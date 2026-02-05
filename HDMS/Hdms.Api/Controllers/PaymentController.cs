using Hdms.Api.Data;
using Hdms.Api.Models;
using Hdms.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly HdmsDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SSLCommerzService _sslCommerz;
        private readonly IConfiguration _configuration;

        public PaymentController(
            HdmsDbContext context,
            UserManager<ApplicationUser> userManager,
            SSLCommerzService sslCommerz,
            IConfiguration configuration)
        {
            _context = context;
            _userManager = userManager;
            _sslCommerz = sslCommerz;
            _configuration = configuration;
        }

        // POST /api/payment/initiate
        [HttpPost("initiate")]
        [Authorize]
        public async Task<IActionResult> InitiatePayment([FromBody] InitiatePaymentRequest request)
        {
            if (request.Amount <= 0 || request.Amount > 10000)
                return BadRequest("Amount must be between 1 and 10000 BDT");

            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            // Generate unique transaction ID
            var tranId = $"TOPUP-{user.Id.Substring(0, 8)}-{DateTime.UtcNow.Ticks}";

            // Get base URL from configuration or request
            var baseUrl = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:5173";

            // Get IPN host URL from configuration (supports ngrok tunnels)
            var ipnHostUrl = _configuration["AppSettings:IpnHostUrl"] ?? $"{Request.Scheme}://{Request.Host}";

            var paymentRequest = new PaymentRequest
            {
                TransactionId = tranId,
                Amount = request.Amount,
                SuccessUrl = $"{ipnHostUrl}/api/payment/success",
                FailUrl = $"{ipnHostUrl}/api/payment/fail",
                CancelUrl = $"{ipnHostUrl}/api/payment/cancel",
                IpnUrl = $"{ipnHostUrl}/api/payment/ipn",
                CustomerName = user.FullName ?? "Student",
                CustomerEmail = user.Email ?? "student@hdms.com",
                CustomerPhone = user.Phone ?? "01700000000",
                CustomerAddress = user.HallName,
                CustomerCity = "Dhaka",
                ProductName = "HDMS Wallet Top-up",
                ProductCategory = "Wallet"
            };

            var response = await _sslCommerz.InitiatePayment(paymentRequest);

            if (response.Status == "SUCCESS" && !string.IsNullOrEmpty(response.GatewayPageURL))
            {
                // Store transaction in database
                _context.WalletTransactions.Add(new WalletTransaction
                {
                    UserId = user.Id,
                    Amount = request.Amount,
                    Type = "TOPUP_PENDING",
                    Ref = tranId,
                    Description = "Wallet top-up initiated via SSLCOMMERZ"
                });
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    gatewayUrl = response.GatewayPageURL,
                    sessionKey = response.SessionKey,
                    transactionId = tranId
                });
            }

            return BadRequest(new
            {
                success = false,
                message = response.FailedReason ?? "Failed to initiate payment"
            });
        }

        // POST /api/payment/ipn (Instant Payment Notification from SSLCOMMERZ)
        [HttpPost("ipn")]
        [AllowAnonymous]
        public async Task<IActionResult> IPN()
        {
            try
            {
                // Read form data manually to handle SSLCOMMERZ format
                var form = await Request.ReadFormAsync();
                
                var tranId = form["tran_id"].ToString();
                var valId = form["val_id"].ToString();
                var amount = form["amount"].ToString();
                var cardType = form["card_type"].ToString();
                var cardIssuer = form["card_issuer"].ToString();
                var status = form["status"].ToString();

                Console.WriteLine($"IPN Received: tran_id={tranId}, val_id={valId}, amount={amount}, status={status}");

                if (string.IsNullOrEmpty(tranId) || string.IsNullOrEmpty(status))
                {
                    Console.WriteLine("IPN: Missing transaction data");
                    return Ok("IPN received"); 
                }

                // Check if already processed
                var existingTxn = await _context.WalletTransactions
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Ref == tranId && t.Type == "TOPUP");

                if (existingTxn != null)
                {
                    Console.WriteLine($"IPN: Already processed for {tranId}");
                    return Ok("IPN already processed");
                }

                // Trust SSLCOMMERZ status directly - don't call validation API again
                // The status field in IPN data IS the validation result
                if (status == "VALID" || status == "Validated" || status == "valid")
                {
                    // Find the pending transaction
                    var pendingTxn = await _context.WalletTransactions
                        .FirstOrDefaultAsync(t => t.Ref == tranId && t.Type == "TOPUP_PENDING");

                    if (pendingTxn != null)
                    {
                        Console.WriteLine($"IPN: Found pending transaction for userId={pendingTxn.UserId}, amount={pendingTxn.Amount}");
                        
                        var user = await _context.Users.FindAsync(pendingTxn.UserId);
                        if (user != null)
                        {
                            Console.WriteLine($"IPN: Found user {user.Email}, current balance={user.WalletBalance}");
                            
                            await using var transaction = await _context.Database.BeginTransactionAsync();
                            try
                            {
                                // Update wallet balance
                                user.WalletBalance += pendingTxn.Amount;
                                Console.WriteLine($"IPN: Updated balance to {user.WalletBalance}");

                                // Update transaction status
                                pendingTxn.Type = "TOPUP";
                                pendingTxn.Description = $"Wallet top-up completed via SSLCOMMERZ (Val: {valId}, Bank: {cardIssuer}, Card: {cardType})";

                                // Mark both as modified
                                _context.Users.Update(user);
                                _context.WalletTransactions.Update(pendingTxn);

                                await _context.SaveChangesAsync();
                                await transaction.CommitAsync();

                                Console.WriteLine($"IPN: Successfully processed transaction {tranId}. New balance: {user.WalletBalance}");
                                return Ok("IPN processed successfully");
                            }
                            catch (Exception ex)
                            {
                                await transaction.RollbackAsync();
                                Console.WriteLine($"IPN transaction error: {ex.Message}\n{ex.StackTrace}");
                                return Ok("IPN received"); 
                            }
                        }
                        else
                        {
                            Console.WriteLine($"IPN: User not found for userId={pendingTxn.UserId}");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"IPN: No pending transaction found for {tranId}");
                    }
                }
                else
                {
                    Console.WriteLine($"IPN: Payment not valid - status={status}");
                }

                return Ok("IPN received");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"IPN Error: {ex.Message}\n{ex.StackTrace}");
                return Ok("IPN received");
            }
        }

        // POST /api/payment/success (User redirect after successful payment)
        [HttpPost("success")]
        [AllowAnonymous]
        public async Task<IActionResult> Success([FromForm] string tran_id, [FromForm] string val_id)
        {
            try
            {
                Console.WriteLine($"Success endpoint called: tran_id={tran_id}, val_id={val_id}");

                if (string.IsNullOrEmpty(tran_id))
                {
                    var frontendUrlFail = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:5174";
                    return Redirect($"{frontendUrlFail}/student/wallet?payment=failed");
                }

                // Give IPN a moment to process if it hasn't already
                await Task.Delay(500);

                // Check if transaction was processed by IPN
                var completedTxn = await _context.WalletTransactions
                    .FirstOrDefaultAsync(t => t.Ref == tran_id && t.Type == "TOPUP");

                if (completedTxn != null)
                {
                    // Already processed by IPN - redirect to success
                    var frontendUrl = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:5174";
                    return Redirect($"{frontendUrl}/student/wallet?payment=success&amount={completedTxn.Amount}");
                }

                // Check if there's a pending transaction (IPN might process it later)
                var pendingTxn = await _context.WalletTransactions
                    .FirstOrDefaultAsync(t => t.Ref == tran_id && t.Type == "TOPUP_PENDING");

                if (pendingTxn != null)
                {
                    // Pending transaction exists - IPN will process it, redirect to success
                    var frontendUrl = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:5174";
                    return Redirect($"{frontendUrl}/student/wallet?payment=success&amount={pendingTxn.Amount}");
                }

                // No transaction found - this shouldn't happen
                var frontendUrlFail2 = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:5174";
                return Redirect($"{frontendUrlFail2}/student/wallet?payment=failed");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Success endpoint error: {ex.Message}");
                var frontendUrl = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:5174";
                return Redirect($"{frontendUrl}/student/wallet?payment=failed");
            }
        }

        // POST /api/payment/fail
        [HttpPost("fail")]
        [AllowAnonymous]
        public async Task<IActionResult> Fail([FromForm] string tran_id)
        {
            try
            {
                // Mark transaction as failed in database
                var pendingTxn = await _context.WalletTransactions
                    .FirstOrDefaultAsync(t => t.Ref == tran_id && t.Type == "TOPUP_PENDING");

                if (pendingTxn != null)
                {
                    pendingTxn.Type = "TOPUP_FAILED";
                    pendingTxn.Description = "Wallet top-up failed - user returned from SSLCOMMERZ";
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Fail endpoint error: {ex.Message}");
            }

            var frontendUrl = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:5174";
            return Redirect($"{frontendUrl}/student/wallet?payment=failed");
        }

        // POST /api/payment/cancel
        [HttpPost("cancel")]
        [AllowAnonymous]
        public async Task<IActionResult> Cancel([FromForm] string tran_id)
        {
            try
            {
                // Mark transaction as cancelled in database
                var pendingTxn = await _context.WalletTransactions
                    .FirstOrDefaultAsync(t => t.Ref == tran_id && t.Type == "TOPUP_PENDING");

                if (pendingTxn != null)
                {
                    pendingTxn.Type = "TOPUP_CANCELLED";
                    pendingTxn.Description = "Wallet top-up cancelled - user cancelled at SSLCOMMERZ";
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Cancel endpoint error: {ex.Message}");
            }

            var frontendUrl = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:5174";
            return Redirect($"{frontendUrl}/student/wallet?payment=cancelled");
        }

        // GET /api/payment/status/{tranId}
        [HttpGet("status/{tranId}")]
        [Authorize]
        public async Task<IActionResult> GetStatus(string tranId)
        {
            var txn = await _context.WalletTransactions
                .FirstOrDefaultAsync(t => t.Ref == tranId);

            if (txn == null) return NotFound("Transaction not found");

            return Ok(new
            {
                transactionId = txn.Ref,
                amount = txn.Amount,
                status = txn.Type,
                description = txn.Description,
                createdAt = txn.CreatedAt
            });
        }
    }

    public class InitiatePaymentRequest
    {
        public decimal Amount { get; set; }
    }

    public class IPNRequest
    {
        public string TranId { get; set; } = string.Empty;
        public string ValId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string CardType { get; set; } = string.Empty;
        public string CardNo { get; set; } = string.Empty;
        public string BankTranId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string TranDate { get; set; } = string.Empty;
        public string Currency { get; set; } = string.Empty;
        public string CardIssuer { get; set; } = string.Empty;
        public string CardBrand { get; set; } = string.Empty;
        public string CardIssuerCountry { get; set; } = string.Empty;
        public string CurrencyType { get; set; } = string.Empty;
        public decimal CurrencyAmount { get; set; }
        public string CurrencyRate { get; set; } = string.Empty;
        public string StoreAmount { get; set; } = string.Empty;
    }
}
