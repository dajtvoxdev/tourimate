using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;

namespace Entities.Models;

[Table("AuditLogs")]
public class AuditLog : BaseEntity
{
    public Guid? UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Action { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? EntityType { get; set; }

    public Guid? EntityId { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? OldValues { get; set; } // JSON

    [Column(TypeName = "nvarchar(max)")]
    public string? NewValues { get; set; } // JSON

    [MaxLength(45)]
    public string? IpAddress { get; set; }

    [MaxLength(500)]
    public string? UserAgent { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    // Computed properties
    [NotMapped]
    public bool IsUserAction => UserId.HasValue;

    [NotMapped]
    public bool HasChanges => !string.IsNullOrEmpty(OldValues) || !string.IsNullOrEmpty(NewValues);
}
