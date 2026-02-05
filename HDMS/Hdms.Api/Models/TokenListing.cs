using Hdms.Api.Enums;

namespace Hdms.Api.Models
{
    public class TokenListing
    {
        public int Id { get; set; }

        public int TokenId { get; set; }
        public MealToken? Token { get; set; }

        public string SellerId { get; set; } = string.Empty;
        public ApplicationUser? Seller { get; set; }

        public string? BuyerId { get; set; }
        public ApplicationUser? Buyer { get; set; }

        public decimal ListingPrice { get; set; }
        public ListingStatus Status { get; set; } = ListingStatus.Active;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
    }
}