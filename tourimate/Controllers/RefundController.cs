using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using TouriMate.Services;
using System.Security.Claims;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class RefundController : ControllerBase
{
    private readonly TouriMateDbContext _context;
    private readonly IRefundService _refundService;
    private readonly ILogger<RefundController> _logger;

    public RefundController(
        TouriMateDbContext context,
        IRefundService refundService,
        ILogger<RefundController> logger)
    {
        _context = context;
        _refundService = refundService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetRefunds(
        int page = 1,
        int pageSize = 20,
        string? status = null,
        DateTime? dateFrom = null,
        DateTime? dateTo = null,
        string? search = null)
    {
        try
        {
            var query = _context.Refunds
                .Include(r => r.Booking)
                    .ThenInclude(b => b.Tour)
                .Include(r => r.Booking)
                    .ThenInclude(b => b.Customer)
                .Include(r => r.Booking)
                    .ThenInclude(b => b.TourAvailability)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.RefundStatus == status);
            }

            if (dateFrom.HasValue)
            {
                query = query.Where(r => r.CreatedAt >= dateFrom.Value);
            }

            if (dateTo.HasValue)
            {
                query = query.Where(r => r.CreatedAt <= dateTo.Value);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(r =>
                    r.Booking.BookingNumber.Contains(search) ||
                    r.Booking.Customer.FirstName.Contains(search) ||
                    r.Booking.Customer.LastName.Contains(search) ||
                    r.Booking.Tour.Title.Contains(search) ||
                    (r.RefundReference != null && r.RefundReference.Contains(search))
                );
            }

            var totalCount = await query.CountAsync();
            var totalRefundAmount = await query.SumAsync(r => r.RefundAmount);
            var totalOriginalAmount = await query.SumAsync(r => r.OriginalAmount);

            var refunds = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.Id,
                    r.RefundAmount,
                    r.OriginalAmount,
                    r.RefundPercentage,
                    r.RefundStatus,
                    r.Currency,
                    r.RefundReason,
                    r.RefundReference,
                    r.RefundBankName,
                    r.RefundBankAccount,
                    r.RefundAccountName,
                    r.RefundNotes,
                    r.DaysBeforeTour,
                    r.RefundProcessedAt,
                    r.RefundCompletedAt,
                    r.CreatedAt,
                    r.UpdatedAt,
                    Booking = new
                    {
                        r.Booking.Id,
                        r.Booking.BookingNumber,
                        r.Booking.TotalAmount,
                        r.Booking.Status,
                        r.Booking.CancellationReason,
                        r.Booking.CancelledAt,
                        Tour = new
                        {
                            r.Booking.Tour.Id,
                            r.Booking.Tour.Title,
                            r.Booking.Tour.TourGuideId
                        },
                        TourAvailability = new
                        {
                            r.Booking.TourAvailability.Date
                        },
                        Customer = new
                        {
                            r.Booking.Customer.Id,
                            r.Booking.Customer.FirstName,
                            r.Booking.Customer.LastName,
                            r.Booking.Customer.Email,
                            r.Booking.Customer.PhoneNumber
                        }
                    }
                })
                .ToListAsync();

            return Ok(new
            {
                refunds,
                summary = new
                {
                    totalRefundAmount,
                    totalOriginalAmount,
                    totalCount,
                    averageRefundAmount = totalCount > 0 ? totalRefundAmount / totalCount : 0
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
            _logger.LogError(ex, "Error getting refunds");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{refundId}")]
    public async Task<IActionResult> GetRefundById(Guid refundId)
    {
        try
        {
            var refund = await _context.Refunds
                .Include(r => r.Booking)
                    .ThenInclude(b => b.Tour)
                .Include(r => r.Booking)
                    .ThenInclude(b => b.Customer)
                .Include(r => r.Booking)
                    .ThenInclude(b => b.TourAvailability)
                .Where(r => r.Id == refundId)
                .Select(r => new
                {
                    r.Id,
                    r.RefundAmount,
                    r.OriginalAmount,
                    r.RefundPercentage,
                    r.RefundStatus,
                    r.Currency,
                    r.RefundReason,
                    r.RefundReference,
                    r.RefundBankName,
                    r.RefundBankAccount,
                    r.RefundAccountName,
                    r.RefundNotes,
                    r.DaysBeforeTour,
                    r.RefundProcessedAt,
                    r.RefundCompletedAt,
                    r.CreatedAt,
                    r.UpdatedAt,
                    Booking = new
                    {
                        r.Booking.Id,
                        r.Booking.BookingNumber,
                        r.Booking.TotalAmount,
                        r.Booking.Status,
                        r.Booking.CancellationReason,
                        r.Booking.CancelledAt,
                        Tour = new
                        {
                            r.Booking.Tour.Id,
                            r.Booking.Tour.Title,
                            r.Booking.Tour.TourGuideId
                        },
                        TourAvailability = new
                        {
                            r.Booking.TourAvailability.Date
                        },
                        Customer = new
                        {
                            r.Booking.Customer.Id,
                            r.Booking.Customer.FirstName,
                            r.Booking.Customer.LastName,
                            r.Booking.Customer.Email,
                            r.Booking.Customer.PhoneNumber
                        }
                    }
                })
                .FirstOrDefaultAsync();

            if (refund == null)
            {
                return NotFound("Refund not found");
            }

            return Ok(refund);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting refund {RefundId}", refundId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{refundId}/status")]
    public async Task<IActionResult> UpdateRefundStatus(
        Guid refundId,
        [FromBody] UpdateRefundStatusRequest request)
    {
        try
        {
            var refund = await _context.Refunds.FindAsync(refundId);
            if (refund == null)
            {
                return NotFound("Refund not found");
            }

            var validStatuses = new[] { "Pending", "Processing", "Completed", "Failed", "Cancelled" };
            if (!validStatuses.Contains(request.Status))
            {
                return BadRequest("Invalid status");
            }

            refund.RefundStatus = request.Status;
            
            if (request.Status == "Processing" && refund.RefundProcessedAt == null)
            {
                refund.RefundProcessedAt = DateTime.UtcNow;
            }

            if (request.Status == "Completed" && refund.RefundCompletedAt == null)
            {
                refund.RefundCompletedAt = DateTime.UtcNow;
            }

            if (!string.IsNullOrEmpty(request.RefundReference))
            {
                refund.RefundReference = request.RefundReference;
            }

            if (!string.IsNullOrEmpty(request.Notes))
            {
                refund.RefundNotes = string.IsNullOrEmpty(refund.RefundNotes)
                    ? request.Notes
                    : refund.RefundNotes + "\n" + request.Notes;
            }

            refund.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Refund {RefundId} status updated to {Status}", refundId, request.Status);

            return Ok(new { message = "Refund status updated successfully", refund });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating refund status for {RefundId}", refundId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("statistics")]
    public async Task<IActionResult> GetRefundStatistics(
        DateTime? dateFrom = null,
        DateTime? dateTo = null)
    {
        try
        {
            var query = _context.Refunds.AsQueryable();

            if (dateFrom.HasValue)
            {
                query = query.Where(r => r.CreatedAt >= dateFrom.Value);
            }

            if (dateTo.HasValue)
            {
                query = query.Where(r => r.CreatedAt <= dateTo.Value);
            }

            var refunds = await query.ToListAsync();

            var totalRefundAmount = refunds.Sum(r => r.RefundAmount);
            var totalOriginalAmount = refunds.Sum(r => r.OriginalAmount);
            var totalRefunds = refunds.Count;

            // Refunds by status
            var refundsByStatus = refunds
                .GroupBy(r => r.RefundStatus)
                .Select(g => new
                {
                    status = g.Key,
                    count = g.Count(),
                    totalAmount = g.Sum(r => r.RefundAmount)
                })
                .ToList();

            // Refunds by month
            var refundsByMonth = refunds
                .GroupBy(r => new { r.CreatedAt.Year, r.CreatedAt.Month })
                .Select(g => new
                {
                    year = g.Key.Year,
                    month = g.Key.Month,
                    count = g.Count(),
                    totalAmount = g.Sum(r => r.RefundAmount),
                    monthName = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy")
                })
                .OrderBy(x => x.year)
                .ThenBy(x => x.month)
                .ToList();

            // Refunds by percentage tier
            var refundsByPercentage = refunds
                .GroupBy(r => r.RefundPercentage)
                .Select(g => new
                {
                    percentage = g.Key,
                    count = g.Count(),
                    totalAmount = g.Sum(r => r.RefundAmount)
                })
                .OrderByDescending(x => x.percentage)
                .ToList();

            return Ok(new
            {
                totalRefundAmount,
                totalOriginalAmount,
                totalRefunds,
                averageRefundAmount = totalRefunds > 0 ? totalRefundAmount / totalRefunds : 0,
                averageRefundPercentage = totalRefunds > 0 ? refunds.Average(r => r.RefundPercentage) : 0,
                refundsByStatus,
                refundsByMonth,
                refundsByPercentage
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting refund statistics");
            return StatusCode(500, "Internal server error");
        }
    }
}

public class UpdateRefundStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? RefundReference { get; set; }
    public string? Notes { get; set; }
}
