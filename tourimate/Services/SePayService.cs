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

    public SePayService(
        TouriMateDbContext db, 
        ILogger<SePayService> logger, 
        IEmailService emailService,
        IHubContext<PaymentHub> paymentHub)
    {
        _db = db;
        _logger = logger;
        _emailService = emailService;
        _paymentHub = paymentHub;
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

            // Extract payment code from content
            var paymentCode = ExtractPaymentCode(webhookData.Content);
            if (string.IsNullOrEmpty(paymentCode))
            {
                _logger.LogWarning("No payment code found in webhook content: {Content}", webhookData.Content);
                return new SePayWebhookResponse
                {
                    Success = false,
                    Message = "No payment code found"
                };
            }

            _logger.LogInformation("SePay webhook processing - PaymentCode: {PaymentCode}", paymentCode);

            // Find existing Transaction by payment code (booking number)
            var existingTransaction = await _db.Transactions
                .FirstOrDefaultAsync(t => t.TransactionId == paymentCode);

            if (existingTransaction == null)
            {
                _logger.LogWarning("No Transaction found for payment code: {PaymentCode}", paymentCode);
                return new SePayWebhookResponse
                {
                    Success = false,
                    Message = "No related transaction found"
                };
            }

            _logger.LogInformation("Transaction found: {TransactionId}, Status: {Status}", 
                existingTransaction.TransactionId, existingTransaction.Status);

            // Attempt to load related booking explicitly (navigation may not be mapped)
            Booking? relatedBooking = null;
            if (existingTransaction.EntityType == "Booking" && existingTransaction.EntityId.HasValue)
            {
                relatedBooking = await _db.Bookings
                    .Include(b => b.Tour)
                    .Include(b => b.TourAvailability)
                    .Include(b => b.Customer)
                    .FirstOrDefaultAsync(b => b.Id == existingTransaction.EntityId.Value);
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
            }

                        await _db.SaveChangesAsync();

            // Create Revenue record
            if (relatedBooking?.Tour?.TourGuideId != null)
            {
                        var existingRevenue = await _db.Revenues
                    .FirstOrDefaultAsync(r => r.TransactionId == existingTransaction.Id);

                        if (existingRevenue == null)
                        {
                    var commissionRate = 0.15m; // 15% commission
                    var grossAmount = existingTransaction.Amount;
                            var commissionAmount = Math.Round(grossAmount * commissionRate, 2);
                            var netAmount = Math.Round(grossAmount - commissionAmount, 2);

                            var revenue = new Revenue
                            {
                        TransactionId = existingTransaction.Id,
                        UserId = relatedBooking.Tour.TourGuideId,
                        EntityId = relatedBooking.TourId,
                                EntityType = "Tour",
                                GrossAmount = grossAmount,
                                CommissionRate = commissionRate,
                                CommissionAmount = commissionAmount,
                                NetAmount = netAmount,
                        Currency = existingTransaction.Currency,
                                PayoutStatus = "pending"
                            };

                            _db.Revenues.Add(revenue);
                            await _db.SaveChangesAsync();

                    _logger.LogInformation("Revenue created: {RevenueId}, NetAmount: {NetAmount}", 
                        revenue.Id, revenue.NetAmount);
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
                        }
                        catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send booking confirmation email");
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
                            message = "Thanh toán thành công!"
                        });
                    
                    _logger.LogInformation("SignalR notification sent for booking: {BookingNumber}", relatedBooking.BookingNumber);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send SignalR notification");
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
        return ExtractPaymentCode(content);
    }

    private string? ExtractPaymentCode(string content)
    {
        if (string.IsNullOrEmpty(content))
            return null;

        // Try to find booking number pattern (TK + digits)
        var bookingPattern = @"(TK\d+)";
        var bookingMatch = System.Text.RegularExpressions.Regex.Match(content, bookingPattern);
        if (bookingMatch.Success)
        {
            return bookingMatch.Groups[1].Value;
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
}