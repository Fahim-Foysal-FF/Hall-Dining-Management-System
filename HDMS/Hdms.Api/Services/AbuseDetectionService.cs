using Hdms.Api.Data;
using Hdms.Api.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Hdms.Api.Services
{
    public class AbuseDetectionService
    {
        private readonly HdmsDbContext _context;

        public AbuseDetectionService(HdmsDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// AI-powered abuse detection based on user behavior patterns
        /// </summary>
        public async Task<AbuseDetectionResult> AnalyzeUserBehavior(string userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return new AbuseDetectionResult { UserId = userId, AbuseScore = 0, IsAbusive = false };

            var now = DateTime.UtcNow;
            var last24Hours = now.AddHours(-24);
            var last7Days = now.AddDays(-7);
            var last30Days = now.AddDays(-30);

            double abuseScore = 0;
            var flags = new List<string>();

            // 1. Check complaint spam (more than 5 complaints in 24 hours)
            var recentComplaints = await _context.Complaints
                .Where(c => c.StudentId == userId && c.CreatedAt >= last24Hours)
                .CountAsync();

            if (recentComplaints > 5)
            {
                abuseScore += 30;
                flags.Add($"SPAM_COMPLAINTS: {recentComplaints} complaints in 24 hours");
            }
            else if (recentComplaints > 3)
            {
                abuseScore += 15;
                flags.Add($"EXCESSIVE_COMPLAINTS: {recentComplaints} complaints in 24 hours");
            }

            // 2. Check complaint spam over 7 days (more than 15 complaints)
            var weekComplaints = await _context.Complaints
                .Where(c => c.StudentId == userId && c.CreatedAt >= last7Days)
                .CountAsync();

            if (weekComplaints > 15)
            {
                abuseScore += 25;
                flags.Add($"SPAM_COMPLAINTS_WEEKLY: {weekComplaints} complaints in 7 days");
            }
            else if (weekComplaints > 10)
            {
                abuseScore += 12;
                flags.Add($"EXCESSIVE_COMPLAINTS_WEEKLY: {weekComplaints} complaints in 7 days");
            }

            // 3. Check for duplicate/similar complaint content
            var recentComplaintTexts = await _context.Complaints
                .Where(c => c.StudentId == userId && c.CreatedAt >= last7Days)
                .Select(c => c.Description)
                .ToListAsync();

            if (recentComplaintTexts.Count > 5)
            {
                // Simple duplicate detection - check if many complaints have very similar length
                var avgLength = recentComplaintTexts.Average(t => t?.Length ?? 0);
                var similarComplaints = recentComplaintTexts
                    .Count(t => t != null && Math.Abs((t.Length - avgLength)) < 10);

                if (similarComplaints > 5 && similarComplaints > recentComplaintTexts.Count * 0.7)
                {
                    abuseScore += 20;
                    flags.Add($"DUPLICATE_COMPLAINTS: {similarComplaints} similar complaints detected");
                }
            }

            // 4. Calculate historical complaint abuse from previous logs
            var historicalComplaintAbuse = await _context.UserAbuseLogs
                .Where(l => l.UserId == userId && 
                            l.DetectedAt >= last30Days &&
                            l.ActionType.Contains("COMPLAINT"))
                .SumAsync(l => l.Severity);

            if (historicalComplaintAbuse > 20)
            {
                abuseScore += historicalComplaintAbuse / 2.0;
                flags.Add($"REPEAT_COMPLAINT_OFFENDER: {historicalComplaintAbuse} historical complaint abuse points");
            }

            // 5. Check if user was previously suspended for complaints
            var priorComplaintSuspensions = await _context.UserSuspensions
                .Where(s => s.UserId == userId && 
                            s.SuspendedAt >= last30Days.AddDays(-60) &&
                            (s.Reason.Contains("complaint") || s.Reason.Contains("spam") || s.Reason.Contains("support")))
                .CountAsync();

            if (priorComplaintSuspensions > 0)
            {
                abuseScore += priorComplaintSuspensions * 15;
                flags.Add($"PRIOR_COMPLAINT_SUSPENSIONS: {priorComplaintSuspensions} times in 90 days");
            }

            // Determine if abusive (threshold: 25 points or higher for complaints)
            bool isAbusive = abuseScore >= 25;
            int recommendedWeeks = CalculateSuspensionDuration(abuseScore);

            return new AbuseDetectionResult
            {
                UserId = userId,
                AbuseScore = abuseScore,
                IsAbusive = isAbusive,
                Flags = flags,
                RecommendedSuspensionWeeks = recommendedWeeks,
                AnalyzedAt = now
            };
        }

        /// <summary>
        /// Calculate recommended suspension duration based on abuse score
        /// </summary>
        private int CalculateSuspensionDuration(double abuseScore)
        {
            if (abuseScore < 25) return 0;
            if (abuseScore < 35) return 1;
            if (abuseScore < 45) return 2;
            if (abuseScore < 55) return 3;
            if (abuseScore < 65) return 4;
            if (abuseScore < 75) return 5;
            if (abuseScore < 85) return 6;
            if (abuseScore < 95) return 8;
            return 10; // Maximum 10 weeks
        }

        /// <summary>
        /// Log detected abuse for future analysis
        /// </summary>
        public async Task LogAbuse(string userId, string actionType, string description, int severity, double abuseScore)
        {
            var log = new UserAbuseLog
            {
                UserId = userId,
                ActionType = actionType,
                Description = description,
                Severity = severity,
                AbuseScore = abuseScore,
                DetectedAt = DateTime.UtcNow
            };

            _context.UserAbuseLogs.Add(log);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Get list of users flagged by AI for admin review
        /// </summary>
        public async Task<List<FlaggedUser>> GetFlaggedUsers()
        {
            var recentLogs = await _context.UserAbuseLogs
                .Where(l => !l.IsReviewed && l.DetectedAt >= DateTime.UtcNow.AddDays(-7))
                .GroupBy(l => l.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    TotalScore = g.Sum(l => l.AbuseScore),
                    LatestDetection = g.Max(l => l.DetectedAt),
                    FlagCount = g.Count()
                })
                .Where(x => x.TotalScore >= 25)
                .ToListAsync();

            var flaggedUsers = new List<FlaggedUser>();
            foreach (var log in recentLogs)
            {
                var user = await _context.Users.FindAsync(log.UserId);
                if (user != null)
                {
                    var result = await AnalyzeUserBehavior(log.UserId);
                    flaggedUsers.Add(new FlaggedUser
                    {
                        UserId = log.UserId,
                        UserName = user.FullName,
                        Email = user.Email!,
                        AbuseScore = result.AbuseScore,
                        Flags = result.Flags,
                        RecommendedWeeks = result.RecommendedSuspensionWeeks,
                        DetectedAt = log.LatestDetection
                    });
                }
            }

            return flaggedUsers.OrderByDescending(f => f.AbuseScore).ToList();
        }
    }

    public class AbuseDetectionResult
    {
        public string UserId { get; set; } = string.Empty;
        public double AbuseScore { get; set; }
        public bool IsAbusive { get; set; }
        public List<string> Flags { get; set; } = new();
        public int RecommendedSuspensionWeeks { get; set; }
        public DateTime AnalyzedAt { get; set; }
    }

    public class FlaggedUser
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public double AbuseScore { get; set; }
        public List<string> Flags { get; set; } = new();
        public int RecommendedWeeks { get; set; }
        public DateTime DetectedAt { get; set; }
    }
}
