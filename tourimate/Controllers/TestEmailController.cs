using Microsoft.AspNetCore.Mvc;
using TouriMate.Services;
using TouriMate.Data;
using Microsoft.EntityFrameworkCore;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class TestEmailController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly ILogger<TestEmailController> _logger;
    private readonly TouriMateDbContext _db;

    public TestEmailController(IEmailService emailService, ILogger<TestEmailController> logger, TouriMateDbContext db)
    {
        _emailService = emailService;
        _logger = logger;
        _db = db;
    }

    [HttpPost("send-test-email")]
    public async Task<IActionResult> SendTestEmail([FromBody] TestEmailRequest request)
    {
        try
        {
            var result = await _emailService.SendTourGuideApplicationStatusEmailAsync(
                request.Email, 
                request.Name, 
                request.Status, 
                request.Feedback
            );

            if (result)
            {
                return Ok(new { message = "Email sent successfully" });
            }
            else
            {
                return BadRequest(new { message = "Failed to send email" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending test email");
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpGet("check-user-email/{applicationId}")]
    public async Task<IActionResult> CheckUserEmail(Guid applicationId)
    {
        try
        {
            var application = await _db.TourGuideApplications
                .Include(a => a.User)
                .FirstOrDefaultAsync(a => a.Id == applicationId);

            if (application == null)
            {
                return NotFound(new { message = "Application not found" });
            }

            var userInfo = new
            {
                applicationId = application.Id,
                userId = application.UserId,
                userEmail = application.User.Email,
                userFirstName = application.User.FirstName,
                userLastName = application.User.LastName,
                userFullName = $"{application.User.FirstName} {application.User.LastName}".Trim(),
                emailIsNull = application.User.Email == null,
                emailIsEmpty = string.IsNullOrEmpty(application.User.Email),
                emailIsWhiteSpace = string.IsNullOrWhiteSpace(application.User.Email)
            };

            return Ok(userInfo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking user email");
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }
}

public class TestEmailRequest
{
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Feedback { get; set; }
}
