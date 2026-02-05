using Hdms.Api.Data;
using Hdms.Api.DTOs.Menu;
using Hdms.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class MealPlansController : ControllerBase
    {
        private readonly HdmsDbContext _context;

        private static readonly string[] DayOrder =
        {
            "SATURDAY","SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"
        };

        public MealPlansController(HdmsDbContext context)
        {
            _context = context;
        }

        // GET /api/mealplans
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var plans = await _context.MealPlans.ToListAsync();

            var ordered = DayOrder
                .SelectMany(dow => new[] { "LUNCH", "DINNER" }
                    .Select(slot => plans.FirstOrDefault(
                        p => p.DayOfWeek == dow && p.TimeSlot == slot)))
                .Where(p => p != null)
                .Select(p => new
                {
                    p!.Id,
                    DayOfWeek = p.DayOfWeek,
                    TimeSlot = p.TimeSlot,
                    p.ItemsText,
                    p.ChoicesText,
                    p.Price,
                    p.Note
                });

            return Ok(ordered);
        }

        // PUT /api/mealplans/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateMealPlanRequest req)
        {
            var plan = await _context.MealPlans.FindAsync(id);
            if (plan == null) return NotFound();

            plan.ItemsText = req.ItemsText;
            plan.ChoicesText = string.IsNullOrWhiteSpace(req.ChoicesText)
                ? null
                : req.ChoicesText.Trim();
            plan.Price = req.Price;
            plan.Note = string.IsNullOrWhiteSpace(req.Note)
                ? null
                : req.Note.Trim();
            plan.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Updated", plan.Id });
        }
    }
}