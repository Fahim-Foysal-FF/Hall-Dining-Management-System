using Hdms.Api.Enums;

namespace Hdms.Api.Models
{
    public class MenuMeal
    {
        public int Id { get; set; }

        public int WeeklyMenuId { get; set; }
        public WeeklyMenu? WeeklyMenu { get; set; }

        public DateTime Date { get; set; }
        public MealType MealType { get; set; }

        public ICollection<MenuMealItem> MenuMealItems { get; set; } = new List<MenuMealItem>();
    }
}