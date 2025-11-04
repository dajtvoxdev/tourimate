using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using Entities.Models;
using Entities.Enums;
using TouriMate.Services;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentRequestController : ControllerBase
{
    private readonly TouriMateDbContext _context;
    private readonly ICommissionService _commissionService;
    private readonly ILogger<PaymentRequestController> _logger;

    public PaymentRequestController(
        TouriMateDbContext context, 
        ICommissionService commissionService,
        ILogger<PaymentRequestController> logger)
    {
        _context = context;
        _commissionService = commissionService;
        _logger = logger;
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return string.IsNullOrEmpty(userIdClaim) ? null : Guid.Parse(userIdClaim);
    }

    /// <summary>
    /// Get payment requests for tour guide (their own requests)
    /// </summary>
    [HttpGet("tour-guide")]
    [Authorize]
    public async Task<IActionResult> GetTourGuidePaymentRequests(
        int page = 1,
        int pageSize = 20,
        string? status = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null || user.Role != UserRole.TourGuide)
            {
                return Forbid("Only tour guides can access this endpoint");
            }

            var query = _context.Costs
                .Include(c => c.Payer)
                .Where(c => c.RecipientId == userId.Value && c.Type == CostType.TourGuidePayment)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<CostStatus>(status, true, out var costStatus))
            {
                query = query.Where(c => c.Status == costStatus);
            }

            var totalCount = await query.CountAsync();

            var paymentRequests = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new
                {
                    c.Id,
                    c.CostCode,
                    c.CostName,
                    c.Description,
                    c.Amount,
                    c.Currency,
                    c.Status,
                    c.DueDate,
                    c.PaidDate,
                    c.PaymentMethod,
                    c.ReferenceNumber,
                    c.CreatedAt,
                    c.UpdatedAt,
                    PayerName = c.Payer.FirstName + " " + c.Payer.LastName,
                    RelatedBooking = c.RelatedEntityType == "Booking" ? new
                    {
                        Id = c.RelatedEntityId,
                        BookingNumber = c.ReferenceNumber
                    } : null
                })
                .ToListAsync();

            return Ok(new
            {
                paymentRequests,
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
            _logger.LogError(ex, "Error getting tour guide payment requests");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get payment requests for admin (all pending requests)
    /// </summary>
    [HttpGet("admin")]
    [Authorize]
    public async Task<IActionResult> GetAdminPaymentRequests(
        int page = 1,
        int pageSize = 20,
        string? status = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null || user.Role != UserRole.Admin)
            {
                return Forbid("Only admins can access this endpoint");
            }

            var query = _context.Costs
                .Include(c => c.Recipient)
                .Where(c => c.Type == CostType.TourGuidePayment)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<CostStatus>(status, true, out var costStatus))
            {
                query = query.Where(c => c.Status == costStatus);
            }

            var totalCount = await query.CountAsync();

            var paymentRequests = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new
                {
                    c.Id,
                    c.CostCode,
                    c.CostName,
                    c.Description,
                    c.Amount,
                    c.Currency,
                    c.Status,
                    c.DueDate,
                    c.PaidDate,
                    c.PaymentMethod,
                    c.ReferenceNumber,
                    c.CreatedAt,
                    c.UpdatedAt,
                    RecipientName = c.Recipient.FirstName + " " + c.Recipient.LastName,
                    RelatedBooking = c.RelatedEntityType == "Booking" ? new
                    {
                        Id = c.RelatedEntityId,
                        BookingNumber = c.ReferenceNumber
                    } : null
                })
                .ToListAsync();

            return Ok(new
            {
                paymentRequests,
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
            _logger.LogError(ex, "Error getting admin payment requests");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Create payment request for completed tour (Tour Guide)
    /// </summary>
    [HttpPost("create")]
    [Authorize]
    public async Task<IActionResult> CreatePaymentRequest([FromBody] CreatePaymentRequestDto request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null || user.Role != UserRole.TourGuide)
            {
                return Forbid("Only tour guides can create payment requests");
            }

            if (request.OrderId.HasValue && request.OrderId != Guid.Empty)
            {
                var costOrder = await _commissionService.CreateTourGuideOrderPaymentRequestAsync(request.OrderId.Value, userId.Value);
                return Ok(new
                {
                    message = "Payment request created successfully",
                    costId = costOrder.Id,
                    amount = costOrder.Amount,
                    status = costOrder.Status.ToString()
                });
            }

            var cost = await _commissionService.CreateTourGuidePaymentRequestAsync(request.BookingId, userId.Value);

            return Ok(new
            {
                message = "Payment request created successfully",
                costId = cost.Id,
                amount = cost.Amount,
                status = cost.Status.ToString()
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating payment request");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Process payment request (Admin)
    /// </summary>
    [HttpPost("{costId}/process")]
    [Authorize]
    public async Task<IActionResult> ProcessPaymentRequest(Guid costId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null || user.Role != UserRole.Admin)
            {
                return Forbid("Only admins can process payment requests");
            }

            var success = await _commissionService.ProcessTourGuidePaymentAsync(costId, userId.Value);

            if (success)
            {
                return Ok(new { message = "Payment processed successfully" });
            }
            else
            {
                return BadRequest("Failed to process payment");
            }
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing payment request {CostId}", costId);
            return StatusCode(500, "Internal server error");
        }
    }
}

public class CreatePaymentRequestDto
{
    public Guid BookingId { get; set; }
    public Guid? OrderId { get; set; }
}
