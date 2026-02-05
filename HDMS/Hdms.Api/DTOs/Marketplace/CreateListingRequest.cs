namespace Hdms.Api.DTOs.Marketplace
{
    public class CreateListingRequest
    {
        public int? TokenId { get; set; }
        public int? QRGroupId { get; set; }
        public decimal ListingPrice { get; set; }
    }
}