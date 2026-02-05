using Hdms.Api.Enums;

namespace Hdms.Api.DTOs.Menu
{
    public class WeekMenuMealItemDto
    {
        public int FoodItemId { get; set; }
        public string FoodItemName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public decimal Price { get; set; }
    }

    public class WeekMenuMealDto
    {
        public DateTime Date { get; set; }
        public MealType MealType { get; set; }
        public List<WeekMenuMealItemDto> Items { get; set; } = new();
    }

    public class WeekMenuResponse
    {
        public int WeeklyMenuId { get; set; }
        public DateTime WeekStartDate { get; set; }
        public DateTime WeekEndDate { get; set; }
        public List<WeekMenuMealDto> Meals { get; set; } = new();
    }
}