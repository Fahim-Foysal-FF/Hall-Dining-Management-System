using System;

namespace Hdms.Api.Models
{
    public class Complaint
    {
        public int Id { get; set; }
        public string TrackId { get; set; } = Guid.NewGuid().ToString().Substring(0, 8).ToUpper();
        public string StudentId { get; set; } = string.Empty;
        public ApplicationUser? Student { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, In Progress, Resolved, Rejected
        public string? FileName { get; set; }
        public string? FileUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string? AdminResponse { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }
}
