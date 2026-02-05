namespace Hdms.Api.Models
{
    public class WeeklyMenu
    {
        public int Id { get; set; }
        public DateTime WeekStartDate { get; set; }
        public DateTime WeekEndDate { get; set; }
        public bool IsPublished { get; set; } = false;

        public string CreatedById { get; set; } = string.Empty;
        public ApplicationUser? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<MenuMeal> MenuMeals { get; set; } = new List<MenuMeal>();
    }
}