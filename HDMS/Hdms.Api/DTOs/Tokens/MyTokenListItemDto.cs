using Hdms.Api.Enums;

namespace Hdms.Api.DTOs.Tokens
{
    public class MyTokenListItemDto
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public MealType MealType { get; set; }
        public decimal Price { get; set; }
        public TokenStatus Status { get; set; }
        public Guid? TokenUid { get; set; }
        public string? MealPreference { get; set; }

        public bool IsBundle { get; set; }
        public int? QRTokenGroupId { get; set; }
        public int? TotalTokens { get; set; }
        public int? RemainingTokens { get; set; }
    }
}
