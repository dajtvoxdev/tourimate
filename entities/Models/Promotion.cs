using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;
using Entities.Enums;

namespace Entities.Models;

[Table("Promotions")]
public class Promotion : BaseEntity, IAuditableEntity
{
    [Required]
    public Guid EntityId { get; set; } // Tour or Product ID

    [Required]
    [MaxLength(20)]
    public string EntityType { get; set; } = string.Empty; // Tour, Product

    [Required]
    [MaxLength(20)]
    public string PromotionType { get; set; } = string.Empty; // featured, sponsored, banner

    [Required]
    public Guid RequestedBy { get; set; }

    [Required]
    public int Duration { get; set; } // days

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Cost { get; set; }

    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "VND";

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "pending_payment"; // pending_payment, active, expired, cancelled

    [Required]
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

    [MaxLength(100)]
    public string? PaymentId { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public int ViewCount { get; set; } = 0;

    public int ClickCount { get; set; } = 0;

    public int ConversionCount { get; set; } = 0;

    // IAuditableEntity properties
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("RequestedBy")]
    public virtual User RequestedByUser { get; set; } = null!;

    // Note: Tour and Product navigation properties removed to avoid cascade conflicts
    // Use EntityId and EntityType to identify the related entity
    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();

    // Computed properties
    [NotMapped]
    public bool IsActive => Status == "active" && 
        StartDate <= DateTime.UtcNow && 
        EndDate >= DateTime.UtcNow;

    [NotMapped]
    public bool IsExpired => EndDate < DateTime.UtcNow;

    [NotMapped]
    public decimal ClickThroughRate => ViewCount > 0 ? (decimal)ClickCount / ViewCount * 100 : 0;

    [NotMapped]
    public decimal ConversionRate => ClickCount > 0 ? (decimal)ConversionCount / ClickCount * 100 : 0;
}
