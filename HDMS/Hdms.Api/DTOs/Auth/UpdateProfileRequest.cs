namespace Hdms.Api.DTOs.Auth
{
    public class UpdateProfileRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
    }
}
