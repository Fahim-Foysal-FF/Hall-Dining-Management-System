namespace Hdms.Api.Models
{
    public class DiningClosure
    {
        public int Id { get; set; }
        
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        
        public string Reason { get; set; } = string.Empty; // e.g., "Maintenance", "Holidays", "Special Event"
        
        public string? Description { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string CreatedById { get; set; } = string.Empty;
        public ApplicationUser? CreatedBy { get; set; }
        
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedById { get; set; }
        public ApplicationUser? UpdatedBy { get; set; }
        
        public bool IsActive { get; set; } = true;
    }
}
