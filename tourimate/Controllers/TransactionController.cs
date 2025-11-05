using Entities.Enums;
using Entities.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;
using TouriMate.Data;
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
    /// <param name="status">Filter by transaction status (pending, completed, failed, cancelled, refunded)</param>
    /// <param name="type">Filter by transaction type (booking_payment, order_payment, etc.)</param>
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
            // Query from Transactions table as primary source
            var query = _context.Transactions
                .Include(t => t.User)
                .AsQueryable();

            // Filter by transaction status (from Transaction model)
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(t => t.Status.ToLower() == status.ToLower());
            }

            // Filter by transaction type
            if (!string.IsNullOrEmpty(type))
            {
                if (type.ToLower() == "booking")
                {
                    query = query.Where(t => t.Type == "booking_payment" || t.EntityType == "Booking");
                }
                else if (type.ToLower() == "order")
                {
                    query = query.Where(t => t.Type == "order_payment" || t.EntityType == "Order");
                }
                else
                {
                    query = query.Where(t => t.Type.Contains(type, StringComparison.OrdinalIgnoreCase));
                }
            }

            // Search functionality
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(t =>
                    t.TransactionId.Contains(search) ||
                    t.User.FirstName.Contains(search) ||
                    t.User.LastName.Contains(search) ||
                    t.User.Email.Contains(search) ||
                    t.Description != null && t.Description.Contains(search));
            }

            var totalCount = await query.CountAsync();

            // Get transactions with related booking/order info
            var transactions = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new
                {
                    Id = t.Id,
                    TransactionId = t.TransactionId,
                    TransactionNumber = t.TransactionId, // Use TransactionId as transaction number
                    Type = t.Type,
                    EntityType = t.EntityType,
                    Status = t.Status, // Primary status from Transaction
                    Amount = t.Amount,
                    Currency = t.Currency,
                    CustomerName = t.User.FirstName + " " + t.User.LastName,
                    CustomerEmail = t.User.Email,
                    PaymentMethod = t.PaymentMethod,
                    PaymentGateway = t.PaymentGateway,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt,
                    Description = t.Description,
                    EntityId = t.EntityId,
                    // Related entity info (Booking or Order) - will be loaded separately if needed
                    BookingNumber = (string?)null,
                    OrderNumber = (string?)null,
                    TourTitle = (string?)null,
                    TourDate = (DateTime?)null,
                    Participants = (int?)null,
                    PaymentStatus = (string?)null, // From related entity
                    ContactInfo = (string?)null
                })
                .ToListAsync();

            // Load related booking/order info for display
            var transactionDtos = new List<object>();
            foreach (var tx in transactions)
            {
                string? bookingNumber = null;
                string? orderNumber = null;
                string? tourTitle = null;
                DateTime? tourDate = null;
                int? participants = null;
                string? paymentStatus = null;
                string? contactInfo = null;

                if (tx.EntityType == "Booking" && tx.EntityId.HasValue)
                {
                    var booking = await _context.Bookings
                        .Include(b => b.Tour)
                        .Include(b => b.TourAvailability)
                        .FirstOrDefaultAsync(b => b.Id == tx.EntityId.Value);
                    
                    if (booking != null)
                    {
                        bookingNumber = booking.BookingNumber;
                        tourTitle = booking.Tour?.Title;
                        tourDate = booking.TourAvailability?.Date;
                        participants = booking.Participants;
                        paymentStatus = booking.PaymentStatus.ToString();
                        contactInfo = booking.ContactInfo;
                    }
                }
                else if (tx.EntityType == "Order" && tx.EntityId.HasValue)
                {
                    var order = await _context.Orders
                        .FirstOrDefaultAsync(o => o.Id == tx.EntityId.Value);
                    
                    if (order != null)
                    {
                        orderNumber = order.OrderNumber;
                        paymentStatus = order.PaymentStatus.ToString();
                    }
                }

                transactionDtos.Add(new
                {
                    tx.Id,
                    tx.TransactionId,
                    TransactionNumber = tx.TransactionNumber,
                    Type = tx.Type,
                    EntityType = tx.EntityType,
                    Status = tx.Status, // Primary status
                    tx.Amount,
                    tx.Currency,
                    tx.CustomerName,
                    tx.CustomerEmail,
                    tx.PaymentMethod,
                    tx.PaymentGateway,
                    tx.CreatedAt,
                    tx.UpdatedAt,
                    tx.Description,
                    BookingNumber = bookingNumber,
                    OrderNumber = orderNumber,
                    TourTitle = tourTitle,
                    TourDate = tourDate,
                    Participants = participants,
                    PaymentStatus = paymentStatus, // From related entity
                    ContactInfo = contactInfo
                });
            }

            return Ok(new
            {
                transactions = transactionDtos,
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

            // Money flow based on Transactions table
            var totalIn = await _context.Transactions
                .Where(t => t.TransactionDirection == "in" && t.Status == "completed")
                .SumAsync(t => (decimal?)t.Amount) ?? 0m;
            var totalOut = await _context.Transactions
                .Where(t => t.TransactionDirection == "out" && t.Status == "completed")
                .SumAsync(t => (decimal?)t.Amount) ?? 0m;

            var totalInCount = await _context.Transactions
                .CountAsync(t => t.TransactionDirection == "in" && t.Status == "completed");
            var totalOutCount = await _context.Transactions
                .CountAsync(t => t.TransactionDirection == "out" && t.Status == "completed");

            return Ok(new
            {
                bookingStats,
                orderStats,
                paymentStats,
                orderPaymentStats,
                totalRevenue = totalIn - totalOut,
                pendingRevenue = 0m,
                totalIn,
                totalOut,
                totalInCount,
                totalOutCount
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting transaction statistics");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Test endpoint to verify authentication is working
    /// </summary>
    /// <returns>User ID and role if authenticated</returns>
    [HttpGet("test-auth")]
    [Authorize]
    public IActionResult TestAuth()
    {
        var userId = GetCurrentUserId();
        var userRole = User.FindFirst("role")?.Value;
        
        return Ok(new
        {
            message = "Authentication working",
            userId = userId?.ToString(),
            userRole = userRole,
            isAuthenticated = User.Identity?.IsAuthenticated ?? false
        });
    }

    /// <summary>
    /// Get transactions for tour guide (only their own tours and products)
    /// </summary>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Page size</param>
    /// <param name="status">Filter by transaction status</param>
    /// <param name="type">Filter by transaction type</param>
    /// <param name="search">Search term</param>
    /// <returns>List of transactions for tour guide's tours and products</returns>
    [HttpGet("tour-guide")]
    [Authorize]
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

            // Get transaction IDs for bookings of tour guide's tours
            var tourBookingIds = await _context.Bookings
                .Where(b => b.Tour.TourGuideId == userId.Value)
                .Select(b => b.Id)
                .ToListAsync();

            // Get transaction IDs for orders containing tour guide's products
            var productOrderIds = await _context.OrderItems
                .Where(oi => oi.Product.TourGuideId == userId.Value)
                .Select(oi => oi.OrderId)
                .Distinct()
                .ToListAsync();

            // Query Transactions table - filter by tour guide's bookings or orders
            var query = _context.Transactions
                .Include(t => t.User)
                .Where(t => 
                    (t.EntityType == "Booking" && t.EntityId.HasValue && tourBookingIds.Contains(t.EntityId.Value)) ||
                    (t.EntityType == "Order" && t.EntityId.HasValue && productOrderIds.Contains(t.EntityId.Value))
                )
                .AsQueryable();

            // Filter by transaction status (from Transaction model)
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(t => t.Status.ToLower() == status.ToLower());
            }

            // Filter by transaction type
            if (!string.IsNullOrEmpty(type))
            {
                if (type.ToLower() == "booking")
                {
                    query = query.Where(t => t.Type == "booking_payment" || t.EntityType == "Booking");
                }
                else if (type.ToLower() == "order")
                {
                    query = query.Where(t => t.Type == "order_payment" || t.EntityType == "Order");
                }
                else
                {
                    query = query.Where(t => t.Type.Contains(type, StringComparison.OrdinalIgnoreCase));
                }
            }

            // Search functionality
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(t =>
                    t.TransactionId.Contains(search) ||
                    t.User.FirstName.Contains(search) ||
                    t.User.LastName.Contains(search) ||
                    t.User.Email.Contains(search) ||
                    t.Description != null && t.Description.Contains(search));
            }

            var totalCount = await query.CountAsync();

            // Get transactions with related booking/order info
            var transactions = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new
                {
                    Id = t.Id,
                    TransactionId = t.TransactionId,
                    TransactionNumber = t.TransactionId,
                    Type = t.Type,
                    EntityType = t.EntityType,
                    Status = t.Status, // Primary status from Transaction
                    Amount = t.Amount,
                    Currency = t.Currency,
                    CustomerName = t.User.FirstName + " " + t.User.LastName,
                    CustomerEmail = t.User.Email,
                    PaymentMethod = t.PaymentMethod,
                    PaymentGateway = t.PaymentGateway,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt,
                    Description = t.Description,
                    EntityId = t.EntityId,
                    BookingNumber = (string?)null,
                    OrderNumber = (string?)null,
                    TourTitle = (string?)null,
                    TourDate = (DateTime?)null,
                    Participants = (int?)null,
                    PaymentStatus = (string?)null,
                    ContactInfo = (string?)null
                })
                .ToListAsync();

            // Load related booking/order info for display
            var transactionDtos = new List<object>();
            foreach (var tx in transactions)
            {
                string? bookingNumber = null;
                string? orderNumber = null;
                string? tourTitle = null;
                DateTime? tourDate = null;
                int? participants = null;
                string? paymentStatus = null;
                string? contactInfo = null;

                if (tx.EntityType == "Booking" && tx.EntityId.HasValue)
                {
                    var booking = await _context.Bookings
                        .Include(b => b.Tour)
                        .Include(b => b.TourAvailability)
                        .FirstOrDefaultAsync(b => b.Id == tx.EntityId.Value && b.Tour.TourGuideId == userId.Value);
                    
                    if (booking != null)
                    {
                        bookingNumber = booking.BookingNumber;
                        tourTitle = booking.Tour?.Title;
                        tourDate = booking.TourAvailability?.Date;
                        participants = booking.Participants;
                        paymentStatus = booking.PaymentStatus.ToString();
                        contactInfo = booking.ContactInfo;
                    }
                }
                else if (tx.EntityType == "Order" && tx.EntityId.HasValue)
                {
                    var order = await _context.Orders
                        .Include(o => o.Items)
                            .ThenInclude(item => item.Product)
                        .FirstOrDefaultAsync(o => o.Id == tx.EntityId.Value && 
                            o.Items.Any(item => item.Product.TourGuideId == userId.Value));
                    
                    if (order != null)
                    {
                        orderNumber = order.OrderNumber;
                        paymentStatus = order.PaymentStatus.ToString();
                    }
                }

                transactionDtos.Add(new
                {
                    tx.Id,
                    tx.TransactionId,
                    TransactionNumber = tx.TransactionNumber,
                    Type = tx.Type,
                    EntityType = tx.EntityType,
                    Status = tx.Status, // Primary status
                    tx.Amount,
                    tx.Currency,
                    tx.CustomerName,
                    tx.CustomerEmail,
                    tx.PaymentMethod,
                    tx.PaymentGateway,
                    tx.CreatedAt,
                    tx.UpdatedAt,
                    tx.Description,
                    BookingNumber = bookingNumber,
                    OrderNumber = orderNumber,
                    TourTitle = tourTitle,
                    TourDate = tourDate,
                    Participants = participants,
                    PaymentStatus = paymentStatus,
                    ContactInfo = contactInfo
                });
            }

            return Ok(new
            {
                transactions = transactionDtos,
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
    /// Get transaction statistics for tour guide (only their own tours)
    /// </summary>
    /// <returns>Transaction statistics for tour guide's tours</returns>
    [HttpGet("tour-guide/statistics")]
    [Authorize]
    public async Task<IActionResult> GetTransactionStatisticsForTourGuide()
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

            // Get booking stats for tour guide's tours only
            var bookingStats = await _context.Bookings
                .Where(b => b.Tour.TourGuideId == userId.Value)
                .GroupBy(b => b.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            // Orders are not tour-specific, so no order stats for tour guide
            var orderStats = new List<object>();

            // Get payment stats for tour guide's tours only
            var paymentStats = await _context.Bookings
                .Where(b => b.Tour.TourGuideId == userId.Value)
                .GroupBy(b => b.PaymentStatus)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            // Orders are not tour-specific, so no order payment stats for tour guide
            var orderPaymentStats = new List<object>();

            // Calculate revenue for tour guide's tours only
            var totalRevenue = await _context.Bookings
                .Where(b => b.Tour.TourGuideId == userId.Value && b.Status == BookingStatus.Completed)
                .SumAsync(b => b.TotalAmount);

            var pendingRevenue = await _context.Bookings
                .Where(b => b.Tour.TourGuideId == userId.Value && b.Status == BookingStatus.PendingPayment)
                .SumAsync(b => b.TotalAmount);

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
            _logger.LogError(ex, "Error getting transaction statistics for tour guide");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <param name="transactionId">Transaction ID (Guid)</param>
    /// <param name="request">Status update request</param>
    /// <returns>Success result</returns>
    [HttpPut("{transactionId}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateTransactionStatus(
        Guid transactionId,
        [FromBody] UpdateTransactionStatusRequest request)
    {
        try
        {
            // Update Transaction status (primary)
            var transaction = await _context.Transactions
                .FirstOrDefaultAsync(t => t.Id == transactionId);

            if (transaction == null)
            {
                return NotFound("Transaction not found");
            }

            // Validate status - Transaction status values: pending, completed, failed, cancelled, refunded
            var validStatuses = new[] { "pending", "completed", "failed", "cancelled", "refunded" };
            var newStatus = request.Status.ToLower();
            
            if (!validStatuses.Contains(newStatus))
            {
                return BadRequest($"Invalid transaction status. Valid values: {string.Join(", ", validStatuses)}");
            }

            // Update Transaction status
            transaction.Status = newStatus;
            transaction.UpdatedAt = DateTime.UtcNow;
            transaction.UpdatedBy = GetCurrentUserId();

            // Optionally update related Booking/Order status if needed
            if (transaction.EntityType == "Booking" && transaction.EntityId.HasValue)
            {
                var booking = await _context.Bookings
                    .Include(b => b.Tour)
                    .FirstOrDefaultAsync(b => b.Id == transaction.EntityId.Value);
                    
                if (booking != null)
                {
                    // Sync booking status if transaction is completed
                    if (newStatus == "completed" && booking.Status != BookingStatus.Confirmed)
                    {
                        booking.Status = BookingStatus.Confirmed;
                        booking.PaymentStatus = PaymentStatus.Paid;
                        booking.UpdatedAt = DateTime.UtcNow;

                        // Create Revenue records for tour guide and admin (similar to SePayService)
                        if (booking.Tour?.TourGuideId != null)
                        {
                            var existingRevenue = await _context.Revenues
                                .FirstOrDefaultAsync(r => r.TransactionId == transaction.Id);

                            if (existingRevenue == null)
                            {
                                // Use platform commission rate derived from TourGuide payout percentage in settings
                                var platformCommissionRate = await GetPlatformCommissionRateAsync();
                                var grossAmount = transaction.Amount; // Toàn bộ số tiền
                                var commissionAmount = Math.Round(grossAmount * platformCommissionRate, 2); // Phần hoa hồng (platform)

                                // Admin revenue: EntityType = "Tour" - nhận toàn bộ số tiền
                                var adminUserId = await _context.Users
                                    .Where(u => u.Role == UserRole.Admin)
                                    .Select(u => u.Id)
                                    .FirstOrDefaultAsync();

                                if (adminUserId != Guid.Empty)
                                {
                                    var adminRevenue = new Revenue
                                    {
                                        TransactionId = transaction.Id,
                                        UserId = adminUserId,
                        EntityId = booking.TourId,
                        EntityType = "Tour",
                                        GrossAmount = grossAmount, // Toàn bộ số tiền
                                        CommissionRate = 0,
                                        CommissionAmount = 0,
                                        NetAmount = grossAmount,
                                        Currency = transaction.Currency,
                        PayoutStatus = "pending"
                    };

                                    _context.Revenues.Add(adminRevenue);
                                }

                                // Tour guide revenue: EntityType = "Booking" - nhận NET (gross - commission)
                                var tourGuideRevenue = new Revenue
                                {
                                    TransactionId = transaction.Id,
                                    UserId = booking.Tour.TourGuideId,
                                    EntityId = booking.Id,
                                    EntityType = "Booking",
                        GrossAmount = grossAmount,
                                    CommissionRate = platformCommissionRate,
                        CommissionAmount = commissionAmount,
                                    NetAmount = Math.Round(grossAmount - commissionAmount, 2),
                                    Currency = transaction.Currency,
                        PayoutStatus = "pending"
                    };

                                _context.Revenues.Add(tourGuideRevenue);

                await _context.SaveChangesAsync();
                                _logger.LogInformation("Revenue records created for Booking transaction {TransactionId}", transaction.Id);
                            }
                        }
                    }
                    // Sync booking status if transaction is cancelled
                    else if (newStatus == "cancelled" && booking.Status != BookingStatus.Cancelled)
                    {
                        booking.Status = BookingStatus.Cancelled;
                        booking.UpdatedAt = DateTime.UtcNow;
                    }
                }
            }
            else if (transaction.EntityType == "Order" && transaction.EntityId.HasValue)
            {
                var order = await _context.Orders
                    .Include(o => o.Items)
                        .ThenInclude(item => item.Product)
                            .ThenInclude(p => p.TourGuide)
                    .FirstOrDefaultAsync(o => o.Id == transaction.EntityId.Value);
                    
                if (order != null)
                {
                    // Sync order status if transaction is completed
                    if (newStatus == "completed" && order.Status != OrderStatus.Processing)
                    {
                    order.Status = OrderStatus.Processing;
                            order.PaymentStatus = PaymentStatus.Paid;
                    order.UpdatedAt = DateTime.UtcNow;

                        // Create Revenue records for tour guides and admin (similar to SePayService)
                        if (order.Items.Any())
                        {
                            var existingRevenue = await _context.Revenues
                                .FirstOrDefaultAsync(r => r.TransactionId == transaction.Id);

                            if (existingRevenue == null)
                            {
                                // Group items by tour guide to create revenue records
                                var itemsByTourGuide = order.Items
                                    .Where(item => item.Product?.TourGuideId != null)
                                    .GroupBy(item => item.Product.TourGuideId)
                                    .Select(g => new
                                    {
                                        TourGuideId = g.Key,
                                        Items = g.ToList()
                                    })
                                    .ToList();
                                
                                // Use platform commission rate derived from TourGuide payout percentage in settings
                                var commissionRate = await GetPlatformCommissionRateAsync();
                                var totalOrderAmount = order.Items.Sum(item => item.Subtotal);

                                // Admin revenue: EntityType = "Product" - nhận toàn bộ số tiền của order
                                var adminUserId = await _context.Users
                                    .Where(u => u.Role == UserRole.Admin)
                                    .Select(u => u.Id)
                                    .FirstOrDefaultAsync();

                                if (adminUserId != Guid.Empty)
                                {
                                    // Group by product for admin revenue
                                    var productIds = order.Items
                                        .Select(item => item.ProductId)
                                        .Distinct()
                                        .ToList();

                                    foreach (var productId in productIds)
                                    {
                                        var productItems = order.Items
                                            .Where(item => item.ProductId == productId)
                                            .ToList();
                                        
                                        var productTotalAmount = productItems.Sum(item => item.Subtotal);

                                        var adminRevenue = new Revenue
                                        {
                                            TransactionId = transaction.Id,
                                            UserId = adminUserId,
                                            EntityId = productId,
                                            EntityType = "Product",
                                            GrossAmount = productTotalAmount, // Toàn bộ số tiền của product trong order
                                            CommissionRate = 0,
                                            CommissionAmount = 0,
                                            NetAmount = productTotalAmount,
                                            Currency = transaction.Currency,
                                            PayoutStatus = "pending"
                                        };

                                        _context.Revenues.Add(adminRevenue);
                                    }
                                }

                                // Create one revenue record per tour guide - nhận NET (gross - commission)
                                foreach (var group in itemsByTourGuide)
                                {
                                    var tourGuideId = group.TourGuideId;
                                    var tourGuideItems = group.Items;
                                    var tourGuideTotalAmount = tourGuideItems.Sum(item => item.Subtotal);
                                    var commissionAmount = Math.Round(tourGuideTotalAmount * commissionRate, 2);
                                    var netAmount = Math.Round(tourGuideTotalAmount - commissionAmount, 2);

                                    var revenue = new Revenue
                                    {
                                        TransactionId = transaction.Id,
                                        UserId = tourGuideId,
                                        EntityId = order.Id,
                                        EntityType = "Order",
                                        GrossAmount = tourGuideTotalAmount,
                                        CommissionRate = commissionRate,
                                        CommissionAmount = commissionAmount,
                                        NetAmount = netAmount,
                                        Currency = transaction.Currency,
                                        PayoutStatus = "pending"
                                    };

                                    _context.Revenues.Add(revenue);

                                    _logger.LogInformation("Revenue created for Order: OrderId={OrderId}, TourGuideId={TourGuideId}, NetAmount={NetAmount}",
                                        order.Id, tourGuideId, netAmount);
                                }

                                if (itemsByTourGuide.Any())
                                {
                                    await _context.SaveChangesAsync();
                                    _logger.LogInformation("Revenue records created for Order transaction {TransactionId}: TotalAmount={TotalAmount}", 
                                        transaction.Id, totalOrderAmount);
                                }
                            }
                        }
                    }
                    // Sync order status if transaction is cancelled
                    else if (newStatus == "cancelled" && order.Status != OrderStatus.Cancelled)
                    {
                        order.Status = OrderStatus.Cancelled;
                        order.UpdatedAt = DateTime.UtcNow;
                    }
                }
            }
            // Sync Cost status if this transaction is linked to a Cost record
            else if (transaction.EntityType == "Cost" && transaction.EntityId.HasValue)
            {
                var cost = await _context.Costs.FirstOrDefaultAsync(c => c.Id == transaction.EntityId.Value);
                if (cost != null)
                {
                    // Map transaction status -> cost status
                    // completed => Paid, cancelled => Cancelled, pending/failed => Pending (manual follow-up)
                    if (newStatus == "completed")
                    {
                        cost.Status = CostStatus.Paid;
                        cost.PaidDate = DateTime.UtcNow;
                    }
                    else if (newStatus == "cancelled")
                    {
                        cost.Status = CostStatus.Cancelled;
                    }
                    else if (newStatus == "pending" || newStatus == "failed")
                    {
                        cost.Status = CostStatus.Pending;
                    }
                    cost.UpdatedAt = DateTime.UtcNow;
                }
            }
            // Sync Refund status if this transaction is linked to a Refund record
            else if (transaction.EntityType == "Refund" && transaction.EntityId.HasValue)
            {
                var refund = await _context.Refunds.FirstOrDefaultAsync(r => r.Id == transaction.EntityId.Value);
                if (refund != null)
                {
                    // Map transaction status -> refund status
                    if (newStatus == "completed")
                    {
                        refund.RefundStatus = "Completed";
                        refund.RefundCompletedAt = DateTime.UtcNow;
                    }
                    else if (newStatus == "pending")
                    {
                        refund.RefundStatus = "Pending";
                    }
                    else if (newStatus == "failed")
                    {
                        refund.RefundStatus = "Failed";
                    }
                    else if (newStatus == "cancelled")
                    {
                        refund.RefundStatus = "Cancelled";
                    }
                    refund.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Transaction {TransactionId} status updated to {Status} by admin", transactionId, newStatus);
            
            return Ok(new { message = "Transaction status updated successfully", status = newStatus });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating transaction status for {TransactionId}", transactionId);
            return StatusCode(500, "Internal server error");
        }
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return string.IsNullOrEmpty(userIdClaim) ? null : Guid.Parse(userIdClaim);
    }

    // Platform commission rate = 1 - TourGuidePayoutPercentage
    private async Task<decimal> GetPlatformCommissionRateAsync()
    {
        try
        {
            var setting = await _context.SystemSettings
                .FirstOrDefaultAsync(s => s.Key == "TourGuideCommissionPercentage");

            decimal payoutPercentage;
            if (setting != null && decimal.TryParse(setting.Value, out var parsed))
            {
                payoutPercentage = parsed; // e.g., 80 means guide gets 80%
            }
            else
            {
                payoutPercentage = 80m; // default payout to guide if not configured
            }

            var platformRate = 1m - (payoutPercentage / 100m); // e.g., 20%
            if (platformRate < 0m) platformRate = 0m;
            if (platformRate > 1m) platformRate = 1m;
            return platformRate;
        }
        catch
        {
            return 0.20m; // fallback to 20%
        }
    }
}

public class UpdateTransactionStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
