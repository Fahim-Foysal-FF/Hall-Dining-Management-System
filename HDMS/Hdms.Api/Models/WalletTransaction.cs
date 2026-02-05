namespace Hdms.Api.Models
{
    public class WalletTransaction
    {
        public int Id { get; set; }

        public string UserId { get; set; } = string.Empty;
        public ApplicationUser? User { get; set; }

        public decimal Amount { get; set; }          // +credit, -debit
        public string Type { get; set; } = string.Empty; // TOPUP | PURCHASE | SALE | REFUND | ADJUSTMENT
        public string? Ref { get; set; }             // e.g., "listing:1", "token:5"
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}