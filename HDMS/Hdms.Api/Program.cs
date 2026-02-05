using System.Security.Claims;
using System.Text;
using Hdms.Api.Data;
using Hdms.Api.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using QRCoder;

var builder = WebApplication.CreateBuilder(args);

// DbContext: SQL Server
builder.Services.AddDbContext<HdmsDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sql =>
        {
            sql.CommandTimeout(120);
        }));

// Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<HdmsDbContext>()
    .AddDefaultTokenProviders();

// JWT
var jwtSection = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSection["Key"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSection["Issuer"],
        ValidAudience = jwtSection["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

builder.Services.AddAuthorization();

// Controllers & Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS for frontend (Vite)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
                policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "https://davian-unchapped-eloisa.ngrok-free.dev")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Email service
builder.Services.AddSingleton<EmailService>();

// SSLCOMMERZ Payment Service
builder.Services.AddHttpClient<Hdms.Api.Services.SSLCommerzService>();
builder.Services.AddScoped<Hdms.Api.Services.SSLCommerzService>();

// AI Abuse Detection Service
builder.Services.AddScoped<Hdms.Api.Services.AbuseDetectionService>();

var app = builder.Build();

// Ensure DB + seed admin
await EnsureDatabaseAndSeedAsync(app.Services);

// Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection(); // optional

app.UseStaticFiles();
app.UseCors("AllowFrontend");
app.UseAuthentication();
// Force-logout middleware: any authenticated request from a suspended user is rejected
app.Use(async (context, next) =>
{
    if (context.User?.Identity?.IsAuthenticated == true)
    {
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            var db = context.RequestServices.GetRequiredService<HdmsDbContext>();
            var now = DateTime.UtcNow;

            var activeSuspension = await db.UserSuspensions
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == userId && s.IsActive && s.SuspendedUntil > now);

            if (activeSuspension != null)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "AccountSuspended",
                    message = $"Your account has been suspended until {activeSuspension.SuspendedUntil:yyyy-MM-dd}.",
                    reason = activeSuspension.Reason,
                    suspendedUntil = activeSuspension.SuspendedUntil
                });
                return;
            }
        }
    }

    await next();
});
app.UseAuthorization();
app.MapControllers();
app.Run();

static async Task EnsureDatabaseAndSeedAsync(IServiceProvider services)
{
    using var scope = services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<HdmsDbContext>();
    db.Database.SetCommandTimeout(TimeSpan.FromSeconds(120));
    await db.Database.MigrateAsync();

    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

    string[] roles = { "Admin", "Student" };
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole(role));
        }
    }

    // Admin
    var adminEmail = "admin@hdms.com";
    var admin = await userManager.FindByEmailAsync(adminEmail);
    if (admin == null)
    {
        admin = new ApplicationUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            FullName = "System Admin",
            UserCode = "ADMIN000001"
        };
        await userManager.CreateAsync(admin, "Admin@12345");
        await userManager.AddToRoleAsync(admin, "Admin");
    }

    // Sample student
    var studentEmail = "student@hdms.com";
    var student = await userManager.FindByEmailAsync(studentEmail);
    if (student == null)
    {
        student = new ApplicationUser
        {
            UserName = studentEmail,
            Email = studentEmail,
            FullName = "Sample Student",
            UserCode = "MMH000001",
            WalletBalance = 300m
        };
        await userManager.CreateAsync(student, "Student@12345");
        await userManager.AddToRoleAsync(student, "Student");

        db.WalletTransactions.Add(new WalletTransaction
        {
            UserId = student.Id,
            Amount = 300m,
            Type = "TOPUP",
            Description = "Initial seed"
        });
    }

    // Seed weekly meal plan if empty
    if (!db.MealPlans.Any())
    {
        decimal L_PRICE = 60m;
        decimal D_PRICE = 60m;
        decimal FEAST_PRICE = 120m;

        void AddPlan(string dow, string slot, string items, string? choices, decimal price, string note = "Rice & Lentils common")
        {
            db.MealPlans.Add(new MealPlan
            {
                DayOfWeek = dow,
                TimeSlot = slot,
                ItemsText = items,
                ChoicesText = choices,
                Price = price,
                Note = note
            });
        }

        AddPlan("SATURDAY", "LUNCH", "Chicken/Fish, Vegetables", "CHICKEN|FISH", L_PRICE);
        AddPlan("SATURDAY", "DINNER", "Chicken/Egg", "CHICKEN|EGG", D_PRICE);

        AddPlan("SUNDAY", "LUNCH", "Chicken/Fish, Vegetables", "CHICKEN|FISH", L_PRICE);
        AddPlan("SUNDAY", "DINNER", "Chicken/Fish", "CHICKEN|FISH", D_PRICE);

        AddPlan("MONDAY", "LUNCH", "Chicken/Fish, Vegetables", "CHICKEN|FISH", L_PRICE);
        AddPlan("MONDAY", "DINNER", "Khichuri, Fried Egg", null, D_PRICE);

        AddPlan("TUESDAY", "LUNCH", "Chicken/Fish, Vegetables", "CHICKEN|FISH", L_PRICE);
        AddPlan("TUESDAY", "DINNER", "Chicken/Fish", "CHICKEN|FISH", D_PRICE);

        AddPlan("WEDNESDAY", "LUNCH", "Chicken/Fish, Vegetables", "CHICKEN|FISH", L_PRICE);
        AddPlan("WEDNESDAY", "DINNER", "Chicken/Egg", "CHICKEN|EGG", D_PRICE);

        AddPlan("THURSDAY", "LUNCH", "Feast, Vegetables", null, FEAST_PRICE, "Rice & Lentils common; Feast day");
        AddPlan("THURSDAY", "DINNER", "Chicken/Fish", "CHICKEN|FISH", D_PRICE);

        AddPlan("FRIDAY", "LUNCH", "Chicken/Fish, Vegetables", "CHICKEN|FISH", L_PRICE);
        AddPlan("FRIDAY", "DINNER", "Chicken/Fish", "CHICKEN|FISH", D_PRICE);
    }

    await db.SaveChangesAsync();

    // --- Automated WeeklyMenu/Meals/Items seeding for current and next week ---
    var today = DateTime.UtcNow.Date;
    var weekStart = today.AddDays(-(int)today.DayOfWeek); // Sunday as start
    var weekEnd = weekStart.AddDays(6);
    var nextWeekStart = weekStart.AddDays(7);
    var nextWeekEnd = nextWeekStart.AddDays(6);


    async Task SeedWeeklyMenu(DateTime start, DateTime end)
    {
        if (!db.WeeklyMenus.Any(w => w.WeekStartDate == start && w.WeekEndDate == end))
        {
            var admin = await db.Users.FirstOrDefaultAsync(u => u.UserName == "admin@hdms.com");
            var menu = new WeeklyMenu
            {
                WeekStartDate = start,
                WeekEndDate = end,
                IsPublished = true,
                CreatedById = admin?.Id ?? string.Empty,
                CreatedAt = DateTime.UtcNow
            };
            db.WeeklyMenus.Add(menu);
            await db.SaveChangesAsync();

            // Ensure at least one FoodCategory exists
            var category = db.FoodCategories.FirstOrDefault();
            if (category == null)
            {
                category = new FoodCategory { Name = "General" };
                db.FoodCategories.Add(category);
                await db.SaveChangesAsync();
            }

            // Add MenuMeals for each day (Lunch & Dinner)
            for (int i = 0; i < 7; i++)
            {
                var date = start.AddDays(i);
                foreach (var mealType in new[] { 1, 2 }) // Lunch, Dinner
                {
                    var meal = new MenuMeal
                    {
                        WeeklyMenuId = menu.Id,
                        Date = date,
                        MealType = (Hdms.Api.Enums.MealType)mealType
                    };
                    db.MenuMeals.Add(meal);
                    await db.SaveChangesAsync();

                    // Add at least one MenuMealItem (pick first FoodItem or create dummy)
                    var food = db.FoodItems.FirstOrDefault();
                    if (food == null)
                    {
                        food = new FoodItem { Name = "Rice", Price = 10, CategoryId = category.Id };
                        db.FoodItems.Add(food);
                        await db.SaveChangesAsync();
                    }
                    db.MenuMealItems.Add(new MenuMealItem { MenuMealId = meal.Id, FoodItemId = food.Id });
                }
            }
            await db.SaveChangesAsync();
        }
    }

    await SeedWeeklyMenu(weekStart, weekEnd);
    await SeedWeeklyMenu(nextWeekStart, nextWeekEnd);

    // Backfill UserCode for any users missing it
    var usersNeedingCode = await db.Users
        .Where(u => string.IsNullOrEmpty(u.UserCode))
        .ToListAsync();

    foreach (var u in usersNeedingCode)
    {
        var idPart = u.Id.Length >= 6
            ? u.Id.Substring(0, 6).ToUpper()
            : u.Id.ToUpper();
        u.UserCode = $"MMH{idPart}";
    }

    await db.SaveChangesAsync();
}