using System.Security.Claims;
using Hdms.Api.Data;
using Hdms.Api.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly HdmsDbContext _context;
        private readonly EmailService _emailService;
        private const int DefaultMonthlyLimit = 45;

        public ReportsController(HdmsDbContext context, EmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        private async Task<int> GetMonthlyLimit(int year, int month)
        {
            var cap = await _context.MonthlyMealLimits
                .Where(x => x.Year == year && x.Month == month)
                .OrderByDescending(x => x.UpdatedAt)
                .FirstOrDefaultAsync();
            return cap?.Limit ?? DefaultMonthlyLimit;
        }

        [HttpGet("student/monthly")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> StudentMonthly(int year, int month)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            var from = new DateTime(year, month, 1);
            var to = from.AddMonths(1).AddDays(-1);

            var tokens = await _context.MealTokens
                .Where(t => t.StudentId == userId && t.Date >= from && t.Date <= to)
                .ToListAsync();

            var total = tokens.Count;
            var consumed = tokens.Count(t => t.Status == TokenStatus.Redeemed);

            var byMeal = tokens
                .GroupBy(t => t.MealType)
                .Select(g => new
                {
                    MealType = g.Key.ToString(),
                    Purchased = g.Count(),
                    Redeemed = g.Count(x => x.Status == TokenStatus.Redeemed)
                });

            return Ok(new
            {
                Year = year,
                Month = month,
                TotalPurchased = total,
                TotalConsumed = consumed,
                Breakdown = byMeal
            });
        }

        [HttpGet("admin/consumption")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminConsumption(int year, int month)
        {
            var from = new DateTime(year, month, 1);
            var to = from.AddMonths(1).AddDays(-1);

            var tokens = await _context.MealTokens
                .Where(t => t.Date >= from && t.Date <= to)
                .ToListAsync();

            var perDay = tokens
                .GroupBy(t => t.Date.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    TotalTokens = g.Count(),
                    Redeemed = g.Count(x => x.Status == TokenStatus.Redeemed)
                });

            return Ok(new
            {
                Year = year,
                Month = month,
                PerDay = perDay
            });
        }

        // GET /api/reports/my-monthly-tokens?year=2025&month=12
        [HttpGet("my-monthly-tokens")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetMyMonthlyTokens(int year, int month)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1);

            var monthlyLimit = await GetMonthlyLimit(year, month);

            var tokenQuery = _context.MealTokens
                .Where(t => t.StudentId == userId &&
                           t.Status != TokenStatus.Cancelled &&
                           t.Date >= startDate && t.Date < endDate);

            var totalTokens = await tokenQuery.CountAsync();
            var redeemedTokens = await tokenQuery.CountAsync(t => t.Status == TokenStatus.Redeemed);

            return Ok(new
            {
                Year = year,
                Month = month,
                PurchasedTokens = totalTokens,
                RedeemedTokens = redeemedTokens,
                RemainingTokens = Math.Max(0, monthlyLimit - totalTokens)
            });
        }

        // GET /api/reports/all-users-tokens?year=2025&month=12
        [HttpGet("all-users-tokens")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllUsersTokens(int year, int month)
        {
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1);
            var monthEnd = endDate.AddDays(-1);

            // Use Bangladesh time (UTC+6) to decide if we're inside the last 10 days window
            var nowLocal = DateTime.UtcNow.AddHours(6);
            var inReminderWindow = nowLocal.Year == year && nowLocal.Month == month && nowLocal.Date >= monthEnd.AddDays(-9);

            var monthlyLimit = await GetMonthlyLimit(year, month);

            var users = await (from u in _context.Users
                               join ur in _context.UserRoles on u.Id equals ur.UserId
                               join r in _context.Roles on ur.RoleId equals r.Id
                               where r.Name == "Student"
                               select new
                               {
                                   u.Id,
                                   u.FullName,
                                   u.Email,
                                   u.UserCode,
                                   PurchasedTokens = _context.MealTokens
                                       .Count(t => t.StudentId == u.Id &&
                                                   t.Status != TokenStatus.Cancelled &&
                                                   t.Date >= startDate && t.Date < endDate)
                               })
                               .ToListAsync();

            var result = users.Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.UserCode,
                u.PurchasedTokens,
                RemainingTokens = Math.Max(0, monthlyLimit - u.PurchasedTokens)
            }).ToList();

            // fire-and-forget notifications for users under the monthly limit, only during the last 10 days of the month
            if (inReminderWindow)
            {
                _ = Task.Run(async () =>
                {
                    foreach (var u in result)
                    {
                        if (u.RemainingTokens > 0 && !string.IsNullOrEmpty(u.Email))
                        {
                            await _emailService.SendLowPurchaseAlertAsync(u.Email, u.FullName, year, month, u.PurchasedTokens, u.RemainingTokens);
                        }
                    }
                });
            }

            return Ok(result);
        }

        [HttpGet("monthly-limit")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetMonthlyLimitSetting(int year, int month)
        {
            var limit = await GetMonthlyLimit(year, month);
            return Ok(new { Year = year, Month = month, Limit = limit });
        }

        public class MonthlyLimitRequest
        {
            public int Year { get; set; }
            public int Month { get; set; }
            public int Limit { get; set; }
        }

        [HttpPost("monthly-limit")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SetMonthlyLimit([FromBody] MonthlyLimitRequest req)
        {
            if (req.Limit <= 0) return BadRequest("Limit must be positive.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

            var existing = await _context.MonthlyMealLimits
                .FirstOrDefaultAsync(x => x.Year == req.Year && x.Month == req.Month);

            if (existing == null)
            {
                _context.MonthlyMealLimits.Add(new Models.MonthlyMealLimit
                {
                    Year = req.Year,
                    Month = req.Month,
                    Limit = req.Limit,
                    UpdatedById = userId,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            else
            {
                existing.Limit = req.Limit;
                existing.UpdatedById = userId;
                existing.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Monthly limit updated.", req.Year, req.Month, req.Limit });
        }
    }
}