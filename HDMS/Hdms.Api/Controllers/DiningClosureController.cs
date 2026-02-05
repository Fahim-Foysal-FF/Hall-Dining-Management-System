using Hdms.Api.Data;
using Hdms.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/admin/dining")]
    [Authorize(Roles = "Admin")]
    public class DiningClosureController : ControllerBase
    {
        private readonly HdmsDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public DiningClosureController(HdmsDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET /api/admin/dining/closures
        [HttpGet("closures")]
        public async Task<IActionResult> GetClosures([FromQuery] bool includeInactive = false)
        {
            var query = _context.DiningClosures
                .Include(dc => dc.CreatedBy)
                .Include(dc => dc.UpdatedBy)
                .AsQueryable();

            if (!includeInactive)
            {
                query = query.Where(dc => dc.IsActive);
            }

            var closures = await query
                .OrderByDescending(dc => dc.StartDate)
                .Select(dc => new
                {
                    dc.Id,
                    dc.StartDate,
                    dc.EndDate,
                    dc.Reason,
                    dc.Description,
                    dc.IsActive,
                    CreatedBy = dc.CreatedBy!.FullName,
                    dc.CreatedAt,
                    UpdatedBy = dc.UpdatedBy != null ? dc.UpdatedBy.FullName : null,
                    dc.UpdatedAt
                })
                .ToListAsync();

            return Ok(closures);
        }

        // GET /api/admin/dining/closures/active
        [HttpGet("closures/active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveClosures()
        {
            var today = DateTime.UtcNow.Date;

            var closures = await _context.DiningClosures
                .Where(dc => dc.IsActive && dc.StartDate.Date <= today && dc.EndDate.Date >= today)
                .Select(dc => new
                {
                    dc.Id,
                    dc.StartDate,
                    dc.EndDate,
                    dc.Reason,
                    dc.Description
                })
                .ToListAsync();

            return Ok(closures);
        }

        // POST /api/admin/dining/closures
        [HttpPost("closures")]
        public async Task<IActionResult> CreateClosure([FromBody] CreateDiningClosureRequest request)
        {
            if (request.StartDate >= request.EndDate)
            {
                return BadRequest("End date must be after start date");
            }

            if (string.IsNullOrWhiteSpace(request.Reason))
            {
                return BadRequest("Reason is required");
            }

            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null) return Unauthorized();

                var closure = new DiningClosure
                {
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    Reason = request.Reason.Trim(),
                    Description = request.Description?.Trim(),
                    CreatedById = user.Id,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.DiningClosures.Add(closure);
                await _context.SaveChangesAsync();

                Console.WriteLine($"Dining closure created: {request.Reason} from {request.StartDate:yyyy-MM-dd} to {request.EndDate:yyyy-MM-dd} by {user.FullName}");

                return Ok(new
                {
                    success = true,
                    message = "Dining closure created successfully",
                    closureId = closure.Id,
                    startDate = closure.StartDate,
                    endDate = closure.EndDate,
                    reason = closure.Reason
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating dining closure: {ex.Message}");
                return BadRequest(new { error = "Failed to create closure", details = ex.Message });
            }
        }

        // PUT /api/admin/dining/closures/{id}
        [HttpPut("closures/{id}")]
        public async Task<IActionResult> UpdateClosure(int id, [FromBody] UpdateDiningClosureRequest request)
        {
            if (request.StartDate >= request.EndDate)
            {
                return BadRequest("End date must be after start date");
            }

            try
            {
                var closure = await _context.DiningClosures.FindAsync(id);
                if (closure == null)
                {
                    return NotFound("Closure not found");
                }

                var user = await _userManager.GetUserAsync(User);
                if (user == null) return Unauthorized();

                closure.StartDate = request.StartDate;
                closure.EndDate = request.EndDate;
                closure.Reason = request.Reason?.Trim() ?? closure.Reason;
                closure.Description = request.Description?.Trim();
                closure.UpdatedById = user.Id;
                closure.UpdatedAt = DateTime.UtcNow;

                _context.DiningClosures.Update(closure);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Closure updated successfully",
                    closureId = closure.Id
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating closure: {ex.Message}");
                return BadRequest(new { error = "Failed to update closure", details = ex.Message });
            }
        }

        // DELETE /api/admin/dining/closures/{id}
        [HttpDelete("closures/{id}")]
        public async Task<IActionResult> DeleteClosure(int id)
        {
            try
            {
                var closure = await _context.DiningClosures.FindAsync(id);
                if (closure == null)
                {
                    return NotFound("Closure not found");
                }

                closure.IsActive = false;
                _context.DiningClosures.Update(closure);
                await _context.SaveChangesAsync();

                Console.WriteLine($"Dining closure deactivated: {closure.Reason}");

                return Ok(new
                {
                    success = true,
                    message = "Closure deactivated successfully"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting closure: {ex.Message}");
                return BadRequest(new { error = "Failed to delete closure", details = ex.Message });
            }
        }

        // GET /api/admin/dining/check/{date}
        [HttpGet("check/{date}")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckDiningAvailable(string date)
        {
            if (!DateTime.TryParse(date, out var checkDate))
            {
                return BadRequest("Invalid date format");
            }

            var closure = await _context.DiningClosures
                .Where(dc => dc.IsActive && dc.StartDate.Date <= checkDate.Date && dc.EndDate.Date >= checkDate.Date)
                .FirstOrDefaultAsync();

            if (closure != null)
            {
                return Ok(new
                {
                    available = false,
                    reason = closure.Reason,
                    description = closure.Description,
                    startDate = closure.StartDate,
                    endDate = closure.EndDate
                });
            }

            return Ok(new { available = true });
        }
    }

    public class CreateDiningClosureRequest
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class UpdateDiningClosureRequest
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? Reason { get; set; }
        public string? Description { get; set; }
    }
}
