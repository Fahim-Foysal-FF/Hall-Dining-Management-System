using Hdms.Api.Data;
using Hdms.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Security.Claims;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NoticesController : ControllerBase
    {
        private readonly HdmsDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IWebHostEnvironment _hostEnvironment;

        public NoticesController(
            HdmsDbContext db,
            UserManager<ApplicationUser> userManager,
            IWebHostEnvironment hostEnvironment)
        {
            _db = db;
            _userManager = userManager;
            _hostEnvironment = hostEnvironment;
        }

        [AllowAnonymous]
        [HttpGet("board")]
        public async Task<IActionResult> GetNoticesForStudents([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var now = DateTime.UtcNow;

            var notices = await _db.DiningNotices
                .Where(n => n.IsActive && (n.ExpiresAt == null || n.ExpiresAt > now))
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(n => new
                {
                    n.Id,
                    n.Title,
                    n.Content,
                    n.FileName,
                    n.FileUrl,
                    n.CreatedAt,
                    CreatedBy = n.CreatedBy!.UserName,
                    n.ExpiresAt
                })
                .ToListAsync();

            var total = await _db.DiningNotices
                .CountAsync(n => n.IsActive && (n.ExpiresAt == null || n.ExpiresAt > now));

            return Ok(new
            {
                notices,
                total,
                page,
                pageSize
            });
        }

        [AllowAnonymous]
        [HttpGet("board/{id}")]
        public async Task<IActionResult> GetNoticeDetail(int id)
        {
            var now = DateTime.UtcNow;
            var notice = await _db.DiningNotices
                .Include(n => n.CreatedBy)
                .FirstOrDefaultAsync(n => n.Id == id && n.IsActive && (n.ExpiresAt == null || n.ExpiresAt > now));

            if (notice == null)
                return NotFound("Notice not found");

            return Ok(new
            {
                notice.Id,
                notice.Title,
                notice.Content,
                notice.FileName,
                notice.FileUrl,
                notice.CreatedAt,
                notice.UpdatedAt,
                CreatedBy = notice.CreatedBy!.UserName,
                notice.ExpiresAt
            });
        }

        // ADMIN ENDPOINTS

        [Authorize(Roles = "Admin")]
        [HttpPost("create")]
        public async Task<IActionResult> CreateNotice([FromForm] CreateNoticeDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User not found");

            var notice = new DiningNotice
            {
                Title = dto.Title,
                Content = dto.Content,
                CreatedById = userId,
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                ExpiresAt = dto.ExpiresAt
            };

            if (dto.File != null && dto.File.Length > 0)
            {
                try
                {
                    var uploadsFolder = GetNoticeUploadsFolder();
                    if (!Directory.Exists(uploadsFolder))
                    {
                        Directory.CreateDirectory(uploadsFolder);
                    }

                    var uniqueFileName = $"{Guid.NewGuid()}_{dto.File.FileName}";
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await dto.File.CopyToAsync(stream);
                    }

                    notice.FileName = dto.File.FileName;
                    notice.FileUrl = $"/uploads/notices/{uniqueFileName}";
                }
                catch (Exception ex)
                {
                    return BadRequest($"File upload failed: {ex.Message}");
                }
            }

            _db.DiningNotices.Add(notice);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Notice created successfully", id = notice.Id });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("admin/all")]
        public async Task<IActionResult> GetAllNotices([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var notices = await _db.DiningNotices
                .Include(n => n.CreatedBy)
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(n => new
                {
                    n.Id,
                    n.Title,
                    n.Content,
                    n.FileName,
                    n.FileUrl,
                    n.CreatedAt,
                    n.UpdatedAt,
                    CreatedBy = n.CreatedBy!.UserName,
                    n.IsActive,
                    n.ExpiresAt
                })
                .ToListAsync();

            var total = await _db.DiningNotices.CountAsync();

            return Ok(new
            {
                notices,
                total,
                page,
                pageSize
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("admin/{id}/update")]
        public async Task<IActionResult> UpdateNotice(int id, [FromForm] UpdateNoticeDto dto)
        {
            var notice = await _db.DiningNotices.FirstOrDefaultAsync(n => n.Id == id);
            if (notice == null)
                return NotFound("Notice not found");

            notice.Title = dto.Title;
            notice.Content = dto.Content;
            notice.UpdatedAt = DateTime.UtcNow;
            notice.ExpiresAt = dto.ExpiresAt;

            if (dto.File != null && dto.File.Length > 0)
            {
                try
                {
                    var uploadsFolder = GetNoticeUploadsFolder();
                    if (!Directory.Exists(uploadsFolder))
                    {
                        Directory.CreateDirectory(uploadsFolder);
                    }

                    // Delete old file if exists
                    if (!string.IsNullOrEmpty(notice.FileUrl))
                    {
                        var existingPath = Path.Combine(
                            uploadsFolder,
                            notice.FileUrl.Replace("/uploads/notices/", string.Empty));

                        if (System.IO.File.Exists(existingPath))
                        {
                            System.IO.File.Delete(existingPath);
                        }
                    }

                    var uniqueFileName = $"{Guid.NewGuid()}_{dto.File.FileName}";
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await dto.File.CopyToAsync(stream);
                    }

                    notice.FileName = dto.File.FileName;
                    notice.FileUrl = $"/uploads/notices/{uniqueFileName}";
                }
                catch (Exception ex)
                {
                    return BadRequest($"File upload failed: {ex.Message}");
                }
            }

            _db.DiningNotices.Update(notice);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Notice updated successfully" });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("admin/{id}/toggle-status")]
        public async Task<IActionResult> ToggleNoticeStatus(int id)
        {
            var notice = await _db.DiningNotices.FirstOrDefaultAsync(n => n.Id == id);
            if (notice == null)
                return NotFound("Notice not found");

            notice.IsActive = !notice.IsActive;
            notice.UpdatedAt = DateTime.UtcNow;

            _db.DiningNotices.Update(notice);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Notice status updated", isActive = notice.IsActive });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("admin/{id}/delete")]
        public async Task<IActionResult> DeleteNotice(int id)
        {
            var notice = await _db.DiningNotices.FirstOrDefaultAsync(n => n.Id == id);
            if (notice == null)
                return NotFound("Notice not found");

            _db.DiningNotices.Remove(notice);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Notice deleted successfully" });
        }

        private string GetNoticeUploadsFolder()
        {
            var webRoot = _hostEnvironment.WebRootPath;
            if (string.IsNullOrWhiteSpace(webRoot))
            {
                webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            return Path.Combine(webRoot, "uploads", "notices");
        }
    }

    public class CreateNoticeDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime? ExpiresAt { get; set; }
        public IFormFile? File { get; set; }
    }

    public class UpdateNoticeDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime? ExpiresAt { get; set; }
        public IFormFile? File { get; set; }
    }
}
