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
    Task<bool> ProcessPaymentAsync(Guid orderId, SePayWebhookRequest webhookData);
}

public class SePayService : ISePayService
{
    private readonly TouriMateDbContext _db;
    private readonly ILogger<SePayService> _logger;

    public SePayService(TouriMateDbContext db, ILogger<SePayService> logger)
    {
        _db = db;
        _logger = logger;
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

            // Check for duplicate processing
            var existingTransaction = await _db.SePayTransactions
                .FirstOrDefaultAsync(st => st.SePayTransactionId == webhookData.Id);

            if (existingTransaction != null)
            {
                _logger.LogWarning("Duplicate webhook received for SePay transaction ID: {TransactionId}", webhookData.Id);
                return new SePayWebhookResponse
                {
                    Success = true,
                    Message = "Transaction already processed",
                    TransactionId = existingTransaction.Id.ToString(),
                    ProcessedAt = existingTransaction.ProcessedAt
                };
            }

            // Save SePay transaction record
            var sePayTransaction = new SePayTransaction
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

            // Extract payment code and find related order
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

            var orderId = await FindRelatedOrderAsync(paymentCode);
            if (!orderId.HasValue)
            {
                sePayTransaction.ProcessingStatus = "failed";
                sePayTransaction.ProcessingNotes = $"No order found for payment code: {paymentCode}";
                sePayTransaction.ProcessedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                return new SePayWebhookResponse
                {
                    Success = false,
                    Message = "No related order found"
                };
            }

            // Process the payment
            var paymentProcessed = await ProcessPaymentAsync(orderId.Value, webhookData);
            
            // Update SePay transaction record
            sePayTransaction.EntityId = orderId.Value;
            sePayTransaction.EntityType = "Order";
            sePayTransaction.ProcessingStatus = paymentProcessed ? "processed" : "failed";
            sePayTransaction.ProcessingNotes = paymentProcessed ? "Payment processed successfully" : "Payment processing failed";
            sePayTransaction.ProcessedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return new SePayWebhookResponse
            {
                Success = paymentProcessed,
                Message = paymentProcessed ? "Payment processed successfully" : "Payment processing failed",
                TransactionId = sePayTransaction.Id.ToString(),
                OrderId = orderId.Value.ToString(),
                ProcessedAt = sePayTransaction.ProcessedAt
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
        // For example: "TT" + OrderNumber, or custom format
        
        // Simple pattern matching - you may need to adjust based on your format
        var patterns = new[]
        {
            @"TT(\d+)",  // TT followed by digits
            @"ORDER(\d+)", // ORDER followed by digits
            @"PAY(\d+)"   // PAY followed by digits
        };

        foreach (var pattern in patterns)
        {
            var match = System.Text.RegularExpressions.Regex.Match(content, pattern);
            if (match.Success)
            {
                return match.Groups[1].Value;
            }
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
