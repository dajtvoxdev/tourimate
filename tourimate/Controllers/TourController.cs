using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using TouriMate.Contracts.Tours;
using Entities.Models;
using Entities.Enums;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using TouriMate.Services;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class TourController : ControllerBase
{
    private readonly TouriMateDbContext _db;
    private readonly IEmailService _emailService;

    public TourController(TouriMateDbContext db, IEmailService emailService)
    {
        _db = db;
        _emailService = emailService;
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

    private static List<string> DeserializeImageUrls(string? images)
    {
        if (string.IsNullOrWhiteSpace(images)) return new List<string>();
        try
        {
            var list = JsonSerializer.Deserialize<List<string>>(images);
            return list ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    private static string? SerializeImageUrls(List<string>? imageUrls)
    {
        if (imageUrls == null) return null;
        return JsonSerializer.Serialize(imageUrls);
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
            Price = tour.BasePrice,
            Currency = tour.Currency,
            Category = tour.Category,
            Images = tour.Images,
            ImageUrls = DeserializeImageUrls(tour.Images),
            Itinerary = tour.Itinerary,
            Includes = tour.Includes,
            Excludes = tour.Excludes,
            Terms = tour.Terms,
            IsActive = tour.IsActive,
            IsFeatured = tour.IsFeatured,
            Status = tour.Status,
            DivisionCode = tour.DivisionCode,
            ProvinceCode = tour.ProvinceCode,
            WardCode = tour.WardCode,
            TourGuideId = tour.TourGuideId,
            TourGuideName = $"{tour.TourGuide.FirstName} {tour.TourGuide.LastName}".Trim(),
            TourGuideEmail = tour.TourGuide.Email,
            TourGuidePhone = tour.TourGuide.PhoneNumber,
            TourGuideAvatar = tour.TourGuide.Avatar,
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
            Price = tour.BasePrice,
            Currency = tour.Currency,
            Category = tour.Category,
            Images = tour.Images,
            ImageUrls = DeserializeImageUrls(tour.Images),
            IsActive = tour.IsActive,
            IsFeatured = tour.IsFeatured,
            Status = tour.Status,
            DivisionCode = tour.DivisionCode,
            ProvinceCode = tour.ProvinceCode,
            WardCode = tour.WardCode,
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

            // If a tour guide accesses with ?mine=1, or a non-admin tour guide in general, scope to own tours
            var mineParam = HttpContext.Request.Query["mine"].FirstOrDefault();
            var isMineRequested = !string.IsNullOrEmpty(mineParam) && (mineParam == "1" || mineParam.ToLower() == "true");
            var currentUserId = GetCurrentUserId();
            var userIsAdmin = await IsAdmin();
            var userIsGuide = await IsTourGuide();
            if ((isMineRequested && currentUserId.HasValue) || (userIsGuide && !userIsAdmin))
            {
                query = query.Where(t => t.TourGuideId == currentUserId);
            }

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

            // Difficulty removed from search filters

            if (request.MinPrice.HasValue)
            {
                query = query.Where(t => t.BasePrice >= request.MinPrice.Value);
            }

            if (request.MaxPrice.HasValue)
            {
                query = query.Where(t => t.BasePrice <= request.MaxPrice.Value);
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

            if (request.DivisionCode.HasValue)
            {
                query = query.Where(t => t.DivisionCode == request.DivisionCode.Value);
            }

            // Destination province on tour
            if (request.DestinationProvinceCode.HasValue)
            {
                query = query.Where(t => t.ProvinceCode == request.DestinationProvinceCode.Value);
            }

            // Apply sorting
            query = request.SortBy.ToLower() switch
            {
                "title" => request.SortDirection.ToLower() == "asc" ? query.OrderBy(t => t.Title) : query.OrderByDescending(t => t.Title),
                "price" => request.SortDirection.ToLower() == "asc" ? query.OrderBy(t => t.BasePrice) : query.OrderByDescending(t => t.BasePrice),
                "duration" => request.SortDirection.ToLower() == "asc" ? query.OrderBy(t => t.Duration) : query.OrderByDescending(t => t.Duration),
                "rating" => request.SortDirection.ToLower() == "asc" ? query.OrderBy(t => t.AverageRating) : query.OrderByDescending(t => t.AverageRating),
                "bookings" => request.SortDirection.ToLower() == "asc" ? query.OrderBy(t => t.TotalBookings) : query.OrderByDescending(t => t.TotalBookings),
                "createdat" or "created_at" => request.SortDirection.ToLower() == "asc" ? query.OrderBy(t => t.CreatedAt) : query.OrderByDescending(t => t.CreatedAt),
                _ => query.OrderByDescending(t => t.CreatedAt)
            };

            // Pre-filter by availability if requested
            if (request.DepartureDivisionCode.HasValue || request.StartDate.HasValue || request.MinAvailPrice.HasValue || request.MaxAvailPrice.HasValue)
            {
                var availQuery = _db.TourAvailabilities.AsQueryable();
                if (request.DepartureDivisionCode.HasValue)
                    availQuery = availQuery.Where(a => a.DepartureDivisionCode == request.DepartureDivisionCode.Value);
                if (request.StartDate.HasValue)
                    availQuery = availQuery.Where(a => a.Date >= request.StartDate.Value);
                if (request.MinAvailPrice.HasValue)
                    availQuery = availQuery.Where(a => a.AdultPrice >= request.MinAvailPrice.Value);
                if (request.MaxAvailPrice.HasValue)
                    availQuery = availQuery.Where(a => a.AdultPrice <= request.MaxAvailPrice.Value);

                var tourIdsWithAvail = await availQuery.Select(a => a.TourId).Distinct().ToListAsync();
                query = query.Where(t => tourIdsWithAvail.Contains(t.Id));
            }

            // Get total count
            var totalCount = await query.CountAsync();

            // Apply pagination
            var tours = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

            // Enrich with most recent availability and division names
            var tourIds = tours.Select(t => t.Id).ToList();
            var recentAvailabilities = await _db.TourAvailabilities
                .Where(a => tourIds.Contains(a.TourId) && a.IsAvailable)
                .GroupBy(a => a.TourId)
                .Select(g => g.OrderByDescending(x => x.Date).First())
                .ToListAsync();

            var divisionCodes = new HashSet<int>();
            foreach (var a in recentAvailabilities)
            {
                if (a.DepartureDivisionCode != 0) divisionCodes.Add(a.DepartureDivisionCode);
            }
            var locationDivisionCodes = tours
                .SelectMany(t => new[] { t.ProvinceCode ?? 0, t.WardCode ?? 0 })
                .Where(c => c != 0);
            foreach (var code in locationDivisionCodes) divisionCodes.Add(code);

            var divisions = await _db.Divisions
                .Where(d => divisionCodes.Contains(d.Code))
                .ToDictionaryAsync(d => d.Code, d => d);

            var list = tours.Select(t =>
            {
                var dto = MapToListDto(t);
                var recent = recentAvailabilities.FirstOrDefault(a => a.TourId == t.Id);
                if (recent != null)
                {
                    dto.RecentAdultPrice = recent.AdultPrice;
                    dto.RecentDepartureDivisionCode = recent.DepartureDivisionCode;
                    dto.RecentTripTime = recent.TripTime;
                    dto.RecentDate = recent.Date;
                    if (recent.DepartureDivisionCode != 0 && divisions.TryGetValue(recent.DepartureDivisionCode, out var dep))
                    {
                        dto.RecentDepartureDivisionName = dep.FullName ?? dep.Name;
                    }
                }
                if (t.ProvinceCode.HasValue && divisions.TryGetValue(t.ProvinceCode.Value, out var prov))
                {
                    dto.ProvinceName = prov.FullName ?? prov.Name;
                }
                if (t.WardCode.HasValue && divisions.TryGetValue(t.WardCode.Value, out var ward))
                {
                    dto.WardName = ward.FullName ?? ward.Name;
                }
                return dto;
            }).ToList();

            var response = new TourSearchResponse
            {
                Tours = list,
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
                return StatusCode(403, "Chỉ hướng dẫn viên hoặc quản trị viên mới có thể tạo tour");
            }

            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            var tourGuide = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (tourGuide == null)
            {
                return NotFound("Không tìm thấy thông tin hướng dẫn viên");
            }

            var creatorIsAdmin = await IsAdmin();

            var tour = new Tour
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                Description = request.Description,
                ShortDescription = request.ShortDescription,
                Location = request.Location,
                Duration = request.Duration,
                BasePrice = request.Price,
                Currency = string.IsNullOrWhiteSpace(request.Currency) ? "VND" : request.Currency,
                Category = request.Category,
                
                Images = request.ImageUrls != null ? SerializeImageUrls(request.ImageUrls) : request.Images,
                Itinerary = request.Itinerary,
                Includes = request.Includes,
                Excludes = request.Excludes,
                Terms = request.Terms,
                IsActive = true,
                IsFeatured = request.IsFeatured,
                Status = creatorIsAdmin ? TourStatus.Approved : TourStatus.PendingApproval,
                TourGuideId = userId.Value,
                CreatedBy = userId.Value,
                DivisionCode = request.DivisionCode,
                ProvinceCode = request.ProvinceCode,
                WardCode = request.WardCode
            };

            _db.Tours.Add(tour);
            await _db.SaveChangesAsync();

            // Notify admin only if tour needs approval
            if (!creatorIsAdmin)
            {
                try
                {
                    var guide = tourGuide;
                    var html = $@"<h3>Tour mới chờ phê duyệt</h3>
<p>Tiêu đề: <strong>{tour.Title}</strong></p>
<p>Hướng dẫn viên: {guide!.FirstName} {guide.LastName} ({guide.Email})</p>
<p>Thời gian tạo: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC</p>
<p>Vui lòng vào trang quản trị để xem và phê duyệt.</p>";
                    await _emailService.SendAdminNotificationAsync("Tour mới chờ phê duyệt", html);
                }
                catch { }
            }

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

            if (tour.TourGuideId != userId && !isAdmin)
            {
                return StatusCode(403, "Bạn chỉ có thể chỉnh sửa tour của mình");
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
            if (request.Price.HasValue)
                tour.BasePrice = request.Price.Value;
            if (!string.IsNullOrWhiteSpace(request.Currency))
                tour.Currency = request.Currency;
            if (!string.IsNullOrWhiteSpace(request.Category))
                tour.Category = request.Category;
            // Difficulty removed
            if (request.ImageUrls != null)
                tour.Images = SerializeImageUrls(request.ImageUrls);
            else if (request.Images != null)
                tour.Images = request.Images;
            if (request.Itinerary != null)
                tour.Itinerary = request.Itinerary;
            if (request.Includes != null)
                tour.Includes = request.Includes;
            if (request.Excludes != null)
                tour.Excludes = request.Excludes;
            if (request.Terms != null)
                tour.Terms = request.Terms;
            if (request.DivisionCode.HasValue) tour.DivisionCode = request.DivisionCode.Value;
            if (request.ProvinceCode.HasValue) tour.ProvinceCode = request.ProvinceCode.Value;
            if (request.WardCode.HasValue) tour.WardCode = request.WardCode.Value;
            if (request.IsActive.HasValue)
                tour.IsActive = request.IsActive.Value;
            if (request.IsFeatured.HasValue)
                tour.IsFeatured = request.IsFeatured.Value;
            //if (request.Status.HasValue && isAdmin)
            //    tour.Status = request.Status.Value;

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
                return StatusCode(403, "Bạn chỉ có thể xóa tour của mình");
            }

            // Check if tour has bookings
            var hasBookings = await _db.Bookings.AnyAsync(b => b.TourId == id && b.Status != BookingStatus.Cancelled);
            if (hasBookings)
            {
                return BadRequest("Không thể xóa tour đã có đặt tour. Vui lòng thay đổi trạng thái thành không hoạt động.");
            }

            _db.Tours.Remove(tour);
            await _db.SaveChangesAsync();

            return Ok();
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
                return StatusCode(403, "Chỉ quản trị viên mới có thể xem thống kê");
            }

            var totalTours = await _db.Tours.CountAsync();
            var activeTours = await _db.Tours.CountAsync(t => t.IsActive);
            var pendingTours = await _db.Tours.CountAsync(t => t.Status == TourStatus.PendingApproval);
            var rejectedTours = await _db.Tours.CountAsync(t => t.Status == TourStatus.Rejected);
            var featuredTours = await _db.Tours.CountAsync(t => t.IsFeatured);

            var averagePrice = await _db.Tours.Where(t => t.IsActive).AverageAsync(t => (double)t.BasePrice);
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
                return StatusCode(403, "Chỉ quản trị viên mới có thể thay đổi trạng thái tour");
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

            // Notify guide when approved/rejected (best-effort)
            try
            {
                if (status == TourStatus.Approved || status == TourStatus.Rejected)
                {
                    var guide = await _db.Users.FirstOrDefaultAsync(u => u.Id == tour.TourGuideId);
                    if (guide != null)
                    {
                        var subj = status == TourStatus.Approved ? "Tour đã được phê duyệt" : "Tour bị từ chối";
                        var html = $@"<h3>{subj}</h3>
<p>Tour: <strong>{tour.Title}</strong></p>
<p>Trạng thái: {status}</p>";
                        await _emailService.SendAdminNotificationAsync(subj, html);
                    }
                }
            }
            catch { }

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
