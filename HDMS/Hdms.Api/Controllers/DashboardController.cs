using System.Security.Claims;
using Hdms.Api.Data;
using Hdms.Api.Enums;
using Hdms.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/admin/[controller]")]
    [Authorize(Roles = "Admin")]
    public class DashboardController : ControllerBase
    {
        private readonly HdmsDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public DashboardController(HdmsDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            // ----- Stats -----
            var students = (await _userManager.GetUsersInRoleAsync("Student")).Count;
            var admins = (await _userManager.GetUsersInRoleAsync("Admin")).Count;
            var tokensTotal = await _context.MealTokens.CountAsync();

            // Revenue = sum of -wallet debits of type PURCHASE
            var purchases = _context.WalletTransactions
                .Where(w => w.Type == "PURCHASE" && w.Amount < 0);

            // Sum negative amounts in SQL (nullable), then flip sign in C#
            var revenueTotalRaw = await purchases.SumAsync(w => (decimal?)w.Amount) ?? 0m;

            var revenueTodayRaw = await purchases
                .Where(w => w.CreatedAt.Date == today)
                .SumAsync(w => (decimal?)w.Amount) ?? 0m;

            var revenueTotal = -revenueTotalRaw;
            var revenueToday = -revenueTodayRaw;

            var stats = new
            {
                Students = students,
                Admins = admins,
                Tokens = tokensTotal,
                RevenueTotal = revenueTotal,
                RevenueToday = revenueToday
            };

            // ----- Today's lunch/dinner snapshot -----
            async Task<object> SlotCounts(MealType mealType)
            {
                var query = _context.MealTokens
                    .Where(t => t.Date == today &&
                                t.MealType == mealType &&
                                t.Status != TokenStatus.Cancelled);

                var total = await query.CountAsync();
                var used = await query.Where(t => t.Status == TokenStatus.Redeemed).CountAsync();
                var listed = await query.Where(t => t.Status == TokenStatus.ListedForSale).CountAsync();
                var remaining = total - used;

                return new
                {
                    Total = total,
                    Used = used,
                    Remaining = remaining,
                    Listed = listed
                };
            }

            var todayInfo = new
            {
                Date = today.ToString("yyyy-MM-dd"),
                Lunch = await SlotCounts(MealType.Lunch),
                Dinner = await SlotCounts(MealType.Dinner)
            };

            // ----- Marketplace summary -----
            var listedNow = await _context.TokenListings
                .Include(l => l.Token)
                .Where(l => l.Status == ListingStatus.Active &&
                            l.Token!.Status == TokenStatus.ListedForSale &&
                            l.Token.Date >= today)
                .CountAsync();

            // We already have "tomorrow" defined as today.AddDays(1) above
            var soldTodayQuery = _context.TokenListings
                .Where(l => l.Status == ListingStatus.Completed &&
                            l.CompletedAt.HasValue &&
                            l.CompletedAt.Value >= today &&
                            l.CompletedAt.Value < tomorrow);

            var soldTodayCount = await soldTodayQuery.CountAsync();

            // Nullable sum pattern that EF can translate
            var soldAmountTodayRaw = await soldTodayQuery
                .SumAsync(l => (decimal?)l.ListingPrice) ?? 0m;

            var market = new
            {
                ListedNow = listedNow,
                SoldToday = soldTodayCount,
                SoldAmountToday = soldAmountTodayRaw
            };

            // ----- Feedback averages for today -----
            var feedbackRows = await _context.MealFeedbacks
                .Where(f => f.Date == today)
                .GroupBy(f => f.MealType)
                .Select(g => new
                {
                    MealType = g.Key,
                    Avg = g.Average(x => x.Rating),
                    Count = g.Count()
                }).ToListAsync();

            double lunchAvg = 0, dinnerAvg = 0;
            int lunchCount = 0, dinnerCount = 0;

            foreach (var r in feedbackRows)
            {
                if (r.MealType == MealType.Lunch)
                {
                    lunchAvg = r.Avg;
                    lunchCount = r.Count;
                }
                else if (r.MealType == MealType.Dinner)
                {
                    dinnerAvg = r.Avg;
                    dinnerCount = r.Count;
                }
            }

            var feedback = new
            {
                LunchAvg = lunchAvg,
                LunchCount = lunchCount,
                DinnerAvg = dinnerAvg,
                DinnerCount = dinnerCount
            };

            // ----- Wallet summary -----
            // Nullable sum pattern EF can translate
            var totalBalance = await _context.Users
                .SumAsync(u => (decimal?)u.WalletBalance) ?? 0m;

            var topupsToday = await _context.WalletTransactions
                .Where(w => w.Type == "TOPUP" && w.CreatedAt.Date == today)
                .CountAsync();

            var wallet = new
            {
                TotalBalance = totalBalance,
                TopupsToday = topupsToday
            };

            // ----- Tomorrow’s meal plan -----
            string DowName(DateTime d)
            {
                string[] dayNames =
                {
                    "SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"
                };
                return dayNames[(int)d.DayOfWeek];
            }

            var dowTomorrow = DowName(tomorrow);

            var lunchPlan = await _context.MealPlans
                .FirstOrDefaultAsync(p => p.DayOfWeek == dowTomorrow && p.TimeSlot == "LUNCH");
            var dinnerPlan = await _context.MealPlans
                .FirstOrDefaultAsync(p => p.DayOfWeek == dowTomorrow && p.TimeSlot == "DINNER");

            var nextPlan = new
            {
                Date = tomorrow.ToString("yyyy-MM-dd"),
                Lunch = lunchPlan == null ? null : new
                {
                    lunchPlan.ItemsText,
                    lunchPlan.Note,
                    lunchPlan.Price
                },
                Dinner = dinnerPlan == null ? null : new
                {
                    dinnerPlan.ItemsText,
                    dinnerPlan.Note,
                    dinnerPlan.Price
                }
            };

            return Ok(new
            {
                Stats = stats,
                Today = todayInfo,
                Market = market,
                Feedback = feedback,
                Wallet = wallet,
                NextPlan = nextPlan
            });
        }
    }
}