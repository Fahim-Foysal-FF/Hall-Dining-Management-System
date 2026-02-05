namespace Hdms.Api.DTOs.Menu
{
    public class UpdateMealPlanRequest
    {
        public string ItemsText { get; set; } = string.Empty;
        public string? ChoicesText { get; set; }
        public decimal Price { get; set; }
        public string? Note { get; set; }
    }
}