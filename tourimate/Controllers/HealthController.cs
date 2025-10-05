using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TouriMate.Data;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly TouriMateDbContext _context;
    private readonly ILogger<HealthController> _logger;

    public HealthController(TouriMateDbContext context, ILogger<HealthController> logger)
    {
        _context = context;
        _logger = logger;
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
}
