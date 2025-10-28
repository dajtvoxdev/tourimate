using Entities.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using tourimate.Contracts.Common;
using tourimate.Contracts.Pricing;
using TouriMate.Data;

namespace tourimate.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PricingConfigController : ControllerBase
{
    private readonly TouriMateDbContext _db;

    public PricingConfigController(TouriMateDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<PricingConfigSearchResponse>> GetPricingConfigs([FromQuery] PricingConfigSearchRequest request)
    {
        try
        {
            var query = _db.PricingConfigs
                .Include(p => p.Creator)
                .Include(p => p.Updater)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(request.Category))
            {
                query = query.Where(p => p.Category == request.Category);
            }

            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var searchTerm = request.SearchTerm.ToLower();
                query = query.Where(p => p.ConfigName.ToLower().Contains(searchTerm) ||
                                       p.ConfigKey.ToLower().Contains(searchTerm) ||
                                       p.Description.ToLower().Contains(searchTerm));
            }

            if (request.IsActive.HasValue)
            {
                query = query.Where(p => p.IsActive == request.IsActive.Value);
            }

            // Apply pagination
            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

            var configs = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(p => new PricingConfigDto
                {
                    Id = p.Id,
                    ConfigKey = p.ConfigKey,
                    ConfigName = p.ConfigName,
                    Description = p.Description,
                    Value = p.Value,
                    Unit = p.Unit,
                    Category = p.Category,
                    IsActive = p.IsActive,
                    EffectiveDate = p.EffectiveDate,
                    ExpiryDate = p.ExpiryDate,
                    Notes = p.Notes,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    CreatedByName = p.Creator != null ? $"{p.Creator.FirstName} {p.Creator.LastName}" : null,
                    UpdatedByName = p.Updater != null ? $"{p.Updater.FirstName} {p.Updater.LastName}" : null
                })
                .ToListAsync();

            return Ok(new PricingConfigSearchResponse
            {
                Configs = configs,
                Pagination = new PaginationInfo
                {
                    Page = request.Page,
                    PageSize = request.PageSize,
                    TotalCount = totalCount,
                    TotalPages = totalPages
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PricingConfigDto>> GetPricingConfig(Guid id)
    {
        try
        {
            var config = await _db.PricingConfigs
                .Include(p => p.Creator)
                .Include(p => p.Updater)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (config == null)
            {
                return NotFound("Không tìm thấy cấu hình giá");
            }

            var configDto = new PricingConfigDto
            {
                Id = config.Id,
                ConfigKey = config.ConfigKey,
                ConfigName = config.ConfigName,
                Description = config.Description,
                Value = config.Value,
                Unit = config.Unit,
                Category = config.Category,
                IsActive = config.IsActive,
                EffectiveDate = config.EffectiveDate,
                ExpiryDate = config.ExpiryDate,
                Notes = config.Notes,
                CreatedAt = config.CreatedAt,
                UpdatedAt = config.UpdatedAt,
                CreatedByName = config.Creator != null ? $"{config.Creator.FirstName} {config.Creator.LastName}" : null,
                UpdatedByName = config.Updater != null ? $"{config.Updater.FirstName} {config.Updater.LastName}" : null
            };

            return Ok(configDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    [HttpPost]
    public async Task<ActionResult<PricingConfigDto>> CreatePricingConfig([FromBody] CreatePricingConfigDto request)
    {
        try
        {
            // Check if config key already exists
            var existingConfig = await _db.PricingConfigs
                .FirstOrDefaultAsync(p => p.ConfigKey == request.ConfigKey);

            if (existingConfig != null)
            {
                return BadRequest("Mã cấu hình đã tồn tại");
            }

            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("Không có quyền truy cập");
            }

            var config = new PricingConfig
            {
                ConfigKey = request.ConfigKey,
                ConfigName = request.ConfigName,
                Description = request.Description,
                Value = request.Value,
                Unit = request.Unit,
                Category = request.Category,
                IsActive = request.IsActive,
                EffectiveDate = request.EffectiveDate,
                ExpiryDate = request.ExpiryDate,
                Notes = request.Notes,
                CreatedBy = userId.Value,
                UpdatedBy = userId.Value
            };

            _db.PricingConfigs.Add(config);
            await _db.SaveChangesAsync();

            var configDto = new PricingConfigDto
            {
                Id = config.Id,
                ConfigKey = config.ConfigKey,
                ConfigName = config.ConfigName,
                Description = config.Description,
                Value = config.Value,
                Unit = config.Unit,
                Category = config.Category,
                IsActive = config.IsActive,
                EffectiveDate = config.EffectiveDate,
                ExpiryDate = config.ExpiryDate,
                Notes = config.Notes,
                CreatedAt = config.CreatedAt,
                UpdatedAt = config.UpdatedAt
            };

            return CreatedAtAction(nameof(GetPricingConfig), new { id = config.Id }, configDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PricingConfigDto>> UpdatePricingConfig(Guid id, [FromBody] UpdatePricingConfigDto request)
    {
        try
        {
            var config = await _db.PricingConfigs.FindAsync(id);
            if (config == null)
            {
                return NotFound("Không tìm thấy cấu hình giá");
            }

            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("Không có quyền truy cập");
            }

            config.ConfigName = request.ConfigName;
            config.Description = request.Description;
            config.Value = request.Value;
            config.Unit = request.Unit;
            config.IsActive = request.IsActive;
            config.EffectiveDate = request.EffectiveDate;
            config.ExpiryDate = request.ExpiryDate;
            config.Notes = request.Notes;
            config.UpdatedBy = userId.Value;

            await _db.SaveChangesAsync();

            var configDto = new PricingConfigDto
            {
                Id = config.Id,
                ConfigKey = config.ConfigKey,
                ConfigName = config.ConfigName,
                Description = config.Description,
                Value = config.Value,
                Unit = config.Unit,
                Category = config.Category,
                IsActive = config.IsActive,
                EffectiveDate = config.EffectiveDate,
                ExpiryDate = config.ExpiryDate,
                Notes = config.Notes,
                CreatedAt = config.CreatedAt,
                UpdatedAt = config.UpdatedAt
            };

            return Ok(configDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeletePricingConfig(Guid id)
    {
        try
        {
            var config = await _db.PricingConfigs.FindAsync(id);
            if (config == null)
            {
                return NotFound("Không tìm thấy cấu hình giá");
            }

            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("Không có quyền truy cập");
            }

            _db.PricingConfigs.Remove(config);
            await _db.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    [HttpGet("categories")]
    public ActionResult<List<string>> GetCategories()
    {
        var categories = new List<string>
        {
            "TourPush",
            "TourCommission", 
            "ProductCommission"
        };

        return Ok(categories);
    }

    [HttpGet("units")]
    public ActionResult<List<string>> GetUnits()
    {
        var units = new List<string>
        {
            "VND",
            "USD", 
            "EUR",
            "%"
        };

        return Ok(units);
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return string.IsNullOrEmpty(userIdClaim) ? null : Guid.Parse(userIdClaim);
    }
}
