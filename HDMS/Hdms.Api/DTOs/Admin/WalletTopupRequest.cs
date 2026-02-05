namespace Hdms.Api.DTOs.Admin
{
    public class WalletTopupRequest
    {
        public string UserId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? Description { get; set; }
    }
}