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
    /// Get all tour categories
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<TourCategoryDto>>> GetTourCategories()
    {
        try
        {
            var categories = await _db.TourCategories
                .Where(c => c.IsActive)
                .OrderBy(c => c.SortOrder)
                .ThenBy(c => c.Name)
                .Select(c => new TourCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Code = c.Code,
                    Description = c.Description,
                    Icon = c.Icon,
                    ParentId = c.ParentId,
                    SortOrder = c.SortOrder,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .ToListAsync();

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
    public async Task<ActionResult<TourCategoryDto>> GetTourCategory(Guid id)
    {
        try
        {
            var category = await _db.TourCategories
                .Where(c => c.Id == id && c.IsActive)
                .Select(c => new TourCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Code = c.Code,
                    Description = c.Description,
                    Icon = c.Icon,
                    ParentId = c.ParentId,
                    SortOrder = c.SortOrder,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .FirstOrDefaultAsync();

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

    /// <summary>
    /// Create a new tour category (Admin only)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TourCategoryDto>> CreateTourCategory([FromBody] CreateTourCategoryRequest request)
    {
        try
        {
            var category = new TourCategory
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                Icon = request.Icon,
                Code = request.Code,
                ParentId = request.ParentId,
                SortOrder = request.SortOrder,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.TourCategories.Add(category);
            await _db.SaveChangesAsync();

            var categoryDto = new TourCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Code = category.Code,
                Description = category.Description,
                Icon = category.Icon,
                ParentId = category.ParentId,
                SortOrder = category.SortOrder,
                IsActive = category.IsActive,
                CreatedAt = category.CreatedAt,
                UpdatedAt = category.UpdatedAt
            };

            return CreatedAtAction(nameof(GetTourCategory), new { id = category.Id }, categoryDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    /// <summary>
    /// Update a tour category (Admin only)
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<TourCategoryDto>> UpdateTourCategory(Guid id, [FromBody] UpdateTourCategoryRequest request)
    {
        try
        {
            var category = await _db.TourCategories.FirstOrDefaultAsync(c => c.Id == id);
            if (category == null)
            {
                return NotFound("Không tìm thấy danh mục tour");
            }

            // Update fields
            if (!string.IsNullOrWhiteSpace(request.Name))
                category.Name = request.Name;
            if (request.Description != null)
                category.Description = request.Description;
            if (request.Icon != null)
                category.Icon = request.Icon;
            if (!string.IsNullOrWhiteSpace(request.Code))
                category.Code = request.Code;
            if (request.ParentId.HasValue)
                category.ParentId = request.ParentId.Value;
            if (request.SortOrder.HasValue)
                category.SortOrder = request.SortOrder.Value;
            if (request.IsActive.HasValue)
                category.IsActive = request.IsActive.Value;

            category.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            var categoryDto = new TourCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Code = category.Code,
                Description = category.Description,
                Icon = category.Icon,
                ParentId = category.ParentId,
                SortOrder = category.SortOrder,
                IsActive = category.IsActive,
                CreatedAt = category.CreatedAt,
                UpdatedAt = category.UpdatedAt
            };

            return Ok(categoryDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    /// <summary>
    /// Delete a tour category (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTourCategory(Guid id)
    {
        try
        {
            var category = await _db.TourCategories.FirstOrDefaultAsync(c => c.Id == id);
            if (category == null)
            {
                return NotFound("Không tìm thấy danh mục tour");
            }

            // Check if category has tours
            var hasTours = await _db.Tours.AnyAsync(t => t.Category == category.Name);
            if (hasTours)
            {
                return BadRequest("Không thể xóa danh mục đã có tour. Vui lòng thay đổi trạng thái thành không hoạt động.");
            }

            _db.TourCategories.Remove(category);
            await _db.SaveChangesAsync();

            return Ok();
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

public class CreateTourCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public string Code { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
    public int SortOrder { get; set; } = 0;
}

public class UpdateTourCategoryRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public string? Code { get; set; }
    public Guid? ParentId { get; set; }
    public int? SortOrder { get; set; }
    public bool? IsActive { get; set; }
}