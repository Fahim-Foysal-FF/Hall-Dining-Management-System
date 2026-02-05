using Hdms.Api.Enums;

namespace Hdms.Api.DTOs.Menu
{
    public class CreateMenuMealRequest
    {
        public DateTime Date { get; set; }
        public MealType MealType { get; set; }
        public List<int> FoodItemIds { get; set; } = new();
    }
}