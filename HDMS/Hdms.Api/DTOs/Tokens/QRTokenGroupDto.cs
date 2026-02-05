namespace Hdms.Api.DTOs.Tokens
{
    /// <summary>
    /// DTO for QR Token Group details
    /// </summary>
    public class QRTokenGroupDto
    {
        public int Id { get; set; }
        public Guid QRCode { get; set; }
        public int TotalTokens { get; set; }
        public int RemainingTokens { get; set; }
        public int RedeemedTokens { get; set; }
        public DateTime MealDate { get; set; }
        public string MealType { get; set; } = string.Empty;
        public decimal PricePerToken { get; set; }
        public decimal TotalPrice { get; set; } // TotalTokens * PricePerToken
        public string? MealPreference { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Request to buy multiple tokens in one QR code
    /// </summary>
    public class BuyQRTokenGroupRequest
    {
        public string Date { get; set; } = string.Empty;
        public string Slot { get; set; } = string.Empty; // LUNCH or DINNER
        public int Quantity { get; set; } = 1; // 1-4 tokens
        public string? Preference { get; set; }
    }

    /// <summary>
    /// Response for token redemption from QR group
    /// </summary>
    public class RedeemQRTokenResponse
    {
        public int TokenId { get; set; }
        public Guid TokenUid { get; set; }
        public int QRGroupId { get; set; }
        public Guid QRCode { get; set; }
        public int RemainingTokens { get; set; } // Tokens left in this QR
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// Details about a token/QR group for scanning
    /// </summary>
    public class TokenScanDetailsDto
    {
        public int TokenId { get; set; }
        public Guid TokenUid { get; set; }
        public DateTime Date { get; set; }
        public string MealType { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? MealPreference { get; set; }
        public DateTime? RedeemedAt { get; set; }

        // QR Group specific
        public int? QRGroupId { get; set; }
        public Guid? QRCode { get; set; }
        public int? TotalTokensInGroup { get; set; }
        public int? RemainingTokensInGroup { get; set; }
        public int? RedeemedTokensInGroup { get; set; }

        // Student info
        public StudentInfoDto? Student { get; set; }
        public MealInfoDto? Meal { get; set; }
    }

    public class StudentInfoDto
    {
        public string Id { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string UserCode { get; set; } = string.Empty;
    }

    public class MealInfoDto
    {
        public string ItemsText { get; set; } = string.Empty;
        public string Slot { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
    }
}
