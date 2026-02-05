using Hdms.Api.Data;
using Hdms.Api.Enums;
using Hdms.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/admin/tokens")]
    [Authorize(Roles = "Admin")]
    public class AdminTokensController : ControllerBase
    {
        private readonly HdmsDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly EmailService _emailService;

        public AdminTokensController(HdmsDbContext context, UserManager<ApplicationUser> userManager, EmailService emailService)
        {
            _context = context;
            _userManager = userManager;
            _emailService = emailService;
        }

        // GET /api/admin/tokens
        [HttpGet]
        public async Task<IActionResult> GetTokens()
        {
            var tokenEntities = await _context.MealTokens
                .Include(t => t.Student)
                .OrderByDescending(t => t.Date)
                .Take(500)
                .ToListAsync();

            var tokens = tokenEntities
                .Select(t => new
                {
                    t.Id,
                    t.Date,
                    MealType = t.MealType.ToString(),
                    t.Price,
                    Status = t.Status.ToString(),
                    StudentName = t.Student?.FullName,
                    StudentEmail = t.Student?.Email,
                    StudentCode = t.Student?.UserCode
                })
                .ToList();

            return Ok(tokens);
        }

        // GET /api/admin/tokens/listings
        [HttpGet("listings")]
        public async Task<IActionResult> GetListings()
        {
            var listingEntities = await _context.TokenListings
                .Include(l => l.Token)
                    .ThenInclude(t => t!.Student)
                .Include(l => l.Seller)
                .OrderByDescending(l => l.CreatedAt)
                .Take(500)
                .ToListAsync();

            var listings = listingEntities
                .Select(l => new
                {
                    l.Id,
                    l.TokenId,
                    Price = l.ListingPrice,
                    Status = l.Status.ToString(),
                    l.CreatedAt,
                    TokenDate = l.Token?.Date,
                    MealType = l.Token?.MealType.ToString(),
                    SellerName = l.Seller?.FullName,
                    SellerEmail = l.Seller?.Email,
                    SellerCode = l.Seller?.UserCode
                })
                .ToList();

            return Ok(listings);
        }

    // POST /api/admin/tokens/send-free
    [HttpPost("send-free")]
    public async Task<IActionResult> SendFreeTokens([FromBody] SendFreeTokensRequest request)
        {
            if (request.MealDate == default || string.IsNullOrWhiteSpace(request.Reason))
            {
                return BadRequest("Meal date and reason are required");
            }

            if (request.MealType < 0 || request.MealType > 2)
            {
                return BadRequest("Invalid meal type");
            }

            try
            {
                // Get all active users
                var users = await _context.Users.ToListAsync();

                if (users.Count == 0)
                {
                    return BadRequest("No users found");
                }

                // Get current weekly menu for the date
                var weeklyMenu = await _context.WeeklyMenus
                    .FirstOrDefaultAsync(w => w.IsPublished && w.WeekStartDate <= request.MealDate && w.WeekEndDate >= request.MealDate);

                int tokensCreated = 0;
                var createdTokens = new List<MealToken>();

                foreach (var user in users)
                {
                    // Check if user already has a token for this date and meal type
                    var existingToken = await _context.MealTokens
                        .FirstOrDefaultAsync(t => t.StudentId == user.Id && t.Date == request.MealDate && t.MealType == (MealType)request.MealType);

                    if (existingToken != null)
                    {
                        continue; // Skip if token already exists
                    }

                    var token = new MealToken
                    {
                        TokenUid = Guid.NewGuid(),
                        StudentId = user.Id,
                        Date = request.MealDate,
                        MealType = (MealType)request.MealType,
                        Price = 0, // Free token
                        Status = TokenStatus.Purchased,
                        WeeklyMenuId = weeklyMenu?.Id ?? 0,
                        MealPreference = null
                    };

                    _context.MealTokens.Add(token);
                    createdTokens.Add(token);
                    tokensCreated++;
                }

                if (tokensCreated > 0)
                {
                    await _context.SaveChangesAsync();

                    // Send emails with QR codes for each token
                    var mealTypeStr = ((MealType)request.MealType).ToString();
                    var tasks = new List<Task>();

                    foreach (var token in createdTokens)
                    {
                        var user = users.FirstOrDefault(u => u.Id == token.StudentId);
                        if (user != null && !string.IsNullOrEmpty(user.Email))
                        {
                            // Send email with QR code
                            tasks.Add(_emailService.SendTokenQrEmailAsync(
                                user.Email,
                                user.FullName,
                                token.Id,
                                token.Date,
                                mealTypeStr,
                                0, // Free token
                                token.TokenUid,
                                token.MealPreference
                            ));
                        }
                    }

                    // Wait for all emails to be sent
                    await Task.WhenAll(tasks);

                    // Log this action
                    Console.WriteLine($"Admin sent {tokensCreated} free tokens for {request.MealDate:yyyy-MM-dd} ({(MealType)request.MealType}). Reason: {request.Reason}. Emails sent with QR codes.");

                    return Ok(new
                    {
                        success = true,
                        message = $"Successfully sent {tokensCreated} free tokens to users with QR code emails",
                        tokensCreated = tokensCreated,
                        date = request.MealDate,
                        mealType = ((MealType)request.MealType).ToString(),
                        reason = request.Reason
                    });
                }
                else
                {
                    return Ok(new
                    {
                        success = true,
                        message = "All users already have tokens for this date and meal type",
                        tokensCreated = 0
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending free tokens: {ex.Message}\n{ex.StackTrace}");
                return BadRequest(new { error = "Failed to send free tokens", details = ex.Message });
            }
        }
    }

    public class SendFreeTokensRequest
    {
        public DateTime MealDate { get; set; }
        public int MealType { get; set; } // 0=Breakfast, 1=Lunch, 2=Dinner
        public string Reason { get; set; } = string.Empty; // e.g., "Hall Day", "March 26", etc.
    }
}