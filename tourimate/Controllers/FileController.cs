using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Net.Http;
using System.Net;

namespace tourimate.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FileController : ControllerBase
{
    private readonly HttpClient _httpClient;

    public FileController(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    [HttpGet("preview")]
    [Authorize]
    public async Task<IActionResult> PreviewFile([FromQuery] string url)
    {
        if (string.IsNullOrEmpty(url))
        {
            return BadRequest("URL parameter is required");
        }

        try
        {
            // Validate that the URL is from Cloudinary (security check)
            if (!url.StartsWith("https://res.cloudinary.com/"))
            {
                return BadRequest("Invalid file URL");
            }

            // Download the file from Cloudinary
            var response = await _httpClient.GetAsync(url);
            
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, "Failed to fetch file from Cloudinary");
            }

            var content = await response.Content.ReadAsByteArrayAsync();
            var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/octet-stream";

            // Return the file with proper headers
            return File(content, contentType);
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(500, $"Error fetching file: {ex.Message}");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Unexpected error: {ex.Message}");
        }
    }

    [HttpGet("preview/pdf")]
    [Authorize]
    public async Task<IActionResult> PreviewPdf([FromQuery] string url)
    {
        if (string.IsNullOrEmpty(url))
        {
            return BadRequest("URL parameter is required");
        }

        try
        {
            // Validate that the URL is from Cloudinary (security check)
            if (!url.StartsWith("https://res.cloudinary.com/"))
            {
                return BadRequest("Invalid file URL");
            }

            // Download the PDF from Cloudinary
            var response = await _httpClient.GetAsync(url);
            
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, "Failed to fetch PDF from Cloudinary");
            }

            var content = await response.Content.ReadAsByteArrayAsync();
            
            // Set proper headers for PDF viewing
            Response.Headers.Append("Content-Disposition", "inline; filename=\"document.pdf\"");
            Response.Headers.Append("X-Content-Type-Options", "nosniff");
            
            return File(content, "application/pdf");
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(500, $"Error fetching PDF: {ex.Message}");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Unexpected error: {ex.Message}");
        }
    }
}
