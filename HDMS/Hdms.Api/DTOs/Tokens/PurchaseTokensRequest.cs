using Hdms.Api.Enums;

namespace Hdms.Api.DTOs.Tokens
{
    public class MealSelectionDto
    {
        public DateTime Date { get; set; }
        public MealType MealType { get; set; }
    }

    public class PurchaseTokensRequest
    {
        public List<MealSelectionDto> Selections { get; set; } = new();
        public string PaymentMethod { get; set; } = "Mock";
    }
}