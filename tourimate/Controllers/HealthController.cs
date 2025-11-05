using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using TouriMate.Services;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly TouriMateDbContext _context;
    private readonly ILogger<HealthController> _logger;
    private readonly IEmailService _emailService;

    public HealthController(TouriMateDbContext context, ILogger<HealthController> logger, IEmailService emailService)
    {
        _context = context;
        _logger = logger;
        _emailService = emailService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            // Test database connection
            var canConnect = await _context.Database.CanConnectAsync();
            
            var healthStatus = new
            {
                Status = "Healthy",
                Timestamp = DateTime.UtcNow,
                Database = new
                {
                    CanConnect = canConnect,
                    Provider = _context.Database.ProviderName,
                    ConnectionString = _context.Database.GetConnectionString()?.Replace("123456", "***")
                },
                Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                Version = "1.0.0"
            };

            _logger.LogInformation("Health check performed successfully");
            return Ok(healthStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            return StatusCode(500, new
            {
                Status = "Unhealthy",
                Error = ex.Message,
                Timestamp = DateTime.UtcNow
            });
        }
    }

    [HttpGet("database")]
    public async Task<IActionResult> DatabaseStatus()
    {
        try
        {
            var canConnect = await _context.Database.CanConnectAsync();
            var pendingMigrations = await _context.Database.GetPendingMigrationsAsync();
            var appliedMigrations = await _context.Database.GetAppliedMigrationsAsync();

            // Count records in some key tables
            var userCount = await _context.Users.CountAsync();
            var productCategoryCount = await _context.ProductCategories.CountAsync();
            var systemSettingCount = await _context.SystemSettings.CountAsync();

            var databaseStatus = new
            {
                CanConnect = canConnect,
                PendingMigrations = pendingMigrations.ToList(),
                AppliedMigrations = appliedMigrations.ToList(),
                TableCounts = new
                {
                    Users = userCount,
                    ProductCategories = productCategoryCount,
                    SystemSettings = systemSettingCount
                },
                DatabaseName = _context.Database.GetDbConnection().Database,
                Timestamp = DateTime.UtcNow
            };

            return Ok(databaseStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database status check failed");
            return StatusCode(500, new
            {
                Error = ex.Message,
                Timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Test email service by sending a test email to the specified address
    /// </summary>
    /// <param name="email">Email address to send test email to</param>
    /// <returns>Success or error message</returns>
    [HttpPost("test-email")]
    public async Task<IActionResult> TestEmail([FromQuery] string email)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest(new { error = "Email parameter is required" });
            }

            // Validate email format
            if (!email.Contains("@") || !email.Contains("."))
            {
                return BadRequest(new { error = "Invalid email format" });
            }

            _logger.LogInformation("Sending test email to: {Email}", email);

            // Send simple test email using order confirmation with test data
            var testItems = new List<TouriMate.Services.OrderItemInfo>
            {
                new TouriMate.Services.OrderItemInfo
                {
                    ProductName = "Test Email Service",
                    Quantity = 1,
                    Price = 0,
                    Variant = null
                }
            };

            var success = await _emailService.SendOrderConfirmationEmailAsync(
                toEmail: email,
                toName: "Test User",
                orderNumber: "TEST-EMAIL-001",
                totalAmount: 0,
                currency: "VND",
                items: testItems,
                shippingAddress: "This is a test email to verify email service configuration"
            );

            if (success)
            {
                _logger.LogInformation("Test email sent successfully to: {Email}", email);
                return Ok(new
                {
                    success = true,
                    message = $"Test email sent successfully to {email}",
                    timestamp = Entities.Common.TimeProvider.VietnamNow()
                });
            }
            else
            {
                _logger.LogWarning("Failed to send test email to: {Email}", email);
                return StatusCode(500, new
                {
                    success = false,
                    error = "Failed to send test email. Check email service configuration.",
                    timestamp = Entities.Common.TimeProvider.VietnamNow()
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending test email to: {Email}", email);
            return StatusCode(500, new
            {
                success = false,
                error = $"Error sending test email: {ex.Message}",
                timestamp = Entities.Common.TimeProvider.VietnamNow()
            });
        }
    }
}
