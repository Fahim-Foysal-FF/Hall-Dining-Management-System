using System.Security.Claims;
using Hdms.Api.Data;
using Hdms.Api.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/student")]
    [Authorize(Roles = "Student")]
    public class StudentController : ControllerBase
    {
        private readonly HdmsDbContext _context;

        public StudentController(HdmsDbContext context)
        {
            _context = context;
        }

        private string GetUserId() =>
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

          [HttpGet("dashboard")]
        public async Task<IActionResult> Get()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var today = DateTime.UtcNow.Date;
            var monthStart = new DateTime(today.Year, today.Month, 1);
            var monthEnd = monthStart.AddMonths(1);
            var yearStart = new DateTime(today.Year, 1, 1);
            var yearEnd = new DateTime(today.Year, 12, 31);

            // All tokens for this user
            var tokensQuery = _context.MealTokens
                .Where(t => t.StudentId == userId);

            var totalTokens = await tokensQuery.CountAsync();
            var usedTokens = await tokensQuery
                .Where(t => t.Status == TokenStatus.Redeemed)
                .CountAsync();
            var activeTokens = await tokensQuery
                .Where(t => (t.Status == TokenStatus.Purchased || t.Status == TokenStatus.ListedForSale) && t.Date >= today)
                .CountAsync();
            var monthlyPurchased = await tokensQuery
                .Where(t => t.Status == TokenStatus.Purchased &&
                            t.Date >= monthStart && t.Date < monthEnd)
                .CountAsync();
            var yearlyPurchased = await tokensQuery
                .Where(t => t.Status == TokenStatus.Purchased &&
                            t.Date >= yearStart && t.Date <= yearEnd)
                .CountAsync();

            const int monthlyLimit = 45;

            var stats = new
            {
                TotalTokens = totalTokens,
                UsedTokens = usedTokens,
                ActiveTokens = activeTokens,
                MonthlyTokens = monthlyPurchased,
                YearlyTokens = yearlyPurchased,
                RemainingMonthly = Math.Max(0, monthlyLimit - monthlyPurchased)
            };

            // Recent tokens
            var recentTokens = await tokensQuery
                .OrderByDescending(t => t.Date)
                .Take(10)
                .Select(t => new
                {
                    t.Id,
                    t.Date,
                    MealType = t.MealType.ToString(),
                    Status = t.Status.ToString(),
                    t.Price
                })
                .ToListAsync();

            // Wallet
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return Unauthorized();

            var wallet = new
            {
                Balance = user.WalletBalance
            };

            // Today's menu using current-week menu
            var todayMenu = await BuildTodayMenuAsync(today);

            return Ok(new
            {
                Stats = stats,
                RecentTokens = recentTokens,
                Wallet = wallet,
                TodayMenu = todayMenu
            });
        }

        [HttpGet("first-token-alert")]
        public async Task<IActionResult> GetFirstTokenAlert()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var today = DateTime.UtcNow.Date;
            
            // Check if user has any free tokens (price = 0) created in the last 7 days
            var freeToken = await _context.MealTokens
                .Where(t => t.StudentId == userId &&
                            t.Price == 0 &&
                            t.Date >= today &&
                            t.CreatedAt >= DateTime.UtcNow.AddDays(-7))
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            if (freeToken == null)
            {
                return Ok(new { hasAlert = false });
            }

            return Ok(new
            {
                hasAlert = true,
                title = "Free Token Gift! 🎁",
                message = "You have received a free meal token",
                description = $"Use your free {freeToken.MealType} token on {freeToken.Date:dddd, MMMM d, yyyy}",
                tokenDate = freeToken.Date.ToString("yyyy-MM-dd"),
                mealType = freeToken.MealType.ToString(),
                expiresIn = (freeToken.Date - today).Days,
                tokenId = freeToken.Id,
                reason = "Special Gift - Check your email for QR code"
            });
        }

        private async Task<object?> BuildTodayMenuAsync(DateTime today)
        {
            // Find a published weekly menu that contains today
            var menu = await _context.WeeklyMenus
                .Include(w => w.MenuMeals)
                    .ThenInclude(m => m.MenuMealItems)
                        .ThenInclude(mi => mi.FoodItem)
                .Where(w => w.IsPublished &&
                            w.WeekStartDate <= today &&
                            w.WeekEndDate >= today)
                .FirstOrDefaultAsync();

            if (menu == null) return null;

            var mealsToday = menu.MenuMeals
                .Where(mm => mm.Date.Date == today.Date)
                .ToList();

            var lunch = mealsToday
                .FirstOrDefault(m => m.MealType == MealType.Lunch);
            var dinner = mealsToday
                .FirstOrDefault(m => m.MealType == MealType.Dinner);

            object? MapMeal(Models.MenuMeal? m)
            {
                if (m == null) return null;

                var items = m.MenuMealItems
                    .Select(mi => mi.FoodItem!.Name)
                    .ToList();

                return new
                {
                    Items = items
                };
            }

            return new
            {
                Date = today.ToString("yyyy-MM-dd"),
                Lunch = MapMeal(lunch),
                Dinner = MapMeal(dinner)
            };
        }
    }
}
