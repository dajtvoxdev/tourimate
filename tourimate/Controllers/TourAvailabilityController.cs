using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using tourimate.Contracts.Tours;
using TouriMate.Data;
using Entities.Models;
using Microsoft.Extensions.Logging;

namespace tourimate.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TourAvailabilityController : ControllerBase
{
    private readonly TouriMateDbContext _db;
    private readonly ILogger<TourAvailabilityController> _logger;

    public TourAvailabilityController(TouriMateDbContext db, ILogger<TourAvailabilityController> logger)
    {
        _db = db;
        _logger = logger;
    }

    // GET: api/touravailability
    [HttpGet]
    public async Task<ActionResult<TourAvailabilitySearchResponse>> GetTourAvailabilities([FromQuery] TourAvailabilitySearchRequest request)
    {
        try
        {
            var query = _db.TourAvailabilities.AsQueryable();

            // Apply filters
            if (request.TourId.HasValue)
                query = query.Where(ta => ta.TourId == request.TourId.Value);

            if (request.StartDate.HasValue)
                query = query.Where(ta => ta.Date >= request.StartDate.Value);

            if (request.EndDate.HasValue)
                query = query.Where(ta => ta.Date <= request.EndDate.Value);

            if (request.IsAvailable.HasValue)
                query = query.Where(ta => ta.IsAvailable == request.IsAvailable.Value);

            if (request.MinPrice.HasValue)
                query = query.Where(ta => ta.AdultPrice >= request.MinPrice.Value);

            if (request.MaxPrice.HasValue)
                query = query.Where(ta => ta.AdultPrice <= request.MaxPrice.Value);

            if (request.DepartureDivisionCode.HasValue)
                query = query.Where(ta => ta.DepartureDivisionCode == request.DepartureDivisionCode.Value);

            if (!string.IsNullOrEmpty(request.Vehicle))
                query = query.Where(ta => ta.Vehicle != null && ta.Vehicle.Contains(request.Vehicle));

            // Apply sorting
            query = request.SortBy?.ToLower() switch
            {
                "adultprice" => request.SortDirection?.ToLower() == "desc" 
                    ? query.OrderByDescending(ta => ta.AdultPrice) 
                    : query.OrderBy(ta => ta.AdultPrice),
                "maxparticipants" => request.SortDirection?.ToLower() == "desc" 
                    ? query.OrderByDescending(ta => ta.MaxParticipants) 
                    : query.OrderBy(ta => ta.MaxParticipants),
                _ => request.SortDirection?.ToLower() == "desc" 
                    ? query.OrderByDescending(ta => ta.Date) 
                    : query.OrderBy(ta => ta.Date)
            };

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply pagination
            var skip = (request.Page - 1) * request.PageSize;
            
            // Log the query for performance analysis
            var finalQuery = query
                .Skip(skip)
                .Take(request.PageSize);
            
            var tourAvailabilities = await finalQuery.ToListAsync();
            
            // Load related data separately for better performance
            var tourIds = tourAvailabilities.Select(ta => ta.TourId).Distinct().ToList();
            var divisionCodes = tourAvailabilities.Select(ta => ta.DepartureDivisionCode).Where(code => code != 0).Distinct().ToList();
            
            var tours = await _db.Tours.Where(t => tourIds.Contains(t.Id)).ToDictionaryAsync(t => t.Id, t => t);
            var divisions = await _db.Divisions.Where(d => divisionCodes.Contains(d.Code)).ToDictionaryAsync(d => d.Code, d => d);
            
            // Manually populate navigation properties
            foreach (var ta in tourAvailabilities)
            {
                if (tours.TryGetValue(ta.TourId, out var tour))
                    ta.Tour = tour;
                if (ta.DepartureDivisionCode != 0 && divisions.TryGetValue(ta.DepartureDivisionCode, out var division))
                    ta.DepartureDivision = division;
            }

            var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

            var response = new TourAvailabilitySearchResponse
            {
                Data = tourAvailabilities.Select(MapToDto).ToList(),
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize,
                TotalPages = totalPages,
                HasNextPage = request.Page < totalPages,
                HasPreviousPage = request.Page > 1
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    // GET: api/touravailability/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<TourAvailabilityDto>> GetTourAvailability(Guid id)
    {
        try
        {
            var tourAvailability = await _db.TourAvailabilities
                .Include(ta => ta.Tour)
                .Include(ta => ta.DepartureDivision)
                .FirstOrDefaultAsync(ta => ta.Id == id);

            if (tourAvailability == null)
                return NotFound($"Không tìm thấy tour availability với ID: {id}");

            return Ok(MapToDto(tourAvailability));
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    // GET: api/touravailability/tour/{tourId}
    [HttpGet("tour/{tourId}")]
    public async Task<ActionResult<List<TourAvailabilityDto>>> GetTourAvailabilitiesByTour(Guid tourId)
    {
        try
        {
            var query = _db.TourAvailabilities
                .Where(ta => ta.TourId == tourId)
                .OrderBy(ta => ta.Date);
            
            _logger.LogInformation("GetTourAvailabilitiesByTour Query: {Query}", query.ToQueryString());
            _logger.LogInformation("GetTourAvailabilitiesByTour Parameters: TourId={TourId}", tourId);
            
            var tourAvailabilities = await query.ToListAsync();
            
            // Load related data separately for better performance
            var divisionCodes = tourAvailabilities.Select(ta => ta.DepartureDivisionCode).Where(code => code != 0).Distinct().ToList();
            var tour = await _db.Tours.FirstOrDefaultAsync(t => t.Id == tourId);
            var divisions = await _db.Divisions.Where(d => divisionCodes.Contains(d.Code)).ToDictionaryAsync(d => d.Code, d => d);
            
            // Manually populate navigation properties
            foreach (var ta in tourAvailabilities)
            {
                ta.Tour = tour;
                if (ta.DepartureDivisionCode != 0 && divisions.TryGetValue(ta.DepartureDivisionCode, out var division))
                    ta.DepartureDivision = division;
            }

            return Ok(tourAvailabilities.Select(MapToDto).ToList());
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    // POST: api/touravailability
    [HttpPost]
    public async Task<ActionResult<TourAvailabilityDto>> CreateTourAvailability([FromBody] CreateTourAvailabilityRequest request)
    {
        try
        {
            // Validate tour exists
            var tour = await _db.Tours.FindAsync(request.TourId);
            if (tour == null)
                return BadRequest($"Không tìm thấy tour với ID: {request.TourId}");

            // Validate departure division exists
            var division = await _db.Divisions.FirstOrDefaultAsync(d => d.Code == request.DepartureDivisionCode);
            if (division == null)
                return BadRequest($"Không tìm thấy division với Code: {request.DepartureDivisionCode}");

            // Check for duplicate date for the same tour
            var existingAvailability = await _db.TourAvailabilities
                .FirstOrDefaultAsync(ta => ta.TourId == request.TourId && ta.Date.Date == request.Date.Date);
            
            if (existingAvailability != null)
                return BadRequest($"Đã tồn tại tour availability cho ngày {request.Date:dd/MM/yyyy} của tour này");

            // Validate booked participants doesn't exceed max participants
            if (request.BookedParticipants > request.MaxParticipants)
                return BadRequest("Số người đã đặt không thể vượt quá số người tối đa");

            var tourAvailability = new TourAvailability
            {
                Id = Guid.NewGuid(),
                TourId = request.TourId,
                Date = request.Date,
                MaxParticipants = request.MaxParticipants,
                BookedParticipants = request.BookedParticipants,
                IsAvailable = request.IsAvailable,
                DepartureDivisionCode = request.DepartureDivisionCode,
                Vehicle = request.Vehicle,
                AdultPrice = request.AdultPrice,
                ChildPrice = request.ChildPrice,
                Surcharge = request.Surcharge,
                TripTime = request.TripTime,
                Note = request.Note,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.TourAvailabilities.Add(tourAvailability);
            await _db.SaveChangesAsync();

            // Reload with includes for response
            var createdAvailability = await _db.TourAvailabilities
                .Include(ta => ta.Tour)
                .Include(ta => ta.DepartureDivision)
                .FirstOrDefaultAsync(ta => ta.Id == tourAvailability.Id);

            return CreatedAtAction(nameof(GetTourAvailability), new { id = tourAvailability.Id }, MapToDto(createdAvailability!));
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    // PUT: api/touravailability/{id}
    [HttpPut("{id}")]
    public async Task<ActionResult<TourAvailabilityDto>> UpdateTourAvailability(Guid id, [FromBody] UpdateTourAvailabilityRequest request)
    {
        try
        {
            var tourAvailability = await _db.TourAvailabilities.FindAsync(id);
            if (tourAvailability == null)
                return NotFound($"Không tìm thấy tour availability với ID: {id}");

            // Validate departure division if provided
            if (request.DepartureDivisionCode.HasValue)
            {
                var division = await _db.Divisions.FirstOrDefaultAsync(d => d.Code == request.DepartureDivisionCode.Value);
                if (division == null)
                    return BadRequest($"Không tìm thấy division với Code: {request.DepartureDivisionCode.Value}");
            }

            // Check for duplicate date if date is being changed
            if (request.Date != tourAvailability.Date)
            {
                var existingAvailability = await _db.TourAvailabilities
                    .FirstOrDefaultAsync(ta => ta.TourId == tourAvailability.TourId && 
                                             ta.Date.Date == request.Date.Date && 
                                             ta.Id != id);
                
                if (existingAvailability != null)
                    return BadRequest($"Đã tồn tại tour availability cho ngày {request.Date:dd/MM/yyyy} của tour này");
            }

            // Update fields
            tourAvailability.Date = request.Date;
            
            if (request.MaxParticipants.HasValue)
                tourAvailability.MaxParticipants = request.MaxParticipants.Value;

            if (request.BookedParticipants.HasValue)
                tourAvailability.BookedParticipants = request.BookedParticipants.Value;

            if (request.IsAvailable.HasValue)
                tourAvailability.IsAvailable = request.IsAvailable.Value;

            if (request.DepartureDivisionCode.HasValue)
                tourAvailability.DepartureDivisionCode = request.DepartureDivisionCode.Value;

            if (request.Vehicle != null)
                tourAvailability.Vehicle = request.Vehicle;

            if (request.AdultPrice.HasValue)
                tourAvailability.AdultPrice = request.AdultPrice.Value;

            if (request.ChildPrice.HasValue)
                tourAvailability.ChildPrice = request.ChildPrice.Value;

            if (request.Surcharge.HasValue)
                tourAvailability.Surcharge = request.Surcharge.Value;

            if (request.TripTime != null)
                tourAvailability.TripTime = request.TripTime;

            if (request.Note != null)
                tourAvailability.Note = request.Note;

            // Validate booked participants doesn't exceed max participants
            if (tourAvailability.BookedParticipants > tourAvailability.MaxParticipants)
                return BadRequest("Số người đã đặt không thể vượt quá số người tối đa");

            tourAvailability.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            // Reload with includes for response
            var updatedAvailability = await _db.TourAvailabilities
                .Include(ta => ta.Tour)
                .Include(ta => ta.DepartureDivision)
                .FirstOrDefaultAsync(ta => ta.Id == id);

            return Ok(MapToDto(updatedAvailability!));
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    // DELETE: api/touravailability/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTourAvailability(Guid id)
    {
        try
        {
            var tourAvailability = await _db.TourAvailabilities.FindAsync(id);
            if (tourAvailability == null)
                return NotFound($"Không tìm thấy tour availability với ID: {id}");

            // Check if there are any bookings for this availability (by TourId and Date)
            var hasBookings = await _db.Bookings.AnyAsync(b => b.TourId == tourAvailability.TourId && 
                                                               b.TourDate == DateOnly.FromDateTime(tourAvailability.Date));
            if (hasBookings)
                return BadRequest("Không thể xóa tour availability đã có booking. Vui lòng hủy hoặc hoàn thành tất cả booking trước.");

            _db.TourAvailabilities.Remove(tourAvailability);
            await _db.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    // Helper method to map entity to DTO
    private static TourAvailabilityDto MapToDto(TourAvailability ta)
    {
        return new TourAvailabilityDto
        {
            Id = ta.Id,
            TourId = ta.TourId,
            TourTitle = ta.Tour?.Title ?? "",
            Date = ta.Date,
            MaxParticipants = ta.MaxParticipants,
            BookedParticipants = ta.BookedParticipants,
            IsAvailable = ta.IsAvailable,
            AvailableSpots = ta.AvailableSpots,
            HasAvailableSpots = ta.HasAvailableSpots,
            DepartureDivisionCode = ta.DepartureDivisionCode,
            DepartureDivisionName = ta.DepartureDivision?.Name ?? "",
            Vehicle = ta.Vehicle,
            AdultPrice = ta.AdultPrice,
            ChildPrice = ta.ChildPrice,
            Surcharge = ta.Surcharge,
            TotalAdultPrice = ta.TotalAdultPrice,
            TotalChildPrice = ta.TotalChildPrice,
            TripTime = ta.TripTime,
            Note = ta.Note,
            CreatedAt = ta.CreatedAt,
            UpdatedAt = ta.UpdatedAt
        };
    }
}
