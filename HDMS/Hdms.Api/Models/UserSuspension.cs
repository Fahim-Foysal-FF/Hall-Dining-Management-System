using System;

namespace Hdms.Api.Models
{
    public class UserSuspension
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser? User { get; set; }
        
        public string Reason { get; set; } = string.Empty;
        public string? Details { get; set; }
        
        public int DurationWeeks { get; set; } // 1-10 weeks
        public DateTime SuspendedAt { get; set; }
        public DateTime SuspendedUntil { get; set; }
        
        public string SuspendedById { get; set; } = string.Empty;
        public ApplicationUser? SuspendedBy { get; set; }
        
        public bool IsActive { get; set; } = true;
        public bool IsAIDetected { get; set; } = false; // True if AI flagged this user
        
        public DateTime? RevokedAt { get; set; }
        public string? RevokedById { get; set; }
        public ApplicationUser? RevokedBy { get; set; }
        public string? RevocationReason { get; set; }
    }
}
