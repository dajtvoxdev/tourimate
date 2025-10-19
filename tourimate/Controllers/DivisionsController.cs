using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using Entities.Models;

namespace tourimate.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DivisionsController : ControllerBase
{
    private readonly TouriMateDbContext _db;

    public DivisionsController(TouriMateDbContext db)
    {
        _db = db;
    }

    // GET: api/divisions
    [HttpGet]
    public async Task<ActionResult<List<DivisionDto>>> GetDivisions()
    {
        try
        {
            var divisions = await _db.Divisions
                .OrderBy(d => d.Type)
                .ThenBy(d => d.Name)
                .Select(d => new DivisionDto
                {
                    Id = d.Id.ToString(),
                    Code = d.Code,
                    Name = d.Name,
                    FullName = d.FullName,
                    Type = d.Type,
                    ParentCode = d.ParentCode,
                    IsActive = true,
                    CreatedAt = d.CreatedAt,
                    UpdatedAt = d.UpdatedAt
                })
                .ToListAsync();

            return Ok(divisions);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    // GET: api/divisions/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<DivisionDto>> GetDivision(Guid id)
    {
        try
        {
            var division = await _db.Divisions
                .Select(d => new DivisionDto
                {
                    Id = d.Id.ToString(),
                    Code = d.Code,
                    Name = d.Name,
                    FullName = d.FullName,
                    Type = d.Type,
                    ParentCode = d.ParentCode,
                    IsActive = true,
                    CreatedAt = d.CreatedAt,
                    UpdatedAt = d.UpdatedAt
                })
                .FirstOrDefaultAsync(d => d.Id == id.ToString());

            if (division == null)
                return NotFound($"Không tìm thấy division với ID: {id}");

            return Ok(division);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    // GET: api/divisions/by-code/{code}
    [HttpGet("by-code/{code}")]
    public async Task<ActionResult<DivisionDto>> GetDivisionByCode(int code)
    {
        try
        {
            var division = await _db.Divisions
                .Select(d => new DivisionDto
                {
                    Id = d.Id.ToString(),
                    Code = d.Code,
                    Name = d.Name,
                    FullName = d.FullName,
                    Type = d.Type,
                    ParentCode = d.ParentCode,
                    IsActive = true,
                    CreatedAt = d.CreatedAt,
                    UpdatedAt = d.UpdatedAt
                })
                .FirstOrDefaultAsync(d => d.Code == code);

            if (division == null)
                return NotFound($"Không tìm thấy division với Code: {code}");

            return Ok(division);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    // GET: api/divisions/provinces
    [HttpGet("provinces")]
    public async Task<ActionResult<List<DivisionDto>>> GetProvinces()
    {
        try
        {
            var provinces = await _db.Divisions
                .Where(d => !d.ParentCode.HasValue)
                .OrderBy(d => d.Type).ThenBy(d => d.Name)
                .Select(d => new DivisionDto
                {
                    Id = d.Id.ToString(),
                    Code = d.Code,
                    Name = d.Name,
                    FullName = d.FullName,
                    Type = d.Type,
                    ParentCode = d.ParentCode,
                    IsActive = true,
                    CreatedAt = d.CreatedAt,
                    UpdatedAt = d.UpdatedAt
                })
                .ToListAsync();

            return Ok(provinces);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }
    

    // GET: api/divisions/wards-by-province/{provinceCode}
    [HttpGet("wards-by-province/{provinceCode}")]
    public async Task<ActionResult<List<DivisionDto>>> GetWardsByProvince(int provinceCode)
    {
        try
        {
  
            var wards = await _db.Divisions
                .Where(d =>  d.ParentCode.HasValue && provinceCode == d.ParentCode.Value)
                .OrderBy(d => d.Name)
                .Select(d => new DivisionDto
                {
                    Id = d.Id.ToString(),
                    Code = d.Code,
                    Name = d.Name,
                    FullName = d.FullName,
                    Type = d.Type,
                    ParentCode = d.ParentCode,
                    IsActive = true,
                    CreatedAt = d.CreatedAt,
                    UpdatedAt = d.UpdatedAt
                })
                .ToListAsync();

            return Ok(wards);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }
}

public class DivisionDto
{
    public string Id { get; set; } = string.Empty;
    public int Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string Type { get; set; } = string.Empty;
    public int? ParentCode { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}