using Microsoft.AspNetCore.Identity;

namespace Hdms.Api.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; } = string.Empty;
        public string StudentIdNumber { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string HallName { get; set; } = string.Empty;
        public string RoomNumber { get; set; } = string.Empty;

        // Extra fields from your Flask model
        public string UserCode { get; set; } = string.Empty; // MMHxxxxxx
        public string? Phone { get; set; }
        public string Locale { get; set; } = "en";
        public string? AvatarPath { get; set; }

        public decimal WalletBalance { get; set; } = 0m;
    }
}