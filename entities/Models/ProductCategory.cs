using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;

namespace Entities.Models;

[Table("ProductCategories")]
public class ProductCategory : BaseEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(200)]
    public string? Icon { get; set; }

    public Guid? ParentId { get; set; }

    public int SortOrder { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    // Navigation properties
    [ForeignKey("ParentId")]
    public virtual ProductCategory? Parent { get; set; }

    public virtual ICollection<ProductCategory> Children { get; set; } = new List<ProductCategory>();
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    // Computed properties
    [NotMapped]
    public bool HasChildren => Children.Any();

    [NotMapped]
    public bool IsRootCategory => ParentId == null;
}
