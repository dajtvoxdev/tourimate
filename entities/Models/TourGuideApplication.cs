using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;
using Entities.Enums;

namespace Entities.Models;

[Table("TourGuideApplications")]
public class TourGuideApplication : BaseEntity, IAuditableEntity
{
    [Required]
    public Guid UserId { get; set; }

    [Required]
    [Column(TypeName = "nvarchar(max)")]
    public string ApplicationData { get; set; } = string.Empty; // JSON containing all application info

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "pending_review"; // pending_review, approved, rejected

    public Guid? ReviewedBy { get; set; }

    public DateTime? ReviewedAt { get; set; }

    [MaxLength(1000)]
    public string? Feedback { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? Documents { get; set; } // JSON array of document URLs

    // IAuditableEntity properties
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [ForeignKey("ReviewedBy")]
    public virtual User? Reviewer { get; set; }
}
