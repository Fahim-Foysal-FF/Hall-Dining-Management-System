namespace Hdms.Api.Models
{
    public class FoodItem
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true;

        public int CategoryId { get; set; }
        public FoodCategory? Category { get; set; }
    }
}