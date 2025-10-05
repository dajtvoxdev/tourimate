using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;

namespace Entities.Models;

[Table("Reports")]
public class Report : BaseEntity, IAuditableEntity
{
    [Required]
    public Guid ReportedBy { get; set; }

    [Required]
    public Guid EntityId { get; set; } // Review, User, Tour, Product ID

    [Required]
    [MaxLength(20)]
    public string EntityType { get; set; } = string.Empty; // Review, User, Tour, Product

    [Required]
    [MaxLength(50)]
    public string Reason { get; set; } = string.Empty; // inappropriate_content, spam, fake_review, harassment

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? Evidence { get; set; } // JSON array of evidence URLs

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "pending"; // pending, investigating, resolved, dismissed

    public Guid? ReviewedBy { get; set; }

    public DateTime? ReviewedAt { get; set; }

    [MaxLength(1000)]
    public string? Resolution { get; set; }

    // IAuditableEntity properties
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("ReportedBy")]
    public virtual User ReportedByUser { get; set; } = null!;

    [ForeignKey("ReviewedBy")]
    public virtual User? ReviewedByUser { get; set; }

    [ForeignKey("EntityId")]
    public virtual Review? Review { get; set; }

    // Computed properties
    [NotMapped]
    public bool IsPending => Status == "pending";

    [NotMapped]
    public bool IsResolved => Status == "resolved" || Status == "dismissed";

    [NotMapped]
    public bool RequiresAction => Status == "pending" || Status == "investigating";
}
