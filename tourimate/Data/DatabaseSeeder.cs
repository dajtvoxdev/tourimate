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
        // Check if users already exist
        var existingEmails = await context.Users.Select(u => u.Email).ToListAsync();

        var users = new List<User>
        {
            // Admin
            new User
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Email = "admin@tourimate.com",
                PhoneNumber = "0901234567",
                PasswordHash = "$2a$11$example.hash.admin", // This should be properly hashed in production
                FirstName = "Minh",
                LastName = "Nguyễn",
                Role = UserRole.Admin,
                IsPhoneVerified = true,
                IsActive = true,
                AcceptEmailMarketing = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            },

            // Tour Guides with real Vietnamese names
            new User
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Email = "linh.tran@test.com",
                PhoneNumber = "0901234568",
                PasswordHash = "$2a$11$example.hash.guide1",
                FirstName = "Linh",
                LastName = "Trần",
                Role = UserRole.TourGuide,
                IsPhoneVerified = true,
                IsActive = true,
                AcceptEmailMarketing = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new User
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Email = "duc.le@test.com",
                PhoneNumber = "0901234569",
                PasswordHash = "$2a$11$example.hash.guide2",
                FirstName = "Đức",
                LastName = "Lê",
                Role = UserRole.TourGuide,
                IsPhoneVerified = true,
                IsActive = true,
                AcceptEmailMarketing = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new User
            {
                Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                Email = "thao.pham@test.com",
                PhoneNumber = "0901234570",
                PasswordHash = "$2a$11$example.hash.guide3",
                FirstName = "Thảo",
                LastName = "Phạm",
                Role = UserRole.TourGuide,
                IsPhoneVerified = true,
                IsActive = true,
                AcceptEmailMarketing = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new User
            {
                Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                Email = "hoang.nguyen@test.com",
                PhoneNumber = "0901234571",
                PasswordHash = "$2a$11$example.hash.guide4",
                FirstName = "Hoàng",
                LastName = "Nguyễn",
                Role = UserRole.TourGuide,
                IsPhoneVerified = true,
                IsActive = true,
                AcceptEmailMarketing = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new User
            {
                Id = Guid.Parse("66666666-6666-6666-6666-666666666666"),
                Email = "mai.vu@test.com",
                PhoneNumber = "0901234572",
                PasswordHash = "$2a$11$example.hash.guide5",
                FirstName = "Mai",
                LastName = "Vũ",
                Role = UserRole.TourGuide,
                IsPhoneVerified = true,
                IsActive = true,
                AcceptEmailMarketing = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new User
            {
                Id = Guid.Parse("77777777-7777-7777-7777-777777777777"),
                Email = "tuan.dang@test.com",
                PhoneNumber = "0901234573",
                PasswordHash = "$2a$11$example.hash.guide6",
                FirstName = "Tuấn",
                LastName = "Đặng",
                Role = UserRole.TourGuide,
                IsPhoneVerified = true,
                IsActive = true,
                AcceptEmailMarketing = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new User
            {
                Id = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                Email = "lan.bui@test.com",
                PhoneNumber = "0901234574",
                PasswordHash = "$2a$11$example.hash.guide7",
                FirstName = "Lan",
                LastName = "Bùi",
                Role = UserRole.TourGuide,
                IsPhoneVerified = true,
                IsActive = true,
                AcceptEmailMarketing = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new User
            {
                Id = Guid.Parse("99999999-9999-9999-9999-999999999999"),
                Email = "khanh.dinh@test.com",
                PhoneNumber = "0901234575",
                PasswordHash = "$2a$11$example.hash.guide8",
                FirstName = "Khánh",
                LastName = "Đinh",
                Role = UserRole.TourGuide,
                IsPhoneVerified = true,
                IsActive = true,
                AcceptEmailMarketing = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new User
            {
                Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                Email = "huong.ngo@test.com",
                PhoneNumber = "0901234576",
                PasswordHash = "$2a$11$example.hash.guide9",
                FirstName = "Hương",
                LastName = "Ngô",
                Role = UserRole.TourGuide,
                IsPhoneVerified = true,
                IsActive = true,
                AcceptEmailMarketing = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            },

            // Customers with real Vietnamese names
            new User
            {
                Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                Email = "nam.ly@test.com",
                PhoneNumber = "0901234577",
                PasswordHash = "$2a$11$example.hash.customer1",
                FirstName = "Nam",
                LastName = "Lý",
                Role = UserRole.Customer,
                IsPhoneVerified = true,
                IsActive = true,
                AcceptEmailMarketing = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new User
            {
                Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                Email = "thu.trinh@test.com",
                PhoneNumber = "0901234578",
                PasswordHash = "$2a$11$example.hash.customer2",
                FirstName = "Thu",
                LastName = "Trịnh",
                Role = UserRole.Customer,
                IsPhoneVerified = true,
                IsActive = true,
                AcceptEmailMarketing = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new User
            {
                Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                Email = "hung.phan@test.com",
                PhoneNumber = "0901234579",
                PasswordHash = "$2a$11$example.hash.customer3",
                FirstName = "Hùng",
                LastName = "Phan",
                Role = UserRole.Customer,
                IsPhoneVerified = false,
                IsActive = true,
                AcceptEmailMarketing = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new User
            {
                Id = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                Email = "yen.vo@test.com",
                PhoneNumber = "0901234580",
                PasswordHash = "$2a$11$example.hash.customer4",
                FirstName = "Yến",
                LastName = "Võ",
                Role = UserRole.Customer,
                IsPhoneVerified = true,
                IsActive = true,
                AcceptEmailMarketing = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new User
            {
                Id = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
                Email = "quang.do@test.com",
                PhoneNumber = "0901234581",
                PasswordHash = "$2a$11$example.hash.customer5",
                FirstName = "Quang",
                LastName = "Đỗ",
                Role = UserRole.Customer,
                IsPhoneVerified = true,
                IsActive = false,
                AcceptEmailMarketing = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            }
        };

        // Filter out users that already exist
        var usersToAdd = users.Where(u => !existingEmails.Contains(u.Email)).ToList();

        if (usersToAdd.Any())
        {
            await context.Users.AddRangeAsync(usersToAdd);
            Console.WriteLine($"Added {usersToAdd.Count} new users.");
        }
        else
        {
            Console.WriteLine("All users already exist, skipping seeding.");
        }
    }
}
