using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;

namespace Entities.Models;

[Table("ReviewReplies")]
public class ReviewReply : BaseEntity, IAuditableEntity
{
    [Required]
    public Guid ReviewId { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Content { get; set; } = string.Empty;

    // IAuditableEntity properties
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("ReviewId")]
    public virtual Review Review { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    // Computed properties
    [NotMapped]
    public bool CanBeEdited => UserId == CreatedBy && DateTime.UtcNow.Subtract(CreatedAt).TotalMinutes <= 30;
}
