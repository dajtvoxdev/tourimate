using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using Entities.Models;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class TourCategoriesController : ControllerBase
{
    private readonly TouriMateDbContext _db;

    public TourCategoriesController(TouriMateDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Get all tour categories (currently returns hardcoded categories)
    /// </summary>
    [HttpGet]
    public ActionResult<List<TourCategoryDto>> GetTourCategories()
    {
        try
        {
            // For now, return hardcoded categories to avoid migration complexity
            var categories = new List<TourCategoryDto>
            {
                new TourCategoryDto
                {
                    Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    Name = "Phiêu lưu",
                    Code = "adventure",
                    Description = "Tours phiêu lưu và khám phá",
                    SortOrder = 1,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new TourCategoryDto
                {
                    Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                    Name = "Văn hóa",
                    Code = "cultural",
                    Description = "Tours văn hóa và lịch sử",
                    SortOrder = 2,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new TourCategoryDto
                {
                    Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                    Name = "Thiên nhiên",
                    Code = "nature",
                    Description = "Tours thiên nhiên và sinh thái",
                    SortOrder = 3,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new TourCategoryDto
                {
                    Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                    Name = "Ẩm thực",
                    Code = "food",
                    Description = "Tours ẩm thực và trải nghiệm ẩm thực",
                    SortOrder = 4,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            return Ok(categories);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    /// <summary>
    /// Get a specific tour category by ID
    /// </summary>
    [HttpGet("{id}")]
    public ActionResult<TourCategoryDto> GetTourCategory(Guid id)
    {
        try
        {
            // For now, return hardcoded categories to avoid migration complexity
            var categories = new List<TourCategoryDto>
            {
                new TourCategoryDto
                {
                    Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    Name = "Phiêu lưu",
                    Code = "adventure",
                    Description = "Tours phiêu lưu và khám phá",
                    SortOrder = 1,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new TourCategoryDto
                {
                    Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                    Name = "Văn hóa",
                    Code = "cultural",
                    Description = "Tours văn hóa và lịch sử",
                    SortOrder = 2,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new TourCategoryDto
                {
                    Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                    Name = "Thiên nhiên",
                    Code = "nature",
                    Description = "Tours thiên nhiên và sinh thái",
                    SortOrder = 3,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new TourCategoryDto
                {
                    Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                    Name = "Ẩm thực",
                    Code = "food",
                    Description = "Tours ẩm thực và trải nghiệm ẩm thực",
                    SortOrder = 4,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            var category = categories.FirstOrDefault(c => c.Id == id && c.IsActive);

            if (category == null)
            {
                return NotFound("Không tìm thấy danh mục tour");
            }

            return Ok(category);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

}

public class TourCategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public string Code { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
