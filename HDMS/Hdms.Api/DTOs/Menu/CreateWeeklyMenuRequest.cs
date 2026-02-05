namespace Hdms.Api.DTOs.Menu
{
    public class CreateWeeklyMenuRequest
    {
        public DateTime WeekStartDate { get; set; }
        public DateTime WeekEndDate { get; set; }
    }
}