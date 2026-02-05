using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Hdms.Api.Data;
using Hdms.Api.DTOs.Auth;
using Hdms.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly EmailService _emailService;
        private readonly HdmsDbContext _context;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IConfiguration configuration,
            EmailService emailService,
            HdmsDbContext context)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _emailService = emailService;
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest model)
        {
            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null)
                return BadRequest("User with this email already exists.");

            var user = new ApplicationUser
            {
                UserName = model.Email,
                Email = model.Email,
                FullName = model.FullName,
                StudentIdNumber = model.StudentIdNumber,
                Department = model.Department,
                HallName = model.HallName,
                RoomNumber = model.RoomNumber
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors);
            // Generate a UserCode if missing (e.g., MMH + first 6 chars of Id)
            if (string.IsNullOrEmpty(user.UserCode))
            {
                var idPart = user.Id.Length >= 6
                    ? user.Id.Substring(0, 6).ToUpper()
                    : user.Id.ToUpper();
                user.UserCode = $"MMH{idPart}";
                await _userManager.UpdateAsync(user);
}

            if (!await _roleManager.RoleExistsAsync("Student"))
                await _roleManager.CreateAsync(new IdentityRole("Student"));

            await _userManager.AddToRoleAsync(user, "Student");

            return Ok("User registered successfully.");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
                return Unauthorized("Invalid email or password.");

            // Check if user is currently suspended/blocked
            var now = DateTime.UtcNow;
            var activeSuspension = await _context.UserSuspensions
                .Where(s => s.UserId == user.Id && s.IsActive && s.SuspendedUntil > now)
                .OrderByDescending(s => s.SuspendedAt)
                .FirstOrDefaultAsync();

            if (activeSuspension != null)
            {
                var daysRemaining = (activeSuspension.SuspendedUntil - now).Days;
                return Unauthorized(new
                {
                    error = "AccountSuspended",
                    message = $"Your account has been suspended until {activeSuspension.SuspendedUntil:yyyy-MM-dd}.",
                    reason = activeSuspension.Reason,
                    suspendedUntil = activeSuspension.SuspendedUntil,
                    daysRemaining = daysRemaining
                });
            }

            var roles = await _userManager.GetRolesAsync(user);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.Email ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

            var jwtSection = _configuration.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSection["Key"]!));

            var token = new JwtSecurityToken(
                issuer: jwtSection["Issuer"],
                audience: jwtSection["Audience"],
                expires: DateTime.UtcNow.AddMinutes(double.Parse(jwtSection["ExpiresMinutes"]!)),
                claims: claims,
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new AuthResponse
            {
                Token = tokenString,
                UserId = user.Id,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                UserCode = user.UserCode ?? string.Empty,
                Roles = roles
            });
        }

        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                user.Id,
                user.Email,
                user.FullName,
                user.UserCode,
                user.Phone,
                user.Department,
                user.HallName,
                user.RoomNumber,
                user.WalletBalance,
                                user.AvatarPath,
                Roles = roles
            });
        }

        [HttpPost("forgot")]
        public async Task<IActionResult> Forgot(ForgotPasswordRequest model)
        {
            if (string.IsNullOrWhiteSpace(model.Email))
                return BadRequest("Email is required.");

            var user = await _userManager.FindByEmailAsync(model.Email);
            // Always return OK to avoid account enumeration
            if (user == null)
            {
                return Ok(new { message = "If this email exists, a reset link has been sent." });
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

            // Send password reset email
            await _emailService.SendPasswordResetEmailAsync(user.Email!, user.FullName, token, user.Id);

            return Ok(new { message = "If this email exists, a reset link has been sent." });
        }

        [HttpPost("reset")]
        public async Task<IActionResult> ResetPassword(ResetPasswordRequest model)
        {
            if (string.IsNullOrWhiteSpace(model.UserId) ||
                string.IsNullOrWhiteSpace(model.Token) ||
                string.IsNullOrWhiteSpace(model.NewPassword))
            {
                return BadRequest("UserId, token, and new password are required.");
            }

            var user = await _userManager.FindByIdAsync(model.UserId);
            if (user == null)
            {
                return BadRequest("Invalid user.");
            }

            var result = await _userManager.ResetPasswordAsync(user, model.Token, model.NewPassword);
            if (!result.Succeeded)
            {
                return BadRequest("Failed to reset password. The token may be invalid or expired.");
            }

            return Ok(new { message = "Password has been reset successfully." });
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromForm] string fullName, [FromForm] string? phone, [FromForm] string roomNumber, [FromForm] IFormFile? photo)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            // Update profile fields
            user.FullName = fullName ?? user.FullName;
            user.Phone = phone ?? user.Phone;
            user.RoomNumber = roomNumber ?? user.RoomNumber;

            // Handle photo upload
            if (photo != null && photo.Length > 0)
            {
                // Validate file
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                var fileExtension = Path.GetExtension(photo.FileName).ToLowerInvariant();
                
                if (!allowedExtensions.Contains(fileExtension))
                    return BadRequest("Invalid file format. Only JPG, PNG, GIF are allowed.");
                
                if (photo.Length > 5 * 1024 * 1024) // 5MB limit
                    return BadRequest("File size must not exceed 5MB.");

                // Save photo
                var uploadsFolder = Path.Combine("wwwroot", "uploads", "avatars");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var fileName = $"{user.Id}_{DateTime.UtcNow.Ticks}{fileExtension}";
                var filePath = Path.Combine(uploadsFolder, fileName);
                
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await photo.CopyToAsync(fileStream);
                }

                user.AvatarPath = $"/uploads/avatars/{fileName}";
            }

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest("Failed to update profile.");
            }

            return Ok(new { message = "Profile updated successfully.", user.Id, user.FullName, user.Email, user.Phone, user.RoomNumber, user.AvatarPath });
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return BadRequest($"Failed to change password: {errors}");
            }

            return Ok(new { message = "Password changed successfully." });
        }
    }
}
