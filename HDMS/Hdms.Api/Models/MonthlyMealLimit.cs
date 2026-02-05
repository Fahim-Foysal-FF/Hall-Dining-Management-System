using System;

namespace Hdms.Api.Models
{
    public class MonthlyMealLimit
    {
        public int Id { get; set; }
        public int Year { get; set; }
        public int Month { get; set; }
        public int Limit { get; set; }
        public string? UpdatedById { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
