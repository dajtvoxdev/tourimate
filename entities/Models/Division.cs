using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;

namespace Entities.Models;

[Table("Divisions")]
public class Division : BaseEntity
{
    // Code from provinces.open-api.vn (e.g., province code)
    [Required]
    public int Code { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? FullName { get; set; }

    [MaxLength(50)]
    public string? Type { get; set; }

    [MaxLength(200)]
    public string? NameEn { get; set; }

    [MaxLength(200)]
    public string? CodeName { get; set; }

    // For hierarchical mapping (e.g., ward -> belongs to province)
    public int? ParentCode { get; set; }

    // Navigation
    public virtual ICollection<Tour> Tours { get; set; } = new List<Tour>();
}


