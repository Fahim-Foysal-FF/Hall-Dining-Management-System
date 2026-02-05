using System.Security.Claims;
using Hdms.Api.Data;
using Hdms.Api.Enums;
using Hdms.Api.Models;
using Hdms.Api.DTOs.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Student")]
    public class OrdersController : ControllerBase
    {
        private readonly HdmsDbContext _context;
        private readonly EmailService _emailService;
        private readonly ILogger<OrdersController> _logger;
        private const int DefaultTokenLimit = 4;
        private const int DefaultMonthlyLimit = 45;

        public OrdersController(HdmsDbContext context, EmailService emailService, ILogger<OrdersController> logger)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
        }

        private string GetUserId() =>
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        private async Task<int> GetMonthlyLimit(int year, int month)
        {
            var cap = await _context.MonthlyMealLimits
                .Where(x => x.Year == year && x.Month == month)
                .OrderByDescending(x => x.UpdatedAt)
                .FirstOrDefaultAsync();
            return cap?.Limit ?? DefaultMonthlyLimit;
        }

        private static string DowName(DateTime d)
        {
            string[] days = { "MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY" };
            return days[(int)d.DayOfWeek == 0 ? 6 : (int)d.DayOfWeek - 1];
        }

        /// <summary>
        /// Buy a single LUNCH or DINNER token for a future date, using wallet.
        /// Body: { "date": "2025-01-01", "slot": "LUNCH" }
        /// </summary>
        [HttpPost("buy-token")]
        public async Task<IActionResult> BuyToken([FromBody] BuyTokenRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Slot))
                return BadRequest("Invalid request.");

            var slot = req.Slot.ToUpperInvariant(); // LUNCH / DINNER
            if (slot != "LUNCH" && slot != "DINNER")
                return BadRequest("Slot must be LUNCH or DINNER.");

            // Get meal preference from request - FIXED: Use req.Preference instead of req.MealPreference
            string mealPreference = req.Preference ?? string.Empty; // Line 50 fix

            DateTime mealDate;
            if (!DateTime.TryParse(req.Date, out mealDate))
                return BadRequest("Invalid date.");

            // Use Bangladesh time (UTC+6) for all purchase window checks
            var now = DateTime.UtcNow.AddHours(6);
            var today = now.Date;
            var lunchPurchaseCutoff = new TimeSpan(13, 0, 0);  // 1:00 PM
            var dinnerPurchaseCutoff = new TimeSpan(19, 0, 0); // 7:00 PM

            if (mealDate < today)
                return BadRequest("Cannot buy tokens for past dates.");

            if (mealDate == today)
            {
                var cutoff = slot == "LUNCH" ? lunchPurchaseCutoff : dinnerPurchaseCutoff;
                if (now.TimeOfDay > cutoff)
                    return BadRequest($"Purchase window closed for today's {slot.ToLower()} (cutoff {cutoff}).");
            }

            var uid = GetUserId();
            var user = await _context.Users.FindAsync(uid);
            if (user == null) return Unauthorized();

            // Load plan
            var dow = DowName(mealDate);
            var plan = await _context.MealPlans
                .FirstOrDefaultAsync(p => p.DayOfWeek == dow && p.TimeSlot == slot);
            if (plan == null) return BadRequest("No meal plan for that day/slot.");

            // Daily cap
            int limit = DefaultTokenLimit;
            var existingCount = await _context.MealTokens
                .Where(t => t.StudentId == uid &&
                            t.Date == mealDate &&
                            t.MealType == (slot == "LUNCH" ? MealType.Lunch : MealType.Dinner) &&
                            t.Status != TokenStatus.Cancelled)  // treat Redeemed/List for sale as counting
                .CountAsync();

            if (existingCount >= limit)
                return BadRequest($"Limit reached: you can buy at most {limit} {slot.ToLower()} token(s) for {mealDate:yyyy-MM-dd}.");

            // Monthly cap
            var monthStart = new DateTime(mealDate.Year, mealDate.Month, 1);
            var monthlyLimit = await GetMonthlyLimit(mealDate.Year, mealDate.Month);
            var monthlyCount = await _context.MealTokens
                .Where(t => t.StudentId == uid &&
                            t.Date >= monthStart && t.Date < monthStart.AddMonths(1) &&
                            t.Status == TokenStatus.Purchased)
                .CountAsync();

            if (monthlyCount >= monthlyLimit)
                return BadRequest($"Monthly limit reached: you can buy at most {monthlyLimit} tokens per month.");

            var price = plan.Price;

            if (user.WalletBalance < price)
                return BadRequest("Insufficient wallet balance. Please top up.");


            // Find the WeeklyMenu for the mealDate
            var weekStart = mealDate.AddDays(-(int)mealDate.DayOfWeek); // Sunday as start
            var weekEnd = weekStart.AddDays(6);
            var weeklyMenu = await _context.WeeklyMenus
                .FirstOrDefaultAsync(w => w.WeekStartDate <= mealDate && w.WeekEndDate >= mealDate);

            if (weeklyMenu == null)
                return BadRequest("No weekly menu found for the selected date.");

            // Create token and wallet transaction
            var token = new MealToken
            {
                StudentId = uid,
                WeeklyMenuId = weeklyMenu.Id,
                Date = mealDate,
                MealType = slot == "LUNCH" ? MealType.Lunch : MealType.Dinner,
                Price = price,
                Status = TokenStatus.Purchased,
                TokenUid = Guid.NewGuid(),
                MealPreference = !string.IsNullOrWhiteSpace(mealPreference) ? mealPreference : null
            };

            _context.MealTokens.Add(token);
            await _context.SaveChangesAsync(); // Save token first to get the ID

            user.WalletBalance -= price;
            _context.WalletTransactions.Add(new WalletTransaction
            {
                UserId = uid,
                Amount = -price,
                Type = "PURCHASE",
                Ref = $"token:{token.Id}",
                Description = $"{slot} {mealDate:yyyy-MM-dd} token"
            });

            await _context.SaveChangesAsync(); // Save transaction with correct token ID

            // Send QR code email
            try
            {
                await _emailService.SendTokenQrEmailAsync(user.Email!, user.FullName, token.Id, token.Date, slot, token.Price, token.TokenUid, mealPreference);
            }
            catch (Exception ex)
            {
                // Log but don't fail purchase
                _logger.LogError(ex, "Failed to send token QR email after purchase for user {UserId}", uid);
            }
                        // Optionally pass mealPreference to email

            // Get meal preference (items) for this token - FIXED: Use different variable name
            var mealPlan = await _context.MealPlans.FirstOrDefaultAsync(p => p.DayOfWeek == DowName(mealDate) && p.TimeSlot == slot);
            string mealItems = mealPlan?.ItemsText ?? ""; // Line 153-154 fix: changed variable name

            return Ok(new
            {
                TokenId = token.Id,
                TokenUid = token.TokenUid,
                Date = token.Date,
                Slot = slot,
                Price = token.Price,
                MealPreference = mealPreference,
                MealItems = mealItems // Line 163 fix: removed duplicate TokenUid, added MealItems
            });
        }

        /// <summary>
        /// Basic wallet view: balance + last N transactions
        /// </summary>
        [HttpGet("wallet")]
        public async Task<IActionResult> Wallet()
        {
            var uid = GetUserId();
            var user = await _context.Users.FindAsync(uid);
            if (user == null) return Unauthorized();

            var txns = await _context.WalletTransactions
                .Where(t => t.UserId == uid)
                .OrderByDescending(t => t.CreatedAt)
                .Take(50)
                .Select(t => new
                {
                    t.Id,
                    t.Type,
                    t.Amount,
                    t.Ref,
                    t.Description,
                    t.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                Balance = user.WalletBalance,
                Transactions = txns
            });
        }

        /// <summary>
        /// For buy page: returns lunch/dinner plan + counts for date.
        /// GET /api/orders/options?date=2025-01-02
        /// </summary>
        [HttpGet("options")]
        public async Task<IActionResult> GetOptions([FromQuery] string? date)
        {
            var uid = GetUserId();
            DateTime selected;
            if (!DateTime.TryParse(date, out selected))
            {
                selected = DateTime.UtcNow.Date.AddDays(1); // default tomorrow
            }

            if (selected <= DateTime.UtcNow.Date)
            {
                selected = DateTime.UtcNow.Date.AddDays(1);
            }

            var dow = DowName(selected);
            var lunch = await _context.MealPlans
                .FirstOrDefaultAsync(p => p.DayOfWeek == dow && p.TimeSlot == "LUNCH");
            var dinner = await _context.MealPlans
                .FirstOrDefaultAsync(p => p.DayOfWeek == dow && p.TimeSlot == "DINNER");

            int limit = DefaultTokenLimit;

            var lunchCount = await _context.MealTokens
                .Where(t => t.StudentId == uid &&
                            t.Date == selected &&
                            t.MealType == MealType.Lunch &&
                            t.Status != TokenStatus.Cancelled)
                .CountAsync();

            var dinnerCount = await _context.MealTokens
                .Where(t => t.StudentId == uid &&
                            t.Date == selected &&
                            t.MealType == MealType.Dinner &&
                            t.Status != TokenStatus.Cancelled)
                .CountAsync();

            return Ok(new
            {
                Date = selected.ToString("yyyy-MM-dd"),
                Limit = limit,
                Lunch = lunch == null ? null : new
                {
                    lunch.ItemsText,
                    lunch.Note,
                    lunch.Price,
                    Choices = (lunch.ChoicesText ?? "")
                        .Split('|', StringSplitOptions.RemoveEmptyEntries)
                        .Select(c => c.Trim().ToUpper())
                },
                Dinner = dinner == null ? null : new
                {
                    dinner.ItemsText,
                    dinner.Note,
                    dinner.Price,
                    Choices = (dinner.ChoicesText ?? "")
                        .Split('|', StringSplitOptions.RemoveEmptyEntries)
                        .Select(c => c.Trim().ToUpper())
                },
                LunchCount = lunchCount,
                DinnerCount = dinnerCount
            });
        }

        /// <summary>
        /// Buy multiple tokens (1-4) in one QR code group.
        /// Body: { "date": "2025-01-01", "slot": "LUNCH", "quantity": 2, "preference": "..." }
        /// </summary>
        [HttpPost("buy-qr-tokens")]
        public async Task<IActionResult> BuyQRTokenGroup([FromBody] BuyTokenRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Slot))
                return BadRequest("Invalid request.");

            var slot = req.Slot.ToUpperInvariant(); // LUNCH / DINNER
            if (slot != "LUNCH" && slot != "DINNER")
                return BadRequest("Slot must be LUNCH or DINNER.");

            // Validate quantity (1-4 tokens per QR code)
            int quantity = req.Quantity;
            if (quantity < 1 || quantity > 4)
                return BadRequest("Quantity must be between 1 and 4 tokens per QR code.");

            string mealPreference = req.Preference ?? string.Empty;

            DateTime mealDate;
            if (!DateTime.TryParse(req.Date, out mealDate))
                return BadRequest("Invalid date.");

            // Use Bangladesh time (UTC+6) for all purchase window checks
            var now = DateTime.UtcNow.AddHours(6);
            var today = now.Date;
            var lunchPurchaseCutoff = new TimeSpan(13, 0, 0);  // 1:00 PM
            var dinnerPurchaseCutoff = new TimeSpan(19, 0, 0); // 7:00 PM

            if (mealDate < today)
                return BadRequest("Cannot buy tokens for past dates.");

            if (mealDate == today)
            {
                var cutoff = slot == "LUNCH" ? lunchPurchaseCutoff : dinnerPurchaseCutoff;
                if (now.TimeOfDay > cutoff)
                    return BadRequest($"Purchase window closed for today's {slot.ToLower()} (cutoff {cutoff}).");
            }

            var uid = GetUserId();
            var user = await _context.Users.FindAsync(uid);
            if (user == null) return Unauthorized();

            // Load meal plan
            var dow = DowName(mealDate);
            var plan = await _context.MealPlans
                .FirstOrDefaultAsync(p => p.DayOfWeek == dow && p.TimeSlot == slot);
            if (plan == null) return BadRequest("No meal plan for that day/slot.");

            // Daily cap - check existing tokens
            int dailyLimit = DefaultTokenLimit;
            var existingCount = await _context.MealTokens
                .Where(t => t.StudentId == uid &&
                            t.Date == mealDate &&
                            t.MealType == (slot == "LUNCH" ? MealType.Lunch : MealType.Dinner) &&
                            t.Status != TokenStatus.Cancelled)
                .CountAsync();

            if (existingCount + quantity > dailyLimit)
                return BadRequest($"Limit reached: you can buy at most {dailyLimit} {slot.ToLower()} token(s) total for {mealDate:yyyy-MM-dd}. Already have {existingCount}.");

            // Monthly cap
            var monthStart = new DateTime(mealDate.Year, mealDate.Month, 1);
            var monthlyLimit = await GetMonthlyLimit(mealDate.Year, mealDate.Month);
            var monthlyCount = await _context.MealTokens
                .Where(t => t.StudentId == uid &&
                            t.Date >= monthStart && t.Date < monthStart.AddMonths(1) &&
                            t.Status == TokenStatus.Purchased)
                .CountAsync();

            if (monthlyCount + quantity > monthlyLimit)
                return BadRequest($"Monthly limit reached: you can buy at most {monthlyLimit} tokens per month. Current: {monthlyCount}.");

            decimal pricePerToken = plan.Price;
            decimal totalPrice = pricePerToken * quantity;

            if (user.WalletBalance < totalPrice)
                return BadRequest("Insufficient wallet balance for this purchase. Please top up.");

            // Find the WeeklyMenu for the mealDate
            var weeklyMenu = await _context.WeeklyMenus
                .FirstOrDefaultAsync(w => w.WeekStartDate <= mealDate && w.WeekEndDate >= mealDate);

            if (weeklyMenu == null)
                return BadRequest("No weekly menu found for the selected date.");

            // Create QR Token Group
            var qrGroup = new QRTokenGroup
            {
                QRCode = Guid.NewGuid(),
                StudentId = uid,
                TotalTokens = quantity,
                RemainingTokens = quantity,
                RedeemedTokens = 0,
                MealDate = mealDate,
                MealType = slot == "LUNCH" ? MealType.Lunch : MealType.Dinner,
                PricePerToken = pricePerToken,
                MealPreference = !string.IsNullOrWhiteSpace(mealPreference) ? mealPreference : null,
                WeeklyMenuId = weeklyMenu.Id,
                Status = QRTokenGroupStatus.Active
            };

            _context.QRTokenGroups.Add(qrGroup);
            await _context.SaveChangesAsync(); // Save QR group first to get ID

            // Create individual tokens linked to this QR group
            var tokensCreated = new List<MealToken>();
            for (int i = 0; i < quantity; i++)
            {
                var token = new MealToken
                {
                    StudentId = uid,
                    WeeklyMenuId = weeklyMenu.Id,
                    Date = mealDate,
                    MealType = slot == "LUNCH" ? MealType.Lunch : MealType.Dinner,
                    Price = pricePerToken,
                    Status = TokenStatus.Purchased,
                    TokenUid = Guid.NewGuid(),
                    MealPreference = !string.IsNullOrWhiteSpace(mealPreference) ? mealPreference : null,
                    QRTokenGroupId = qrGroup.Id
                };
                _context.MealTokens.Add(token);
                tokensCreated.Add(token);
            }

            await _context.SaveChangesAsync(); // Save tokens

            // Deduct from wallet
            user.WalletBalance -= totalPrice;
            _context.WalletTransactions.Add(new WalletTransaction
            {
                UserId = uid,
                Amount = -totalPrice,
                Type = "PURCHASE_QR",
                Ref = $"qr-group:{qrGroup.Id}",
                Description = $"{slot} x{quantity} {mealDate:yyyy-MM-dd} (QR Code)"
            });

            await _context.SaveChangesAsync();

            // Send QR code email
            try
            {
                await _emailService.SendTokenQrEmailAsync(
                    user.Email!,
                    user.FullName,
                    tokensCreated.First().Id,
                    mealDate,
                    slot,
                    totalPrice,
                    qrGroup.QRCode,
                    mealPreference
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send QR token group email for user {UserId}", uid);
            }

            var mealPlan = await _context.MealPlans
                .FirstOrDefaultAsync(p => p.DayOfWeek == DowName(mealDate) && p.TimeSlot == slot);
            string mealItems = mealPlan?.ItemsText ?? "";

            return Ok(new
            {
                QRGroupId = qrGroup.Id,
                QRCode = qrGroup.QRCode,
                Date = mealDate,
                Slot = slot,
                TotalTokens = quantity,
                PricePerToken = pricePerToken,
                TotalPrice = totalPrice,
                MealPreference = mealPreference,
                MealItems = mealItems,
                Message = $"Successfully purchased {quantity} token(s) in one QR code!"
            });
        }
    }
}