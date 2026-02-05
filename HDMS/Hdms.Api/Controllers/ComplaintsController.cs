using Hdms.Api.Data;
using Hdms.Api.Models;
using Hdms.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ComplaintsController : ControllerBase
    {
        private readonly HdmsDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly EmailService _emailService;
        private readonly IWebHostEnvironment _hostEnvironment;
        private readonly AbuseDetectionService _abuseDetection;

        public ComplaintsController(
            HdmsDbContext db,
            UserManager<ApplicationUser> userManager,
            EmailService emailService,
            IWebHostEnvironment hostEnvironment,
            AbuseDetectionService abuseDetection)
        {
            _db = db;
            _userManager = userManager;
            _emailService = emailService;
            _hostEnvironment = hostEnvironment;
            _abuseDetection = abuseDetection;
        }

        [Authorize(Roles = "Student")]
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitComplaint([FromForm] ComplaintSubmitDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User not found");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound("User not found");

            var complaint = new Complaint
            {
                StudentId = userId,
                Title = dto.Title,
                Description = dto.Description,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Handle file upload
            if (dto.File != null && dto.File.Length > 0)
            {
                try
                {
                    var uploadsFolder = Path.Combine(_hostEnvironment.WebRootPath, "uploads", "complaints");
                    if (!Directory.Exists(uploadsFolder))
                        Directory.CreateDirectory(uploadsFolder);

                    var uniqueFileName = $"{complaint.TrackId}_{dto.File.FileName}";
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await dto.File.CopyToAsync(stream);
                    }

                    complaint.FileName = dto.File.FileName;
                    complaint.FileUrl = $"/uploads/complaints/{uniqueFileName}";
                }
                catch (Exception ex)
                {
                    return BadRequest($"File upload failed: {ex.Message}");
                }
            }

            _db.Complaints.Add(complaint);
            await _db.SaveChangesAsync();

            // Send email with track ID
            try
            {
                await _emailService.SendComplaintConfirmationEmailAsync(user.Email!, user.UserName!, complaint.TrackId, complaint.Title);
            }
            catch (Exception ex)
            {
                // Log error but don't fail the complaint submission
                Console.WriteLine($"Email sending failed: {ex.Message}");
            }

            // Auto-detect and act on complaint spam/abuse
            try
            {
                var analysis = await _abuseDetection.AnalyzeUserBehavior(userId);
                if (analysis.IsAbusive)
                {
                    await _abuseDetection.LogAbuse(
                        userId,
                        "COMPLAINT_SPAM",
                        string.Join(" | ", analysis.Flags),
                        (int)Math.Round(analysis.AbuseScore),
                        analysis.AbuseScore);

                    var hasActiveSuspension = await _db.UserSuspensions
                        .AnyAsync(s => s.UserId == userId && s.IsActive && s.SuspendedUntil > DateTime.UtcNow);

                    if (!hasActiveSuspension)
                    {
                        var weeks = analysis.RecommendedSuspensionWeeks > 0 ? analysis.RecommendedSuspensionWeeks : 1;
                        var now = DateTime.UtcNow;
                        var suspension = new UserSuspension
                        {
                            UserId = userId,
                            Reason = "Complaint spam detected (automatic)",
                            Details = string.Join(" | ", analysis.Flags),
                            DurationWeeks = weeks,
                            SuspendedAt = now,
                            SuspendedUntil = now.AddDays(weeks * 7),
                            SuspendedById = "SYSTEM",
                            IsActive = true,
                            IsAIDetected = true
                        };

                        _db.UserSuspensions.Add(suspension);
                        await _db.SaveChangesAsync();

                        // Notify user about automatic suspension (best-effort)
                        try
                        {
                            var subject = "Account Suspended for Complaint Abuse";
                            var body = $@"<p>Dear {user.FullName},</p>
<p>Your account has been suspended for {weeks} week(s) due to excessive or spam complaints.</p>
<p>Reason: Complaint spam detected (automatic)</p>
<p>Suspended until: {suspension.SuspendedUntil:yyyy-MM-dd HH:mm} UTC</p>
<p>If you believe this is an error, please contact the hall administration.</p>
<p>- HDMS System</p>";
                            await _emailService.SendEmailAsync(user.Email!, subject, body);
                        }
                        catch (Exception emailEx)
                        {
                            Console.WriteLine($"Failed to send suspension email: {emailEx.Message}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Abuse detection error: {ex.Message}");
            }

            return Ok(new { message = "Complaint submitted successfully", trackId = complaint.TrackId });
        }

        [Authorize(Roles = "Student")]
        [HttpGet("my-complaints")]
        public async Task<IActionResult> GetMyComplaints()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User not found");

            var complaints = await _db.Complaints
                .Where(c => c.StudentId == userId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id,
                    c.TrackId,
                    c.Title,
                    c.Description,
                    c.Status,
                    c.FileName,
                    c.FileUrl,
                    c.CreatedAt,
                    c.UpdatedAt,
                    c.AdminResponse,
                    c.ResolvedAt
                })
                .ToListAsync();

            return Ok(complaints);
        }

        [Authorize(Roles = "Student")]
        [HttpGet("track/{trackId}")]
        public async Task<IActionResult> TrackComplaint(string trackId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User not found");

            var complaint = await _db.Complaints
                .Where(c => c.TrackId == trackId && c.StudentId == userId)
                .FirstOrDefaultAsync();

            if (complaint == null)
                return NotFound("Complaint not found");

            return Ok(new
            {
                complaint.Id,
                complaint.TrackId,
                complaint.Title,
                complaint.Description,
                complaint.Status,
                complaint.FileName,
                complaint.FileUrl,
                complaint.CreatedAt,
                complaint.UpdatedAt,
                complaint.AdminResponse,
                complaint.ResolvedAt
            });
        }

        // ADMIN ENDPOINTS

        [Authorize(Roles = "Admin")]
        [HttpGet("admin/all")]
        public async Task<IActionResult> GetAllComplaints([FromQuery] string? status = null)
        {
            var query = _db.Complaints.AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(c => c.Status == status);

            var complaints = await query
                .Include(c => c.Student)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id,
                    c.TrackId,
                    c.Title,
                    c.Description,
                    c.Status,
                    c.FileName,
                    c.FileUrl,
                    c.CreatedAt,
                    c.UpdatedAt,
                    c.AdminResponse,
                    c.ResolvedAt,
                    StudentName = c.Student!.UserName,
                    StudentEmail = c.Student!.Email
                })
                .ToListAsync();

            return Ok(complaints);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("admin/{id}/update")]
        public async Task<IActionResult> UpdateComplaint(int id, [FromBody] ComplaintUpdateDto dto)
        {
            var complaint = await _db.Complaints
                .Include(c => c.Student)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (complaint == null)
                return NotFound("Complaint not found");

            complaint.Status = dto.Status;
            complaint.AdminResponse = dto.AdminResponse;
            complaint.UpdatedAt = DateTime.UtcNow;

            if (dto.Status == "Resolved")
                complaint.ResolvedAt = DateTime.UtcNow;

            _db.Complaints.Update(complaint);
            await _db.SaveChangesAsync();

            // Send email notification to student
            try
            {
                if (complaint.Student != null && !string.IsNullOrEmpty(complaint.Student.Email))
                {
                    await _emailService.SendComplaintResponseEmailAsync(
                        complaint.Student.Email,
                        complaint.Student.UserName ?? "Student",
                        complaint.TrackId,
                        complaint.Title,
                        complaint.Status,
                        complaint.AdminResponse
                    );
                }
            }
            catch (Exception ex)
            {
                // Log error but don't fail the update
                Console.WriteLine($"Email sending failed: {ex.Message}");
            }

            return Ok(new { message = "Complaint updated successfully" });
        }
    }

    public class ComplaintSubmitDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public IFormFile? File { get; set; }
    }

    public class ComplaintUpdateDto
    {
        public string Status { get; set; } = string.Empty;
        public string? AdminResponse { get; set; }
    }
}
