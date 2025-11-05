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

            // BASE: Use Revenue table
            IQueryable<Entities.Models.Revenue> baseRevenue = _context.Revenues
                .Include(r => r.Transaction);

            if (userRole == "TourGuide")
            {
                // Tour guide sees their earnings from bookings and orders (Tour, Product)
                baseRevenue = baseRevenue.Where(r => r.UserId == userGuid && (r.EntityType == "Tour" || r.EntityType == "Product"));
            }
            else
            {
                // Admin sees business revenues only: Tour, Product
                baseRevenue = baseRevenue.Where(r => r.EntityType == "Tour" || r.EntityType == "Product");
            }

            if (dateFrom.HasValue)
            {
                baseRevenue = baseRevenue.Where(r => r.CreatedAt >= dateFrom.Value);
            }
            if (dateTo.HasValue)
            {
                baseRevenue = baseRevenue.Where(r => r.CreatedAt <= dateTo.Value);
            }
            if (!string.IsNullOrEmpty(paymentStatus))
            {
                var ps = paymentStatus.ToLower();
                baseRevenue = baseRevenue.Where(r => r.PayoutStatus.ToLower() == ps);
            }

            var totalCount = await baseRevenue.CountAsync();
            // Admin: sum GrossAmount (100%). TourGuide: sum NetAmount (their take-home)
            var totalRevenue = userRole == "TourGuide"
                ? (await baseRevenue.SumAsync(r => (decimal?)r.NetAmount) ?? 0m)
                : (await baseRevenue.SumAsync(r => (decimal?)r.GrossAmount) ?? 0m);
            // Separate counts by Revenue EntityType (Tour = bookings, Product = orders)
            var totalBookingsCount = await baseRevenue.CountAsync(r => r.EntityType == "Tour");
            var totalOrdersCount = await baseRevenue.CountAsync(r => r.EntityType == "Product");

            var pageRows = await baseRevenue
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.Id,
                    r.TransactionId,
                    r.EntityId,
                    r.EntityType,
                    r.GrossAmount,
                    r.CommissionRate,
                    r.CommissionAmount,
                    r.NetAmount,
                    r.Currency,
                    r.PayoutStatus,
                    r.PayoutDate,
                    r.CreatedAt,
                    r.UpdatedAt,
                    TxType = r.Transaction.Type,
                    TxStatus = r.Transaction.Status,
                    TxEntityId = r.Transaction.EntityId,
                    TxEntityType = r.Transaction.EntityType,
                    TxDescription = r.Transaction.Description
                })
                .ToListAsync();

            // Enrich with Booking/Order for admin display context
            var bookingIds = pageRows
                .Where(x => x.TxEntityType == "Booking" && x.TxEntityId.HasValue)
                .Select(x => x.TxEntityId!.Value)
                .Distinct()
                .ToList();
            var orderIds = pageRows
                .Where(x => x.TxEntityType == "Order" && x.TxEntityId.HasValue)
                .Select(x => x.TxEntityId!.Value)
                .Distinct()
                .ToList();

            var bookings = await _context.Bookings
                .Include(b => b.Tour)
                .Include(b => b.TourAvailability)
                .Include(b => b.Customer)
                .Where(b => bookingIds.Contains(b.Id))
                .Select(b => new {
                    b.Id,
                    b.BookingNumber,
                    b.TotalAmount,
                    b.PaymentStatus,
                    b.Status,
                    b.CreatedAt,
                    b.UpdatedAt,
                    Tour = new { b.Tour.Id, b.Tour.Title, b.Tour.TourGuideId },
                    TourAvailability = new { b.TourAvailability.Date, b.TourAvailability.AdultPrice, b.TourAvailability.ChildPrice },
                    Customer = new { b.Customer.Id, b.Customer.FirstName, b.Customer.LastName, b.Customer.Email }
                })
                .ToListAsync();
            var bookingDict = bookings.ToDictionary(b => b.Id, b => b);

            var orders = await _context.Orders
                .Include(o => o.Customer)
                .Where(o => orderIds.Contains(o.Id))
                .Select(o => new {
                    o.Id,
                    o.OrderNumber,
                    o.TotalAmount,
                    o.PaymentStatus,
                    o.Status,
                    o.CreatedAt,
                    o.UpdatedAt,
                    Customer = new { o.Customer.Id, o.Customer.FirstName, o.Customer.LastName, o.Customer.Email }
                })
                .ToListAsync();
            var orderDict = orders.ToDictionary(o => o.Id, o => o);

            var enriched = pageRows.Select(r => new
            {
                r.Id,
                r.TransactionId,
                r.EntityId,
                Kind = r.EntityType, // Tour | Product (Platform derived from payout status if needed)
                r.GrossAmount,
                r.CommissionRate,
                r.CommissionAmount,
                r.NetAmount,
                // Admin revenue is GrossAmount (100%), NetAmount is for tour guide payouts
                RevenueAmount = userRole == "Admin" ? r.GrossAmount : r.NetAmount,
                r.Currency,
                r.PayoutStatus,
                r.PayoutDate,
                r.CreatedAt,
                r.UpdatedAt,
                Transaction = new { Type = r.TxType, Status = r.TxStatus, EntityId = r.TxEntityId, EntityType = r.TxEntityType, Description = r.TxDescription },
                Booking = (r.TxEntityType == "Booking" && r.TxEntityId.HasValue && bookingDict.ContainsKey(r.TxEntityId.Value)) ? bookingDict[r.TxEntityId.Value] : null,
                Order = (r.TxEntityType == "Order" && r.TxEntityId.HasValue && orderDict.ContainsKey(r.TxEntityId.Value)) ? orderDict[r.TxEntityId.Value] : null
            });

            return Ok(new
            {
                revenues = enriched,
                summary = new
                {
                    totalRevenue,
                    totalBookings = totalBookingsCount,
                    totalOrders = totalOrdersCount,
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

            // Unused branch now handled above by revenue table
            var query = _context.Bookings.Where(b => false);

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

            // Orders (products) with Paid status
            var orderQuery = _context.Orders
                .Include(o => o.Customer)
                .Where(o => o.PaymentStatus == PaymentStatus.Paid);

            if (dateFrom.HasValue)
            {
                orderQuery = orderQuery.Where(o => o.CreatedAt >= dateFrom.Value);
            }

            if (dateTo.HasValue)
            {
                orderQuery = orderQuery.Where(o => o.CreatedAt <= dateTo.Value);
            }

            var adminTotalCount = 0;
            var adminTotalRevenue = 0m;

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

            // Also include recent orders page slice (aligned to page, basic union pagination)
            var adminOrders = await orderQuery
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new
                {
                    Id = o.Id,
                    BookingNumber = o.OrderNumber,
                    TotalAmount = o.TotalAmount,
                    PaymentStatus = o.PaymentStatus,
                    Status = o.Status,
                    CreatedAt = o.CreatedAt,
                    UpdatedAt = o.UpdatedAt,
                    Tour = (object?)null,
                    TourAvailability = (object?)null,
                    Customer = new
                    {
                        o.Customer.Id,
                        o.Customer.FirstName,
                        o.Customer.LastName,
                        o.Customer.Email
                    }
                })
                .ToListAsync();

            return Ok(new
            {
                revenues = Array.Empty<object>(),
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

            IQueryable<Entities.Models.Revenue> rbase = _context.Revenues;
            if (userRole == "TourGuide")
            {
                // Tour guide stats: only their earnings from Tour/Product revenues
                rbase = rbase.Where(r => r.UserId == userGuid && (r.EntityType == "Tour" || r.EntityType == "Product"));
            }
            if (dateFrom.HasValue) rbase = rbase.Where(r => r.CreatedAt >= dateFrom.Value);
            if (dateTo.HasValue) rbase = rbase.Where(r => r.CreatedAt <= dateTo.Value);

            var list = await rbase.ToListAsync();
            var totalRevenue = list.Sum(r => r.NetAmount);
            var totalPayments = list.Count;

            var revenueByMonth = list
                .GroupBy(r => new { r.CreatedAt.Year, r.CreatedAt.Month })
                .Select(g => new
                {
                    year = g.Key.Year,
                    month = g.Key.Month,
                    revenue = g.Sum(r => r.NetAmount),
                    bookings = g.Count(),
                    monthName = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy")
                })
                .OrderBy(x => x.year).ThenBy(x => x.month)
                .ToList();

            // Revenue by entity (supplemental view)
            var revenueByEntity = list
                .GroupBy(r => new { r.EntityType, r.EntityId })
                .Select(g => new
                {
                    entityType = g.Key.EntityType,
                    entityId = g.Key.EntityId,
                    revenue = g.Sum(r => r.NetAmount),
                    count = g.Count()
                })
                .OrderByDescending(x => x.revenue)
                .Take(10)
                .ToList();

            // Revenue by payout status
            var revenueByStatus = list
                .GroupBy(r => r.PayoutStatus)
                .Select(g => new
                {
                    status = g.Key,
                    revenue = g.Sum(r => r.NetAmount),
                    bookings = g.Count()
                })
                .ToList();

            return Ok(new
            {
                totalRevenue,
                totalBookings = totalPayments,
                averageRevenue = totalPayments > 0 ? totalRevenue / totalPayments : 0,
                revenueByMonth,
                revenueByTour = revenueByEntity,
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

