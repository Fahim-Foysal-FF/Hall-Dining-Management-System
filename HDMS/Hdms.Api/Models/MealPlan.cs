namespace Hdms.Api.Models
{
    public class MealPlan
    {
        public int Id { get; set; }
        public string DayOfWeek { get; set; } = string.Empty; // SATURDAY..FRIDAY
        public string TimeSlot { get; set; } = string.Empty;  // LUNCH or DINNER
        public string ItemsText { get; set; } = string.Empty;
        public string? ChoicesText { get; set; }              // e.g. "CHICKEN|FISH"
        public decimal Price { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}