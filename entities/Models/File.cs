using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;

namespace Entities.Models;

[Table("Files")]
public class File : BaseEntity, IAuditableEntity
{
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string OriginalFileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(10)]
    public string FileExtension { get; set; } = string.Empty;

    [Required]
    public long FileSize { get; set; }

    [Required]
    [MaxLength(100)]
    public string MimeType { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string FilePath { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string FileUrl { get; set; } = string.Empty;

    public Guid? EntityId { get; set; } // Related entity ID

    [MaxLength(50)]
    public string? EntityType { get; set; } // Tour, Product, User, Review, etc.

    [Required]
    public Guid UploadedBy { get; set; }

    // IAuditableEntity properties
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("UploadedBy")]
    public virtual User UploadedByUser { get; set; } = null!;

    // Computed properties
    [NotMapped]
    public bool IsImage => MimeType.StartsWith("image/");

    [NotMapped]
    public bool IsDocument => MimeType.StartsWith("application/");

    [NotMapped]
    public string FileSizeFormatted
    {
        get
        {
            var size = (double)FileSize;
            string[] sizes = { "B", "KB", "MB", "GB" };
            var order = 0;
            while (size >= 1024 && order < sizes.Length - 1)
            {
                order++;
                size /= 1024;
            }
            return $"{size:0.##} {sizes[order]}";
        }
    }
}
