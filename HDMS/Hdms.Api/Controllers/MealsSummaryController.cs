using Hdms.Api.Data;
using Hdms.Api.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/admin/meals-summary")]
    [Authorize(Roles = "Admin")]
    public class MealsSummaryController : ControllerBase
    {
        private readonly HdmsDbContext _context;

        public MealsSummaryController(HdmsDbContext context)
        {
            _context = context;
        }

        // GET /api/admin/meals-summary?date=2025-01-01
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] string? date)
        {
            DateTime target;
            if (!DateTime.TryParse(date, out target))
                target = DateTime.UtcNow.Date;

            target = target.Date;

            // We care about Lunch & Dinner
            var mealTypes = new[] { MealType.Lunch, MealType.Dinner };

            var slots = new List<object>();

            foreach (var mt in mealTypes)
            {
                var tokens = await _context.MealTokens
                    .Where(t => t.Date == target && t.MealType == mt)
                    .ToListAsync();

                var total = tokens.Count;
                var purchased = tokens.Count(t => t.Status == TokenStatus.Purchased);
                var redeemed = tokens.Count(t => t.Status == TokenStatus.Redeemed);
                var listed = tokens.Count(t => t.Status == TokenStatus.ListedForSale);
                var sold = tokens.Count(t => t.Status == TokenStatus.Sold);
                var cancelled = tokens.Count(t => t.Status == TokenStatus.Cancelled);
                var remaining = purchased + listed; // not redeemed / sold / cancelled

                slots.Add(new
                {
                    MealType = mt.ToString(), // "Lunch" / "Dinner"
                    Total = total,
                    Purchased = purchased,
                    Redeemed = redeemed,
                    Remaining = remaining,
                    Listed = listed,
                    Sold = sold,
                    Cancelled = cancelled
                });
            }

            return Ok(new
            {
                Date = target.ToString("yyyy-MM-dd"),
                Slots = slots
            });
        }
    }
}