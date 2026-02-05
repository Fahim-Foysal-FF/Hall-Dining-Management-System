using Hdms.Api.Enums;

namespace Hdms.Api.Models
{
    public class TokenOrder
    {
        public int Id { get; set; }

        public string StudentId { get; set; } = string.Empty;
        public ApplicationUser? Student { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public decimal TotalAmount { get; set; }
        public OrderPaymentStatus PaymentStatus { get; set; } = OrderPaymentStatus.Pending;
        public string? PaymentGatewayRef { get; set; }

        public ICollection<MealToken> MealTokens { get; set; } = new List<MealToken>();
    }
}