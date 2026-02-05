using System;
using System.Collections.Generic;
using Hdms.Api.Enums;

namespace Hdms.Api.Models
{
    /// <summary>
    /// Represents a group of tokens purchased together with a single QR code.
    /// A user can buy 1-4 tokens in a single QR code group.
    /// When scanning, tokens are decremented from this group.
    /// </summary>
    public class QRTokenGroup
    {
        public int Id { get; set; }

        // Unique QR identifier - this is what gets embedded in QR code
        public Guid QRCode { get; set; }

        // Student who owns this QR token group
        public string StudentId { get; set; } = string.Empty;
        public ApplicationUser? Student { get; set; }

        // Total tokens in this QR code (1-4)
        public int TotalTokens { get; set; }

        // Tokens remaining (decremented with each scan/redemption)
        public int RemainingTokens { get; set; }

        // Tokens that have been redeemed
        public int RedeemedTokens { get; set; }

        // Meal date for all tokens in this group
        public DateTime MealDate { get; set; }

        // Meal type (Lunch/Dinner)
        public MealType MealType { get; set; }

        // Price per token (total price = Price * TotalTokens)
        public decimal PricePerToken { get; set; }

        // Meal preference (can be shared or empty)
        public string? MealPreference { get; set; }

        // Reference to TokenOrder if bought in bulk
        public int? TokenOrderId { get; set; }
        public TokenOrder? TokenOrder { get; set; }

        // Week reference
        public int WeeklyMenuId { get; set; }
        public WeeklyMenu? WeeklyMenu { get; set; }

        // Status tracking
        public QRTokenGroupStatus Status { get; set; } = QRTokenGroupStatus.Active;

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; } // When all tokens are redeemed

        // Individual tokens in this group
        public ICollection<MealToken> MealTokens { get; set; } = new List<MealToken>();
    }

    /// <summary>
    /// Status of a QR token group
    /// </summary>
    public enum QRTokenGroupStatus
    {
        Active = 0,      // Tokens can still be redeemed
        Completed = 1,   // All tokens have been redeemed
        Cancelled = 2,   // Group was cancelled (not all tokens used)
        Expired = 3      // Meal date has passed
    }
}
