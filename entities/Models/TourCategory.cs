using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;

namespace Entities.Models;

[Table("TourCategories")]
public class TourCategory : BaseEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(200)]
    public string? Icon { get; set; }

    [MaxLength(50)]
    public string Code { get; set; } = string.Empty; // Short code for easy reference

    public Guid? ParentId { get; set; }

    public int SortOrder { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    // Navigation properties
    [ForeignKey("ParentId")]
    public virtual TourCategory? Parent { get; set; }

    public virtual ICollection<TourCategory> Children { get; set; } = new List<TourCategory>();
    public virtual ICollection<Tour> Tours { get; set; } = new List<Tour>();

    // Computed properties
    [NotMapped]
    public bool HasChildren => Children.Any();

    [NotMapped]
    public bool IsRootCategory => ParentId == null;
}
