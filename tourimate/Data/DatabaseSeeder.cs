using Microsoft.EntityFrameworkCore;
using Entities.Models;
using Entities.Enums;

namespace TouriMate.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(TouriMateDbContext context)
    {
        // Seed Users
        await SeedUsersAsync(context);
        
        // Seed Tour Categories
        await SeedTourCategoriesAsync(context);
        
        await context.SaveChangesAsync();
    }

    private static async Task SeedTourCategoriesAsync(TouriMateDbContext context)
    {
        // Check if categories already exist by name or code
        var existingNames = await context.TourCategories.Select(c => c.Name).ToListAsync();
        var existingCodes = await context.TourCategories.Select(c => c.Code).ToListAsync();

        var categories = new List<TourCategory>
        {
            new TourCategory
            {
                Id = Guid.NewGuid(),
                Name = "Phiêu lưu",
                Code = "adventure",
                Description = "Tour phiêu lưu, khám phá và trải nghiệm mạo hiểm",
                Icon = "compass",
                SortOrder = 1,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new TourCategory
            {
                Id = Guid.NewGuid(),
                Name = "Văn hóa",
                Code = "cultural",
                Description = "Tour văn hóa, lịch sử và di sản",
                Icon = "book-open",
                SortOrder = 2,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new TourCategory
            {
                Id = Guid.NewGuid(),
                Name = "Thiên nhiên",
                Code = "nature",
                Description = "Tour thiên nhiên, du lịch xanh và sinh thái",
                Icon = "tree-pine",
                SortOrder = 3,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new TourCategory
            {
                Id = Guid.NewGuid(),
                Name = "Ẩm thực",
                Code = "food",
                Description = "Tour ẩm thực và trải nghiệm ẩm thực địa phương",
                Icon = "utensils",
                SortOrder = 4,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new TourCategory
            {
                Id = Guid.NewGuid(),
                Name = "Nghỉ dưỡng",
                Code = "resort",
                Description = "Tour nghỉ dưỡng, thư giãn và spa",
                Icon = "sun",
                SortOrder = 5,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new TourCategory
            {
                Id = Guid.NewGuid(),
                Name = "Biển đảo",
                Code = "beach",
                Description = "Tour biển đảo, tắm biển và hoạt động dưới nước",
                Icon = "waves",
                SortOrder = 6,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new TourCategory
            {
                Id = Guid.NewGuid(),
                Name = "Núi rừng",
                Code = "mountain",
                Description = "Tour núi rừng, trekking và leo núi",
                Icon = "mountain",
                SortOrder = 7,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new TourCategory
            {
                Id = Guid.NewGuid(),
                Name = "Thành thị",
                Code = "city",
                Description = "Tour thành thị, mua sắm và giải trí",
                Icon = "building",
                SortOrder = 8,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        // Filter out categories that already exist
        var categoriesToAdd = categories.Where(c => 
            !existingNames.Contains(c.Name) && !existingCodes.Contains(c.Code)).ToList();

        if (categoriesToAdd.Any())
        {
            await context.TourCategories.AddRangeAsync(categoriesToAdd);
            Console.WriteLine($"Added {categoriesToAdd.Count} new tour categories.");
        }
        else
        {
            Console.WriteLine("All tour categories already exist, skipping seeding.");
        }
    }

    private static async Task SeedUsersAsync(TouriMateDbContext context)
    {
    }
}
