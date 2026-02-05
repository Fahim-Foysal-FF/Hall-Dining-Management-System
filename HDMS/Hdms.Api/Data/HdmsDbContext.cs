using Hdms.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Hdms.Api.Data
{
    public class HdmsDbContext : IdentityDbContext<ApplicationUser>
    {
        public HdmsDbContext(DbContextOptions<HdmsDbContext> options)
            : base(options)
        {
        }

        public DbSet<FoodCategory> FoodCategories => Set<FoodCategory>();
        public DbSet<FoodItem> FoodItems => Set<FoodItem>();
        public DbSet<WeeklyMenu> WeeklyMenus => Set<WeeklyMenu>();
        public DbSet<MenuMeal> MenuMeals => Set<MenuMeal>();
        public DbSet<MenuMealItem> MenuMealItems => Set<MenuMealItem>();

        public DbSet<TokenOrder> TokenOrders => Set<TokenOrder>();
        public DbSet<MealToken> MealTokens => Set<MealToken>();
        public DbSet<TokenListing> TokenListings => Set<TokenListing>();
        public DbSet<MonthlyMealLimit> MonthlyMealLimits => Set<MonthlyMealLimit>();
        public DbSet<QRTokenGroup> QRTokenGroups => Set<QRTokenGroup>();

        public DbSet<MealFeedback> MealFeedbacks => Set<MealFeedback>();

        // New
        public DbSet<MealPlan> MealPlans => Set<MealPlan>();
        public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
        public DbSet<Complaint> Complaints => Set<Complaint>();
        public DbSet<DiningNotice> DiningNotices => Set<DiningNotice>();
        public DbSet<DiningClosure> DiningClosures => Set<DiningClosure>();
        
        // User moderation and abuse detection
        public DbSet<UserSuspension> UserSuspensions => Set<UserSuspension>();
        public DbSet<UserAbuseLog> UserAbuseLogs => Set<UserAbuseLog>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Existing relationships
            builder.Entity<MenuMeal>()
                .HasMany(m => m.MenuMealItems)
                .WithOne(mi => mi.MenuMeal!)
                .HasForeignKey(mi => mi.MenuMealId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<MenuMealItem>()
                .HasOne(mi => mi.FoodItem)
                .WithMany()
                .HasForeignKey(mi => mi.FoodItemId)
                .OnDelete(DeleteBehavior.Restrict);

            // Avoid multiple cascade paths & set decimal precision

            builder.Entity<WeeklyMenu>()
                .HasOne(w => w.CreatedBy)
                .WithMany()
                .HasForeignKey(w => w.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<MealToken>()
                .HasOne(t => t.Student)
                .WithMany()
                .HasForeignKey(t => t.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<MealToken>()
                .HasOne(t => t.WeeklyMenu)
                .WithMany()
                .HasForeignKey(t => t.WeeklyMenuId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<MealToken>()
                .HasOne(t => t.TokenOrder)
                .WithMany(o => o.MealTokens)
                .HasForeignKey(t => t.TokenOrderId)
                .OnDelete(DeleteBehavior.SetNull);

            // QR Token Group relationships
            builder.Entity<MealToken>()
                .HasOne(t => t.QRTokenGroup)
                .WithMany(g => g.MealTokens)
                .HasForeignKey(t => t.QRTokenGroupId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<QRTokenGroup>()
                .HasOne(g => g.Student)
                .WithMany()
                .HasForeignKey(g => g.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<QRTokenGroup>()
                .HasOne(g => g.TokenOrder)
                .WithMany()
                .HasForeignKey(g => g.TokenOrderId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Entity<QRTokenGroup>()
                .HasOne(g => g.WeeklyMenu)
                .WithMany()
                .HasForeignKey(g => g.WeeklyMenuId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<MealFeedback>()
                .HasOne(f => f.Student)
                .WithMany()
                .HasForeignKey(f => f.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<TokenListing>()
                .HasOne(l => l.Token)
                .WithMany()
                .HasForeignKey(l => l.TokenId)
                .OnDelete(DeleteBehavior.Restrict);

            // Decimal precision
            builder.Entity<FoodItem>()
                .Property(f => f.Price)
                .HasColumnType("decimal(18,2)");

            builder.Entity<MealToken>()
                .Property(t => t.Price)
                .HasColumnType("decimal(18,2)");

            builder.Entity<TokenListing>()
                .Property(l => l.ListingPrice)
                .HasColumnType("decimal(18,2)");

            builder.Entity<QRTokenGroup>()
                .Property(g => g.PricePerToken)
                .HasColumnType("decimal(18,2)");

            builder.Entity<TokenOrder>()
                .Property(o => o.TotalAmount)
                .HasColumnType("decimal(18,2)");

            builder.Entity<MealPlan>()
                .Property(p => p.Price)
                .HasColumnType("decimal(18,2)");

            builder.Entity<WalletTransaction>()
                .Property(w => w.Amount)
                .HasColumnType("decimal(18,2)");
            builder.Entity<ApplicationUser>()
                .Property(u => u.WalletBalance)
                .HasColumnType("decimal(18,2)");

            // Complaint relationships
            builder.Entity<Complaint>()
                .HasOne(c => c.Student)
                .WithMany()
                .HasForeignKey(c => c.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            // DiningNotice relationships
            builder.Entity<DiningNotice>()
                .HasOne(n => n.CreatedBy)
                .WithMany()
                .HasForeignKey(n => n.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            // UserSuspension relationships
            builder.Entity<UserSuspension>()
                .HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<UserSuspension>()
                .HasOne(s => s.SuspendedBy)
                .WithMany()
                .HasForeignKey(s => s.SuspendedById)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<UserSuspension>()
                .HasOne(s => s.RevokedBy)
                .WithMany()
                .HasForeignKey(s => s.RevokedById)
                .OnDelete(DeleteBehavior.Restrict);

            // UserAbuseLog relationships
            builder.Entity<UserAbuseLog>()
                .HasOne(l => l.User)
                .WithMany()
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<UserAbuseLog>()
                .HasOne(l => l.ReviewedBy)
                .WithMany()
                .HasForeignKey(l => l.ReviewedById)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}