namespace Hdms.Api.Models
{
    public class MenuMealItem
    {
        public int Id { get; set; }

        public int MenuMealId { get; set; }
        public MenuMeal? MenuMeal { get; set; }

        public int FoodItemId { get; set; }
        public FoodItem? FoodItem { get; set; }
    }
}