using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using TouriMate.Contracts.Tours;
using Entities.Models;
using Entities.Enums;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class TourController : ControllerBase
{
    private readonly TouriMateDbContext _db;

    public TourController(TouriMateDbContext db)
    {
        _db = db;
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return string.IsNullOrEmpty(userIdClaim) ? null : Guid.Parse(userIdClaim);
    }

    private async Task<bool> IsAdmin()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return false;

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
        return user?.Role == UserRole.Admin;
    }

    private async Task<bool> IsTourGuide()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return false;

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
        return user?.Role == UserRole.TourGuide || user?.Role == UserRole.Admin;
    }

    private static TourDto MapToDto(Tour tour)
    {
        return new TourDto
        {
            Id = tour.Id,
            Title = tour.Title,
            Description = tour.Description,
            ShortDescription = tour.ShortDescription,
            Location = tour.Location,
            Duration = tour.Duration,
            MaxParticipants = tour.MaxParticipants,
            Price = tour.Price,
            Currency = tour.Currency,
            Category = tour.Category,
            Difficulty = tour.Difficulty,
            Images = tour.Images,
            Itinerary = tour.Itinerary,
            Includes = tour.Includes,
            Excludes = tour.Excludes,
            Terms = tour.Terms,
            IsActive = tour.IsActive,
            IsFeatured = tour.IsFeatured,
            Status = tour.Status,
            TourGuideId = tour.TourGuideId,
            TourGuideName = $"{tour.TourGuide.FirstName} {tour.TourGuide.LastName}".Trim(),
            TourGuideEmail = tour.TourGuide.Email,
            AverageRating = tour.AverageRating,
            TotalReviews = tour.TotalReviews,
            TotalBookings = tour.TotalBookings,
            ViewCount = tour.ViewCount,
            CreatedAt = tour.CreatedAt,
            UpdatedAt = tour.UpdatedAt
        };
    }

    private static TourListDto MapToListDto(Tour tour)
    {
        return new TourListDto
        {
            Id = tour.Id,
            Title = tour.Title,
            ShortDescription = tour.ShortDescription,
            Location = tour.Location,
            Duration = tour.Duration,
            Price = tour.Price,
            Currency = tour.Currency,
            Category = tour.Category,
            Difficulty = tour.Difficulty,
            Images = tour.Images,
            IsActive = tour.IsActive,
            IsFeatured = tour.IsFeatured,
            Status = tour.Status,
            TourGuideId = tour.TourGuideId,
            TourGuideName = $"{tour.TourGuide.FirstName} {tour.TourGuide.LastName}".Trim(),
            AverageRating = tour.AverageRating,
            TotalReviews = tour.TotalReviews,
            TotalBookings = tour.TotalBookings,
            ViewCount = tour.ViewCount,
            CreatedAt = tour.CreatedAt
        };
    }

    /// <summary>
    /// Get all tours with pagination and filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<TourSearchResponse>> GetTours([FromQuery] TourSearchRequest request)
    {
        try
        {
            var query = _db.Tours
                .Include(t => t.TourGuide)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var searchTerm = request.SearchTerm.ToLower();
                query = query.Where(t => t.Title.ToLower().Contains(searchTerm) ||
                                       t.Description.ToLower().Contains(searchTerm) ||
                                       t.Location.ToLower().Contains(searchTerm) ||
                                       t.ShortDescription.ToLower().Contains(searchTerm));
            }

            if (!string.IsNullOrWhiteSpace(request.Location))
            {
                query = query.Where(t => t.Location.ToLower().Contains(request.Location.ToLower()));
            }

            if (!string.IsNullOrWhiteSpace(request.Category))
            {
                query = query.Where(t => t.Category.ToLower().Contains(request.Category.ToLower()));
            }

            if (!string.IsNullOrWhiteSpace(request.Difficulty))
            {
                query = query.Where(t => t.Difficulty == request.Difficulty);
            }

            if (request.MinPrice.HasValue)
            {
                query = query.Where(t => t.Price >= request.MinPrice.Value);
            }

            if (request.MaxPrice.HasValue)
            {
                query = query.Where(t => t.Price <= request.MaxPrice.Value);
            }

            if (request.MinDuration.HasValue)
            {
                query = query.Where(t => t.Duration >= request.MinDuration.Value);
            }

            if (request.MaxDuration.HasValue)
            {
                query = query.Where(t => t.Duration <= request.MaxDuration.Value);
            }

            if (request.IsActive.HasValue)
            {
                query = query.Where(t => t.IsActive == request.IsActive.Value);
            }

            if (request.IsFeatured.HasValue)
            {
                query = query.Where(t => t.IsFeatured == request.IsFeatured.Value);
            }

            if (request.Status.HasValue)
            {
                query = query.Where(t => t.Status == request.Status.Value);
            }

            if (request.TourGuideId.HasValue)
            {
                query = query.Where(t => t.TourGuideId == request.TourGuideId.Value);
            }

            // Apply sorting
            query = request.SortBy.ToLower() switch
            {
                "title" => request.SortDirection.ToLower() == "asc" ? query.OrderBy(t => t.Title) : query.OrderByDescending(t => t.Title),
                "price" => request.SortDirection.ToLower() == "asc" ? query.OrderBy(t => t.Price) : query.OrderByDescending(t => t.Price),
                "duration" => request.SortDirection.ToLower() == "asc" ? query.OrderBy(t => t.Duration) : query.OrderByDescending(t => t.Duration),
                "rating" => request.SortDirection.ToLower() == "asc" ? query.OrderBy(t => t.AverageRating) : query.OrderByDescending(t => t.AverageRating),
                "bookings" => request.SortDirection.ToLower() == "asc" ? query.OrderBy(t => t.TotalBookings) : query.OrderByDescending(t => t.TotalBookings),
                "createdat" or "created_at" => request.SortDirection.ToLower() == "asc" ? query.OrderBy(t => t.CreatedAt) : query.OrderByDescending(t => t.CreatedAt),
                _ => query.OrderByDescending(t => t.CreatedAt)
            };

            // Get total count
            var totalCount = await query.CountAsync();

            // Apply pagination
            var tours = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

            var response = new TourSearchResponse
            {
                Tours = tours.Select(MapToListDto).ToList(),
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize,
                TotalPages = totalPages
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    /// <summary>
    /// Get a specific tour by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<TourDto>> GetTour(Guid id)
    {
        try
        {
            var tour = await _db.Tours
                .Include(t => t.TourGuide)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tour == null)
            {
                return NotFound("Không tìm thấy tour");
            }

            // Increment view count
            tour.ViewCount++;
            await _db.SaveChangesAsync();

            return Ok(MapToDto(tour));
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    /// <summary>
    /// Create a new tour (requires TourGuide or Admin role)
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<TourDto>> CreateTour([FromBody] CreateTourRequest request)
    {
        try
        {
            if (!await IsTourGuide())
            {
                return Forbid("Chỉ hướng dẫn viên hoặc quản trị viên mới có thể tạo tour");
            }

            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            // Verify tour guide exists
            var tourGuide = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (tourGuide == null)
            {
                return NotFound("Không tìm thấy thông tin hướng dẫn viên");
            }

            var tour = new Tour
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                Description = request.Description,
                ShortDescription = request.ShortDescription,
                Location = request.Location,
                Duration = request.Duration,
                MaxParticipants = request.MaxParticipants,
                Price = request.Price,
                Currency = request.Currency,
                Category = request.Category,
                Difficulty = request.Difficulty,
                Images = request.Images,
                Itinerary = request.Itinerary,
                Includes = request.Includes,
                Excludes = request.Excludes,
                Terms = request.Terms,
                IsActive = true,
                IsFeatured = request.IsFeatured,
                Status = TourStatus.PendingApproval,
                TourGuideId = userId.Value,
                CreatedBy = userId.Value,
                UpdatedBy = userId.Value
            };

            _db.Tours.Add(tour);
            await _db.SaveChangesAsync();

            // Reload with navigation properties
            var createdTour = await _db.Tours
                .Include(t => t.TourGuide)
                .FirstOrDefaultAsync(t => t.Id == tour.Id);

            return CreatedAtAction(nameof(GetTour), new { id = tour.Id }, MapToDto(createdTour!));
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    /// <summary>
    /// Update a tour (requires ownership or Admin role)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<TourDto>> UpdateTour(Guid id, [FromBody] UpdateTourRequest request)
    {
        try
        {
            var tour = await _db.Tours.FirstOrDefaultAsync(t => t.Id == id);
            if (tour == null)
            {
                return NotFound("Không tìm thấy tour");
            }

            var userId = GetCurrentUserId();
            var isAdmin = await IsAdmin();

            // Check ownership or admin rights
            if (tour.TourGuideId != userId && !isAdmin)
            {
                return Forbid("Bạn chỉ có thể chỉnh sửa tour của mình");
            }

            // Update fields
            if (!string.IsNullOrWhiteSpace(request.Title))
                tour.Title = request.Title;
            if (!string.IsNullOrWhiteSpace(request.Description))
                tour.Description = request.Description;
            if (!string.IsNullOrWhiteSpace(request.ShortDescription))
                tour.ShortDescription = request.ShortDescription;
            if (!string.IsNullOrWhiteSpace(request.Location))
                tour.Location = request.Location;
            if (request.Duration.HasValue)
                tour.Duration = request.Duration.Value;
            if (request.MaxParticipants.HasValue)
                tour.MaxParticipants = request.MaxParticipants.Value;
            if (request.Price.HasValue)
                tour.Price = request.Price.Value;
            if (!string.IsNullOrWhiteSpace(request.Currency))
                tour.Currency = request.Currency;
            if (!string.IsNullOrWhiteSpace(request.Category))
                tour.Category = request.Category;
            if (!string.IsNullOrWhiteSpace(request.Difficulty))
                tour.Difficulty = request.Difficulty;
            if (request.Images != null)
                tour.Images = request.Images;
            if (request.Itinerary != null)
                tour.Itinerary = request.Itinerary;
            if (request.Includes != null)
                tour.Includes = request.Includes;
            if (request.Excludes != null)
                tour.Excludes = request.Excludes;
            if (request.Terms != null)
                tour.Terms = request.Terms;
            if (request.IsActive.HasValue)
                tour.IsActive = request.IsActive.Value;
            if (request.IsFeatured.HasValue)
                tour.IsFeatured = request.IsFeatured.Value;
            if (request.Status.HasValue && isAdmin)
                tour.Status = request.Status.Value;

            tour.UpdatedBy = userId;

            await _db.SaveChangesAsync();

            // Reload with navigation properties
            var updatedTour = await _db.Tours
                .Include(t => t.TourGuide)
                .FirstOrDefaultAsync(t => t.Id == id);

            return Ok(MapToDto(updatedTour!));
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    /// <summary>
    /// Delete a tour (requires ownership or Admin role)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteTour(Guid id)
    {
        try
        {
            var tour = await _db.Tours.FirstOrDefaultAsync(t => t.Id == id);
            if (tour == null)
            {
                return NotFound("Không tìm thấy tour");
            }

            var userId = GetCurrentUserId();
            var isAdmin = await IsAdmin();

            // Check ownership or admin rights
            if (tour.TourGuideId != userId && !isAdmin)
            {
                return Forbid("Bạn chỉ có thể xóa tour của mình");
            }

            // Check if tour has bookings
            var hasBookings = await _db.Bookings.AnyAsync(b => b.TourId == id && b.Status != BookingStatus.Cancelled);
            if (hasBookings)
            {
                return BadRequest("Không thể xóa tour đã có đặt tour. Vui lòng thay đổi trạng thái thành không hoạt động.");
            }

            _db.Tours.Remove(tour);
            await _db.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    /// <summary>
    /// Get tours by tour guide
    /// </summary>
    [HttpGet("guide/{guideId}")]
    public async Task<ActionResult<List<TourListDto>>> GetToursByGuide(Guid guideId, [FromQuery] bool? isActive = null)
    {
        try
        {
            var query = _db.Tours
                .Include(t => t.TourGuide)
                .Where(t => t.TourGuideId == guideId);

            if (isActive.HasValue)
            {
                query = query.Where(t => t.IsActive == isActive.Value);
            }

            var tours = await query
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return Ok(tours.Select(MapToListDto).ToList());
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    /// <summary>
    /// Get my tours (for authenticated tour guides)
    /// </summary>
    [HttpGet("my-tours")]
    [Authorize]
    public async Task<ActionResult<List<TourListDto>>> GetMyTours([FromQuery] bool? isActive = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            return await GetToursByGuide(userId.Value, isActive);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    /// <summary>
    /// Get tour statistics (Admin only)
    /// </summary>
    [HttpGet("stats")]
    [Authorize]
    public async Task<ActionResult<TourStatsDto>> GetTourStats()
    {
        try
        {
            if (!await IsAdmin())
            {
                return Forbid("Chỉ quản trị viên mới có thể xem thống kê");
            }

            var totalTours = await _db.Tours.CountAsync();
            var activeTours = await _db.Tours.CountAsync(t => t.IsActive);
            var pendingTours = await _db.Tours.CountAsync(t => t.Status == TourStatus.PendingApproval);
            var rejectedTours = await _db.Tours.CountAsync(t => t.Status == TourStatus.Rejected);
            var featuredTours = await _db.Tours.CountAsync(t => t.IsFeatured);

            var averagePrice = await _db.Tours.Where(t => t.IsActive).AverageAsync(t => (double)t.Price);
            var totalRevenue = await _db.Bookings
                .Where(b => b.Status == BookingStatus.Completed)
                .SumAsync(b => b.TotalAmount);
            var totalBookings = await _db.Bookings.CountAsync(b => b.Status == BookingStatus.Completed);
            var averageRating = await _db.Tours.Where(t => t.TotalReviews > 0).AverageAsync(t => (double)t.AverageRating);

            var stats = new TourStatsDto
            {
                TotalTours = totalTours,
                ActiveTours = activeTours,
                PendingTours = pendingTours,
                RejectedTours = rejectedTours,
                FeaturedTours = featuredTours,
                AveragePrice = (decimal)averagePrice,
                TotalRevenue = totalRevenue,
                TotalBookings = totalBookings,
                AverageRating = (decimal)averageRating
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    /// <summary>
    /// Update tour status (Admin only)
    /// </summary>
    [HttpPut("{id}/status")]
    [Authorize]
    public async Task<ActionResult<TourDto>> UpdateTourStatus(Guid id, [FromBody] TourStatus status)
    {
        try
        {
            if (!await IsAdmin())
            {
                return Forbid("Chỉ quản trị viên mới có thể thay đổi trạng thái tour");
            }

            var tour = await _db.Tours
                .Include(t => t.TourGuide)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tour == null)
            {
                return NotFound("Không tìm thấy tour");
            }

            tour.Status = status;
            tour.UpdatedBy = GetCurrentUserId();

            await _db.SaveChangesAsync();

            return Ok(MapToDto(tour));
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    /// <summary>
    /// Get featured tours
    /// </summary>
    [HttpGet("featured")]
    public async Task<ActionResult<List<TourListDto>>> GetFeaturedTours([FromQuery] int limit = 10)
    {
        try
        {
            var tours = await _db.Tours
                .Include(t => t.TourGuide)
                .Where(t => t.IsFeatured && t.IsActive && t.Status == TourStatus.Approved)
                .OrderByDescending(t => t.AverageRating)
                .ThenByDescending(t => t.TotalBookings)
                .Take(limit)
                .ToListAsync();

            return Ok(tours.Select(MapToListDto).ToList());
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }
}
