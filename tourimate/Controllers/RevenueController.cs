using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using Entities.Enums;
using System.Security.Claims;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,TourGuide")]
public class RevenueController : ControllerBase
{
    private readonly TouriMateDbContext _context;
    private readonly ILogger<RevenueController> _logger;

    public RevenueController(TouriMateDbContext context, ILogger<RevenueController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetRevenue(
        int page = 1,
        int pageSize = 20,
        DateTime? dateFrom = null,
        DateTime? dateTo = null,
        string? tourId = null,
        string? paymentStatus = null)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not authenticated");
            }

            var userGuid = Guid.Parse(userId);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Base query for bookings with completed payments
            var query = _context.Bookings
                .Include(b => b.Tour)
                .Include(b => b.TourAvailability)
                .Include(b => b.Customer)
                .Where(b => b.PaymentStatus == PaymentStatus.Paid);

            // Filter by tour guide if not admin
            if (userRole != "Admin")
            {
                query = query.Where(b => b.Tour.TourGuideId == userGuid);
            }

            // Apply filters
            if (dateFrom.HasValue)
            {
                query = query.Where(b => b.CreatedAt >= dateFrom.Value);
            }

            if (dateTo.HasValue)
            {
                query = query.Where(b => b.CreatedAt <= dateTo.Value);
            }

            if (!string.IsNullOrEmpty(tourId) && Guid.TryParse(tourId, out var tourGuid))
            {
                query = query.Where(b => b.TourId == tourGuid);
            }

            if (!string.IsNullOrEmpty(paymentStatus) && Enum.TryParse<PaymentStatus>(paymentStatus, true, out var status))
            {
                query = query.Where(b => b.PaymentStatus == status);
            }

            var totalCount = await query.CountAsync();
            var totalRevenue = await query.SumAsync(b => b.TotalAmount);

            var revenues = await query
                .OrderByDescending(b => b.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new
                {
                    b.Id,
                    b.BookingNumber,
                    b.TotalAmount,
                    b.PaymentStatus,
                    b.Status,
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
                        b.TourAvailability.Date,
                        b.TourAvailability.AdultPrice,
                        b.TourAvailability.ChildPrice
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
                revenues,
                summary = new
                {
                    totalRevenue,
                    totalBookings = totalCount,
                    averageRevenue = totalCount > 0 ? totalRevenue / totalCount : 0
                },
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
            _logger.LogError(ex, "Error getting revenue data");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("statistics")]
    public async Task<IActionResult> GetRevenueStatistics(
        DateTime? dateFrom = null,
        DateTime? dateTo = null)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not authenticated");
            }

            var userGuid = Guid.Parse(userId);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Base query
            var query = _context.Bookings
                .Include(b => b.Tour)
                .Where(b => b.PaymentStatus == PaymentStatus.Paid);

            // Filter by tour guide if not admin
            if (userRole != "Admin")
            {
                query = query.Where(b => b.Tour.TourGuideId == userGuid);
            }

            // Apply date filters
            if (dateFrom.HasValue)
            {
                query = query.Where(b => b.CreatedAt >= dateFrom.Value);
            }

            if (dateTo.HasValue)
            {
                query = query.Where(b => b.CreatedAt <= dateTo.Value);
            }

            var bookings = await query.ToListAsync();

            // Calculate statistics
            var totalRevenue = bookings.Sum(b => b.TotalAmount);
            var totalBookings = bookings.Count;

            // Revenue by month (last 12 months)
            var revenueByMonth = bookings
                .GroupBy(b => new { b.CreatedAt.Year, b.CreatedAt.Month })
                .Select(g => new
                {
                    year = g.Key.Year,
                    month = g.Key.Month,
                    revenue = g.Sum(b => b.TotalAmount),
                    bookings = g.Count(),
                    monthName = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy")
                })
                .OrderBy(x => x.year)
                .ThenBy(x => x.month)
                .ToList();

            // Revenue by tour
            var revenueByTour = bookings
                .GroupBy(b => new { b.Tour.Id, b.Tour.Title })
                .Select(g => new
                {
                    tourId = g.Key.Id,
                    tourTitle = g.Key.Title,
                    revenue = g.Sum(b => b.TotalAmount),
                    bookings = g.Count()
                })
                .OrderByDescending(x => x.revenue)
                .Take(10)
                .ToList();

            // Revenue by status
            var revenueByStatus = bookings
                .GroupBy(b => b.Status)
                .Select(g => new
                {
                    status = g.Key,
                    revenue = g.Sum(b => b.TotalAmount),
                    bookings = g.Count()
                })
                .ToList();

            return Ok(new
            {
                totalRevenue,
                totalBookings,
                averageRevenue = totalBookings > 0 ? totalRevenue / totalBookings : 0,
                revenueByMonth,
                revenueByTour,
                revenueByStatus
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting revenue statistics");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportRevenue(
        DateTime? dateFrom = null,
        DateTime? dateTo = null)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not authenticated");
            }

            var userGuid = Guid.Parse(userId);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Base query
            var query = _context.Bookings
                .Include(b => b.Tour)
                .Include(b => b.TourAvailability)
                .Include(b => b.Customer)
                .Where(b => b.PaymentStatus == PaymentStatus.Paid);

            // Filter by tour guide if not admin
            if (userRole != "Admin")
            {
                query = query.Where(b => b.Tour.TourGuideId == userGuid);
            }

            // Apply date filters
            if (dateFrom.HasValue)
            {
                query = query.Where(b => b.CreatedAt >= dateFrom.Value);
            }

            if (dateTo.HasValue)
            {
                query = query.Where(b => b.CreatedAt <= dateTo.Value);
            }

            var revenues = await query
                .OrderByDescending(b => b.CreatedAt)
                .Select(b => new
                {
                    BookingNumber = b.BookingNumber,
                    TourTitle = b.Tour.Title,
                    CustomerName = $"{b.Customer.FirstName} {b.Customer.LastName}",
                    CustomerEmail = b.Customer.Email,
                    TourDate = b.TourAvailability.Date,
                    Amount = b.TotalAmount,
                    PaymentStatus = b.PaymentStatus.ToString(),
                    BookingStatus = b.Status.ToString(),
                    CreatedAt = b.CreatedAt
                })
                .ToListAsync();

            return Ok(revenues);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting revenue data");
            return StatusCode(500, "Internal server error");
        }
    }
}

