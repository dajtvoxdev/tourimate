using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using Entities.Models;
using Entities.Enums;
using System.Text.Json;
using TouriMate.Contracts.Payment;
using Microsoft.AspNetCore.SignalR;
using tourimate.Services.Hubs;

namespace TouriMate.Services;

public interface ISePayService
{
    Task<SePayWebhookResponse> ProcessWebhookAsync(SePayWebhookRequest webhookData);
    Task<bool> ValidateWebhookAsync(SePayWebhookRequest webhookData);
    Task<string?> ExtractPaymentCodeAsync(string content, string? code);
}

public class SePayService : ISePayService
{
    private readonly TouriMateDbContext _db;
    private readonly ILogger<SePayService> _logger;
    private readonly IEmailService _emailService;
    private readonly IHubContext<PaymentHub> _paymentHub;
    private readonly IHubContext<TransactionHub> _transactionHub;

    public SePayService(
        TouriMateDbContext db, 
        ILogger<SePayService> logger, 
        IEmailService emailService,
        IHubContext<PaymentHub> paymentHub,
        IHubContext<TransactionHub> transactionHub)
    {
        _db = db;
        _logger = logger;
        _emailService = emailService;
        _paymentHub = paymentHub;
        _transactionHub = transactionHub;
    }

    public async Task<SePayWebhookResponse> ProcessWebhookAsync(SePayWebhookRequest webhookData)
    {
        try
        {
            _logger.LogInformation("Processing SePay webhook for transaction ID: {TransactionId}", webhookData.Id);

            // Only process money-in transactions
            if (webhookData.TransferType != "in")
            {
                _logger.LogInformation("Skipping money-out transaction: {TransactionId}", webhookData.Id);
                return new SePayWebhookResponse
                {
                    Success = true,
                    Message = "Money-out transaction skipped"
                };
            }

            // Extract payment code - prioritize Code field, fallback to Content
            string? paymentCode = null;
            
            if (!string.IsNullOrWhiteSpace(webhookData.Code))
            {
                // Use the Code field directly if available (most reliable)
                paymentCode = webhookData.Code.Trim().ToUpper();
                _logger.LogInformation("Using payment code from Code field: {PaymentCode}", paymentCode);
            }
            else
            {
                // Extract from Content field as fallback
                paymentCode = ExtractPaymentCode(webhookData.Content);
            }
            
            if (string.IsNullOrEmpty(paymentCode))
            {
                _logger.LogWarning("No payment code found in webhook. Code: {Code}, Content: {Content}", 
                    webhookData.Code, webhookData.Content);
                return new SePayWebhookResponse
                {
                    Success = false,
                    Message = "No payment code found"
                };
            }

            _logger.LogInformation("SePay webhook processing - PaymentCode: {PaymentCode}", paymentCode);

            // Find existing Transaction by payment code (booking number or order number)
            var existingTransaction = await _db.Transactions
                .FirstOrDefaultAsync(t => t.TransactionId == paymentCode);

            // Attempt to load related booking or order by payment code
            Booking? relatedBooking = null;
            Order? relatedOrder = null;
            
            if (existingTransaction != null)
            {
                _logger.LogInformation("Transaction found: {TransactionId}, Status: {Status}, EntityType: {EntityType}", 
                    existingTransaction.TransactionId, existingTransaction.Status, existingTransaction.EntityType);

                // Load related booking or order from existing transaction
                if (existingTransaction.EntityType == "Booking" && existingTransaction.EntityId.HasValue)
                {
                    relatedBooking = await _db.Bookings
                        .Include(b => b.Tour)
                        .Include(b => b.TourAvailability)
                        .Include(b => b.Customer)
                        .FirstOrDefaultAsync(b => b.Id == existingTransaction.EntityId.Value);
                }
                else if (existingTransaction.EntityType == "Order" && existingTransaction.EntityId.HasValue)
                {
                    relatedOrder = await _db.Orders
                        .Include(o => o.Customer)
                        .Include(o => o.Items)
                        .FirstOrDefaultAsync(o => o.Id == existingTransaction.EntityId.Value);
                }
            }
            else
            {
                // No transaction found - try to find the related booking or order by payment code
                _logger.LogInformation("No Transaction found for payment code: {PaymentCode}. Attempting to find related entity...", paymentCode);

                // Check if it's a booking number (starts with TK)
                if (paymentCode.StartsWith("TK", StringComparison.OrdinalIgnoreCase))
                {
                    relatedBooking = await _db.Bookings
                        .Include(b => b.Tour)
                        .Include(b => b.TourAvailability)
                        .Include(b => b.Customer)
                        .FirstOrDefaultAsync(b => b.BookingNumber == paymentCode);

                    if (relatedBooking != null)
                    {
                        _logger.LogInformation("Found Booking by BookingNumber: {BookingNumber}", paymentCode);
                        
                        // Log amount comparison
                        if (Math.Abs(relatedBooking.TotalAmount - webhookData.TransferAmount) > 0.01m)
                        {
                            _logger.LogWarning("Amount mismatch for Booking {BookingNumber}: Booking Total={BookingAmount}, Webhook Amount={WebhookAmount}",
                                paymentCode, relatedBooking.TotalAmount, webhookData.TransferAmount);
                        }
                        
                        // Create new Transaction for the booking
                        existingTransaction = new Transaction
                        {
                            Id = Guid.NewGuid(),
                            TransactionId = paymentCode,
                            UserId = relatedBooking.CustomerId,
                            Type = "booking_payment",
                            EntityId = relatedBooking.Id,
                            EntityType = "Booking",
                            Amount = webhookData.TransferAmount, // Use actual transferred amount from webhook
                            Currency = "VND",
                            Status = "pending", // Will be updated to "completed" below
                            TransactionDirection = "in",
                            PaymentMethod = "Bank Transfer",
                            PaymentGateway = webhookData.Gateway ?? "SePay",
                            Description = $"Booking payment for {relatedBooking.BookingNumber}",
                            CreatedBy = relatedBooking.CustomerId,
                            UpdatedBy = relatedBooking.CustomerId,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };

                        _db.Transactions.Add(existingTransaction);
                        await _db.SaveChangesAsync();
                        _logger.LogInformation("Created new Transaction for Booking: {BookingNumber}", paymentCode);
                    }
                }
                // Check if it's an order number (starts with ORD)
                else if (paymentCode.StartsWith("ORD", StringComparison.OrdinalIgnoreCase))
                {
                    relatedOrder = await _db.Orders
                        .Include(o => o.Customer)
                        .Include(o => o.Items)
                        .FirstOrDefaultAsync(o => o.OrderNumber == paymentCode);

                    if (relatedOrder != null)
                    {
                        _logger.LogInformation("Found Order by OrderNumber: {OrderNumber}", paymentCode);
                        
                        // Log amount comparison
                        if (Math.Abs(relatedOrder.TotalAmount - webhookData.TransferAmount) > 0.01m)
                        {
                            _logger.LogWarning("Amount mismatch for Order {OrderNumber}: Order Total={OrderAmount}, Webhook Amount={WebhookAmount}",
                                paymentCode, relatedOrder.TotalAmount, webhookData.TransferAmount);
                        }
                        
                        // Create new Transaction for the order
                        existingTransaction = new Transaction
                        {
                            Id = Guid.NewGuid(),
                            TransactionId = paymentCode,
                            UserId = relatedOrder.CustomerId,
                            Type = "order_payment",
                            EntityId = relatedOrder.Id,
                            EntityType = "Order",
                            Amount = webhookData.TransferAmount, // Use actual transferred amount from webhook
                            Currency = relatedOrder.Currency ?? "VND",
                            Status = "pending", // Will be updated to "completed" below
                            TransactionDirection = "in",
                            PaymentMethod = "Bank Transfer",
                            PaymentGateway = webhookData.Gateway ?? "SePay",
                            Description = $"Order payment for {relatedOrder.OrderNumber}",
                            CreatedBy = relatedOrder.CustomerId,
                            UpdatedBy = relatedOrder.CustomerId,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };

                        _db.Transactions.Add(existingTransaction);
                        await _db.SaveChangesAsync();
                        _logger.LogInformation("Created new Transaction for Order: {OrderNumber}", paymentCode);
                    }
                }

                // If still no transaction or related entity found, return error
                if (existingTransaction == null)
                {
                    _logger.LogWarning("No Transaction or related entity found for payment code: {PaymentCode}", paymentCode);
                    return new SePayWebhookResponse
                    {
                        Success = false,
                        Message = "No related transaction or entity found"
                    };
                }
            }

            // Check if already processed
            if (existingTransaction.Status == "completed")
            {
                _logger.LogInformation("Transaction already processed: {TransactionId}", existingTransaction.TransactionId);
                return new SePayWebhookResponse
                {
                    Success = true,
                    Message = "Transaction already processed",
                    TransactionId = existingTransaction.Id.ToString(),
                    BookingId = relatedBooking?.Id.ToString(),
                    OrderId = relatedOrder?.Id.ToString(),
                    ProcessedAt = existingTransaction.UpdatedAt
                };
            }

            // Update Transaction with webhook data
            existingTransaction.Status = "completed";
            existingTransaction.GatewayTransactionId = webhookData.Id.ToString();
            existingTransaction.GatewayResponse = JsonSerializer.Serialize(webhookData);
            existingTransaction.UpdatedAt = DateTime.UtcNow;

            // Update Booking status
            if (relatedBooking != null)
            {
                relatedBooking.Status = BookingStatus.Confirmed;
                relatedBooking.PaymentStatus = PaymentStatus.Paid;
                relatedBooking.UpdatedAt = DateTime.UtcNow;

                // Increment tour's total bookings counter
                if (relatedBooking.Tour != null)
                {
                    relatedBooking.Tour.TotalBookings++;
                    _logger.LogInformation("Incremented TotalBookings for Tour {TourId} to {Count}", 
                        relatedBooking.Tour.Id, relatedBooking.Tour.TotalBookings);
                }
            }

            // Update Order status
            if (relatedOrder != null)
            {
                relatedOrder.Status = OrderStatus.Processing;
                relatedOrder.PaymentStatus = PaymentStatus.Paid;
                relatedOrder.UpdatedAt = DateTime.UtcNow;
                
                _logger.LogInformation("Updated Order {OrderNumber} to Processing status", relatedOrder.OrderNumber);
            }

                        await _db.SaveChangesAsync();

            // Create Revenue record for Booking
            if (relatedBooking?.Tour?.TourGuideId != null)
            {
                var existingRevenue = await _db.Revenues
                    .FirstOrDefaultAsync(r => r.TransactionId == existingTransaction.Id);

                if (existingRevenue == null)
                {
                    var commissionRate = 0.15m; // 15% commission
                    var grossAmount = existingTransaction.Amount; // Toàn bộ số tiền (ví dụ: 4,000,000)
                    var commissionAmount = Math.Round(grossAmount * commissionRate, 2); // Phần hoa hồng cho tour guide (ví dụ: 600,000)

                    // Admin revenue: EntityType = "Tour" - nhận toàn bộ số tiền
                    var adminUserId = await _db.Users
                        .Where(u => u.Role == UserRole.Admin)
                        .Select(u => u.Id)
                        .FirstOrDefaultAsync();

                    if (adminUserId != Guid.Empty)
                    {
                        var adminRevenue = new Revenue
                        {
                            TransactionId = existingTransaction.Id,
                            UserId = adminUserId,
                            EntityId = relatedBooking.TourId,
                            EntityType = "Tour",
                            GrossAmount = grossAmount, // Toàn bộ số tiền
                            CommissionRate = 0,
                            CommissionAmount = 0,
                            NetAmount = grossAmount,
                            Currency = existingTransaction.Currency,
                            PayoutStatus = "pending"
                        };

                        _db.Revenues.Add(adminRevenue);
                    }

                    // Tour guide revenue: EntityType = "Booking" - nhận NET (gross - commission)
                    var revenue = new Revenue
                    {
                        TransactionId = existingTransaction.Id,
                        UserId = relatedBooking.Tour.TourGuideId,
                        EntityId = relatedBooking.Id,
                        EntityType = "Booking",
                        GrossAmount = grossAmount,
                        CommissionRate = commissionRate,
                        CommissionAmount = commissionAmount,
                        NetAmount = Math.Round(grossAmount - commissionAmount, 2),
                        Currency = existingTransaction.Currency,
                        PayoutStatus = "pending"
                    };

                    _db.Revenues.Add(revenue);
                    await _db.SaveChangesAsync();

                    _logger.LogInformation("Revenue created for Booking: TourGuide Revenue={TourGuideAmount}, Admin Revenue={AdminAmount}", 
                        commissionAmount, grossAmount);
                }
            }

            // Create Revenue record for Order (product sales)
            if (relatedOrder != null && relatedOrder.Items.Any())
            {
                var existingRevenue = await _db.Revenues
                    .FirstOrDefaultAsync(r => r.TransactionId == existingTransaction.Id);

                if (existingRevenue == null)
                {
                    // For orders, group items by tour guide to create revenue records
                    // Each tour guide gets one revenue record for all their items in the order
                    var itemsWithProducts = relatedOrder.Items
                        .Select(item => new { item.ProductId, item.Subtotal })
                        .ToList();

                    // Group by tour guide
                    var itemsByTourGuide = new Dictionary<Guid, List<(Guid ProductId, decimal Subtotal)>>();
                    decimal totalCommissionForAdmin = 0m;

                    foreach (var item in itemsWithProducts)
                    {
                        var product = await _db.Products
                            .Include(p => p.TourGuide)
                            .FirstOrDefaultAsync(p => p.Id == item.ProductId);

                        if (product?.TourGuideId != null)
                        {
                            var tourGuideId = product.TourGuideId;
                            if (!itemsByTourGuide.ContainsKey(tourGuideId))
                            {
                                itemsByTourGuide[tourGuideId] = new List<(Guid, decimal)>();
                            }
                            itemsByTourGuide[tourGuideId].Add((item.ProductId, item.Subtotal));
                        }
                    }

                    // Calculate total order amount for admin
                    var totalOrderAmount = relatedOrder.Items.Sum(item => item.Subtotal);
                    var commissionRate = 0.15m; // 15% commission

                    // Admin revenue: EntityType = "Product" - nhận toàn bộ số tiền của order
                    var adminUserId = await _db.Users
                        .Where(u => u.Role == UserRole.Admin)
                        .Select(u => u.Id)
                        .FirstOrDefaultAsync();

                    if (adminUserId != Guid.Empty)
                    {
                        // Group by product for admin revenue
                        var productIds = relatedOrder.Items
                            .Select(item => item.ProductId)
                            .Distinct()
                            .ToList();

                        foreach (var productId in productIds)
                        {
                            var productItems = relatedOrder.Items
                                .Where(item => item.ProductId == productId)
                                .ToList();
                            
                            var productTotalAmount = productItems.Sum(item => item.Subtotal);

                            var adminRevenue = new Revenue
                            {
                                TransactionId = existingTransaction.Id,
                                UserId = adminUserId,
                                EntityId = productId,
                                EntityType = "Product",
                                GrossAmount = productTotalAmount, // Toàn bộ số tiền của product trong order
                                CommissionRate = 0,
                                CommissionAmount = 0,
                                NetAmount = productTotalAmount,
                                Currency = existingTransaction.Currency,
                                PayoutStatus = "pending"
                            };

                            _db.Revenues.Add(adminRevenue);
                        }
                    }

                    // Create one revenue record per tour guide - nhận NET (gross - commission)
                    foreach (var kvp in itemsByTourGuide)
                    {
                        var tourGuideId = kvp.Key;
                        var tourGuideItems = kvp.Value;
                        var tourGuideTotalAmount = tourGuideItems.Sum(item => item.Subtotal);
                        var commissionAmount = Math.Round(tourGuideTotalAmount * commissionRate, 2);
                        var netAmount = Math.Round(tourGuideTotalAmount - commissionAmount, 2);

                        // Tour guide revenue: EntityType = "Order"
                        var revenue = new Revenue
                        {
                            TransactionId = existingTransaction.Id,
                            UserId = tourGuideId,
                            EntityId = relatedOrder.Id,
                            EntityType = "Order",
                            GrossAmount = tourGuideTotalAmount,
                            CommissionRate = commissionRate,
                            CommissionAmount = commissionAmount,
                            NetAmount = netAmount,
                            Currency = existingTransaction.Currency,
                            PayoutStatus = "pending"
                        };

                        _db.Revenues.Add(revenue);
                        _logger.LogInformation("Revenue created for Order: OrderId={OrderId}, TourGuideId={TourGuideId}, NetAmount={NetAmount}", 
                            relatedOrder.Id, tourGuideId, netAmount);
                    }

                    if (itemsByTourGuide.Any())
                    {
                        await _db.SaveChangesAsync();
                        _logger.LogInformation("Revenue records created for Order {OrderNumber}: TotalAmount={TotalAmount}", 
                            relatedOrder.OrderNumber, totalOrderAmount);
                    }
                }
            }

            // Send confirmation email
            try
            {
                if (relatedBooking != null)
                {
                    var contactInfo = new { Name = "", Email = "" };
                    try
                    {
                        if (!string.IsNullOrEmpty(relatedBooking.ContactInfo))
                            contactInfo = JsonSerializer.Deserialize<dynamic>(relatedBooking.ContactInfo) ?? contactInfo;
                    }
                    catch { }

                    var customerName = (string?)contactInfo?.Name ?? relatedBooking.Customer?.FirstName ?? "Khách hàng";
                    var customerEmail = (string?)contactInfo?.Email ?? relatedBooking.Customer?.Email ?? string.Empty;

                    if (!string.IsNullOrWhiteSpace(customerEmail) && relatedBooking.Tour != null)
                    {
                        var tourDate = relatedBooking.TourAvailability?.Date ?? DateTime.UtcNow;
                        await _emailService.SendBookingConfirmationEmailAsync(
                            customerEmail,
                            customerName,
                            relatedBooking.BookingNumber,
                            relatedBooking.Tour.Title,
                            tourDate,
                            existingTransaction.Amount
                        );
                    }
                }
                else if (relatedOrder != null)
                {
                    // Send order confirmation email
                    var customerName = relatedOrder.ReceiverName ?? relatedOrder.Customer?.FirstName ?? "Khách hàng";
                    var customerEmail = relatedOrder.ReceiverEmail ?? relatedOrder.Customer?.Email ?? string.Empty;

                    if (!string.IsNullOrWhiteSpace(customerEmail))
                    {
                        // Map order items to email format
                        var orderItems = relatedOrder.Items?.Select(item => new TouriMate.Services.OrderItemInfo
                        {
                            ProductName = item.ProductName,
                            Quantity = item.Quantity,
                            Price = item.UnitPrice,
                            Variant = item.SelectedVariant
                        }).ToList();

                        await _emailService.SendOrderConfirmationEmailAsync(
                            customerEmail,
                            customerName,
                            relatedOrder.OrderNumber,
                            relatedOrder.TotalAmount,
                            relatedOrder.Currency,
                            orderItems,
                            relatedOrder.ShippingAddress
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send confirmation email");
            }

            _logger.LogInformation("SePay webhook processed successfully: {TransactionId}", existingTransaction.TransactionId);

            // Broadcast payment success via SignalR
            try
            {
                if (relatedBooking != null)
                {
                    await _paymentHub.Clients
                        .Group($"payment_{relatedBooking.BookingNumber}")
                        .SendAsync("PaymentSuccess", new
                        {
                            bookingNumber = relatedBooking.BookingNumber,
                            bookingId = relatedBooking.Id,
                            amount = existingTransaction.Amount,
                            currency = existingTransaction.Currency,
                            status = "success",
                            message = "Thanh toán thành công!",
                            type = "booking"
                        });
                    
                    _logger.LogInformation("SignalR payment notification sent for booking: {BookingNumber}", relatedBooking.BookingNumber);
                }
                else if (relatedOrder != null)
                {
                    await _paymentHub.Clients
                        .Group($"payment_{relatedOrder.OrderNumber}")
                        .SendAsync("PaymentSuccess", new
                        {
                            orderNumber = relatedOrder.OrderNumber,
                            orderId = relatedOrder.Id,
                            amount = existingTransaction.Amount,
                            currency = existingTransaction.Currency,
                            status = "success",
                            message = "Thanh toán thành công!",
                            type = "order"
                        });
                    
                    _logger.LogInformation("SignalR payment notification sent for order: {OrderNumber}", relatedOrder.OrderNumber);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send SignalR payment notification");
            }

            // Broadcast transaction update to admin
            try
            {
                var customerName = "N/A";
                var transactionNumber = "";
                Guid? tourGuideId = null;

                if (relatedBooking != null)
                {
                    transactionNumber = relatedBooking.BookingNumber;
                    customerName = relatedBooking.Customer != null 
                        ? $"{relatedBooking.Customer.FirstName} {relatedBooking.Customer.LastName}".Trim()
                        : "N/A";
                    tourGuideId = relatedBooking.Tour?.TourGuideId;
                }
                else if (relatedOrder != null)
                {
                    transactionNumber = relatedOrder.OrderNumber;
                    customerName = relatedOrder.Customer != null 
                        ? $"{relatedOrder.Customer.FirstName} {relatedOrder.Customer.LastName}".Trim()
                        : relatedOrder.ReceiverName ?? "N/A";
                    
                    // For orders, find tour guides from products
                    var productIds = relatedOrder.Items
                        .Select(item => item.ProductId)
                        .Distinct()
                        .ToList();

                    // Get unique tour guide IDs from products
                    var products = await _db.Products
                        .Where(p => productIds.Contains(p.Id))
                        .Select(p => p.TourGuideId)
                        .Distinct()
                        .ToListAsync();

                    // Broadcast to each tour guide
                    foreach (var guideId in products)
                    {
                        await _transactionHub.Clients
                            .Group($"tourguide_transactions_{guideId}")
                            .SendAsync("TransactionUpdated", new
                            {
                                transactionId = existingTransaction.Id,
                                transactionCode = existingTransaction.TransactionId,
                                status = existingTransaction.Status.ToString(),
                                amount = existingTransaction.Amount,
                                currency = existingTransaction.Currency,
                                orderNumber = relatedOrder.OrderNumber,
                                customerName = customerName,
                                updatedAt = DateTime.UtcNow,
                                message = "Giao dịch đã được cập nhật"
                            });
                    }
                }

                await _transactionHub.Clients
                    .Group("admin_transactions")
                    .SendAsync("TransactionUpdated", new
                    {
                        transactionId = existingTransaction.Id,
                        transactionCode = existingTransaction.TransactionId,
                        status = existingTransaction.Status.ToString(),
                        amount = existingTransaction.Amount,
                        currency = existingTransaction.Currency,
                        bookingNumber = relatedBooking?.BookingNumber,
                        orderNumber = relatedOrder?.OrderNumber,
                        customerName = customerName,
                        updatedAt = DateTime.UtcNow,
                        message = "Giao dịch đã được cập nhật"
                    });

                // Also broadcast to tour guide if applicable (for bookings)
                if (tourGuideId.HasValue)
                {
                    await _transactionHub.Clients
                        .Group($"tourguide_transactions_{tourGuideId.Value}")
                        .SendAsync("TransactionUpdated", new
                        {
                            transactionId = existingTransaction.Id,
                            transactionCode = existingTransaction.TransactionId,
                            status = existingTransaction.Status.ToString(),
                            amount = existingTransaction.Amount,
                            currency = existingTransaction.Currency,
                            bookingNumber = transactionNumber,
                            customerName = customerName,
                            updatedAt = DateTime.UtcNow,
                            message = "Giao dịch đã được cập nhật"
                        });
                }
                
                _logger.LogInformation("SignalR transaction notification sent for transaction: {TransactionId}", existingTransaction.TransactionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send SignalR transaction notification");
            }

            return new SePayWebhookResponse
            {
                Success = true,
                Message = "Transaction processed successfully",
                TransactionId = existingTransaction.Id.ToString(),
                BookingId = relatedBooking?.Id.ToString(),
                ProcessedAt = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing SePay webhook for transaction ID: {TransactionId}", webhookData.Id);
            return new SePayWebhookResponse
            {
                Success = false,
                Message = "Internal server error"
            };
        }
    }

    public async Task<bool> ValidateWebhookAsync(SePayWebhookRequest webhookData)
    {
        // Basic validation
        if (webhookData == null)
            return false;

        if (webhookData.Id <= 0)
            return false;

        if (string.IsNullOrEmpty(webhookData.Gateway))
            return false;

        if (webhookData.TransferAmount <= 0)
            return false;

        if (string.IsNullOrEmpty(webhookData.TransferType))
            return false;

        return true;
    }

    public async Task<string?> ExtractPaymentCodeAsync(string content, string? code)
    {
        // Prioritize code field if available
        if (!string.IsNullOrWhiteSpace(code))
        {
            return code.Trim().ToUpper();
        }
        
        // Fallback to extracting from content
        return ExtractPaymentCode(content);
    }

    private string? ExtractPaymentCode(string content)
    {
        if (string.IsNullOrEmpty(content))
            return null;

        // Try to find order number pattern (ORD + digits)
        var orderPattern = @"(ORD\d+)";
        var orderMatch = System.Text.RegularExpressions.Regex.Match(content, orderPattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (orderMatch.Success)
        {
            return orderMatch.Groups[1].Value.ToUpper(); // Return order number (e.g., "ORD20251104034355430")
        }

        // Try to find booking number pattern (TK + digits)
        var bookingPattern = @"(TK\d+)";
        var bookingMatch = System.Text.RegularExpressions.Regex.Match(content, bookingPattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (bookingMatch.Success)
        {
            return bookingMatch.Groups[1].Value.ToUpper();
        }

        // Try to find any numeric sequence that might be a payment code
        var numericPattern = @"(\d{6,})"; // At least 6 digits
        var numericMatch = System.Text.RegularExpressions.Regex.Match(content, numericPattern);
        if (numericMatch.Success)
        {
            return numericMatch.Groups[1].Value;
        }

        return null;
    }
}