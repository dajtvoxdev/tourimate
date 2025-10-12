using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using Entities.Models;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using System.Text.Json;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class DivisionsController : ControllerBase
{
    private readonly TouriMateDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IWebHostEnvironment _env;

    public DivisionsController(TouriMateDbContext db, IHttpClientFactory httpClientFactory, IWebHostEnvironment env)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _env = env;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Division>>> GetAll()
    {
        var list = await _db.Divisions.AsNoTracking().OrderBy(d => d.Name).ToListAsync();
        return Ok(list);
    }

    [HttpGet("provinces")]
    public async Task<ActionResult<IEnumerable<Division>>> GetProvinces()
    {
        var list = await _db.Divisions.AsNoTracking().Where(d => d.ParentCode == null).OrderBy(d => d.Name).ToListAsync();
        return Ok(list);
    }

    [HttpGet("wards")]
    public async Task<ActionResult<IEnumerable<Division>>> GetWards([FromQuery] int provinceCode)
    {
        var list = await _db.Divisions.AsNoTracking().Where(d => d.ParentCode == provinceCode).OrderBy(d => d.Name).ToListAsync();
        return Ok(list);
    }

    // Sync divisions from local Data/division.json
    [HttpPost("sync")]
    public async Task<IActionResult> Sync()
    {
        var filePath = Path.Combine(_env.ContentRootPath, "Data", "division.json");
        if (!System.IO.File.Exists(filePath))
        {
            return NotFound("Không tìm thấy Data/division.json");
        }

        List<ProvinceWithWardsDto>? provinces;
        try
        {
            var json = await System.IO.File.ReadAllTextAsync(filePath);
            provinces = JsonSerializer.Deserialize<List<ProvinceWithWardsDto>>(json);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi đọc division.json: {ex.Message}");
        }

        if (provinces == null)
        {
            return StatusCode(500, "Dữ liệu division.json không hợp lệ");
        }

        // Build used code set from DB to prevent duplicates during this sync
        var usedCodes = new HashSet<int>(await _db.Divisions.Select(d => d.Code).ToListAsync());

        // Upsert by Code
        var codes = provinces.Select(p => p.code).ToHashSet();
        var existing = await _db.Divisions.Where(d => codes.Contains(d.Code)).ToListAsync();
        var existingByCode = existing.ToDictionary(d => d.Code, d => d);

        foreach (var p in provinces)
        {
            if (existingByCode.TryGetValue(p.code, out var div))
            {
                div.Name = p.name;
                div.FullName = p.name;
                div.Type = p.division_type;
                div.NameEn = p.name_en;
                div.CodeName = p.codename;
                usedCodes.Add(p.code);
            }
            else
            {
                _db.Divisions.Add(new Division
                {
                    Code = p.code,
                    Name = p.name,
                    FullName = p.name,
                    Type = p.division_type,
                    NameEn = p.name_en,
                    CodeName = p.codename
                });
                usedCodes.Add(p.code);
                existingByCode[p.code] = _db.ChangeTracker.Entries<Division>().Last().Entity;
            }
        }

        await _db.SaveChangesAsync();

        // Fetch wards (communes) per province and remap codes to avoid collision with province codes
        // Use deterministic mapping: storedWardCode = provinceCode * 1000 + (originalWardCode % 1000)
        static int ResolveWardCode(int provinceCode, int wardCode)
        {
            var suffix = Math.Abs(wardCode % 1000);
            return checked(provinceCode * 1000 + suffix);
        }

        var allWards = provinces
            .SelectMany(p => (p.wards ?? new List<WardDto>())
                .Select(w => (provinceCode: p.code, ward: w, storedCode: ResolveWardCode(p.code, w.code))))
            .ToList();

        var wardCodes = allWards.Select(x => x.storedCode).ToList();
        var existingWardDivs = await _db.Divisions.Where(d => wardCodes.Contains(d.Code)).ToListAsync();
        var existingWardByCode = existingWardDivs.ToDictionary(d => d.Code, d => d);

        foreach (var pair in allWards)
        {
            var provinceCode = pair.provinceCode;
            var w = pair.ward;
            var storedCode = pair.storedCode;
            // Ensure uniqueness across already used codes and current change tracker
            while (usedCodes.Contains(storedCode) || _db.ChangeTracker.Entries<Division>().Any(e => e.Entity.Code == storedCode))
            {
                storedCode++;
            }

            if (existingWardByCode.TryGetValue(storedCode, out var divWard))
            {
                divWard.Name = w.name;
                divWard.FullName = w.name;
                divWard.Type = w.division_type;
                divWard.CodeName = w.codename;
                divWard.ParentCode = provinceCode;
            }
            else
            {
                _db.Divisions.Add(new Division
                {
                    Code = storedCode,
                    Name = w.name,
                    FullName = w.name,
                    Type = w.division_type,
                    CodeName = w.codename,
                    ParentCode = provinceCode
                });
                usedCodes.Add(storedCode);
                var added = _db.ChangeTracker.Entries<Division>().Last().Entity;
                existingWardByCode[storedCode] = added;
            }
        }
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private sealed class ProvinceWithWardsDto
    {
        public int code { get; set; }
        public string name { get; set; } = string.Empty;
        public string? name_en { get; set; }
        public string? division_type { get; set; }
        public string? codename { get; set; }
        public int? phone_code { get; set; }
        public List<WardDto>? wards { get; set; }
    }

    private sealed class WardDto
    {
        public int code { get; set; }
        public string name { get; set; } = string.Empty;
        public string? division_type { get; set; }
        public string? codename { get; set; }
    }
}


