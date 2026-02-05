namespace Hdms.Api.DTOs.Tokens
{
    public class RedeemRequest
    {
        public int? TokenId { get; set; }
        public Guid? TokenUid { get; set; }
        public Guid? QRGroupCode { get; set; }  // For QR Token Group scanning
    }
}