using System.Security.Claims;
using Hdms.Api.Data;
using Hdms.Api.DTOs.Marketplace;
using Hdms.Api.Enums;
using Hdms.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MarketplaceController : ControllerBase
    {
        private readonly HdmsDbContext _context;
        private readonly EmailService _emailService;
        private readonly ILogger<MarketplaceController> _logger;

        public MarketplaceController(HdmsDbContext context, EmailService emailService, ILogger<MarketplaceController> logger)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
        }

        [HttpGet("listings")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<ListingDto>>> GetListings()
        {
            var listings = await _context.TokenListings
                .Include(l => l.Token)
                .ThenInclude(t => t.QRTokenGroup)
                .Include(l => l.Seller)
                .Where(l => l.Status == ListingStatus.Active &&
                            l.Token!.Status == TokenStatus.ListedForSale &&
                            l.Token.Date >= DateTime.UtcNow.Date)
                .Select(l => new ListingDto
                {
                    Id = l.Id,
                    TokenId = l.TokenId,
                    QRGroupId = l.Token!.QRTokenGroupId,
                    IsBundle = l.Token.QRTokenGroupId != null,
                    BundleSize = l.Token.QRTokenGroup != null ? l.Token.QRTokenGroup.TotalTokens : null,
                    Date = l.Token!.Date,
                    MealType = l.Token.MealType.ToString(),
                    ListingPrice = l.ListingPrice,
                    Status = l.Status,
                    SellerName = l.Seller!.FullName
                })
                .ToListAsync();

            return Ok(listings);
        }

        [HttpPost("listings")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> CreateListing(CreateListingRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            if (request.ListingPrice <= 0) return BadRequest("Listing price must be greater than 0.");

            MealToken? token = null;
            QRTokenGroup? qrGroup = null;

            if (request.QRGroupId.HasValue)
            {
                qrGroup = await _context.QRTokenGroups
                    .Include(g => g.MealTokens)
                    .FirstOrDefaultAsync(g => g.Id == request.QRGroupId.Value);

                if (qrGroup == null) return NotFound("QR bundle not found.");
                if (qrGroup.StudentId != userId) return BadRequest("You do not own this bundle.");
                if (qrGroup.MealDate < DateTime.UtcNow.Date) return BadRequest("Cannot sell expired bundle.");

                if (qrGroup.MealTokens.Any(t => t.Status == TokenStatus.Redeemed))
                    return BadRequest("Cannot sell a partially redeemed bundle.");

                if (qrGroup.MealTokens.Any(t => t.Status != TokenStatus.Purchased))
                    return BadRequest("All tokens in bundle must be purchased.");

                var hasActiveListing = await _context.TokenListings
                    .Include(l => l.Token)
                    .AnyAsync(l => l.Status == ListingStatus.Active && l.Token != null && l.Token.QRTokenGroupId == qrGroup.Id);
                if (hasActiveListing) return BadRequest("This bundle is already listed for sale.");

                foreach (var t in qrGroup.MealTokens)
                {
                    t.Status = TokenStatus.ListedForSale;
                }

                token = qrGroup.MealTokens.OrderBy(t => t.Id).FirstOrDefault();
            }
            else if (request.TokenId.HasValue)
            {
                token = await _context.MealTokens
                    .Include(t => t.QRTokenGroup)
                    .FirstOrDefaultAsync(t => t.Id == request.TokenId.Value);

                if (token == null) return NotFound("Token not found.");
                if (token.StudentId != userId) return BadRequest("You do not own this token.");
                if (token.Date < DateTime.UtcNow.Date) return BadRequest("Cannot sell expired token.");

                if (token.QRTokenGroupId != null)
                {
                    qrGroup = await _context.QRTokenGroups
                        .Include(g => g.MealTokens)
                        .FirstOrDefaultAsync(g => g.Id == token.QRTokenGroupId.Value);

                    if (qrGroup == null) return NotFound("QR bundle not found.");
                    if (qrGroup.StudentId != userId) return BadRequest("You do not own this bundle.");
                    if (qrGroup.MealDate < DateTime.UtcNow.Date) return BadRequest("Cannot sell expired bundle.");

                    if (qrGroup.MealTokens.Any(t => t.Status == TokenStatus.Redeemed))
                        return BadRequest("Cannot sell a partially redeemed bundle.");

                    if (qrGroup.MealTokens.Any(t => t.Status != TokenStatus.Purchased))
                        return BadRequest("All tokens in bundle must be purchased.");

                    var hasActiveListing = await _context.TokenListings
                        .Include(l => l.Token)
                        .AnyAsync(l => l.Status == ListingStatus.Active && l.Token != null && l.Token.QRTokenGroupId == qrGroup.Id);
                    if (hasActiveListing) return BadRequest("This bundle is already listed for sale.");

                    foreach (var t in qrGroup.MealTokens)
                    {
                        t.Status = TokenStatus.ListedForSale;
                    }

                    token = qrGroup.MealTokens.OrderBy(t => t.Id).FirstOrDefault();
                }
                else
                {
                    if (token.Status != TokenStatus.Purchased) return BadRequest("Token must be purchased.");
                    token.Status = TokenStatus.ListedForSale;
                }
            }
            else
            {
                return BadRequest("TokenId or QRGroupId is required.");
            }

            if (token == null) return BadRequest("Unable to create listing.");

            var listing = new TokenListing
            {
                TokenId = token.Id,
                SellerId = userId,
                ListingPrice = request.ListingPrice,
                Status = ListingStatus.Active
            };

            _context.TokenListings.Add(listing);
            await _context.SaveChangesAsync();

            return Ok(listing.Id);
        }

        [HttpPost("listings/{id}/buy")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> BuyListing(int id)
        {
            var buyerId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

            var listing = await _context.TokenListings
                .Include(l => l.Token)
                .ThenInclude(t => t.QRTokenGroup)
                .Include(l => l.Seller)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (listing == null) return NotFound("Listing not found.");
            if (listing.Status != ListingStatus.Active) return BadRequest("Listing is not active.");
            if (listing.Token!.Status != TokenStatus.ListedForSale) return BadRequest("Token not available.");
            if (listing.SellerId == buyerId) return BadRequest("Cannot buy your own token.");

            // Use Bangladesh time (UTC+6) for marketplace cutoff logic
            var now = DateTime.UtcNow.AddHours(6);
            var today = now.Date;
            var purchaseCutoff = listing.Token.MealType == MealType.Lunch
                ? new TimeSpan(13, 0, 0)  // 1:00 PM
                : new TimeSpan(19, 0, 0); // 7:00 PM

            if (listing.Token.Date.Date < today)
                return BadRequest("Token date has passed and cannot be purchased.");

            if (listing.Token.Date.Date == today && now.TimeOfDay > purchaseCutoff)
                return BadRequest("Purchase window closed for today's token.");

            var buyer = await _context.Users.FindAsync(buyerId);
            var seller = listing.Seller;
            if (buyer == null || seller == null) return Unauthorized();

            if (buyer.WalletBalance < listing.ListingPrice)
                return BadRequest("Insufficient wallet balance.");

            await using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                buyer.WalletBalance -= listing.ListingPrice;
                seller.WalletBalance += listing.ListingPrice;

                _context.WalletTransactions.Add(new WalletTransaction
                {
                    UserId = buyerId,
                    Amount = -listing.ListingPrice,
                    Type = "PURCHASE",
                    Ref = $"listing:{listing.Id}",
                    Description = listing.Token.QRTokenGroupId != null
                        ? $"Bought QR bundle #{listing.Token.QRTokenGroupId}"
                        : $"Bought token {listing.Token.Id}"
                });

                _context.WalletTransactions.Add(new WalletTransaction
                {
                    UserId = seller.Id,
                    Amount = listing.ListingPrice,
                    Type = "SALE",
                    Ref = $"listing:{listing.Id}",
                    Description = listing.Token.QRTokenGroupId != null
                        ? $"Sold QR bundle #{listing.Token.QRTokenGroupId}"
                        : $"Sold token {listing.Token.Id}"
                });

                if (listing.Token.QRTokenGroupId != null)
                {
                    var qrGroup = await _context.QRTokenGroups
                        .Include(g => g.MealTokens)
                        .FirstOrDefaultAsync(g => g.Id == listing.Token.QRTokenGroupId.Value);

                    if (qrGroup == null)
                        return BadRequest("QR bundle not found for this listing.");

                    foreach (var t in qrGroup.MealTokens)
                    {
                        t.StudentId = buyerId;
                        t.Status = TokenStatus.Purchased;
                        t.TokenUid = Guid.NewGuid();
                    }

                    qrGroup.StudentId = buyerId;
                    qrGroup.QRCode = Guid.NewGuid();
                    qrGroup.RemainingTokens = qrGroup.TotalTokens;
                    qrGroup.RedeemedTokens = 0;
                    qrGroup.Status = QRTokenGroupStatus.Active;
                    qrGroup.CompletedAt = null;

                    listing.BuyerId = buyerId;
                    listing.Status = ListingStatus.Completed;
                    listing.CompletedAt = now;

                    await _context.SaveChangesAsync();
                    await tx.CommitAsync();

                    // Send QR code email to buyer (bundle)
                    try
                    {
                        await _emailService.SendTokenQrEmailAsync(
                            buyer.Email!,
                            buyer.FullName,
                            listing.Token.Id,
                            listing.Token.Date,
                            listing.Token.MealType.ToString(),
                            listing.ListingPrice,
                            qrGroup.QRCode,
                            listing.Token.MealPreference
                        );
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send QR bundle email after marketplace purchase for user {UserId}", buyerId);
                    }
                }
                else
                {
                    listing.Token.StudentId = buyerId;
                    listing.Token.Status = TokenStatus.Purchased;
                    listing.Token.TokenUid = Guid.NewGuid(); // regenerate QR after sale

                    listing.BuyerId = buyerId;
                    listing.Status = ListingStatus.Completed;
                    listing.CompletedAt = now;

                    await _context.SaveChangesAsync();
                    await tx.CommitAsync();

                    // Send QR code email to buyer
                    try
                    {
                        await _emailService.SendTokenQrEmailAsync(
                            buyer.Email!,
                            buyer.FullName,
                            listing.Token.Id,
                            listing.Token.Date,
                            listing.Token.MealType.ToString(),
                            listing.ListingPrice,
                            listing.Token.TokenUid,
                            listing.Token.MealPreference
                        );
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send token QR email after marketplace purchase for user {UserId}", buyerId);
                    }
                }
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            return Ok("Token purchased.");
        }
    }
}