using Microsoft.EntityFrameworkCore;
using Entities.Models;
using Entities.Enums;

namespace TouriMate.Data;

public class TouriMateDbContext : DbContext
{
    public TouriMateDbContext(DbContextOptions<TouriMateDbContext> options) : base(options)
    {
    }

    // User Management
    public DbSet<User> Users { get; set; }
    public DbSet<UserProfile> UserProfiles { get; set; }
    public DbSet<OtpCode> OtpCodes { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<TourGuideApplication> TourGuideApplications { get; set; }

    // Tour Management
    public DbSet<Division> Divisions { get; set; }
    public DbSet<TourCategory> TourCategories { get; set; }
    public DbSet<Tour> Tours { get; set; }
    public DbSet<TourAvailability> TourAvailabilities { get; set; }
    public DbSet<Booking> Bookings { get; set; }

    // Product Management
    public DbSet<ProductCategory> ProductCategories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<ShoppingCart> ShoppingCarts { get; set; }

    // Reviews and Ratings
    public DbSet<Review> Reviews { get; set; }
    public DbSet<ReviewReply> ReviewReplies { get; set; }
    public DbSet<ReviewHelpfulVote> ReviewHelpfulVotes { get; set; }

    // System Management
    public DbSet<Promotion> Promotions { get; set; }
    public DbSet<Report> Reports { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<Revenue> Revenues { get; set; }
    public DbSet<SystemSetting> SystemSettings { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<Entities.Models.File> Files { get; set; }
    
    // Payment Integration
    public DbSet<SePayTransaction> SePayTransactions { get; set; }
    public DbSet<Refund> Refunds { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure enum conversions
        ConfigureEnums(modelBuilder);

        // Configure entity relationships and constraints
        ConfigureUsers(modelBuilder);
        ConfigureTours(modelBuilder);
        ConfigureProducts(modelBuilder);
        ConfigureReviews(modelBuilder);
        ConfigureFinancials(modelBuilder);
        ConfigureSystem(modelBuilder);

        // Configure indexes
        ConfigureIndexes(modelBuilder);

        // Seed initial data
        SeedData(modelBuilder);
    }

    private void ConfigureEnums(ModelBuilder modelBuilder)
    {
        // Configure enum conversions to string for better readability
        modelBuilder.Entity<User>()
            .Property(e => e.Role)
            .HasConversion<string>();

        modelBuilder.Entity<Booking>()
            .Property(e => e.Status)
            .HasConversion<string>();

        modelBuilder.Entity<Booking>()
            .Property(e => e.PaymentStatus)
            .HasConversion<string>();

        modelBuilder.Entity<Order>()
            .Property(e => e.Status)
            .HasConversion<string>();

        modelBuilder.Entity<Order>()
            .Property(e => e.PaymentStatus)
            .HasConversion<string>();

        modelBuilder.Entity<Tour>()
            .Property(e => e.Status)
            .HasConversion<string>();

        modelBuilder.Entity<Review>()
            .Property(e => e.Status)
            .HasConversion<string>();

        modelBuilder.Entity<Promotion>()
            .Property(e => e.PaymentStatus)
            .HasConversion<string>();
    }

    private void ConfigureUsers(ModelBuilder modelBuilder)
    {
        // User unique constraints
        // Email no longer unique — phone number will be the unique identifier
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.PhoneNumber)
            .IsUnique()
            .HasFilter("[PhoneNumber] IS NOT NULL");

        // User-UserProfile one-to-one relationship
        modelBuilder.Entity<UserProfile>()
            .HasOne(up => up.User)
            .WithOne(u => u.Profile)
            .HasForeignKey<UserProfile>(up => up.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // RefreshToken relationship
        modelBuilder.Entity<RefreshToken>()
            .HasIndex(rt => rt.Token)
            .IsUnique();

        // TourGuideApplication relationship
        modelBuilder.Entity<TourGuideApplication>()
            .HasOne(tga => tga.User)
            .WithMany(u => u.TourGuideApplications)
            .HasForeignKey(tga => tga.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TourGuideApplication>()
            .HasOne(tga => tga.Reviewer)
            .WithMany()
            .HasForeignKey(tga => tga.ReviewedBy)
            .OnDelete(DeleteBehavior.NoAction);
    }

    private void ConfigureTours(ModelBuilder modelBuilder)
    {
        // Tour-TourGuide relationship
        modelBuilder.Entity<Tour>()
            .HasOne(t => t.TourGuide)
            .WithMany(u => u.Tours)
            .HasForeignKey(t => t.TourGuideId)
            .OnDelete(DeleteBehavior.Cascade);

        // Tour-Division relationship (optional)
        modelBuilder.Entity<Tour>()
            .HasOne(t => t.Division)
            .WithMany(d => d.Tours)
            .HasForeignKey(t => t.DivisionCode)
            .HasPrincipalKey(d => d.Code)
            .OnDelete(DeleteBehavior.SetNull);


        // TourAvailability unique constraint and relationships
        modelBuilder.Entity<TourAvailability>()
            .HasIndex(ta => new { ta.TourId, ta.Date })
            .IsUnique();

        modelBuilder.Entity<TourAvailability>()
            .HasOne(ta => ta.Tour)
            .WithMany(t => t.Availabilities)
            .HasForeignKey(ta => ta.TourId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TourAvailability>()
            .HasOne(ta => ta.DepartureDivision)
            .WithMany()
            .HasForeignKey(ta => ta.DepartureDivisionCode)
            .HasPrincipalKey(d => d.Code)
            .OnDelete(DeleteBehavior.NoAction);

        // Division hierarchy (ward -> province)
        modelBuilder.Entity<Division>()
            .HasIndex(d => d.Code)
            .IsUnique();

        // Booking relationships
        modelBuilder.Entity<Booking>()
            .HasIndex(b => b.BookingNumber)
            .IsUnique();

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Tour)
            .WithMany(t => t.Bookings)
            .HasForeignKey(b => b.TourId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Customer)
            .WithMany(u => u.Bookings)
            .HasForeignKey(b => b.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.TourAvailability)
            .WithMany()
            .HasForeignKey(b => b.TourAvailabilityId)
            .OnDelete(DeleteBehavior.NoAction);
    }

    private void ConfigureProducts(ModelBuilder modelBuilder)
    {
        // ProductCategory self-referencing relationship
        modelBuilder.Entity<ProductCategory>()
            .HasOne(pc => pc.Parent)
            .WithMany(pc => pc.Children)
            .HasForeignKey(pc => pc.ParentId)
            .OnDelete(DeleteBehavior.NoAction);

        // Product relationships
        modelBuilder.Entity<Product>()
            .HasOne(p => p.Category)
            .WithMany(pc => pc.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Product>()
            .HasOne(p => p.Vendor)
            .WithMany(u => u.Products)
            .HasForeignKey(p => p.VendorId)
            .OnDelete(DeleteBehavior.Cascade);

        // Order relationships
        modelBuilder.Entity<Order>()
            .HasIndex(o => o.OrderNumber)
            .IsUnique();

        modelBuilder.Entity<Order>()
            .HasOne(o => o.Customer)
            .WithMany(u => u.Orders)
            .HasForeignKey(o => o.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        // OrderItem relationships
        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Order)
            .WithMany(o => o.Items)
            .HasForeignKey(oi => oi.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Product)
            .WithMany(p => p.OrderItems)
            .HasForeignKey(oi => oi.ProductId)
            .OnDelete(DeleteBehavior.NoAction);

        // ShoppingCart unique constraint
        modelBuilder.Entity<ShoppingCart>()
            .HasIndex(sc => new { sc.UserId, sc.ProductId })
            .IsUnique();

        // ShoppingCart relationships with NoAction to avoid cascade conflicts
        modelBuilder.Entity<ShoppingCart>()
            .HasOne(sc => sc.User)
            .WithMany(u => u.ShoppingCartItems)
            .HasForeignKey(sc => sc.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<ShoppingCart>()
            .HasOne(sc => sc.Product)
            .WithMany(p => p.CartItems)
            .HasForeignKey(sc => sc.ProductId)
            .OnDelete(DeleteBehavior.NoAction);
    }

    private void ConfigureReviews(ModelBuilder modelBuilder)
    {
        // Review relationships
        modelBuilder.Entity<Review>()
            .HasOne(r => r.User)
            .WithMany(u => u.Reviews)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.Booking)
            .WithMany(b => b.Reviews)
            .HasForeignKey(r => r.BookingId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.Order)
            .WithMany(o => o.Reviews)
            .HasForeignKey(r => r.OrderId)
            .OnDelete(DeleteBehavior.NoAction);

        // ReviewReply relationships
        modelBuilder.Entity<ReviewReply>()
            .HasOne(rr => rr.Review)
            .WithMany(r => r.Replies)
            .HasForeignKey(rr => rr.ReviewId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<ReviewReply>()
            .HasOne(rr => rr.User)
            .WithMany()
            .HasForeignKey(rr => rr.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        // ReviewHelpfulVote unique constraint
        modelBuilder.Entity<ReviewHelpfulVote>()
            .HasIndex(rhv => new { rhv.ReviewId, rhv.UserId })
            .IsUnique();

        // ReviewHelpfulVote relationships with NoAction to prevent multiple cascade paths
        modelBuilder.Entity<ReviewHelpfulVote>()
            .HasOne(rhv => rhv.Review)
            .WithMany(r => r.HelpfulVotesList)
            .HasForeignKey(rhv => rhv.ReviewId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<ReviewHelpfulVote>()
            .HasOne(rhv => rhv.User)
            .WithMany()
            .HasForeignKey(rhv => rhv.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        // Report relationships
        modelBuilder.Entity<Report>()
            .HasOne(r => r.Review)
            .WithMany(r => r.Reports)
            .HasForeignKey(r => r.EntityId)
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_Reports_Reviews_EntityId");

        modelBuilder.Entity<Report>()
            .HasOne(r => r.ReportedByUser)
            .WithMany()
            .HasForeignKey(r => r.ReportedBy)
            .OnDelete(DeleteBehavior.NoAction);
    }

    private void ConfigureFinancials(ModelBuilder modelBuilder)
    {
        // Transaction unique constraint
        modelBuilder.Entity<Transaction>()
            .HasIndex(t => t.TransactionId)
            .IsUnique();

        // Revenue relationships
        modelBuilder.Entity<Revenue>()
            .HasOne(r => r.Transaction)
            .WithMany(t => t.Revenues)
            .HasForeignKey(r => r.TransactionId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Revenue>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.NoAction);
    }

    private void ConfigureSystem(ModelBuilder modelBuilder)
    {
        // SystemSetting unique constraint
        modelBuilder.Entity<SystemSetting>()
            .HasIndex(ss => ss.Key)
            .IsUnique();

        // Promotion relationships with NoAction to avoid cascade conflicts
        modelBuilder.Entity<Promotion>()
            .HasOne(p => p.RequestedByUser)
            .WithMany()
            .HasForeignKey(p => p.RequestedBy)
            .OnDelete(DeleteBehavior.NoAction);

        // Note: Promotion has polymorphic relationships with Tour and Product
        // These will be handled manually in the application layer

        // Report relationships
        modelBuilder.Entity<Report>()
            .HasOne(r => r.ReportedByUser)
            .WithMany()
            .HasForeignKey(r => r.ReportedBy)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Report>()
            .HasOne(r => r.ReviewedByUser)
            .WithMany()
            .HasForeignKey(r => r.ReviewedBy)
            .OnDelete(DeleteBehavior.NoAction);

        // AuditLog relationship
        modelBuilder.Entity<AuditLog>()
            .HasOne(al => al.User)
            .WithMany()
            .HasForeignKey(al => al.UserId)
            .OnDelete(DeleteBehavior.SetNull);
    }

    private void ConfigureIndexes(ModelBuilder modelBuilder)
    {
        // Performance indexes
        modelBuilder.Entity<Tour>()
            .HasIndex(t => new { t.Location, t.IsActive });

        modelBuilder.Entity<Tour>()
            .HasIndex(t => new { t.BasePrice, t.IsActive });

        modelBuilder.Entity<Tour>()
            .HasIndex(t => new { t.DivisionCode, t.IsActive });

        modelBuilder.Entity<Product>()
            .HasIndex(p => new { p.CategoryId, p.IsActive });

        modelBuilder.Entity<Product>()
            .HasIndex(p => new { p.Price, p.IsActive });

        modelBuilder.Entity<Booking>()
            .HasIndex(b => new { b.TourDate, b.Status });

        modelBuilder.Entity<Order>()
            .HasIndex(o => new { o.Status, o.CreatedAt });

        modelBuilder.Entity<Review>()
            .HasIndex(r => new { r.EntityId, r.EntityType, r.Status });
    }

    private void SeedData(ModelBuilder modelBuilder)
    {
        // Seed default product categories
        var foodCategory = new ProductCategory
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Name = "Food & Beverages",
            Description = "Traditional Vietnamese food and drinks",
            SortOrder = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var handicraftCategory = new ProductCategory
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Name = "Handicrafts",
            Description = "Handmade crafts and artisan products",
            SortOrder = 2,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var textileCategory = new ProductCategory
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Name = "Textiles",
            Description = "Traditional clothing and fabrics",
            SortOrder = 3,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        modelBuilder.Entity<ProductCategory>().HasData(
            foodCategory, handicraftCategory, textileCategory
        );


        // Seed system settings
        modelBuilder.Entity<SystemSetting>().HasData(
            new SystemSetting
            {
                Id = Guid.NewGuid(),
                Key = "CommissionRate_Tours",
                Value = "0.15",
                Description = "Commission rate for tour bookings",
                Category = "Finance",
                IsPublic = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new SystemSetting
            {
                Id = Guid.NewGuid(),
                Key = "CommissionRate_Products",
                Value = "0.15",
                Description = "Commission rate for product sales",
                Category = "Finance",
                IsPublic = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new SystemSetting
            {
                Id = Guid.NewGuid(),
                Key = "OTP_ExpiryMinutes",
                Value = "5",
                Description = "OTP expiry time in minutes",
                Category = "Security",
                IsPublic = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        );
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Update timestamps before saving
        var entries = ChangeTracker.Entries<Entities.Common.BaseEntity>()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            entry.Entity.UpdatedAt = DateTime.UtcNow;
            
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
