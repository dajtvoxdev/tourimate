using Microsoft.AspNetCore.Mvc;
using TouriMate.Services;
using TouriMate.Contracts.Payment;
using System.Text.Json;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly ISePayService _sePayService;
    private readonly ILogger<PaymentController> _logger;

    public PaymentController(ISePayService sePayService, ILogger<PaymentController> logger)
    {
        _sePayService = sePayService;
        _logger = logger;
    }

    /// <summary>
    /// Webhook endpoint for SePay notifications
    /// </summary>
    /// <param name="request">SePay webhook data</param>
    /// <returns>Processing result</returns>
    [HttpPost("sepay/webhook")]
    public async Task<IActionResult> SePayWebhook([FromBody] SePayWebhookRequest request)
    {
        try
        {
            _logger.LogInformation("Received SePay webhook for transaction ID: {TransactionId}", request.Id);

            // Log the incoming webhook for debugging
            var webhookJson = JsonSerializer.Serialize(request, new JsonSerializerOptions { WriteIndented = true });
            _logger.LogDebug("SePay webhook data: {WebhookData}", webhookJson);

            // Process the webhook
            var result = await _sePayService.ProcessWebhookAsync(request);

            // Return appropriate HTTP status based on SePay requirements
            if (result.Success)
            {
                // SePay expects HTTP 201 for successful processing
                return StatusCode(201, result);
            }
            else
            {
                // Return HTTP 400 for processing failures
                return BadRequest(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing SePay webhook for transaction ID: {TransactionId}", request?.Id);
            
            // Return HTTP 500 for internal errors
            return StatusCode(500, new SePayWebhookResponse
            {
                Success = false,
                Message = "Internal server error"
            });
        }
    }

    /// <summary>
    /// Get payment instructions for an order
    /// </summary>
    /// <param name="orderId">Order ID</param>
    /// <returns>Payment instructions</returns>
    [HttpGet("instructions/{orderId}")]
    public async Task<IActionResult> GetPaymentInstructions(Guid orderId)
    {
        try
        {
            // This would return payment instructions including:
            // - Bank account details
            // - Payment code (order number)
            // - Amount to transfer
            // - Content to include in transfer
            
            return Ok(new
            {
                orderId,
                paymentCode = orderId.ToString("N")[..8].ToUpper(), // Generate payment code from order ID
                message = "Payment instructions will be implemented based on your bank account configuration"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment instructions for order {OrderId}", orderId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Check payment status for an order
    /// </summary>
    /// <param name="orderId">Order ID</param>
    /// <returns>Payment status</returns>
    [HttpGet("status/{orderId}")]
    public async Task<IActionResult> GetPaymentStatus(Guid orderId)
    {
        try
        {
            // This would check the payment status from the database
            // and return current status information
            
            return Ok(new
            {
                orderId,
                message = "Payment status check will be implemented"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking payment status for order {OrderId}", orderId);
            return StatusCode(500, "Internal server error");
        }
    }
}
