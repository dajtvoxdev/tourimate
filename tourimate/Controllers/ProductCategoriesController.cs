using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using Entities.Models;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Entities.Enums;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/product-categories")]
public sealed class ProductCategoriesController : ControllerBase
{
    private readonly TouriMateDbContext _db;

    public ProductCategoriesController(TouriMateDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProductCategoryDto>>> GetProductCategories()
    {
        var categories = await _db.ProductCategories
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Select(c => new ProductCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
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

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductCategoryDto>> GetProductCategory(Guid id)
    {
        var c = await _db.ProductCategories.FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return NotFound("Không tìm thấy danh mục sản phẩm");

        return Ok(new ProductCategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            Icon = c.Icon,
            ParentId = c.ParentId,
            SortOrder = c.SortOrder,
            IsActive = c.IsActive,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ProductCategoryDto>> CreateProductCategory([FromBody] CreateProductCategoryRequest request)
    {
        var category = new ProductCategory
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            Icon = request.Icon,
            ParentId = request.ParentId,
            SortOrder = request.SortOrder,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.ProductCategories.Add(category);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProductCategory), new { id = category.Id }, new ProductCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            Icon = category.Icon,
            ParentId = category.ParentId,
            SortOrder = category.SortOrder,
            IsActive = category.IsActive,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ProductCategoryDto>> UpdateProductCategory(Guid id, [FromBody] UpdateProductCategoryRequest request)
    {
        var c = await _db.ProductCategories.FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return NotFound("Không tìm thấy danh mục sản phẩm");

        if (!string.IsNullOrWhiteSpace(request.Name)) c.Name = request.Name;
        if (request.Description != null) c.Description = request.Description;
        if (request.Icon != null) c.Icon = request.Icon;
        if (request.ParentId.HasValue) c.ParentId = request.ParentId.Value;
        if (request.SortOrder.HasValue) c.SortOrder = request.SortOrder.Value;
        if (request.IsActive.HasValue) c.IsActive = request.IsActive.Value;
        c.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new ProductCategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            Icon = c.Icon,
            ParentId = c.ParentId,
            SortOrder = c.SortOrder,
            IsActive = c.IsActive,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteProductCategory(Guid id)
    {
        var c = await _db.ProductCategories.FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return NotFound("Không tìm thấy danh mục sản phẩm");

        var hasProducts = await _db.Products.AnyAsync(p => p.Category == c.Name);
        if (hasProducts)
        {
            return BadRequest("Không thể xóa danh mục đã có sản phẩm. Vui lòng đổi trạng thái thành không hoạt động.");
        }

        _db.ProductCategories.Remove(c);
        await _db.SaveChangesAsync();
        return Ok();
    }

    // Role-based authorization via [Authorize(Roles = "Admin")] above
}

public class ProductCategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public Guid? ParentId { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateProductCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public Guid? ParentId { get; set; }
    public int SortOrder { get; set; } = 0;
}

public class UpdateProductCategoryRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public Guid? ParentId { get; set; }
    public int? SortOrder { get; set; }
    public bool? IsActive { get; set; }
}
