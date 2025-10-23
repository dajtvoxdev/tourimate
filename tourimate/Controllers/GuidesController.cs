using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using Entities.Models;
using Entities.Enums;
using TouriMate.Contracts.Guides;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class GuidesController : ControllerBase
{
    private readonly TouriMateDbContext _db;

    public GuidesController(TouriMateDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<GuideListDto>>> GetGuides()
    {
        try
        {
            var guides = await _db.Users
                .Where(u => (u.Role == UserRole.TourGuide || u.Role == UserRole.Admin) && u.IsActive)
                .Select(u => new GuideListDto
                {
                    Id = u.Id,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    IsActive = u.IsActive
                })
                .OrderBy(g => g.FirstName)
                .ThenBy(g => g.LastName)
                .ToListAsync();

            return Ok(guides);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GuideProfileDto>> GetGuide(Guid id)
    {
        try
        {
            var guide = await _db.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (guide == null || !guide.IsTourGuide)
            {
                return NotFound("Không tìm thấy hướng dẫn viên");
            }

            var activeTours = await _db.Tours.CountAsync(t => t.TourGuideId == id && t.IsActive);
            var ratingList = await _db.Tours.Where(t => t.TourGuideId == id && t.TotalReviews > 0)
                .Select(t => t.AverageRating)
                .ToListAsync();
            decimal avgRatingDec = 0;
            if (ratingList.Count > 0)
            {
                avgRatingDec = ratingList.Average();
            }
            var totalReviews = await _db.Tours.Where(t => t.TourGuideId == id).SumAsync(t => t.TotalReviews);

            // Build location: Ward, Province from codes, otherwise from guide application
            string location = string.Empty;
            int? provinceCode = guide.Profile?.ProvinceCode;
            int? wardCode = guide.Profile?.WardCode;
            var divisionCodes = new List<int>();
            if (provinceCode.HasValue) divisionCodes.Add(provinceCode.Value);
            if (wardCode.HasValue) divisionCodes.Add(wardCode.Value);
            Dictionary<int, Entities.Models.Division>? divisions = null;
            if (divisionCodes.Count > 0)
            {
                divisions = await _db.Divisions.Where(d => divisionCodes.Contains(d.Code)).ToDictionaryAsync(d => d.Code, d => d);
            }
            string? provinceName = null;
            string? wardName = null;
            if (provinceCode.HasValue && divisions != null && divisions.TryGetValue(provinceCode.Value, out var prov))
            {
                provinceName = prov.FullName ?? prov.Name;
            }
            if (wardCode.HasValue && divisions != null && divisions.TryGetValue(wardCode.Value, out var ward))
            {
                wardName = ward.FullName ?? ward.Name;
            }
            if (!string.IsNullOrWhiteSpace(wardName) || !string.IsNullOrWhiteSpace(provinceName))
            {
                location = string.Join(", ", new[] { wardName, provinceName }.Where(s => !string.IsNullOrWhiteSpace(s)));
            }
            if (string.IsNullOrWhiteSpace(location))
            {
                // fallback to latest approved tour guide application
                var latestApproved = await _db.TourGuideApplications
                    .Where(a => a.UserId == id && a.Status == "approved")
                    .OrderByDescending(a => a.CreatedAt)
                    .FirstOrDefaultAsync();
                if (latestApproved != null && !string.IsNullOrWhiteSpace(latestApproved.ApplicationData))
                {
                    try
                    {
                        var json = System.Text.Json.JsonDocument.Parse(latestApproved.ApplicationData).RootElement;
                        var wardStr = json.TryGetProperty("wardName", out var w) ? w.GetString() : null;
                        var provinceStr = json.TryGetProperty("provinceName", out var p) ? p.GetString() : null;
                        var addr = json.TryGetProperty("address", out var a) ? a.GetString() : null;
                        var parts = new List<string?> { addr, wardStr, provinceStr };
                        location = string.Join(", ", parts.Where(s => !string.IsNullOrWhiteSpace(s))!);
                    }
                    catch { }
                }
            }

            var dto = new GuideProfileDto
            {
                Id = guide.Id,
                FullName = guide.FullName,
                FirstName = guide.FirstName,
                LastName = guide.LastName,
                Email = guide.Email,
                PhoneNumber = guide.PhoneNumber,
                Avatar = guide.Avatar,
                BioHtml = guide.Profile?.Bio ?? string.Empty,
                Location = location,
                AverageRating = avgRatingDec,
                TotalReviews = totalReviews,
                TotalActiveTours = activeTours,
                CreatedAt = guide.CreatedAt,
                UpdatedAt = guide.UpdatedAt
            };

            return Ok(dto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }
}

public sealed class GuideProfileDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Avatar { get; set; }
    public string BioHtml { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public int TotalActiveTours { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}


