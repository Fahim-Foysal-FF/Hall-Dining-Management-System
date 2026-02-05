using Hdms.Api.Data;
using Hdms.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hdms.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FoodController : ControllerBase
    {
        private readonly HdmsDbContext _context;

        public FoodController(HdmsDbContext context)
        {
            _context = context;
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            return Ok(await _context.FoodCategories.ToListAsync());
        }

        [HttpPost("categories")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCategory(FoodCategory category)
        {
            _context.FoodCategories.Add(category);
            await _context.SaveChangesAsync();
            return Ok(category);
        }

        [HttpGet("items")]
        public async Task<IActionResult> GetItems()
        {
            var items = await _context.FoodItems.Include(f => f.Category).ToListAsync();
            return Ok(items);
        }

        [HttpPost("items")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateItem(FoodItem item)
        {
            _context.FoodItems.Add(item);
            await _context.SaveChangesAsync();
            return Ok(item);
        }
    }
}