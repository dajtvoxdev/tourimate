using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/banks")]
public class BankController : ControllerBase
{
    private readonly ILogger<BankController> _logger;
    private readonly IWebHostEnvironment _environment;

    public BankController(ILogger<BankController> logger, IWebHostEnvironment environment)
    {
        _logger = logger;
        _environment = environment;
    }

    /// <summary>
    /// Get list of supported banks
    /// </summary>
    /// <returns>List of banks</returns>
    [HttpGet]
    public async Task<IActionResult> GetBanks()
    {
        try
        {
            var banksJsonPath = Path.Combine(_environment.ContentRootPath, "Data", "banks.json");
            
            if (!System.IO.File.Exists(banksJsonPath))
            {
                return NotFound("Banks data not found");
            }

            var jsonContent = await System.IO.File.ReadAllTextAsync(banksJsonPath);
            var banksData = JsonSerializer.Deserialize<BanksResponse>(jsonContent);

            if (banksData?.Data == null)
            {
                return NotFound("Invalid banks data");
            }

            // Filter only supported banks
            var supportedBanks = banksData.Data
                .Where(bank => bank.Supported)
                .Select(bank => new
                {
                    bank.Name,
                    bank.Code,
                    bank.ShortName,
                    bank.Bin
                })
                .OrderBy(bank => bank.Name)
                .ToList();

            return Ok(supportedBanks);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting banks data");
            return StatusCode(500, "Internal server error");
        }
    }
}

public class BanksResponse
{
    [JsonPropertyName("no_banks")]
    public string NoBanks { get; set; } = string.Empty;
    
    [JsonPropertyName("data")]
    public List<BankInfo> Data { get; set; } = new();
}

public class BankInfo
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;
    
    [JsonPropertyName("bin")]
    public string Bin { get; set; } = string.Empty;
    
    [JsonPropertyName("short_name")]
    public string ShortName { get; set; } = string.Empty;
    
    [JsonPropertyName("supported")]
    public bool Supported { get; set; }
}

