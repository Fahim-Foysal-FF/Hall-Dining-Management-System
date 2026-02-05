using Hdms.Api.Enums;

namespace Hdms.Api.Models
{
    public class MealFeedback
    {
        public int Id { get; set; }

        public string StudentId { get; set; } = string.Empty;
        public ApplicationUser? Student { get; set; }

        public DateTime Date { get; set; }
        public MealType MealType { get; set; }

        public int Rating { get; set; }   // 1-5
        public string? Comment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}