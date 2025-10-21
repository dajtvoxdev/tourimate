using Microsoft.AspNetCore.Mvc;
using TouriMate.Services;
using TouriMate.Contracts.Payment;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly ISePayService _sePayService;
    private readonly ILogger<PaymentController> _logger;
    private readonly IConfiguration _configuration;

    public PaymentController(ISePayService sePayService, ILogger<PaymentController> logger, IConfiguration configuration)
    {
        _sePayService = sePayService;
        _logger = logger;
        _configuration = configuration;
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

            // Log the incoming webhook for debugging
            var webhookJson = JsonSerializer.Serialize(request, new JsonSerializerOptions { WriteIndented = true });

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

    /// <summary>
    /// Get admin banking information
    /// </summary>
    /// <returns>Admin banking details</returns>
    [HttpGet("admin-banking")]
    public IActionResult GetAdminBanking()
    {
        try
        {
            var account = _configuration["AdminBanking:Account"];
            var bankName = _configuration["AdminBanking:Name"];
            var qrCodeUrl = _configuration["AdminBanking:QRCodeUrl"];

            if (string.IsNullOrEmpty(account) || string.IsNullOrEmpty(bankName))
            {
                return BadRequest("Admin banking configuration is missing");
            }

            return Ok(new
            {
                account,
                bankName,
                qrCodeUrl
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting admin banking information");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get QR code image for payment with dynamic amount and description
    /// </summary>
    /// <param name="amount">Payment amount</param>
    /// <param name="des">Payment description</param>
    /// <returns>QR code image</returns>
    [HttpGet("qr-code")]
    public async Task<IActionResult> GetQRCode([FromQuery] decimal? amount = null, [FromQuery] string? des = null)
    {
        try
        {
            var account = _configuration["AdminBanking:Account"];
            var bank = _configuration["AdminBanking:Name"];
            var baseUrl = _configuration["AdminBanking:QRCodeUrl"];

            if (string.IsNullOrEmpty(account) || string.IsNullOrEmpty(bank) || string.IsNullOrEmpty(baseUrl))
            {
                return BadRequest("Admin banking configuration is missing");
            }

            // Build the QR code URL with parameters
            var qrUrl = $"{baseUrl}";
            
            // Add amount parameter if provided
            if (amount.HasValue && amount.Value > 0)
            {
                qrUrl = qrUrl.Replace("amount=", $"amount={amount.Value}");
            }
            
            // Add description parameter if provided
            if (!string.IsNullOrEmpty(des))
            {
                qrUrl = qrUrl.Replace("des=", $"des={Uri.EscapeDataString(des)}");
            }

            // Fetch the QR code image from SePay
            using var httpClient = new HttpClient();
            var response = await httpClient.GetAsync(qrUrl);
            
            if (response.IsSuccessStatusCode)
            {
                var imageBytes = await response.Content.ReadAsByteArrayAsync();
                var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/png";
                
                return File(imageBytes, contentType);
            }
            else
            {
                _logger.LogError("Failed to fetch QR code from SePay. Status: {StatusCode}", response.StatusCode);
                return StatusCode(500, "Failed to generate QR code");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating QR code for amount: {Amount}, description: {Description}", amount, des);
            return StatusCode(500, "Internal server error");
        }
    }
}
