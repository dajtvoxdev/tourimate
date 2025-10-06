using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using Entities.Models;
using System.Net.Http.Json;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class DivisionsController : ControllerBase
{
    private readonly TouriMateDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;

    public DivisionsController(TouriMateDbContext db, IHttpClientFactory httpClientFactory)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Division>>> GetAll()
    {
        var list = await _db.Divisions.AsNoTracking().OrderBy(d => d.Name).ToListAsync();
        return Ok(list);
    }

    [HttpGet("wards")]
    public async Task<ActionResult<IEnumerable<Division>>> GetWards([FromQuery] int provinceCode)
    {
        var list = await _db.Divisions.AsNoTracking().Where(d => d.ParentCode == provinceCode).OrderBy(d => d.Name).ToListAsync();
        return Ok(list);
    }

    // Sync divisions from provinces.open-api.vn
    [HttpPost("sync")]
    public async Task<IActionResult> Sync()
    {
        var client = _httpClientFactory.CreateClient();
        // provinces API v2 with depth=2 to include wards in response
        // Docs: https://provinces.open-api.vn/api/v2/redoc
        var provinces = await client.GetFromJsonAsync<List<ProvinceWithWardsDto>>("https://provinces.open-api.vn/api/v2/?depth=2");
        if (provinces == null) return StatusCode(502, "Không thể tải dữ liệu từ provinces API");

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
            }
        }

        await _db.SaveChangesAsync();

        // Fetch wards (communes) per province (could be many; stream sequentially)
        // Upsert wards from embedded arrays
        var allWards = provinces.SelectMany(p => (p.wards ?? new List<WardDto>()).Select(w => (provinceCode: p.code, ward: w))).ToList();
        var wardCodes = allWards.Select(x => x.ward.code).ToList();
        var existingWardDivs = await _db.Divisions.Where(d => wardCodes.Contains(d.Code)).ToListAsync();
        var existingWardByCode = existingWardDivs.ToDictionary(d => d.Code, d => d);

        foreach (var pair in allWards)
        {
            var provinceCode = pair.provinceCode;
            var w = pair.ward;
            if (existingWardByCode.TryGetValue(w.code, out var divWard))
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
                    Code = w.code,
                    Name = w.name,
                    FullName = w.name,
                    Type = w.division_type,
                    CodeName = w.codename,
                    ParentCode = provinceCode
                });
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


