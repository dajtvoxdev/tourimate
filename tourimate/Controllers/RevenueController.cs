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
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userGuid))
            {
                return Unauthorized("User not authenticated");
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // For TourGuide: Revenue = Paid Cost records where they are recipient
            if (userRole == "TourGuide")
            {
                var costQuery = _context.Costs
                    .Include(c => c.Payer)
                    .Include(c => c.Recipient)
                    .Where(c => c.RecipientId == userGuid && c.Type == Entities.Models.CostType.TourGuidePayment);

                // Apply filters
                if (dateFrom.HasValue)
                {
                    costQuery = costQuery.Where(c => c.CreatedAt >= dateFrom.Value);
                }

                if (dateTo.HasValue)
                {
                    costQuery = costQuery.Where(c => c.CreatedAt <= dateTo.Value);
                }

                if (!string.IsNullOrEmpty(paymentStatus))
                {
                    if (paymentStatus.ToLower() == "paid")
                    {
                        costQuery = costQuery.Where(c => c.Status == Entities.Models.CostStatus.Paid);
                    }
                    else if (paymentStatus.ToLower() == "pending")
                    {
                        costQuery = costQuery.Where(c => c.Status == Entities.Models.CostStatus.Pending);
                    }
                }

                var totalCount = await costQuery.CountAsync();
                var totalRevenue = await costQuery
                    .Where(c => c.Status == Entities.Models.CostStatus.Paid)
                    .SumAsync(c => (decimal?)c.Amount) ?? 0;

                var revenues = await costQuery
                    .OrderByDescending(c => c.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(c => new
                    {
                        Id = c.Id,
                        BookingNumber = c.CostCode,
                        TotalAmount = c.Amount,
                        PaymentStatus = c.Status == Entities.Models.CostStatus.Paid ? PaymentStatus.Paid : PaymentStatus.Pending,
                        Status = (int)BookingStatus.Confirmed,
                        CreatedAt = c.CreatedAt,
                        UpdatedAt = c.UpdatedAt,
                        Tour = new
                        {
                            Id = Guid.Empty,
                            Title = c.CostName,
                            TourGuideId = c.RecipientId
                        },
                        TourAvailability = new
                        {
                            Date = c.PaidDate ?? c.CreatedAt,
                            AdultPrice = 0m,
                            ChildPrice = 0m
                        },
                        Customer = new
                        {
                            Id = c.PayerId,
                            FirstName = c.Payer.FirstName,
                            LastName = c.Payer.LastName,
                            Email = c.Payer.Email
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

            // For Admin: Revenue = All paid bookings
            var query = _context.Bookings
                .Include(b => b.Tour)
                .Include(b => b.TourAvailability)
                .Include(b => b.Customer)
                .Where(b => b.PaymentStatus == PaymentStatus.Paid);

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

            var adminTotalCount = await query.CountAsync();
            var adminTotalRevenue = await query.SumAsync(b => b.TotalAmount);

            var adminRevenues = await query
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
                revenues = adminRevenues,
                summary = new
                {
                    totalRevenue = adminTotalRevenue,
                    totalBookings = adminTotalCount,
                    averageRevenue = adminTotalCount > 0 ? adminTotalRevenue / adminTotalCount : 0
                },
                pagination = new
                {
                    page,
                    pageSize,
                    totalCount = adminTotalCount,
                    totalPages = (int)Math.Ceiling((double)adminTotalCount / pageSize)
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
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userGuid))
            {
                return Unauthorized("User not authenticated");
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // For TourGuide: Statistics from Cost records
            if (userRole == "TourGuide")
            {
                var costQuery = _context.Costs
                    .Where(c => c.RecipientId == userGuid && c.Type == Entities.Models.CostType.TourGuidePayment);

                // Apply date filters
                if (dateFrom.HasValue)
                {
                    costQuery = costQuery.Where(c => c.CreatedAt >= dateFrom.Value);
                }

                if (dateTo.HasValue)
                {
                    costQuery = costQuery.Where(c => c.CreatedAt <= dateTo.Value);
                }

                var costs = await costQuery.ToListAsync();

                // Calculate statistics
                var totalRevenue = costs.Where(c => c.Status == Entities.Models.CostStatus.Paid).Sum(c => c.Amount);
                var totalPayments = costs.Count;

                // Revenue by month
                var revenueByMonth = costs
                    .Where(c => c.Status == Entities.Models.CostStatus.Paid)
                    .GroupBy(c => new { c.CreatedAt.Year, c.CreatedAt.Month })
                    .Select(g => new
                    {
                        year = g.Key.Year,
                        month = g.Key.Month,
                        revenue = g.Sum(c => c.Amount),
                        bookings = g.Count(),
                        monthName = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy")
                    })
                    .OrderBy(x => x.year)
                    .ThenBy(x => x.month)
                    .ToList();

                // Revenue by payment type (all are TourGuidePayment)
                var revenueByTour = costs
                    .Where(c => c.Status == Entities.Models.CostStatus.Paid)
                    .GroupBy(c => c.CostName)
                    .Select(g => new
                    {
                        tourId = Guid.Empty,
                        tourTitle = g.Key,
                        revenue = g.Sum(c => c.Amount),
                        bookings = g.Count()
                    })
                    .OrderByDescending(x => x.revenue)
                    .Take(10)
                    .ToList();

                // Revenue by status
                var revenueByStatus = costs
                    .GroupBy(c => c.Status)
                    .Select(g => new
                    {
                        status = g.Key == Entities.Models.CostStatus.Paid ? (int)BookingStatus.Confirmed : (int)BookingStatus.PendingPayment,
                        revenue = g.Sum(c => c.Amount),
                        bookings = g.Count()
                    })
                    .ToList();

                return Ok(new
                {
                    totalRevenue,
                    totalBookings = totalPayments,
                    averageRevenue = totalPayments > 0 ? totalRevenue / totalPayments : 0,
                    revenueByMonth,
                    revenueByTour,
                    revenueByStatus
                });
            }

            // For Admin: Statistics from Bookings
            var query = _context.Bookings
                .Include(b => b.Tour)
                .Where(b => b.PaymentStatus == PaymentStatus.Paid);

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
            var adminTotalRevenue = bookings.Sum(b => b.TotalAmount);
            var adminTotalBookings = bookings.Count;

            // Revenue by month (last 12 months)
            var adminRevenueByMonth = bookings
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
            var adminRevenueByTour = bookings
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
            var adminRevenueByStatus = bookings
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
                totalRevenue = adminTotalRevenue,
                totalBookings = adminTotalBookings,
                averageRevenue = adminTotalBookings > 0 ? adminTotalRevenue / adminTotalBookings : 0,
                revenueByMonth = adminRevenueByMonth,
                revenueByTour = adminRevenueByTour,
                revenueByStatus = adminRevenueByStatus
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
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userGuid))
            {
                return Unauthorized("User not authenticated");
            }

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

