using Hdms.Api.Enums;

namespace Hdms.Api.DTOs.Orders
{
    public class BuyTokenRequest
    {
        public string Date { get; set; } = string.Empty;
        public string Slot { get; set; } = string.Empty;
        // Backwards-compat: accept both "preference" and "mealPreference" from JSON
        public string? Preference { get; set; }
        public string? MealPreference { get; set; }
        
        // New: Support buying multiple tokens in one QR code (1-4)
        public int Quantity { get; set; } = 1;
    }
}