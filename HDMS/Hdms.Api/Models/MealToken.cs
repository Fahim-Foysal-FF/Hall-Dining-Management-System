using Hdms.Api.Enums;

namespace Hdms.Api.Models
{
    public class MealToken
    {
        public string? MealPreference { get; set; }
        public int Id { get; set; }

        // Unique identifier for the token (for QR, display, etc)
        public Guid TokenUid { get; set; }

        public string StudentId { get; set; } = string.Empty;
        public ApplicationUser? Student { get; set; }

        public int WeeklyMenuId { get; set; }
        public WeeklyMenu? WeeklyMenu { get; set; }

        public DateTime Date { get; set; }
        public MealType MealType { get; set; }
        public decimal Price { get; set; }

        public TokenStatus Status { get; set; } = TokenStatus.Purchased;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int? TokenOrderId { get; set; }
        public TokenOrder? TokenOrder { get; set; }

        // Reference to QR Token Group (for bulk purchases)
        public int? QRTokenGroupId { get; set; }
        public QRTokenGroup? QRTokenGroup { get; set; }

        public DateTime? RedeemedAt { get; set; }
        public string? RedeemedById { get; set; }
        public ApplicationUser? RedeemedBy { get; set; }
    }
}