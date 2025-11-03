using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using Entities.Models;
using Entities.Enums;
using System.Text;
using System.Security.Claims;
using System.Text.Json;
using TouriMate.Services;
using Microsoft.AspNetCore.Authorization;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/bookings")]
public class BookingController : ControllerBase
{
    private readonly TouriMateDbContext _context;
    private readonly ILogger<BookingController> _logger;
    private readonly IRefundService _refundService;

    public BookingController(TouriMateDbContext context, ILogger<BookingController> logger, IRefundService refundService)
    {
        _context = context;
        _logger = logger;
        _refundService = refundService;
    }

    /// <summary>
    /// Create a new booking
    /// </summary>
    /// <param name="request">Booking creation request</param>
    /// <returns>Booking number</returns>
    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
    {
        try
        {
            // Get current user ID (you may need to adjust this based on your auth implementation)
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized("User not authenticated");
            }

            // Validate tour availability
            var tourAvailability = await _context.TourAvailabilities
                .Include(ta => ta.Tour)
                .FirstOrDefaultAsync(ta => ta.Id == request.TourAvailabilityId);

            if (tourAvailability == null)
            {
                return BadRequest("Tour availability not found");
            }

            // Validate future date (booking only allowed for dates strictly after today)
            var startOfTodayUtc = DateTime.UtcNow.Date;
            if (tourAvailability.Date.Date <= startOfTodayUtc)
            {
                return BadRequest("Tour date is not available for booking");
            }

            // Validate that the user is not trying to book their own tour
            if (tourAvailability.Tour.TourGuideId == userId.Value)
            {
                return BadRequest("You cannot book a tour that you created");
            }

            if (!tourAvailability.IsAvailable)
            {
                return BadRequest("Tour availability is not available");
            }

            if (tourAvailability.BookedParticipants + request.AdultCount + request.ChildCount > tourAvailability.MaxParticipants)
            {
                return BadRequest("Not enough available spots");
            }

            // Generate booking number
            var bookingNumber = GenerateBookingNumber();

            // Calculate total amount
            var totalAmount = (tourAvailability.AdultPrice * request.AdultCount) + 
                             (tourAvailability.ChildPrice * request.ChildCount);

            // Create booking
            var booking = new Booking
            {
                BookingNumber = bookingNumber,
                TourId = request.TourId,
                TourAvailabilityId = request.TourAvailabilityId,
                CustomerId = userId.Value,
                TourDate = DateOnly.FromDateTime(tourAvailability.Date),
                AdultCount = request.AdultCount,
                ChildCount = request.ChildCount,
                TotalAmount = totalAmount,
                Currency = "VND",
                Status = BookingStatus.PendingPayment,
                PaymentStatus = PaymentStatus.Pending,
                SpecialRequests = request.SpecialRequests,
                ContactInfo = System.Text.Json.JsonSerializer.Serialize(new
                {
                    Name = request.ContactName,
                    Email = request.ContactEmail,
                    Phone = request.ContactPhone
                }),
                CreatedBy = userId
            };

            _context.Bookings.Add(booking);

            // Create corresponding Transaction for the booking
            var transaction = new Transaction
            {
                TransactionId = bookingNumber, // Use booking number as transaction ID
                UserId = userId.Value,
                Type = "booking_payment",
                EntityId = booking.Id,
                EntityType = "Booking",
                Amount = totalAmount,
                Currency = "VND",
                Status = "pending",
                TransactionDirection = "in", // Money coming in from customer
                PaymentMethod = "Bank Transfer",
                PaymentGateway = "SePay",
                Description = $"Booking payment for tour: {tourAvailability.Tour.Title}",
                CreatedBy = userId,
                UpdatedBy = userId
            };

            _context.Transactions.Add(transaction);

            // Update tour availability booked participants
            tourAvailability.BookedParticipants += request.AdultCount + request.ChildCount;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Booking and Transaction created successfully: {BookingNumber}", bookingNumber);

            return Ok(new { bookingNumber });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating booking");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get booking by booking number
    /// </summary>
    /// <param name="bookingNumber">Booking number</param>
    /// <returns>Booking details</returns>
    [HttpGet("{bookingNumber}")]
    public async Task<IActionResult> GetBooking(string bookingNumber)
    {
        try
        {
            var booking = await _context.Bookings
                .Include(b => b.Tour)
                .Include(b => b.TourAvailability)
                    .ThenInclude(ta => ta.DepartureDivision)
                .Include(b => b.Customer)
                .FirstOrDefaultAsync(b => b.BookingNumber == bookingNumber);

            if (booking == null)
            {
                return NotFound("Booking not found");
            }

            // Return DTO to avoid circular references
            var bookingDto = new
            {
                booking.Id,
                booking.BookingNumber,
                Status = booking.Status.ToString(),
                booking.TotalAmount,
                booking.AdultCount,
                booking.ChildCount,
                ContactInfo = booking.ContactInfo,
                booking.SpecialRequests,
                booking.CreatedAt,
                Tour = new
                {
                    booking.Tour.Id,
                    booking.Tour.Title,
                    booking.Tour.Images,
                    booking.Tour.Location
                },
                TourAvailability = new
                {
                    booking.TourAvailability.Id,
                    booking.TourAvailability.Date,
                    booking.TourAvailability.AdultPrice,
                    booking.TourAvailability.ChildPrice,
                    DeparturePoint = booking.TourAvailability.DepartureDivision?.Name,
                    booking.TourAvailability.Vehicle,
                    booking.TourAvailability.TripTime
                }
            };

            return Ok(bookingDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting booking: {BookingNumber}", bookingNumber);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get user's bookings
    /// </summary>
    /// <returns>List of user's bookings</returns>
    [HttpGet("user")]
    public async Task<IActionResult> GetUserBookings()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized("User not authenticated");
            }

            var bookings = await _context.Bookings
                .Include(b => b.Tour)
                .Include(b => b.TourAvailability)
                    .ThenInclude(ta => ta.DepartureDivision)
                .Where(b => b.CustomerId == userId.Value)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();

            var bookingDtos = bookings.Select(b => new
            {
                b.Id,
                b.BookingNumber,
                Status = b.Status.ToString(),
                b.TotalAmount,
                b.AdultCount,
                b.ChildCount,
                ContactInfo = b.ContactInfo,
                b.SpecialRequests,
                b.CreatedAt,
                Tour = new
                {
                    b.Tour.Id,
                    b.Tour.Title,
                    b.Tour.Images,
                    b.Tour.Location
                },
                TourAvailability = new
                {
                    b.TourAvailability.Id,
                    b.TourAvailability.Date,
                    b.TourAvailability.AdultPrice,
                    b.TourAvailability.ChildPrice,
                    DeparturePoint = b.TourAvailability.DepartureDivision?.Name,
                    b.TourAvailability.Vehicle,
                    b.TourAvailability.TripTime
                }
            }).ToList();

            return Ok(bookingDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user bookings");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Update an existing booking
    /// </summary>
    /// <param name="bookingId">Booking ID</param>
    /// <param name="request">Booking update request</param>
    /// <returns>Updated booking number</returns>
    [HttpPut("{bookingId}")]
    public async Task<IActionResult> UpdateBooking(Guid bookingId, [FromBody] CreateBookingRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized("User not authenticated");
            }

            // Find existing booking
            var existingBooking = await _context.Bookings
                .Include(b => b.TourAvailability)
                .FirstOrDefaultAsync(b => b.Id == bookingId && b.CustomerId == userId.Value);

            if (existingBooking == null)
            {
                return NotFound("Không tìm thấy tour đã đặt");
            }

            if (existingBooking.Status == BookingStatus.Cancelled)
            {
                return BadRequest("Không thể cập nhật tour đã hủy");
            }

            if (existingBooking.Status == BookingStatus.Completed)
            {
                return BadRequest("Không thể cập nhật tour đã hoàn thành");
            }

            // Validate new tour availability
            var tourAvailability = await _context.TourAvailabilities
                .Include(ta => ta.Tour)
                .FirstOrDefaultAsync(ta => ta.Id == request.TourAvailabilityId);

            if (tourAvailability == null)
            {
                return BadRequest("Không tìm thấy lịch trình");
            }

            // Validate future date (booking only allowed for dates strictly after today)
            var startOfTodayUtc = DateTime.UtcNow.Date;
            if (tourAvailability.Date.Date <= startOfTodayUtc)
            {
                return BadRequest("Ngày khởi hành không còn khả dụng");
            }

            // Validate that the user is not trying to book their own tour
            if (tourAvailability.Tour.TourGuideId == userId.Value)
            {
                return BadRequest("You cannot book a tour that you created");
            }

            if (!tourAvailability.IsAvailable)
            {
                return BadRequest("Lịch trình không khả dụng");
            }   

            // Calculate available spots (excluding current booking)
            var currentBookingParticipants = existingBooking.Participants;
            var availableSpots = tourAvailability.MaxParticipants - (tourAvailability.BookedParticipants - currentBookingParticipants);

            if (request.AdultCount + request.ChildCount > availableSpots)
            {
                return BadRequest("Không đủ chỗ trống");
            }

            // Update booking
            existingBooking.TourId = request.TourId;
            existingBooking.TourAvailabilityId = request.TourAvailabilityId;
            existingBooking.AdultCount = request.AdultCount;
            existingBooking.ChildCount = request.ChildCount;
            existingBooking.ContactInfo = JsonSerializer.Serialize(new
            {
                Name = request.ContactName,
                Email = request.ContactEmail,
                Phone = request.ContactPhone
            });
            existingBooking.SpecialRequests = request.SpecialRequests;
            existingBooking.TotalAmount = request.TotalAmount;
            existingBooking.TourDate = DateOnly.FromDateTime(tourAvailability.Date);
            existingBooking.UpdatedAt = DateTime.UtcNow;

            // Update tour availability booked participants
            if (existingBooking.TourAvailabilityId != request.TourAvailabilityId)
            {
                // Remove from old availability
                existingBooking.TourAvailability.BookedParticipants -= currentBookingParticipants;
                
                // Add to new availability
                tourAvailability.BookedParticipants += request.AdultCount + request.ChildCount;
            }
            else
            {
                // Same availability, just update the count
                var participantDifference = (request.AdultCount + request.ChildCount) - currentBookingParticipants;
                tourAvailability.BookedParticipants += participantDifference;
            }

            await _context.SaveChangesAsync();

            return Ok(new { bookingNumber = existingBooking.BookingNumber });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating booking: {BookingId}", bookingId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Update booking status (Admin or owning TourGuide only)
    /// </summary>
    [HttpPut("{bookingId}/status")]
    [Authorize]
    public async Task<IActionResult> UpdateBookingStatus(Guid bookingId, [FromBody] StatusUpdateRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized("User not authenticated");
            }

            var booking = await _context.Bookings
                .Include(b => b.Tour)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
            {
                return NotFound("Không tìm thấy tour đã đặt");
            }

            // Role checks: Admin can update; TourGuide can update only if owns the tour
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            var isAdmin = user?.Role == UserRole.Admin;
            var isTourGuideOwner = user?.Role == UserRole.TourGuide && booking.Tour.TourGuideId == userId.Value;

            if (!isAdmin && !isTourGuideOwner)
            {
                return Forbid("Not allowed to update this booking");
            }

            if (!Enum.TryParse<BookingStatus>(request.Status, true, out var newStatus))
            {
                return BadRequest("Invalid status");
            }

            // Enforce workflow: PendingPayment -> Confirmed -> Completed; allow Cancelled anytime
            var current = booking.Status;
            var valid = (newStatus == BookingStatus.Cancelled)
                        || (current == BookingStatus.PendingPayment && newStatus == BookingStatus.Confirmed)
                        || (current == BookingStatus.Confirmed && newStatus == BookingStatus.Completed);

            if (!valid)
            {
                return BadRequest("Invalid status transition");
            }

            booking.Status = newStatus;
            booking.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật trạng thái thành công" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating booking status {BookingId}", bookingId);
            return StatusCode(500, "Internal server error");
        }
    }


    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return userId;
        }
        return null;
    }

    private string GenerateBookingNumber()
    {
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var random = new Random().Next(1000, 9999);
        return $"TK{timestamp}{random}";
    }

    /// <summary>
    /// Calculate refund amount for a booking cancellation
    /// </summary>
    /// <param name="bookingId">Booking ID</param>
    /// <param name="cancellationReason">Reason for cancellation</param>
    /// <returns>Refund calculation result</returns>
    [HttpPost("{bookingId}/calculate-refund")]
    public async Task<IActionResult> CalculateRefund(Guid bookingId, [FromBody] CancellationRequest request)
    {
        try
        {
            var result = await _refundService.CalculateRefundAsync(bookingId, request.CancellationReason);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating refund for booking {BookingId}", bookingId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Cancel a booking with refund processing
    /// </summary>
    /// <param name="bookingId">Booking ID</param>
    /// <param name="request">Cancellation request</param>
    /// <returns>Success result</returns>
    [HttpPut("{bookingId}/cancel")]
    public async Task<IActionResult> CancelBooking(Guid bookingId, [FromBody] CancellationRequest request)
    {
        try
        {
            var success = await _refundService.CancelBookingAsync(
                bookingId, 
                request.CancellationReason, 
                request.RefundBankCode,
                request.RefundBankName, 
                request.RefundBankAccount, 
                request.RefundAccountName
            );

            if (success)
            {
                return Ok(new { message = "Booking cancelled successfully" });
            }
            else
            {
                return BadRequest("Failed to cancel booking");
            }
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling booking {BookingId}", bookingId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get all bookings for admin management
    /// </summary>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Page size</param>
    /// <param name="status">Filter by status</param>
    /// <param name="search">Search term</param>
    /// <param name="tourId">Filter by tour ID</param>
    /// <param name="dateFrom">Filter from date</param>
    /// <param name="dateTo">Filter to date</param>
    /// <returns>List of bookings</returns>
    [HttpGet("admin")]
    public async Task<IActionResult> GetBookingsForAdmin(
        int page = 1, 
        int pageSize = 20, 
        string? status = null,
        string? search = null,
        Guid? tourId = null,
        DateTime? dateFrom = null,
        DateTime? dateTo = null)
    {
        try
        {
            var query = _context.Bookings
                .Include(b => b.Tour)
                .Include(b => b.TourAvailability)
                .Include(b => b.Customer)
                .AsQueryable();

            // Filter by status
            if (!string.IsNullOrEmpty(status) && Enum.TryParse<BookingStatus>(status, true, out var bookingStatus))
            {
                query = query.Where(b => b.Status == bookingStatus);
            }

            // Filter by tour
            if (tourId.HasValue)
            {
                query = query.Where(b => b.TourId == tourId.Value);
            }

            // Filter by date range
            if (dateFrom.HasValue)
            {
                query = query.Where(b => b.TourAvailability.Date >= dateFrom.Value);
            }
            if (dateTo.HasValue)
            {
                query = query.Where(b => b.TourAvailability.Date <= dateTo.Value);
            }

            // Search functionality
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(b => 
                    b.BookingNumber.Contains(search) ||
                    b.Tour.Title.Contains(search) ||
                    b.Customer.FirstName.Contains(search) ||
                    b.Customer.LastName.Contains(search) ||
                    b.Customer.Email.Contains(search));
            }

            var totalCount = await query.CountAsync();

            var bookings = await query
                .OrderByDescending(b => b.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new
                {
                    b.Id,
                    b.BookingNumber,
                    b.Status,
                    b.PaymentStatus,
                    b.TotalAmount,
                    b.Participants,
                    b.ContactInfo,
                    b.SpecialRequests,
                    b.CreatedAt,
                    b.UpdatedAt,
                    Tour = new
                    {
                        b.Tour.Id,
                        b.Tour.Title,
                        b.Tour.TourGuideId
                    },
                    TourAvailability = new
                    {
                        b.TourAvailability.Id,
                        b.TourAvailability.Date,
                        b.TourAvailability.AdultPrice,
                        b.TourAvailability.MaxParticipants,
                        b.TourAvailability.BookedParticipants
                    },
                    Customer = new
                    {
                        b.Customer.Id,
                        b.Customer.FirstName,
                        b.Customer.LastName,
                        b.Customer.Email
                    }
                })
                .ToListAsync();

            return Ok(new
            {
                bookings,
                pagination = new
                {
                    page,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting bookings for admin");
            return StatusCode(500, "Internal server error");
        }
    }


    /// <summary>
    /// Get bookings for tour guide (only their own tours)
    /// </summary>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Page size</param>
    /// <param name="status">Filter by status</param>
    /// <param name="search">Search term</param>
    /// <returns>List of bookings for tour guide's tours</returns>
    [HttpGet("tour-guide")]
    public async Task<IActionResult> GetBookingsForTourGuide(
        int page = 1, 
        int pageSize = 20, 
        string? status = null,
        string? search = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized("User not authenticated");
            }

            // Check if user is tour guide
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null || user.Role != UserRole.TourGuide)
            {
                return Forbid("Only tour guides can access this endpoint");
            }

            var query = _context.Bookings
                .Include(b => b.Tour)
                .Include(b => b.TourAvailability)
                .Include(b => b.Customer)
                .Where(b => b.Tour.TourGuideId == userId.Value) // Only bookings for tour guide's tours
                .AsQueryable();

            // Filter by status
            if (!string.IsNullOrEmpty(status) && Enum.TryParse<BookingStatus>(status, true, out var bookingStatus))
            {
                query = query.Where(b => b.Status == bookingStatus);
            }

            // Search functionality
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(b => 
                    b.BookingNumber.Contains(search) ||
                    b.Tour.Title.Contains(search) ||
                    b.Customer.FirstName.Contains(search) ||
                    b.Customer.LastName.Contains(search) ||
                    b.Customer.Email.Contains(search));
            }

            var totalCount = await query.CountAsync();

            var bookings = await query
                .OrderByDescending(b => b.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new
                {
                    b.Id,
                    b.BookingNumber,
                    b.Status,
                    b.PaymentStatus,
                    b.TotalAmount,
                    b.Participants,
                    b.ContactInfo,
                    b.SpecialRequests,
                    b.CreatedAt,
                    b.UpdatedAt,
                    Tour = new
                    {
                        b.Tour.Id,
                        b.Tour.Title,
                        b.Tour.TourGuideId
                    },
                    TourAvailability = new
                    {
                        b.TourAvailability.Id,
                        b.TourAvailability.Date,
                        b.TourAvailability.AdultPrice,
                        b.TourAvailability.MaxParticipants,
                        b.TourAvailability.BookedParticipants
                    },
                    Customer = new
                    {
                        b.Customer.Id,
                        b.Customer.FirstName,
                        b.Customer.LastName,
                        b.Customer.Email
                    }
                })
                .ToListAsync();

            return Ok(new
            {
                bookings,
                pagination = new
                {
                    page,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting bookings for tour guide");
            return StatusCode(500, "Internal server error");
        }
    }
}

public class CreateBookingRequest
{
    public Guid TourId { get; set; }
    public Guid TourAvailabilityId { get; set; }
    public int AdultCount { get; set; }
    public int ChildCount { get; set; }
    public string ContactName { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string? SpecialRequests { get; set; }
    public decimal TotalAmount { get; set; }
}

public class StatusUpdateRequest
{
    public string Status { get; set; } = string.Empty;
}

public class CancellationRequest
{
    public string CancellationReason { get; set; } = string.Empty;
    public string? RefundBankCode { get; set; }
    public string? RefundBankName { get; set; }
    public string? RefundBankAccount { get; set; }
    public string? RefundAccountName { get; set; }
}
