using System.Security.Claims;
using Hdms.Api.Data;
using Hdms.Api.DTOs.Menu;
using Hdms.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MenuController : ControllerBase
    {
        private readonly HdmsDbContext _context;

        public MenuController(HdmsDbContext context)
        {
            _context = context;
        }

        [HttpPost("weekly")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateWeeklyMenu(CreateWeeklyMenuRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

            var weeklyMenu = new WeeklyMenu
            {
                WeekStartDate = request.WeekStartDate.Date,
                WeekEndDate = request.WeekEndDate.Date,
                CreatedById = userId
            };

            _context.WeeklyMenus.Add(weeklyMenu);
            await _context.SaveChangesAsync();

            return Ok(weeklyMenu.Id);
        }

        [HttpPut("weekly/{id}/publish")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PublishWeeklyMenu(int id)
        {
            var menu = await _context.WeeklyMenus.FindAsync(id);
            if (menu == null) return NotFound();

            menu.IsPublished = true;
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("weekly/{id}/meals")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddMenuMeal(int id, CreateMenuMealRequest request)
        {
            var weeklyMenu = await _context.WeeklyMenus.FindAsync(id);
            if (weeklyMenu == null) return NotFound();

            var menuMeal = new MenuMeal
            {
                WeeklyMenuId = id,
                Date = request.Date.Date,
                MealType = request.MealType
            };
            _context.MenuMeals.Add(menuMeal);
            await _context.SaveChangesAsync();

            foreach (var fid in request.FoodItemIds)
            {
                _context.MenuMealItems.Add(new MenuMealItem
                {
                    MenuMealId = menuMeal.Id,
                    FoodItemId = fid
                });
            }

            await _context.SaveChangesAsync();
            return Ok(menuMeal.Id);
        }

        [HttpGet("current-week")]
        [AllowAnonymous]
        public async Task<ActionResult<WeekMenuResponse>> GetCurrentWeekMenu()
        {
            var today = DateTime.UtcNow.Date;

            var menu = await _context.WeeklyMenus
                .Include(w => w.MenuMeals)
                    .ThenInclude(m => m.MenuMealItems)
                        .ThenInclude(mi => mi.FoodItem)
                .Where(w => w.IsPublished &&
                            w.WeekStartDate <= today &&
                            w.WeekEndDate >= today)
                .FirstOrDefaultAsync();

            if (menu == null)
                return NotFound("No published menu for current week.");

            var response = new WeekMenuResponse
            {
                WeeklyMenuId = menu.Id,
                WeekStartDate = menu.WeekStartDate,
                WeekEndDate = menu.WeekEndDate,
                Meals = menu.MenuMeals.Select(mm => new WeekMenuMealDto
                {
                    Date = mm.Date,
                    MealType = mm.MealType,
                    Items = mm.MenuMealItems.Select(mi => new WeekMenuMealItemDto
                    {
                        FoodItemId = mi.FoodItemId,
                        FoodItemName = mi.FoodItem!.Name,
                        Description = mi.FoodItem.Description,
                        ImageUrl = mi.FoodItem.ImageUrl,
                        Price = mi.FoodItem.Price
                    }).ToList()
                }).ToList()
            };

            return Ok(response);
        }
    }
}