using System.Security.Claims;
using Hdms.Api.Data;
using Hdms.Api.DTOs.Tokens;
using Hdms.Api.Enums;
using Hdms.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TokensController : ControllerBase
    {
        private readonly HdmsDbContext _context;
        private const int DefaultMonthlyLimit = 45;

        public TokensController(HdmsDbContext context)
        {
            _context = context;
        }

        private async Task<int> GetMonthlyLimit(int year, int month)
        {
            var cap = await _context.MonthlyMealLimits
                .Where(x => x.Year == year && x.Month == month)
                .OrderByDescending(x => x.UpdatedAt)
                .FirstOrDefaultAsync();
            return cap?.Limit ?? DefaultMonthlyLimit;
        }

        private string GetUserId() =>
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        private static string GetDowName(DateTime d)
        {
            var names = new[] { "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY" };
            return names[(int)d.DayOfWeek];
        }

        // GET /api/tokens/my
        [HttpGet("my")]
        [Authorize(Roles = "Student")]
        public async Task<ActionResult<IEnumerable<MyTokenListItemDto>>> GetMyTokens()
        {
            var userId = GetUserId();

            var singleTokens = await _context.MealTokens
                .Where(t => t.StudentId == userId && t.QRTokenGroupId == null)
                .OrderByDescending(t => t.Date)
                .Select(t => new MyTokenListItemDto
                {
                    Id = t.Id,
                    Date = t.Date,
                    MealType = t.MealType,
                    Price = t.Price,
                    Status = t.Status,
                    TokenUid = t.TokenUid,
                    MealPreference = t.MealPreference,
                    IsBundle = false,
                    QRTokenGroupId = null,
                    TotalTokens = null,
                    RemainingTokens = null
                })
                .ToListAsync();

            var qrGroups = await _context.QRTokenGroups
                .Include(g => g.MealTokens)
                .Where(g => g.StudentId == userId)
                .OrderByDescending(g => g.MealDate)
                .ToListAsync();

            var bundleTokens = qrGroups.Select(g =>
            {
                var tokens = g.MealTokens.ToList();
                var status = TokenStatus.Purchased;

                if (tokens.Any(t => t.Status == TokenStatus.ListedForSale))
                    status = TokenStatus.ListedForSale;
                else if (tokens.All(t => t.Status == TokenStatus.Redeemed))
                    status = TokenStatus.Redeemed;
                else if (tokens.Any(t => t.Status == TokenStatus.Sold))
                    status = TokenStatus.Sold;
                else if (tokens.Any(t => t.Status == TokenStatus.Cancelled))
                    status = TokenStatus.Cancelled;

                return new MyTokenListItemDto
                {
                    Id = g.Id,
                    Date = g.MealDate,
                    MealType = g.MealType,
                    Price = g.PricePerToken * g.TotalTokens,
                    Status = status,
                    TokenUid = g.QRCode,
                    MealPreference = g.MealPreference,
                    IsBundle = true,
                    QRTokenGroupId = g.Id,
                    TotalTokens = g.TotalTokens,
                    RemainingTokens = g.RemainingTokens
                };
            }).ToList();

            var all = singleTokens.Concat(bundleTokens)
                .OrderByDescending(t => t.Date)
                .ThenByDescending(t => t.Id)
                .ToList();

            return Ok(all);
        }

        [HttpPost("redeem")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RedeemToken([FromBody] RedeemRequest req)
        {
            Console.WriteLine("========== TOKEN REDEEM DEBUG ==========");
            Console.WriteLine($"Request received - TokenId: {req.TokenId}, TokenUid: {req.TokenUid}, QRGroupCode: {req.QRGroupCode}");
            
            MealToken? token = null;
            if (req.TokenId.HasValue)
            {
                Console.WriteLine($"Searching by TokenId: {req.TokenId.Value}");
                token = await _context.MealTokens
                    .Include(t => t.Student)
                    .Include(t => t.QRTokenGroup)
                    .FirstOrDefaultAsync(t => t.Id == req.TokenId.Value);
                Console.WriteLine($"Token found by TokenId: {token != null}");
            }
            else if (req.QRGroupCode.HasValue)
            {
                // New: Handle QR group code (from QR bundle scan) OR single token GUID
                Console.WriteLine($"Searching by QRGroupCode: {req.QRGroupCode.Value}");
                var qrGroup = await _context.QRTokenGroups
                    .FirstOrDefaultAsync(qr => qr.QRCode == req.QRGroupCode.Value);
                
                if (qrGroup != null)
                {
                    Console.WriteLine($"QR Group found: {qrGroup.Id}, Remaining: {qrGroup.RemainingTokens}");

                    // Get the first unredeemed token from this group
                    token = await _context.MealTokens
                        .Include(t => t.Student)
                        .Include(t => t.QRTokenGroup)
                        .FirstOrDefaultAsync(t => t.QRTokenGroupId == qrGroup.Id && t.Status != TokenStatus.Redeemed);

                    if (token == null)
                    {
                        Console.WriteLine("No unredeemed tokens found in this QR group");
                        Console.WriteLine("=========================================");
                        return BadRequest("All tokens in this QR code have already been redeemed.");
                    }

                    Console.WriteLine($"Token found from QR group: {token.Id}");
                }
                else
                {
                    // QR Group not found - try as single token TokenUid
                    Console.WriteLine("QR Group not found, trying as single token TokenUid...");
                    token = await _context.MealTokens
                        .Include(t => t.Student)
                        .Include(t => t.QRTokenGroup)
                        .FirstOrDefaultAsync(t => t.TokenUid == req.QRGroupCode.Value);
                    
                    if (token != null)
                    {
                        Console.WriteLine($"Single token found by TokenUid: {token.Id}");
                    }
                    else
                    {
                        Console.WriteLine("Neither QR Group nor single token found");
                        Console.WriteLine("=========================================");
                        return NotFound("QR code not found. Invalid or expired QR code.");
                    }
                }
            }
            else if (req.TokenUid.HasValue)
            {
                Console.WriteLine($"Searching by TokenUid: {req.TokenUid.Value}");
                token = await _context.MealTokens
                    .Include(t => t.Student)
                    .Include(t => t.QRTokenGroup)
                    .FirstOrDefaultAsync(t => t.TokenUid == req.TokenUid.Value);
                Console.WriteLine($"Token found by exact GUID match: {token != null}");
                
                // If not found, try case-insensitive string comparison
                if (token == null)
                {
                    var guidString = req.TokenUid.Value.ToString().ToUpper();
                    Console.WriteLine($"Trying case-insensitive search with: {guidString}");
                    token = await _context.MealTokens
                        .Include(t => t.Student)
                        .Include(t => t.QRTokenGroup)
                        .FirstOrDefaultAsync(t => t.TokenUid.ToString().ToUpper() == guidString);
                    Console.WriteLine($"Token found by case-insensitive match: {token != null}");
                }
            }
            else
            {
                Console.WriteLine("ERROR: Neither TokenId nor TokenUid provided");
            }

            if (token == null)
            {
                Console.WriteLine("ERROR: Token not found in database");
                Console.WriteLine("=========================================");
                return NotFound("Token not found.");
            }
            
            Console.WriteLine($"SUCCESS: Token found - Id: {token.Id}, Uid: {token.TokenUid}, Status: {token.Status}");
            Console.WriteLine("=========================================");

            // Expiry and same-day cutoff checks
            // Bangladesh time (UTC+6) for redemption window checks
            var now = DateTime.UtcNow.AddHours(6);
            var today = now.Date;
            if (token.Date.Date < today)
                return BadRequest("Token date has passed and cannot be used.");

            if (token.Date.Date == today)
            {
                var redemptionCutoff = token.MealType == MealType.Lunch
                    ? new TimeSpan(15, 0, 0)   // 3:00 PM
                    : new TimeSpan(22, 0, 0);  // 10:00 PM

                if (now.TimeOfDay > redemptionCutoff)
                    return BadRequest("Redemption window closed for this token.");
            }

            // Allow redemption even if token is listed for sale (it can still be used until bought).
            // If the token is listed, we cancel any active listing to prevent someone purchasing a used token.
            if (token.Status != TokenStatus.Purchased && token.Status != TokenStatus.ListedForSale)
            {
                var statusMsg = token.Status switch
                {
                    TokenStatus.Redeemed => $"Token already redeemed on {token.RedeemedAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "unknown date"}.",
                    TokenStatus.Sold => "Token has been sold to another student.",
                    TokenStatus.Cancelled => "Token has been cancelled.",
                    _ => "Token is not available for redemption."
                };
                return BadRequest(statusMsg);
            }

            if (token.Status == TokenStatus.ListedForSale)
            {
                var activeListing = await _context.TokenListings
                    .FirstOrDefaultAsync(l => l.TokenId == token.Id && l.Status == ListingStatus.Active);
                if (activeListing != null)
                {
                    activeListing.Status = ListingStatus.Cancelled;
                }
            }

            token.Status = TokenStatus.Redeemed;
            token.RedeemedAt = DateTime.UtcNow;
            token.RedeemedById = GetUserId();

            // Handle QR Token Group update
            int? remainingTokensInGroup = null;
            if (token.QRTokenGroup != null)
            {
                token.QRTokenGroup.RemainingTokens = Math.Max(0, token.QRTokenGroup.RemainingTokens - 1);
                token.QRTokenGroup.RedeemedTokens += 1;
                
                remainingTokensInGroup = token.QRTokenGroup.RemainingTokens;

                // If all tokens redeemed, mark group as completed
                if (token.QRTokenGroup.RemainingTokens == 0)
                {
                    token.QRTokenGroup.Status = QRTokenGroupStatus.Completed;
                    token.QRTokenGroup.CompletedAt = DateTime.UtcNow;
                    Console.WriteLine($"QR Group {token.QRTokenGroup.Id} completed - all tokens redeemed");
                }
            }

            await _context.SaveChangesAsync();

            // Build details payload including student and meal info
            var student = token.Student;

            // Find meal plan items text for context
            string slot = token.MealType == MealType.Lunch ? "LUNCH" : "DINNER";
            string itemsText = string.Empty;
            var plan = await _context.MealPlans
                .FirstOrDefaultAsync(p => p.DayOfWeek == GetDowName(token.Date) && p.TimeSlot == slot);
            if (plan != null)
            {
                itemsText = plan.ItemsText;
            }

            var response = new
            {
                Message = "Token redeemed successfully.",
                Token = new
                {
                    token.Id,
                    token.TokenUid,
                    token.Date,
                    MealType = token.MealType.ToString(),
                    token.Price,
                    Status = token.Status.ToString(),
                    token.MealPreference,
                    token.RedeemedAt
                },
                Student = student == null ? null : new
                {
                    student.Id,
                    student.FullName,
                    student.Email,
                    student.UserCode
                },
                Meal = new
                {
                    ItemsText = itemsText,
                    Slot = slot,
                    Date = token.Date.ToString("yyyy-MM-dd")
                },
                QRGroup = token.QRTokenGroup == null ? null : new
                {
                    QRGroupId = token.QRTokenGroup.Id,
                    QRCode = token.QRTokenGroup.QRCode,
                    RemainingTokens = remainingTokensInGroup,
                    TotalTokens = token.QRTokenGroup.TotalTokens,
                    RedeemedTokens = token.QRTokenGroup.RedeemedTokens
                }
            };

            return Ok(response);
        }

        // GET /api/tokens/scan/{tokenId} or /api/tokens/scan?uid={guid}
        [HttpGet("scan")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetTokenDetails([FromQuery] int? tokenId, [FromQuery] Guid? uid)
        {
            MealToken? token = null;
            
            if (tokenId.HasValue)
            {
                token = await _context.MealTokens
                    .Include(t => t.Student)
                    .Include(t => t.QRTokenGroup)
                    .FirstOrDefaultAsync(t => t.Id == tokenId.Value);
            }
            else if (uid.HasValue)
            {
                token = await _context.MealTokens
                    .Include(t => t.Student)
                    .Include(t => t.QRTokenGroup)
                    .FirstOrDefaultAsync(t => t.TokenUid == uid.Value);
                
                // If not found, try case-insensitive string comparison
                if (token == null)
                {
                    var guidString = uid.Value.ToString().ToUpper();
                    token = await _context.MealTokens
                        .Include(t => t.Student)
                        .Include(t => t.QRTokenGroup)
                        .FirstOrDefaultAsync(t => t.TokenUid.ToString().ToUpper() == guidString);
                }
            }
            else
            {
                return BadRequest("Either tokenId or uid is required.");
            }

            if (token == null)
                return NotFound("Token not found.");

            // Get meal info
            string slot = token.MealType == MealType.Lunch ? "LUNCH" : "DINNER";
            string itemsText = string.Empty;
            var plan = await _context.MealPlans
                .FirstOrDefaultAsync(p => p.DayOfWeek == GetDowName(token.Date) && p.TimeSlot == slot);
            if (plan != null)
            {
                itemsText = plan.ItemsText;
            }

            return Ok(new
            {
                Token = new
                {
                    token.Id,
                    token.TokenUid,
                    token.Date,
                    MealType = token.MealType.ToString(),
                    token.Price,
                    Status = token.Status.ToString(),
                    token.MealPreference,
                    token.RedeemedAt,
                    token.RedeemedById
                },
                Student = token.Student == null ? null : new
                {
                    token.Student.Id,
                    token.Student.FullName,
                    token.Student.Email,
                    token.Student.UserCode
                },
                Meal = new
                {
                    ItemsText = itemsText,
                    Slot = slot,
                    Date = token.Date.ToString("yyyy-MM-dd")
                },
                QRGroup = token.QRTokenGroup == null ? null : new
                {
                    QRGroupId = token.QRTokenGroup.Id,
                    QRCode = token.QRTokenGroup.QRCode,
                    TotalTokens = token.QRTokenGroup.TotalTokens,
                    RemainingTokens = token.QRTokenGroup.RemainingTokens,
                    RedeemedTokens = token.QRTokenGroup.RedeemedTokens,
                    Status = token.QRTokenGroup.Status.ToString()
                }
            });
        }

        // DEBUG: List recent tokens with their UIDs
        [HttpGet("debug/recent")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRecentTokens()
        {
            var tokens = await _context.MealTokens
                .OrderByDescending(t => t.CreatedAt)
                .Take(10)
                .Select(t => new
                {
                    t.Id,
                    TokenUid = t.TokenUid.ToString(),
                    t.Date,
                    MealType = t.MealType.ToString(),
                    Status = t.Status.ToString(),
                    t.CreatedAt
                })
                .ToListAsync();

            return Ok(tokens);
        }

            // DEBUG: Reset token status to Purchased (for testing)
            [HttpPost("debug/reset/{tokenId}")]
            [Authorize(Roles = "Admin")]
            public async Task<IActionResult> ResetTokenStatus(int tokenId)
            {
                var token = await _context.MealTokens.FindAsync(tokenId);
                if (token == null)
                    return NotFound("Token not found.");

                token.Status = TokenStatus.Purchased;
                token.RedeemedAt = null;
                token.RedeemedById = null;
            
                await _context.SaveChangesAsync();
            
                Console.WriteLine($"[DEBUG] Token {tokenId} reset to Purchased status");
            
                return Ok(new { 
                    message = "Token reset to Purchased status", 
                    tokenId = tokenId,
                    tokenUid = token.TokenUid.ToString()
                });
            }

        // you can keep your Redeem or marketplace endpoints below if you had them
    }
}