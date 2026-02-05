using Hdms.Api.Enums;

namespace Hdms.Api.DTOs.Tokens
{
    public class TokenDto
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public MealType MealType { get; set; }
        public decimal Price { get; set; }
        public TokenStatus Status { get; set; }
        public Guid TokenUid { get; set; }
        public string? MealPreference { get; set; }
    }
}