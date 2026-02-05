using Hdms.Api.Enums;

namespace Hdms.Api.DTOs.Marketplace
{
    public class ListingDto
    {
        public int Id { get; set; }
        public int TokenId { get; set; }
        public int? QRGroupId { get; set; }
        public bool IsBundle { get; set; }
        public int? BundleSize { get; set; }
        public DateTime Date { get; set; }
        public string MealType { get; set; } = string.Empty;
        public decimal ListingPrice { get; set; }
        public ListingStatus Status { get; set; }
        public string SellerName { get; set; } = string.Empty;
    }
}