using System.Security.Claims;
using Hdms.Api.Data;
using Hdms.Api.Enums;
using Hdms.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FeedbackController : ControllerBase
    {
        private readonly HdmsDbContext _context;

        public FeedbackController(HdmsDbContext context)
        {
            _context = context;
        }

        private string GetUserId() =>
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        /// <summary>
        /// Student: tokens that are USED (Redeemed) but not yet rated by this user,
        /// plus recent feedbacks by this user.
        /// GET /api/feedback/eligible
        /// </summary>
        [HttpGet("eligible")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetEligible()
        {
            var uid = GetUserId();

            // Existing feedbacks (date + meal type) for this student
            var existing = await _context.MealFeedbacks
                .Where(f => f.StudentId == uid)
                .Select(f => new { f.Date, f.MealType })
                .ToListAsync();

            var existingSet = existing
                .Select(e => (e.Date.Date, e.MealType))
                .ToHashSet();

            // Tokens that are Redeemed and not yet rated for that date+mealType
            var tokens = await _context.MealTokens
                .Where(t => t.StudentId == uid && t.Status == TokenStatus.Redeemed)
                .OrderByDescending(t => t.Date)
                .ToListAsync();

            var eligibleTokens = tokens
                .Where(t => !existingSet.Contains((t.Date.Date, t.MealType)))
                .Select(t => new
                {
                    t.Id,
                    t.Date,
                    MealType = t.MealType.ToString(),
                    t.Price
                })
                .ToList();

            // Recent feedback by this user
            var myFeedback = await _context.MealFeedbacks
                .Where(f => f.StudentId == uid)
                .OrderByDescending(f => f.CreatedAt)
                .Take(10)
                .Select(f => new
                {
                    f.Id,
                    f.Date,
                    MealType = f.MealType.ToString(),
                    f.Rating,
                    f.Comment,
                    f.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                Tokens = eligibleTokens,
                MyFeedback = myFeedback
            });
        }

        public class SubmitFeedbackRequest
        {
            public int TokenId { get; set; }
            public int Rating { get; set; }   // 1..5 (or 0..10 if you prefer)
            public string? Comment { get; set; }
        }

        /// <summary>
        /// Student: submit feedback based on a redeemed token.
        /// POST /api/feedback/from-token
        /// body: { tokenId, rating, comment }
        /// </summary>
        [HttpPost("from-token")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> SubmitFromToken([FromBody] SubmitFeedbackRequest req)
        {
            var uid = GetUserId();
            if (req == null || req.TokenId <= 0)
                return BadRequest("Invalid submission.");

            if (req.Rating < 1 || req.Rating > 5)
                return BadRequest("Rating must be between 1 and 5.");

            var token = await _context.MealTokens
                .Include(t => t.Student)
                .FirstOrDefaultAsync(t => t.Id == req.TokenId);

            if (token == null || token.StudentId != uid)
                return BadRequest("Invalid token.");

            if (token.Status != TokenStatus.Redeemed)
                return BadRequest("You can only give feedback after using the meal.");

            var tokenDate = token.Date.Date;
            var mealType = token.MealType;

            // Enforce one feedback per (user, date, mealType)
            var exists = await _context.MealFeedbacks
                .FirstOrDefaultAsync(f =>
                    f.StudentId == uid &&
                    f.Date == tokenDate &&
                    f.MealType == mealType);

            if (exists != null)
                return BadRequest("You already submitted feedback for this meal.");

            var fb = new MealFeedback
            {
                StudentId = uid,
                Date = tokenDate,
                MealType = mealType,
                Rating = req.Rating,
                Comment = string.IsNullOrWhiteSpace(req.Comment) ? null : req.Comment.Trim()
            };

            _context.MealFeedbacks.Add(fb);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Thanks for your feedback!" });
        }

        /// <summary>
        /// Admin: feedback for a specific date, with per-slot averages.
        /// GET /api/feedback/admin?date=2025-01-01
        /// </summary>
        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminView([FromQuery] string? date)
        {
            DateTime target;
            if (!DateTime.TryParse(date, out target))
                target = DateTime.UtcNow.Date;

            var feedbacks = await _context.MealFeedbacks
                .Include(f => f.Student)
                .Where(f => f.Date == target.Date)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

            // Per-meal-type averages
            var grouped = feedbacks
                .GroupBy(f => f.MealType)
                .Select(g => new
                {
                    MealType = g.Key.ToString(),
                    Avg = g.Average(x => x.Rating),
                    Count = g.Count()
                })
                .ToList();

            var rows = feedbacks.Select(f => new
            {
                f.Id,
                f.Date,
                MealType = f.MealType.ToString(),
                f.Rating,
                f.Comment,
                f.CreatedAt,
                StudentName = f.Student?.FullName,
                StudentEmail = f.Student?.Email,
                StudentCode = f.Student?.UserCode
            });

            return Ok(new
            {
                Date = target.ToString("yyyy-MM-dd"),
                Summary = grouped,
                Rows = rows
            });
        }
    }
}