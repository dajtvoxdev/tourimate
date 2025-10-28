using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using Entities.Models;
using Entities.Enums;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using TouriMate.Services;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/transactions")]
public class TransactionController : ControllerBase
{
    private readonly TouriMateDbContext _context;
    private readonly ILogger<TransactionController> _logger;
    private readonly IEmailService _emailService;

    public TransactionController(TouriMateDbContext context, ILogger<TransactionController> logger, IEmailService emailService)
    {
        _context = context;
        _logger = logger;
        _emailService = emailService;
    }

    /// <summary>
    /// Get all transactions with filtering and pagination
    /// </summary>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Page size</param>
    /// <param name="status">Filter by status</param>
    /// <param name="type">Filter by type (Booking, Order)</param>
    /// <param name="search">Search term</param>
    /// <returns>List of transactions</returns>
    [HttpGet]
    public async Task<IActionResult> GetTransactions(
        int page = 1,
        int pageSize = 20,
        string? status = null,
        string? type = null,
        string? search = null)
    {
        try
        {
            var transactions = new List<object>();
            var totalCount = 0;

            // Get bookings
            var bookingQuery = _context.Bookings
                .Include(b => b.Tour)
                .Include(b => b.TourAvailability)
                .Include(b => b.Customer)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<BookingStatus>(status, true, out var bookingStatus))
            {
                bookingQuery = bookingQuery.Where(b => b.Status == bookingStatus);
            }

            if (!string.IsNullOrEmpty(search))
            {
                bookingQuery = bookingQuery.Where(b =>
                    b.BookingNumber.Contains(search) ||
                    b.Tour.Title.Contains(search) ||
                    b.Customer.FirstName.Contains(search) ||
                    b.Customer.LastName.Contains(search) ||
                    b.Customer.Email.Contains(search));
            }

            if (string.IsNullOrEmpty(type) || type.ToLower() == "booking")
            {
                var bookingCount = await bookingQuery.CountAsync();
                totalCount += bookingCount;

                var bookings = await bookingQuery
                    .OrderByDescending(b => b.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(b => new
                    {
                        Id = b.Id,
                        TransactionNumber = b.BookingNumber,
                        Type = "Booking",
                        Status = b.Status.ToString(),
                        Amount = b.TotalAmount,
                        CustomerName = b.Customer.FirstName + " " + b.Customer.LastName,
                        CustomerEmail = b.Customer.Email,
                        TourTitle = b.Tour.Title,
                        TourDate = b.TourAvailability.Date,
                        Participants = b.Participants,
                        CreatedAt = b.CreatedAt,
                        UpdatedAt = b.UpdatedAt,
                        PaymentStatus = b.PaymentStatus.ToString(),
                        ContactInfo = b.ContactInfo
                    })
                    .ToListAsync();

                transactions.AddRange(bookings);
            }

            // Get orders
            if (string.IsNullOrEmpty(type) || type.ToLower() == "order")
            {
                var orderQuery = _context.Orders
                    .Include(o => o.Customer)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var orderStatus))
                {
                    orderQuery = orderQuery.Where(o => o.Status == orderStatus);
                }

                if (!string.IsNullOrEmpty(search))
                {
                    orderQuery = orderQuery.Where(o =>
                        o.OrderNumber.Contains(search) ||
                        o.Customer.FirstName.Contains(search) ||
                        o.Customer.LastName.Contains(search) ||
                        o.Customer.Email.Contains(search));
                }

                var orderCount = await orderQuery.CountAsync();
                totalCount += orderCount;

                var orders = await orderQuery
                    .OrderByDescending(o => o.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(o => new
                    {
                        Id = o.Id,
                        TransactionNumber = o.OrderNumber,
                        Type = "Order",
                        Status = o.Status.ToString(),
                        Amount = o.TotalAmount,
                        CustomerName = o.Customer.FirstName + " " + o.Customer.LastName,
                        CustomerEmail = o.Customer.Email,
                        TourTitle = (string?)null,
                        TourDate = (DateOnly?)null,
                        Participants = (int?)null,
                        CreatedAt = o.CreatedAt,
                        UpdatedAt = o.UpdatedAt,
                        PaymentStatus = o.PaymentStatus.ToString(),
                        ContactInfo = (string?)null
                    })
                    .ToListAsync();

                transactions.AddRange(orders);
            }

            // Sort combined results by creation date
            var sortedTransactions = transactions
                .OrderByDescending(t => ((dynamic)t).CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return Ok(new
            {
                transactions = sortedTransactions,
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
            _logger.LogError(ex, "Error getting transactions");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get transaction statistics
    /// </summary>
    /// <returns>Transaction statistics</returns>
    [HttpGet("statistics")]
    public async Task<IActionResult> GetTransactionStatistics()
    {
        try
        {
            var bookingStats = await _context.Bookings
                .GroupBy(b => b.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            var orderStats = await _context.Orders
                .GroupBy(o => o.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            var paymentStats = await _context.Bookings
                .GroupBy(b => b.PaymentStatus)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            var orderPaymentStats = await _context.Orders
                .GroupBy(o => o.PaymentStatus)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            var totalRevenue = await _context.Bookings
                .Where(b => b.Status == BookingStatus.Completed)
                .SumAsync(b => b.TotalAmount) +
                await _context.Orders
                .Where(o => o.Status == OrderStatus.Delivered)
                .SumAsync(o => o.TotalAmount);

            var pendingRevenue = await _context.Bookings
                .Where(b => b.Status == BookingStatus.PendingPayment)
                .SumAsync(b => b.TotalAmount) +
                await _context.Orders
                .Where(o => o.Status == OrderStatus.PendingPayment)
                .SumAsync(o => o.TotalAmount);

            return Ok(new
            {
                bookingStats,
                orderStats,
                paymentStats,
                orderPaymentStats,
                totalRevenue,
                pendingRevenue
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting transaction statistics");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get transactions for tour guide (only their own tours)
    /// </summary>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Page size</param>
    /// <param name="status">Filter by status</param>
    /// <param name="type">Filter by type (Booking, Order)</param>
    /// <param name="search">Search term</param>
    /// <returns>List of transactions for tour guide's tours</returns>
    [HttpGet("tour-guide")]
    public async Task<IActionResult> GetTransactionsForTourGuide(
        int page = 1,
        int pageSize = 20,
        string? status = null,
        string? type = null,
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

            var transactions = new List<object>();
            var totalCount = 0;

            // Get bookings for tour guide's tours only
            var bookingQuery = _context.Bookings
                .Include(b => b.Tour)
                .Include(b => b.TourAvailability)
                .Include(b => b.Customer)
                .Where(b => b.Tour.TourGuideId == userId.Value) // Only bookings for tour guide's tours
                .AsQueryable();

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<BookingStatus>(status, true, out var bookingStatus))
            {
                bookingQuery = bookingQuery.Where(b => b.Status == bookingStatus);
            }

            if (!string.IsNullOrEmpty(search))
            {
                bookingQuery = bookingQuery.Where(b =>
                    b.BookingNumber.Contains(search) ||
                    b.Tour.Title.Contains(search) ||
                    b.Customer.FirstName.Contains(search) ||
                    b.Customer.LastName.Contains(search) ||
                    b.Customer.Email.Contains(search));
            }

            if (string.IsNullOrEmpty(type) || type.ToLower() == "booking")
            {
                var bookingCount = await bookingQuery.CountAsync();
                totalCount += bookingCount;

                var bookings = await bookingQuery
                    .OrderByDescending(b => b.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(b => new
                    {
                        Id = b.Id,
                        TransactionNumber = b.BookingNumber,
                        Type = "Booking",
                        Status = b.Status.ToString(),
                        Amount = b.TotalAmount,
                        CustomerName = b.Customer.FirstName + " " + b.Customer.LastName,
                        CustomerEmail = b.Customer.Email,
                        TourTitle = b.Tour.Title,
                        TourDate = b.TourAvailability.Date,
                        Participants = b.Participants,
                        CreatedAt = b.CreatedAt,
                        UpdatedAt = b.UpdatedAt,
                        PaymentStatus = b.PaymentStatus.ToString(),
                        ContactInfo = b.ContactInfo
                    })
                    .ToListAsync();

                transactions.AddRange(bookings);
            }

            // Note: Orders are not filtered by tour guide since they're not tour-specific
            // Tour guides can only see bookings for their tours

            // Sort combined results by creation date
            var sortedTransactions = transactions
                .OrderByDescending(t => ((dynamic)t).CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return Ok(new
            {
                transactions = sortedTransactions,
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
            _logger.LogError(ex, "Error getting transactions for tour guide");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Update transaction status
    /// </summary>

    /// <summary>
    /// Manually approve a SePay transaction and apply booking/order updates
    /// </summary>
    [HttpPost("sepay/{sepayTransactionId}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ApproveSePayTransaction(int sepayTransactionId)
    {
        try
        {
            var sepay = await _context.SePayTransactions
                .FirstOrDefaultAsync(t => t.SePayTransactionId == sepayTransactionId);

            if (sepay == null)
                return NotFound("SePay transaction not found");

            // Determine linked entity
            if (sepay.EntityType == "Booking" && sepay.EntityId.HasValue)
            {
                var booking = await _context.Bookings
                    .Include(b => b.Customer)
                    .Include(b => b.Tour)
                    .Include(b => b.TourAvailability)
                    .FirstOrDefaultAsync(b => b.Id == sepay.EntityId.Value);

                if (booking == null)
                    return NotFound("Linked booking not found");

                // Mark booking confirmed if not already
                if (booking.Status != BookingStatus.Confirmed)
                {
                    booking.Status = BookingStatus.Confirmed;
                    booking.UpdatedAt = DateTime.UtcNow;
                }

                // Ensure Transaction exists (idempotent by GatewayTransactionId)
                var tx = await _context.Transactions
                    .FirstOrDefaultAsync(t => t.GatewayTransactionId == sepay.SePayTransactionId.ToString());

                if (tx == null)
                {
                    tx = new Transaction
                    {
                        TransactionId = $"SEPAY_{sepay.SePayTransactionId}",
                        UserId = booking.CustomerId,
                        Type = "booking_payment",
                        EntityId = booking.Id,
                        EntityType = "Booking",
                        Amount = sepay.TransferAmount,
                        Currency = "VND",
                        Status = "completed",
                        PaymentMethod = "Bank Transfer",
                        PaymentGateway = "SePay",
                        GatewayTransactionId = sepay.SePayTransactionId.ToString(),
                        GatewayResponse = JsonSerializer.Serialize(new { ManualApproved = true }),
                        Description = $"Booking payment (manual approve) - {sepay.Gateway}"
                    };
                    _context.Transactions.Add(tx);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    tx.Status = "completed";
                    tx.UpdatedAt = DateTime.UtcNow;
                }

                // Ensure Revenue exists for this transaction
                var revenue = await _context.Revenues
                    .FirstOrDefaultAsync(r => r.TransactionId == tx.Id);

                if (revenue == null && booking.Tour?.TourGuideId != null)
                {
                    var commissionRate = 0.15m;
                    var grossAmount = tx.Amount;
                    var commissionAmount = Math.Round(grossAmount * commissionRate, 2);
                    var netAmount = Math.Round(grossAmount - commissionAmount, 2);

                    revenue = new Revenue
                    {
                        TransactionId = tx.Id,
                        UserId = booking.Tour.TourGuideId,
                        EntityId = booking.TourId,
                        EntityType = "Tour",
                        GrossAmount = grossAmount,
                        CommissionRate = commissionRate,
                        CommissionAmount = commissionAmount,
                        NetAmount = netAmount,
                        Currency = tx.Currency,
                        PayoutStatus = "pending"
                    };
                    _context.Revenues.Add(revenue);
                }

                // Mark SePay transaction processed
                sepay.ProcessingStatus = "processed";
                sepay.ProcessingNotes = "Manually approved by admin";
                sepay.ProcessedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Try sending confirmation email
                try
                {
                    var contactEmail = string.Empty;
                    var contactName = booking.Customer?.FirstName ?? "Khách hàng";
                    try
                    {
                        if (!string.IsNullOrEmpty(booking.ContactInfo))
                        {
                            var info = JsonSerializer.Deserialize<JsonElement>(booking.ContactInfo);
                            if (info.TryGetProperty("Email", out var emailProp)) contactEmail = emailProp.GetString() ?? string.Empty;
                            if (info.TryGetProperty("Name", out var nameProp)) contactName = nameProp.GetString() ?? contactName;
                        }
                    }
                    catch { }

                    if (string.IsNullOrWhiteSpace(contactEmail))
                        contactEmail = booking.Customer?.Email ?? string.Empty;

                    if (!string.IsNullOrWhiteSpace(contactEmail) && booking.Tour != null)
                    {
                        await _emailService.SendBookingConfirmationEmailAsync(
                            contactEmail,
                            contactName,
                            booking.BookingNumber,
                            booking.Tour.Title,
                            booking.TourAvailability?.Date ?? DateTime.UtcNow,
                            tx.Amount
                        );
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send confirmation email on manual approve for {Booking}", booking.Id);
                }

                return Ok(new { message = "Approved successfully" });
            }
            else if (sepay.EntityType == "Order" && sepay.EntityId.HasValue)
            {
                // For orders: mark as paid/processing and create transaction
                var order = await _context.Orders
                    .Include(o => o.Customer)
                    .FirstOrDefaultAsync(o => o.Id == sepay.EntityId.Value);

                if (order == null)
                    return NotFound("Linked order not found");

                if (order.PaymentStatus != PaymentStatus.Paid)
                {
                    order.PaymentStatus = PaymentStatus.Paid;
                    order.Status = OrderStatus.Processing;
                    order.UpdatedAt = DateTime.UtcNow;
                }

                var tx = await _context.Transactions
                    .FirstOrDefaultAsync(t => t.GatewayTransactionId == sepay.SePayTransactionId.ToString());

                if (tx == null)
                {
                    tx = new Transaction
                    {
                        TransactionId = $"SEPAY_{sepay.SePayTransactionId}",
                        UserId = order.CustomerId,
                        Type = "order_payment",
                        EntityId = order.Id,
                        EntityType = "Order",
                        Amount = sepay.TransferAmount,
                        Currency = "VND",
                        Status = "completed",
                        PaymentMethod = "Bank Transfer",
                        PaymentGateway = "SePay",
                        GatewayTransactionId = sepay.SePayTransactionId.ToString(),
                        GatewayResponse = JsonSerializer.Serialize(new { ManualApproved = true }),
                        Description = $"Order payment (manual approve) - {sepay.Gateway}"
                    };
                    _context.Transactions.Add(tx);
                }
                else
                {
                    tx.Status = "completed";
                    tx.UpdatedAt = DateTime.UtcNow;
                }

                sepay.ProcessingStatus = "processed";
                sepay.ProcessingNotes = "Manually approved by admin";
                sepay.ProcessedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Approved successfully" });
            }

            return BadRequest("SePay transaction is not linked to a known entity");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving SePay transaction {Id}", sepayTransactionId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Manually reject a SePay transaction
    /// </summary>
    [HttpPost("sepay/{sepayTransactionId}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RejectSePayTransaction(int sepayTransactionId, [FromBody] string? reason)
    {
        try
        {
            var sepay = await _context.SePayTransactions
                .FirstOrDefaultAsync(t => t.SePayTransactionId == sepayTransactionId);

            if (sepay == null)
                return NotFound("SePay transaction not found");

            sepay.ProcessingStatus = "failed";
            sepay.ProcessingNotes = string.IsNullOrWhiteSpace(reason) ? "Manually rejected by admin" : reason;
            sepay.ProcessedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Rejected successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting SePay transaction {Id}", sepayTransactionId);
            return StatusCode(500, "Internal server error");
        }
    }
    /// <param name="transactionId">Transaction ID</param>
    /// <param name="type">Transaction type (Booking or Order)</param>
    /// <param name="request">Status update request</param>
    /// <returns>Success result</returns>
    [HttpPut("{transactionId}/status")]
    public async Task<IActionResult> UpdateTransactionStatus(
        Guid transactionId,
        [FromQuery] string type,
        [FromBody] UpdateTransactionStatusRequest request)
    {
        try
        {
            if (type.ToLower() == "booking")
            {
                var booking = await _context.Bookings.FindAsync(transactionId);
                if (booking == null)
                {
                    return NotFound("Booking not found");
                }

                if (Enum.TryParse<BookingStatus>(request.Status, true, out var bookingStatus))
                {
                    booking.Status = bookingStatus;
                    booking.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    return Ok(new { message = "Booking status updated successfully" });
                }
                else
                {
                    return BadRequest("Invalid booking status");
                }
            }
            else if (type.ToLower() == "order")
            {
                var order = await _context.Orders.FindAsync(transactionId);
                if (order == null)
                {
                    return NotFound("Order not found");
                }

                if (Enum.TryParse<OrderStatus>(request.Status, true, out var orderStatus))
                {
                    order.Status = orderStatus;
                    order.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    return Ok(new { message = "Order status updated successfully" });
                }
                else
                {
                    return BadRequest("Invalid order status");
                }
            }
            else
            {
                return BadRequest("Invalid transaction type");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating transaction status for {TransactionId}", transactionId);
            return StatusCode(500, "Internal server error");
        }
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("userId");
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return userId;
        }
        return null;
    }
}

public class UpdateTransactionStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
