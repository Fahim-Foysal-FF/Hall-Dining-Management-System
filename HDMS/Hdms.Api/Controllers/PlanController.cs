using Hdms.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlanController : ControllerBase
    {
        private readonly HdmsDbContext _context;

        public PlanController(HdmsDbContext context)
        {
            _context = context;
        }

        private static readonly string[] DayNames =
        {
            "SUNDAY",    // 0
            "MONDAY",    // 1
            "TUESDAY",   // 2
            "WEDNESDAY", // 3
            "THURSDAY",  // 4
            "FRIDAY",    // 5
            "SATURDAY"   // 6
        };

        private static string DowName(DateTime d)
        {
            // C# DayOfWeek: Sunday=0 .. Saturday=6
            return DayNames[(int)d.DayOfWeek];
        }

        private static DayOfWeek StringToDayOfWeek(string dow) =>
            dow.ToUpperInvariant() switch
            {
                "MONDAY"    => DayOfWeek.Monday,
                "TUESDAY"   => DayOfWeek.Tuesday,
                "WEDNESDAY" => DayOfWeek.Wednesday,
                "THURSDAY"  => DayOfWeek.Thursday,
                "FRIDAY"    => DayOfWeek.Friday,
                "SATURDAY"  => DayOfWeek.Saturday,
                "SUNDAY"    => DayOfWeek.Sunday,
                _           => DayOfWeek.Monday
            };

        [HttpGet("week")]
        [AllowAnonymous]
        public async Task<IActionResult> GetWeekPlan()
        {
            var today = DateTime.UtcNow.Date;

            var plans = await _context.MealPlans.ToListAsync();

            var result = new List<object>();

            // Display order: Saturday → Friday (like your Flask templates)
            string[] displayOrder = { "SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY" };

            foreach (var dow in displayOrder)
            {
                var lunch = plans.FirstOrDefault(p => p.DayOfWeek == dow && p.TimeSlot == "LUNCH");
                var dinner = plans.FirstOrDefault(p => p.DayOfWeek == dow && p.TimeSlot == "DINNER");

                // Compute next calendar date for this DOW, starting from "today"
                var targetDow = StringToDayOfWeek(dow);
                int offset = ((int)targetDow - (int)today.DayOfWeek + 7) % 7;
                var nextDate = today.AddDays(offset).ToString("yyyy-MM-dd");

                result.Add(new
                {
                    Dow = dow,
                    NextDateLunch = nextDate,
                    NextDateDinner = nextDate,
                    Lunch = lunch == null ? null : new
                    {
                        lunch.ItemsText,
                        lunch.Note,
                        lunch.Price
                    },
                    Dinner = dinner == null ? null : new
                    {
                        dinner.ItemsText,
                        dinner.Note,
                        dinner.Price
                    }
                });
            }

            return Ok(result);
        }
    }
}