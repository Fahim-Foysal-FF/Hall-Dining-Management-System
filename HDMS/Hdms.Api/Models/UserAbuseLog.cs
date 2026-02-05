using System;

namespace Hdms.Api.Models
{
    public class UserAbuseLog
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser? User { get; set; }
        
        public string ActionType { get; set; } = string.Empty; // "EXCESSIVE_PURCHASE", "SPAM_COMPLAINT", "RAPID_LISTING", etc.
        public string Description { get; set; } = string.Empty;
        
        public int Severity { get; set; } // 1-10 (higher = more severe)
        public double AbuseScore { get; set; } // AI-calculated score
        
        public DateTime DetectedAt { get; set; }
        public string? Metadata { get; set; } // JSON data for additional context
        
        public bool IsReviewed { get; set; } = false;
        public DateTime? ReviewedAt { get; set; }
        public string? ReviewedById { get; set; }
        public ApplicationUser? ReviewedBy { get; set; }
        public string? ReviewNotes { get; set; }
    }
}
