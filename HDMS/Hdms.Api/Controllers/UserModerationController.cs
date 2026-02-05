using System.Security.Claims;
using Hdms.Api.Data;
using Hdms.Api.Models;
using Hdms.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/admin/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UserModerationController : ControllerBase
    {
        private readonly HdmsDbContext _context;
        private readonly AbuseDetectionService _abuseDetection;
        private readonly EmailService _emailService;

        public UserModerationController(HdmsDbContext context, AbuseDetectionService abuseDetection, EmailService emailService)
        {
            _context = context;
            _abuseDetection = abuseDetection;
            _emailService = emailService;
        }

        private string GetUserId() =>
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        private static string GetRiskLevel(double score) => score switch
        {
            < 25 => "Low",
            < 45 => "Medium",
            < 70 => "High",
            _ => "Critical"
        };

        private static int GetSuggestedWeeks(double score, int recommended)
        {
            if (recommended > 0) return recommended;
            if (score < 25) return 0;
            if (score < 35) return 1;
            if (score < 45) return 2;
            if (score < 55) return 3;
            if (score < 65) return 4;
            if (score < 75) return 5;
            if (score < 85) return 6;
            if (score < 95) return 8;
            return 10;
        }

        /// <summary>
        /// GET /api/admin/usermoderation/flagged-users
        /// Get list of users flagged by AI for potential abuse
        /// </summary>
        [HttpGet("flagged-users")]
        public async Task<IActionResult> GetFlaggedUsers()
        {
            var flaggedUsers = await _abuseDetection.GetFlaggedUsers();
            var now = DateTime.UtcNow;
            var shaped = new List<object>();

            foreach (var f in flaggedUsers)
            {
                var flags = f.Flags ?? new List<string>();
                var suggestedWeeks = GetSuggestedWeeks(f.AbuseScore, f.RecommendedWeeks);

                // Auto-enforce for critical scores when no active suspension
                var hasActiveSuspension = await _context.UserSuspensions
                    .AnyAsync(s => s.UserId == f.UserId && s.IsActive && s.SuspendedUntil > now);

                if (!hasActiveSuspension && f.AbuseScore >= 70)
                {
                    var adminId = GetUserId();
                    var suspendedById = await _context.Users.AnyAsync(u => u.Id == adminId)
                        ? adminId
                        : f.UserId; // Fallback to the offending user to satisfy FK constraint

                    var suspension = new UserSuspension
                    {
                        UserId = f.UserId,
                        Reason = "AI-detected complaint/support abuse",
                        Details = string.Join(" | ", flags),
                        DurationWeeks = suggestedWeeks > 0 ? suggestedWeeks : 4,
                        SuspendedAt = now,
                        SuspendedUntil = now.AddDays((suggestedWeeks > 0 ? suggestedWeeks : 4) * 7),
                        SuspendedById = suspendedById,
                        IsActive = true,
                        IsAIDetected = true
                    };
                    _context.UserSuspensions.Add(suspension);
                    await _context.SaveChangesAsync();
                }

                shaped.Add(new
                {
                    userId = f.UserId,
                    fullName = f.UserName,
                    email = f.Email,
                    abuseScore = f.AbuseScore,
                    riskLevel = GetRiskLevel(f.AbuseScore),
                    suggestedSuspensionWeeks = suggestedWeeks,
                    primaryReason = flags.FirstOrDefault() ?? "Complaint abuse detected",
                    flags,
                    detectedAt = f.DetectedAt
                });
            }

            return Ok(shaped);
        }

        /// <summary>
        /// GET /api/admin/usermoderation/analyze/{userId}
        /// Analyze a specific user's behavior
        /// </summary>
        [HttpGet("analyze/{userId}")]
        public async Task<IActionResult> AnalyzeUser(string userId)
        {
            var result = await _abuseDetection.AnalyzeUserBehavior(userId);
            var user = await _context.Users.FindAsync(userId);
            
            if (user == null)
                return NotFound("User not found");

            var suggested = GetSuggestedWeeks(result.AbuseScore, result.RecommendedSuspensionWeeks);

            return Ok(new
            {
                userId = user.Id,
                fullName = user.FullName,
                email = user.Email,
                abuseScore = result.AbuseScore,
                riskLevel = GetRiskLevel(result.AbuseScore),
                suggestedSuspensionWeeks = suggested,
                reasons = result.Flags,
                analyzedAt = result.AnalyzedAt
            });
        }

        /// <summary>
        /// POST /api/admin/usermoderation/suspend
        /// Suspend a user for specified weeks (1-10)
        /// </summary>
        [HttpPost("suspend")]
        public async Task<IActionResult> SuspendUser([FromBody] SuspendUserRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.UserId))
                return BadRequest("User ID is required");

            // Allow missing/zero duration: fall back to suggested weeks from abuse score, minimum 1
            var duration = req.DurationWeeks;
            if (duration < 1)
            {
                var suggested = req.AbuseScore.HasValue
                    ? GetSuggestedWeeks(req.AbuseScore.Value, 0)
                    : 1;
                duration = Math.Min(10, Math.Max(1, suggested));
            }
            if (duration > 10)
                duration = 10;

            var user = await _context.Users.FindAsync(req.UserId);
            if (user == null)
                return NotFound("User not found");

            // Check if user already has an active suspension
            var existingSuspension = await _context.UserSuspensions
                .FirstOrDefaultAsync(s => s.UserId == req.UserId && s.IsActive && s.SuspendedUntil > DateTime.UtcNow);

            if (existingSuspension != null)
                return BadRequest($"User is already suspended until {existingSuspension.SuspendedUntil:yyyy-MM-dd}");

            var adminId = GetUserId();
            var now = DateTime.UtcNow;
            var suspendedUntil = now.AddDays(duration * 7);

            var suspension = new UserSuspension
            {
                UserId = req.UserId,
                Reason = req.Reason ?? "Violation of platform rules",
                Details = req.Details,
                DurationWeeks = duration,
                SuspendedAt = now,
                SuspendedUntil = suspendedUntil,
                SuspendedById = adminId,
                IsActive = true,
                IsAIDetected = req.IsAIDetected
            };

            _context.UserSuspensions.Add(suspension);

            // Log the abuse if AI detected
            if (req.IsAIDetected)
            {
                await _abuseDetection.LogAbuse(
                    req.UserId,
                    "ADMIN_SUSPENSION",
                    req.Reason ?? "Admin suspended after AI detection",
                    duration * 2, // Severity based on duration
                    req.AbuseScore ?? 0
                );
            }

            // Mark user's abuse logs as reviewed
            var unreviewed = await _context.UserAbuseLogs
                .Where(l => l.UserId == req.UserId && !l.IsReviewed)
                .ToListAsync();

            foreach (var log in unreviewed)
            {
                log.IsReviewed = true;
                log.ReviewedAt = now;
                log.ReviewedById = adminId;
                log.ReviewNotes = $"User suspended for {duration} weeks";
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = $"User {user.FullName} suspended for {duration} week(s)",
                Suspension = new
                {
                    suspension.Id,
                    suspension.UserId,
                    UserName = user.FullName,
                    suspension.Reason,
                    suspension.DurationWeeks,
                    suspension.SuspendedAt,
                    suspension.SuspendedUntil
                }
            });
        }

        /// <summary>
        /// GET /api/admin/usermoderation/suspensions
        /// Get all suspensions (active and past)
        /// </summary>
        [HttpGet("suspensions")]
        public async Task<IActionResult> GetSuspensions([FromQuery] bool? activeOnly = null)
        {
            var query = _context.UserSuspensions
                .Include(s => s.User)
                .Include(s => s.SuspendedBy)
                .AsQueryable();

            if (activeOnly == true)
            {
                query = query.Where(s => s.IsActive && s.SuspendedUntil > DateTime.UtcNow);
            }

            var suspensions = await query
                .OrderByDescending(s => s.SuspendedAt)
                .Select(s => new
                {
                    s.Id,
                    s.UserId,
                    UserName = s.User != null ? s.User.FullName : "Unknown",
                    UserEmail = s.User != null ? s.User.Email : "",
                    s.Reason,
                    s.Details,
                    s.DurationWeeks,
                    s.SuspendedAt,
                    s.SuspendedUntil,
                    SuspendedBy = s.SuspendedBy != null ? s.SuspendedBy.FullName : "System",
                    s.IsActive,
                    s.IsAIDetected,
                    s.RevokedAt,
                    s.RevocationReason
                })
                .ToListAsync();

            return Ok(suspensions);
        }

        /// <summary>
        /// POST /api/admin/usermoderation/revoke/{suspensionId}
        /// Revoke/lift a suspension early
        /// </summary>
        [HttpPost("revoke/{suspensionId}")]
        public async Task<IActionResult> RevokeSuspension(int suspensionId, [FromBody] RevokeSuspensionRequest req)
        {
            var suspension = await _context.UserSuspensions
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == suspensionId);

            if (suspension == null)
                return NotFound("Suspension not found");

            if (!suspension.IsActive)
                return BadRequest("Suspension is already inactive");

            var adminId = GetUserId();

            suspension.IsActive = false;
            suspension.RevokedAt = DateTime.UtcNow;
            suspension.RevokedById = adminId;
            suspension.RevocationReason = req.Reason ?? "Admin decision";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = $"Suspension lifted for {suspension.User?.FullName}",
                Suspension = new
                {
                    suspension.Id,
                    suspension.UserId,
                    suspension.RevokedAt,
                    suspension.RevocationReason
                }
            });
        }

        /// <summary>
        /// GET /api/admin/usermoderation/abuse-logs
        /// Get abuse detection logs
        /// </summary>
        [HttpGet("abuse-logs")]
        public async Task<IActionResult> GetAbuseLogs([FromQuery] bool? unreviewedOnly = null, [FromQuery] int? days = 7)
        {
            var sinceDate = DateTime.UtcNow.AddDays(-(days ?? 7));

            var query = _context.UserAbuseLogs
                .Include(l => l.User)
                .Where(l => l.DetectedAt >= sinceDate);

            if (unreviewedOnly == true)
            {
                query = query.Where(l => !l.IsReviewed);
            }

            var logs = await query
                .OrderByDescending(l => l.DetectedAt)
                .Select(l => new
                {
                    l.Id,
                    l.UserId,
                    UserName = l.User != null ? l.User.FullName : "Unknown",
                    l.ActionType,
                    l.Description,
                    l.Severity,
                    l.AbuseScore,
                    l.DetectedAt,
                    l.IsReviewed,
                    l.ReviewedAt,
                    l.ReviewNotes
                })
                .ToListAsync();

            return Ok(logs);
        }

        /// <summary>
        /// GET /api/admin/usermoderation/check-suspension/{userId}
        /// Check if a user is currently suspended
        /// </summary>
        [HttpGet("check-suspension/{userId}")]
        public async Task<IActionResult> CheckSuspension(string userId)
        {
            var now = DateTime.UtcNow;
            var suspension = await _context.UserSuspensions
                .Where(s => s.UserId == userId && s.IsActive && s.SuspendedUntil > now)
                .OrderByDescending(s => s.SuspendedAt)
                .FirstOrDefaultAsync();

            if (suspension == null)
            {
                return Ok(new { IsSuspended = false });
            }

            return Ok(new
            {
                IsSuspended = true,
                Suspension = new
                {
                    suspension.Id,
                    suspension.Reason,
                    suspension.SuspendedAt,
                    suspension.SuspendedUntil,
                    DaysRemaining = (suspension.SuspendedUntil - now).Days
                }
            });
        }

        /// <summary>
        /// GET /api/admin/usermoderation/all-users
        /// Get all users in the system (for admin block management)
        /// </summary>
        [HttpGet("all-users")]
        public async Task<IActionResult> GetAllUsers([FromQuery] string? search = null)
        {
            var usersQuery = _context.Users.AsQueryable();

            // Apply search filter if provided
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                usersQuery = usersQuery.Where(u => 
                    u.Email.ToLower().Contains(searchLower) ||
                    u.FullName.ToLower().Contains(searchLower) ||
                    u.UserCode.ToLower().Contains(searchLower) ||
                    u.Id.ToLower().Contains(searchLower)
                );
            }

            var users = await usersQuery
                .OrderBy(u => u.FullName)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.UserCode,
                    u.Department,
                    u.HallName,
                    u.RoomNumber
                })
                .Take(100) // Limit to 100 users for performance
                .ToListAsync();

            // Check suspension status for each user
            var now = DateTime.UtcNow;
            var userIds = users.Select(u => u.Id).ToList();
            var activeSuspensions = await _context.UserSuspensions
                .Where(s => userIds.Contains(s.UserId) && s.IsActive && s.SuspendedUntil > now)
                .Select(s => s.UserId)
                .ToListAsync();

            var result = users.Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.UserCode,
                u.Department,
                u.HallName,
                u.RoomNumber,
                IsSuspended = activeSuspensions.Contains(u.Id)
            });

            return Ok(result);
        }

        /// <summary>
        /// POST /api/admin/usermoderation/block
        /// Manually block a user (permanent or temporary block)
        /// </summary>
        [HttpPost("block")]
        public async Task<IActionResult> BlockUser([FromBody] BlockUserRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.UserId))
                return BadRequest("User ID is required");

            if (string.IsNullOrWhiteSpace(req.Reason))
                return BadRequest("Reason is required");

            var user = await _context.Users.FindAsync(req.UserId);
            if (user == null)
                return NotFound("User not found");

            // Check if user already has an active suspension
            var existingSuspension = await _context.UserSuspensions
                .FirstOrDefaultAsync(s => s.UserId == req.UserId && s.IsActive && s.SuspendedUntil > DateTime.UtcNow);

            if (existingSuspension != null)
                return BadRequest($"User is already suspended until {existingSuspension.SuspendedUntil:yyyy-MM-dd}");

            var adminId = GetUserId();
            var now = DateTime.UtcNow;
            
            // Determine suspension duration
            int durationWeeks = req.IsPermanent ? 52 : (req.DurationWeeks ?? 1); // 52 weeks = ~1 year
            var suspendedUntil = req.IsPermanent ? now.AddYears(10) : now.AddDays(durationWeeks * 7); // 10 years for permanent

            var suspension = new UserSuspension
            {
                UserId = req.UserId,
                Reason = req.Reason,
                Details = req.Details,
                DurationWeeks = durationWeeks,
                SuspendedAt = now,
                SuspendedUntil = suspendedUntil,
                SuspendedById = adminId,
                IsActive = true,
                IsAIDetected = false // Manual block, not AI detected
            };

            _context.UserSuspensions.Add(suspension);

            // Log the manual block
            await _abuseDetection.LogAbuse(
                req.UserId,
                "MANUAL_BLOCK",
                $"Admin manually blocked user: {req.Reason}",
                req.IsPermanent ? 100 : 50, // Higher severity for permanent blocks
                0
            );

            // Mark user's abuse logs as reviewed
            var unreviewed = await _context.UserAbuseLogs
                .Where(l => l.UserId == req.UserId && !l.IsReviewed)
                .ToListAsync();

            foreach (var log in unreviewed)
            {
                log.IsReviewed = true;
                log.ReviewedAt = now;
                log.ReviewedById = adminId;
                log.ReviewNotes = $"User manually blocked - {req.Reason}";
            }

            await _context.SaveChangesAsync();

            // Send email notification to the user
            try
            {
                var blockType = req.IsPermanent ? "permanently" : $"for {durationWeeks} week(s)";
                var emailSubject = "Account Suspended - HDMS";
                var emailBody = $@"
                    <html>
                    <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                        <div style='max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd;'>
                            <div style='background-color: #dc3545; color: white; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;'>
                                <h2 style='margin: 0;'>🔒 Account Suspended</h2>
                            </div>
                            
                            <div style='background-color: white; padding: 30px; border-radius: 0 0 5px 5px;'>
                                <p>Dear <strong>{user.FullName}</strong>,</p>
                                
                                <p>Your HDMS (Hall Dining Management System) account has been <strong>{blockType}</strong>.</p>
                                
                                <div style='background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;'>
                                    <h3 style='margin-top: 0; color: #856404;'>Suspension Details:</h3>
                                    <p style='margin: 5px 0;'><strong>Reason:</strong> {req.Reason}</p>
                                    {(!string.IsNullOrEmpty(req.Details) ? $"<p style='margin: 5px 0;'><strong>Details:</strong> {req.Details}</p>" : "")}
                                    <p style='margin: 5px 0;'><strong>Suspended On:</strong> {now:MMMM dd, yyyy 'at' hh:mm tt}</p>
                                    <p style='margin: 5px 0;'><strong>Suspended Until:</strong> {suspendedUntil:MMMM dd, yyyy 'at' hh:mm tt}</p>
                                    {(!req.IsPermanent ? $"<p style='margin: 5px 0;'><strong>Duration:</strong> {durationWeeks} week(s)</p>" : "<p style='margin: 5px 0;'><strong>Type:</strong> Permanent Block</p>")}
                                </div>
                                
                                <h3>What This Means:</h3>
                                <ul>
                                    <li>You will <strong>not be able to login</strong> to the HDMS system</li>
                                    <li>You cannot purchase meal tokens during this period</li>
                                    <li>You cannot access marketplace or other features</li>
                                    {(!req.IsPermanent ? $"<li>Your account will be <strong>automatically reactivated</strong> on {suspendedUntil:MMMM dd, yyyy}</li>" : "<li>Your account can only be reactivated by administrator approval</li>")}
                                </ul>
                                
                                <div style='background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0;'>
                                    <h3 style='margin-top: 0; color: #0c5460;'>Need Help?</h3>
                                    <p style='margin: 5px 0;'>If you believe this suspension was made in error or you would like to appeal, please contact the hall administration:</p>
                                    <p style='margin: 5px 0;'><strong>Email:</strong> admin@mmhall.edu.bd</p>
                                    <p style='margin: 5px 0;'><strong>Office Hours:</strong> 9:00 AM - 5:00 PM</p>
                                </div>
                                
                                <p style='margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;'>
                                    This is an automated notification from the Hall Dining Management System (HDMS).<br>
                                    Munshi Meherullah Hall, JUST<br>
                                    <strong>User Code:</strong> {user.UserCode}<br>
                                    <strong>Notification Date:</strong> {DateTime.UtcNow:MMMM dd, yyyy 'at' hh:mm tt} UTC
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>
                ";

                await _emailService.SendEmailAsync(user.Email!, emailSubject, emailBody);
            }
            catch (Exception ex)
            {
                // Log email error but don't fail the block operation
                Console.WriteLine($"Failed to send suspension email to {user.Email}: {ex.Message}");
            }

            return Ok(new
            {
                Message = $"User {user.FullName} blocked {(req.IsPermanent ? "permanently" : $"for {durationWeeks} week(s)")}",
                Block = new
                {
                    suspension.Id,
                    suspension.UserId,
                    UserName = user.FullName,
                    suspension.Reason,
                    suspension.Details,
                    BlockType = req.IsPermanent ? "Permanent" : "Temporary",
                    suspension.DurationWeeks,
                    suspension.SuspendedAt,
                    suspension.SuspendedUntil,
                    BlockedBy = adminId
                }
            });
        }

        /// <summary>
        /// POST /api/admin/usermoderation/unblock/{userId}
        /// Manually unblock a user (revoke block before expiry)
        /// </summary>
        [HttpPost("unblock/{userId}")]
        public async Task<IActionResult> UnblockUser(string userId, [FromBody] UnblockUserRequest req)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound("User not found");

            var suspension = await _context.UserSuspensions
                .Where(s => s.UserId == userId && s.IsActive && s.SuspendedUntil > DateTime.UtcNow)
                .OrderByDescending(s => s.SuspendedAt)
                .FirstOrDefaultAsync();

            if (suspension == null)
                return BadRequest("No active block found for this user");

            var adminId = GetUserId();

            suspension.IsActive = false;
            suspension.RevokedAt = DateTime.UtcNow;
            suspension.RevokedById = adminId;
            suspension.RevocationReason = req.Reason ?? "Admin decision to unblock";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = $"User {user.FullName} unblocked",
                Unblock = new
                {
                    suspension.Id,
                    suspension.UserId,
                    UserName = user.FullName,
                    suspension.RevokedAt,
                    suspension.RevocationReason,
                    UnblockedBy = adminId
                }
            });
        }
    }

    public class SuspendUserRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string? Reason { get; set; }
        public string? Details { get; set; }
        public int DurationWeeks { get; set; } // 1-10
        public bool IsAIDetected { get; set; } = false;
        public double? AbuseScore { get; set; }
    }

    public class RevokeSuspensionRequest
    {
        public string? Reason { get; set; }
    }

    public class BlockUserRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string? Details { get; set; }
        public bool IsPermanent { get; set; } = false;
        public int? DurationWeeks { get; set; } // Only used if IsPermanent is false
    }

    public class UnblockUserRequest
    {
        public string? Reason { get; set; }
    }
}
