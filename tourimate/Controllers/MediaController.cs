using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TouriMate.Services.Abstractions;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class MediaController : ControllerBase
{
    private readonly IMediaService _mediaService;

    public MediaController(IMediaService mediaService)
    {
        _mediaService = mediaService;
    }

    [HttpPost("upload")]
    [Authorize]
    [RequestSizeLimit(20_000_000)] // 20 MB
    public async Task<IActionResult> Upload([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("Không có tệp để tải lên");
        }

        try
        {
            await using var stream = file.OpenReadStream();
            var url = await _mediaService.UploadAsync(stream, file.FileName);
            return Ok(new { url });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}


