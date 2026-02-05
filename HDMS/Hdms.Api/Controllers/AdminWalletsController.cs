using Hdms.Api.Data;
using Hdms.Api.DTOs.Admin;
using Hdms.Api.Models;
using Hdms.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/admin/[controller]")]
    [Authorize(Roles = "Admin")]
    public class WalletsController : ControllerBase
    {
        private readonly HdmsDbContext _context;
        private readonly SSLCommerzService _sslCommerz;

        public WalletsController(HdmsDbContext context, SSLCommerzService sslCommerz)
        {
            _context = context;
            _sslCommerz = sslCommerz;
        }

        // GET /api/admin/wallets?q=...
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] string? q)
        {
            var usersQuery = _context.Users.AsQueryable();

            if (!string.IsNullOrWhiteSpace(q))
            {
                q = q.Trim();
                var like = $"%{q}%";

                usersQuery = usersQuery.Where(u =>
                    EF.Functions.Like(u.UserCode!, like) ||
                    EF.Functions.Like(u.FullName!, like) ||
                    EF.Functions.Like(u.Email!, like) ||
                    EF.Functions.Like(u.Phone!, like) ||
                    EF.Functions.Like(u.HallName!, like));
            }

            var users = await usersQuery
                .OrderBy(u => u.FullName)
                .Take(100)
                .Select(u => new
                {
                    u.Id,
                    u.UserCode,
                    u.FullName,
                    u.Email,
                    u.Phone,
                    Hall = u.HallName,
                    u.WalletBalance
                })
                .ToListAsync();

            return Ok(users);
        }

        // GET /api/admin/wallets/pending-transactions
        [HttpGet("pending-transactions")]
        public async Task<IActionResult> GetPendingTransactions()
        {
            var pending = await _context.WalletTransactions
                .Where(t => t.Type == "TOPUP_PENDING")
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    transactionId = t.Ref,
                    amount = t.Amount,
                    createdAt = t.CreatedAt,
                    description = t.Description,
                    userId = t.UserId
                })
                .ToListAsync();

            return Ok(pending);
        }

        // POST /api/admin/wallets/topup
        [HttpPost("topup")]
        public async Task<IActionResult> Topup([FromBody] WalletTopupRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.UserId))
                return BadRequest("UserId is required.");

            if (req.Amount <= 0)
            return BadRequest("Amount must be positive.");

            var user = await _context.Users.FindAsync(req.UserId);
            if (user == null) return NotFound("User not found.");

            await using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                user.WalletBalance += req.Amount;

                _context.WalletTransactions.Add(new WalletTransaction
                {
                    UserId = user.Id,
                    Amount = req.Amount,
                    Type = "TOPUP",
                    Ref = "admin",
                    Description = string.IsNullOrWhiteSpace(req.Description)
                        ? "Admin top-up"
                        : req.Description.Trim()
                });

                await _context.SaveChangesAsync();
                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            return Ok(new
            {
                message = "Wallet updated",
                user.Id,
                user.WalletBalance
            });
        }

        // POST /api/admin/wallets/revalidate-pending
        [HttpPost("revalidate-pending")]
        public async Task<IActionResult> RevalidatePending([FromBody] RevalidatePendingRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.TransactionId))
                return BadRequest("TransactionId is required.");

            var pendingTxn = await _context.WalletTransactions
                .FirstOrDefaultAsync(t => t.Ref == req.TransactionId && t.Type == "TOPUP_PENDING");

            if (pendingTxn == null)
                return NotFound("Pending transaction not found.");

            // For manually revalidating, mark as completed without SSLCOMMERZ validation
            // This is useful for admin override or when IPN callback failed
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var user = await _context.Users.FindAsync(pendingTxn.UserId);
                if (user == null)
                    return NotFound("User not found.");

                // Update wallet balance
                user.WalletBalance += pendingTxn.Amount;

                // Update transaction status
                pendingTxn.Type = "TOPUP";
                pendingTxn.Description = $"Wallet top-up revalidated by admin (Manually approved)";

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "Transaction revalidated successfully",
                    transactionId = pendingTxn.Ref,
                    amount = pendingTxn.Amount,
                    userId = user.Id,
                    newBalance = user.WalletBalance
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest($"Failed to revalidate: {ex.Message}");
            }
        }
    }

    public class RevalidatePendingRequest
    {
        public string TransactionId { get; set; } = string.Empty;
    }
}