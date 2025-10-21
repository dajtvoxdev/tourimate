using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using Entities.Models;
using Entities.Enums;
using System.Text.Json;
using TouriMate.Contracts.Payment;

namespace TouriMate.Services;

public interface ISePayService
{
    Task<SePayWebhookResponse> ProcessWebhookAsync(SePayWebhookRequest webhookData);
    Task<bool> ValidateWebhookAsync(SePayWebhookRequest webhookData);
    Task<string?> ExtractPaymentCodeAsync(string content, string? code);
    Task<Guid?> FindRelatedOrderAsync(string paymentCode);
    Task<Guid?> FindRelatedBookingAsync(string paymentCode);
    Task<bool> ProcessPaymentAsync(Guid orderId, SePayWebhookRequest webhookData);
}

public class SePayService : ISePayService
{
    private readonly TouriMateDbContext _db;
    private readonly ILogger<SePayService> _logger;
    private readonly IEmailService _emailService;

    public SePayService(TouriMateDbContext db, ILogger<SePayService> logger, IEmailService emailService)
    {
        _db = db;
        _logger = logger;
        _emailService = emailService;
    }

    public async Task<SePayWebhookResponse> ProcessWebhookAsync(SePayWebhookRequest webhookData)
    {
        try
        {
            _logger.LogInformation("Processing SePay webhook for transaction ID: {TransactionId}", webhookData.Id);

            // Validate webhook data
            if (!await ValidateWebhookAsync(webhookData))
            {
                return new SePayWebhookResponse
                {
                    Success = false,
                    Message = "Invalid webhook data"
                };
            }

            // Check for existing transaction
            var existingTransaction = await _db.SePayTransactions
                .FirstOrDefaultAsync(st => st.SePayTransactionId == webhookData.Id);
            
            SePayTransaction sePayTransaction;

            if (existingTransaction != null)
            {
                // If transaction was already successfully processed, return success
                if (existingTransaction.ProcessingStatus == "processed")
                {
                    _logger.LogWarning("Duplicate webhook received for already processed SePay transaction ID: {TransactionId}", webhookData.Id);
                    return new SePayWebhookResponse
                    {
                        Success = true,
                        Message = "Transaction already processed",
                        TransactionId = existingTransaction.Id.ToString(),
                        ProcessedAt = existingTransaction.ProcessedAt
                    };
                }
                
                // If transaction failed or is pending, allow reprocessing
                if (existingTransaction.ProcessingStatus == "failed" || existingTransaction.ProcessingStatus == "pending")
                {
                    _logger.LogInformation("Reprocessing SePay transaction ID: {TransactionId} with status: {Status}", 
                        webhookData.Id, existingTransaction.ProcessingStatus);
                    
                    // Update existing transaction record with new webhook data
                    existingTransaction.Gateway = webhookData.Gateway;
                    existingTransaction.TransactionDate = DateTime.Parse(webhookData.TransactionDate);
                    existingTransaction.AccountNumber = webhookData.AccountNumber;
                    existingTransaction.Code = webhookData.Code;
                    existingTransaction.Content = webhookData.Content;
                    existingTransaction.TransferType = webhookData.TransferType;
                    existingTransaction.TransferAmount = webhookData.TransferAmount;
                    existingTransaction.Accumulated = webhookData.Accumulated;
                    existingTransaction.SubAccount = webhookData.SubAccount;
                    existingTransaction.ReferenceCode = webhookData.ReferenceCode;
                    existingTransaction.Description = webhookData.Description;
                    existingTransaction.ProcessingStatus = "pending";
                    existingTransaction.ProcessingNotes = null;
                    existingTransaction.ProcessedAt = null;
                    existingTransaction.UpdatedAt = DateTime.UtcNow;
                    
                    await _db.SaveChangesAsync();
                    
                    // Use the existing transaction for further processing
                    sePayTransaction = existingTransaction;
                }
                else
                {
                    // For other statuses (skipped, etc.), return success
                    _logger.LogWarning("SePay transaction ID: {TransactionId} has status: {Status}, skipping reprocessing", 
                        webhookData.Id, existingTransaction.ProcessingStatus);
                    return new SePayWebhookResponse
                    {
                        Success = true,
                        Message = $"Transaction has status: {existingTransaction.ProcessingStatus}",
                        TransactionId = existingTransaction.Id.ToString(),
                        ProcessedAt = existingTransaction.ProcessedAt
                    };
                }
            }
            else
            {
                // Create new SePay transaction record
                sePayTransaction = new SePayTransaction
                {
                    SePayTransactionId = webhookData.Id,
                    Gateway = webhookData.Gateway,
                    TransactionDate = DateTime.Parse(webhookData.TransactionDate),
                    AccountNumber = webhookData.AccountNumber,
                    Code = webhookData.Code,
                    Content = webhookData.Content,
                    TransferType = webhookData.TransferType,
                    TransferAmount = webhookData.TransferAmount,
                    Accumulated = webhookData.Accumulated,
                    SubAccount = webhookData.SubAccount,
                    ReferenceCode = webhookData.ReferenceCode,
                    Description = webhookData.Description,
                    ProcessingStatus = "pending"
                };

                _db.SePayTransactions.Add(sePayTransaction);
                await _db.SaveChangesAsync();
            }

            // Only process money-in transactions
            if (webhookData.TransferType != "in")
            {
                sePayTransaction.ProcessingStatus = "skipped";
                sePayTransaction.ProcessingNotes = "Money-out transaction, skipping payment processing";
                sePayTransaction.ProcessedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                return new SePayWebhookResponse
                {
                    Success = true,
                    Message = "Money-out transaction skipped",
                    TransactionId = sePayTransaction.Id.ToString(),
                    ProcessedAt = sePayTransaction.ProcessedAt
                };
            }

            // Extract payment code and find related order or booking
            var paymentCode = await ExtractPaymentCodeAsync(webhookData.Content, webhookData.Code);
            if (string.IsNullOrEmpty(paymentCode))
            {
                sePayTransaction.ProcessingStatus = "failed";
                sePayTransaction.ProcessingNotes = "No payment code found in transaction content";
                sePayTransaction.ProcessedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                return new SePayWebhookResponse
                {
                    Success = false,
                    Message = "No payment code found"
                };
            }

            // Search for both order and booking simultaneously
            var orderTask = FindRelatedOrderAsync(paymentCode);
            var bookingTask = FindRelatedBookingAsync(paymentCode);
            
            await Task.WhenAll(orderTask, bookingTask);
            
            var orderId = await orderTask;
            var bookingId = await bookingTask;

            // Check if both were found (should not happen, but handle gracefully)
            if (orderId.HasValue && bookingId.HasValue)
            {
                _logger.LogWarning("Both order {OrderId} and booking {BookingId} found for payment code: {PaymentCode}. Processing order first.", 
                    orderId.Value, bookingId.Value, paymentCode);
                // Only record linkage, do not process here
                sePayTransaction.EntityId = orderId.Value;
                sePayTransaction.EntityType = "Order";
                sePayTransaction.ProcessingStatus = "pending_review";
                sePayTransaction.ProcessingNotes = "Linked to Order via payment code; awaiting manual processing";
                sePayTransaction.ProcessedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                return new SePayWebhookResponse
                {
                    Success = true,
                    Message = "Transaction recorded and linked to Order; pending manual processing",
                    TransactionId = sePayTransaction.Id.ToString(),
                    OrderId = orderId.Value.ToString(),
                    ProcessedAt = sePayTransaction.ProcessedAt
                };
            }
            // Process order payment if found
            else if (orderId.HasValue)
            {
                // Only record linkage, do not process here
                sePayTransaction.EntityId = orderId.Value;
                sePayTransaction.EntityType = "Order";
                sePayTransaction.ProcessingStatus = "pending_review";
                sePayTransaction.ProcessingNotes = "Linked to Order via payment code; awaiting manual processing";
                sePayTransaction.ProcessedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                return new SePayWebhookResponse
                {
                    Success = true,
                    Message = "Transaction recorded and linked to Order; pending manual processing",
                    TransactionId = sePayTransaction.Id.ToString(),
                    OrderId = orderId.Value.ToString(),
                    ProcessedAt = sePayTransaction.ProcessedAt
                };
            }
            // Process booking payment if found
            else if (bookingId.HasValue)
            {
                // Only record linkage, do not process here
                sePayTransaction.EntityId = bookingId.Value;
                sePayTransaction.EntityType = "Booking";
                sePayTransaction.ProcessingStatus = "pending_review";
                sePayTransaction.ProcessingNotes = "Linked to Booking via payment code; awaiting manual processing";
                sePayTransaction.ProcessedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                // Create minimal Transaction and Revenue records for reporting (idempotent)
                var existingTx = await _db.Transactions
                    .FirstOrDefaultAsync(t => t.GatewayTransactionId == webhookData.Id.ToString());

                if (existingTx == null)
                {
                    // Load booking with tour to resolve revenue owner
                    var bookingForRevenue = await _db.Bookings
                        .Include(b => b.Tour)
                        .FirstOrDefaultAsync(b => b.Id == bookingId.Value);

                    if (bookingForRevenue != null && bookingForRevenue.Tour?.TourGuideId != null)
                    {
                        var tx = new Transaction
                        {
                            TransactionId = $"SEPAY_{webhookData.Id}",
                            UserId = bookingForRevenue.CustomerId,
                            Type = "booking_payment_detected",
                            EntityId = bookingId.Value,
                            EntityType = "Booking",
                            Amount = webhookData.TransferAmount,
                            Currency = "VND",
                            Status = "pending_review",
                            PaymentMethod = "Bank Transfer",
                            PaymentGateway = "SePay",
                            GatewayTransactionId = webhookData.Id.ToString(),
                            GatewayResponse = JsonSerializer.Serialize(webhookData),
                            Description = $"Booking payment detected via SePay - {webhookData.Gateway}",
                            CreatedBy = bookingForRevenue.CustomerId,
                            UpdatedBy = bookingForRevenue.CustomerId
                        };

                        _db.Transactions.Add(tx);
                        await _db.SaveChangesAsync();

                        // Create revenue if not exists for this transaction
                        var existingRevenue = await _db.Revenues
                            .FirstOrDefaultAsync(r => r.TransactionId == tx.Id);

                        if (existingRevenue == null)
                        {
                            var commissionRate = 0.15m;
                            var grossAmount = tx.Amount;
                            var commissionAmount = Math.Round(grossAmount * commissionRate, 2);
                            var netAmount = Math.Round(grossAmount - commissionAmount, 2);

                            var revenue = new Revenue
                            {
                                TransactionId = tx.Id,
                                UserId = bookingForRevenue.Tour.TourGuideId,
                                EntityId = bookingForRevenue.TourId,
                                EntityType = "Tour",
                                GrossAmount = grossAmount,
                                CommissionRate = commissionRate,
                                CommissionAmount = commissionAmount,
                                NetAmount = netAmount,
                                Currency = tx.Currency,
                                PayoutStatus = "pending"
                            };

                            _db.Revenues.Add(revenue);
                            await _db.SaveChangesAsync();
                        }

                        // Attempt to send booking confirmation email to customer
                        try
                        {
                            var contactInfo = new { Name = "", Email = "" };
                            try
                            {
                                if (!string.IsNullOrEmpty(bookingForRevenue.ContactInfo))
                                    contactInfo = System.Text.Json.JsonSerializer.Deserialize<dynamic>(bookingForRevenue.ContactInfo) ?? contactInfo;
                            }
                            catch {}

                            var customerName = (string?)contactInfo?.Name ?? bookingForRevenue.Customer?.FirstName ?? "Khách hàng";
                            var customerEmail = (string?)contactInfo?.Email ?? bookingForRevenue.Customer?.Email ?? string.Empty;

                            if (!string.IsNullOrWhiteSpace(customerEmail) && bookingForRevenue.Tour != null)
                            {
                                var tourDate = bookingForRevenue.TourAvailability?.Date ?? DateTime.UtcNow;
                                await _emailService.SendBookingConfirmationEmailAsync(
                                    customerEmail,
                                    customerName,
                                    bookingForRevenue.BookingNumber,
                                    bookingForRevenue.Tour.Title,
                                    tourDate,
                                    tx.Amount
                                );
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to send booking confirmation email for booking {BookingId}", bookingId);
                        }
                    }
                }

                return new SePayWebhookResponse
                {
                    Success = true,
                    Message = "Transaction recorded and linked to Booking; pending manual processing",
                    TransactionId = sePayTransaction.Id.ToString(),
                    BookingId = bookingId.Value.ToString(),
                    ProcessedAt = sePayTransaction.ProcessedAt
                };
            }

            // No related order or booking found
            sePayTransaction.ProcessingStatus = "failed";
            sePayTransaction.ProcessingNotes = $"No order or booking found for payment code: {paymentCode}";
            sePayTransaction.ProcessedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return new SePayWebhookResponse
            {
                Success = false,
                Message = "No related order or booking found"
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
        if (webhookData.Id <= 0)
            return false;

        if (string.IsNullOrEmpty(webhookData.Gateway))
            return false;

        if (string.IsNullOrEmpty(webhookData.AccountNumber))
            return false;

        if (webhookData.TransferAmount <= 0)
            return false;

        if (!DateTime.TryParse(webhookData.TransactionDate, out _))
            return false;

        return true;
    }

    public async Task<string?> ExtractPaymentCodeAsync(string content, string? code)
    {
        // If SePay already extracted the code, use it
        if (!string.IsNullOrEmpty(code))
            return code;

        // Try to extract payment code from content using common patterns
        // This would need to be configured based on your payment code format
        
        // First, try to find complete booking number (TK + date + number) - return the FULL booking number
        var bookingNumberPattern = @"(TK\d{8}\d+)";
        var bookingMatch = System.Text.RegularExpressions.Regex.Match(content, bookingNumberPattern);
        if (bookingMatch.Success)
        {
            return bookingMatch.Groups[1].Value; // Return full booking number including "TK"
        }

        // Try to find complete order number patterns
        var orderPatterns = new[]
        {
            @"(TT\d+)",     // TT followed by digits - return full order number
            @"(ORDER\d+)",  // ORDER followed by digits - return full order number
            @"(PAY\d+)"     // PAY followed by digits - return full order number
        };

        foreach (var pattern in orderPatterns)
        {
            var match = System.Text.RegularExpressions.Regex.Match(content, pattern);
            if (match.Success)
            {
                return match.Groups[1].Value; // Return full order number
            }
        }

        // Try to find partial booking number (TK + digits) - return full booking number
        var partialBookingPattern = @"(TK\d+)";
        var partialBookingMatch = System.Text.RegularExpressions.Regex.Match(content, partialBookingPattern);
        if (partialBookingMatch.Success)
        {
            return partialBookingMatch.Groups[1].Value; // Return full booking number including "TK"
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

    public async Task<Guid?> FindRelatedOrderAsync(string paymentCode)
    {
        // Try to find order by payment code in OrderNumber
        var order = await _db.Orders
            .FirstOrDefaultAsync(o => o.OrderNumber == paymentCode);

        if (order != null)
            return order.Id;

        // If payment code is numeric, try to find by ID
        if (int.TryParse(paymentCode, out var orderIdInt))
        {
            var orderById = await _db.Orders
                .FirstOrDefaultAsync(o => o.Id.ToString().Contains(paymentCode));
            
            if (orderById != null)
                return orderById.Id;
        }

        return null;
    }

    public async Task<Guid?> FindRelatedBookingAsync(string paymentCode)
    {
        // Try to find booking by exact booking number match
        var booking = await _db.Bookings
            .FirstOrDefaultAsync(b => b.BookingNumber == paymentCode);

        if (booking != null)
            return booking.Id;

        // Try to find booking by partial booking number match (in case of incomplete extraction)
        var bookingByPartial = await _db.Bookings
            .FirstOrDefaultAsync(b => b.BookingNumber.Contains(paymentCode));
        
        if (bookingByPartial != null)
            return bookingByPartial.Id;

        // Try to find booking by booking number with "TK" prefix (if paymentCode doesn't have TK)
        if (!paymentCode.StartsWith("TK"))
        {
            var bookingWithPrefix = await _db.Bookings
                .FirstOrDefaultAsync(b => b.BookingNumber == $"TK{paymentCode}");
            
            if (bookingWithPrefix != null)
                return bookingWithPrefix.Id;
        }

        return null;
    }

    public async Task<bool> ProcessPaymentAsync(Guid orderId, SePayWebhookRequest webhookData)
    {
        try
        {
            var order = await _db.Orders
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
            {
                _logger.LogWarning("Order not found: {OrderId}", orderId);
                return false;
            }

            // Check if order is already paid
            if (order.PaymentStatus == PaymentStatus.Paid)
            {
                _logger.LogWarning("Order {OrderId} is already paid", orderId);
                return true; // Return true as this is not an error
            }

            // Validate payment amount (optional - you might want to allow partial payments)
            if (webhookData.TransferAmount < order.TotalAmount)
            {
                _logger.LogWarning("Payment amount {Amount} is less than order total {Total} for order {OrderId}", 
                    webhookData.TransferAmount, order.TotalAmount, orderId);
                // You might want to handle partial payments differently
            }

            // Update order payment status
            order.PaymentStatus = PaymentStatus.Paid;
            order.Status = OrderStatus.Processing;
            order.PaymentId = webhookData.Id.ToString();
            order.PaymentMethod = $"SePay-{webhookData.Gateway}";
            order.UpdatedAt = DateTime.UtcNow;

            // Create transaction record
            var transaction = new Transaction
            {
                TransactionId = $"SEPAY_{webhookData.Id}",
                UserId = order.CustomerId,
                Type = "order_payment",
                EntityId = orderId,
                EntityType = "Order",
                Amount = webhookData.TransferAmount,
                Currency = "VND",
                Status = "completed",
                PaymentMethod = "Bank Transfer",
                PaymentGateway = "SePay",
                GatewayTransactionId = webhookData.Id.ToString(),
                GatewayResponse = JsonSerializer.Serialize(webhookData),
                Description = $"Payment via SePay - {webhookData.Gateway}",
                CreatedBy = order.CustomerId,
                UpdatedBy = order.CustomerId
            };

            _db.Transactions.Add(transaction);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Payment processed successfully for order {OrderId}", orderId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing payment for order {OrderId}", orderId);
            return false;
        }
    }
}
