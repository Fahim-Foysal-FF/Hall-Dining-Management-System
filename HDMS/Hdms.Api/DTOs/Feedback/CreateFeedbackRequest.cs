using Hdms.Api.Enums;

namespace Hdms.Api.DTOs.Feedback
{
    public class CreateFeedbackRequest
    {
        public DateTime Date { get; set; }
        public MealType MealType { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}