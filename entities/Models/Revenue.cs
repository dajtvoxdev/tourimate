using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;

namespace Entities.Models;

[Table("Revenue")]
public class Revenue : BaseEntity
{
    [Required]
    public Guid TransactionId { get; set; }

    [Required]
    public Guid UserId { get; set; } // Tour guide or vendor

    [Required]
    public Guid EntityId { get; set; } // Tour or Product ID

    [Required]
    [MaxLength(20)]
    public string EntityType { get; set; } = string.Empty; // Tour, Product

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal GrossAmount { get; set; }

    [Required]
    [Column(TypeName = "decimal(5,4)")]
    public decimal CommissionRate { get; set; } // 0.15 for 15%

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal CommissionAmount { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal NetAmount { get; set; }

    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "VND";

    [Required]
    [MaxLength(20)]
    public string PayoutStatus { get; set; } = "pending"; // pending, paid, held

    public DateTime? PayoutDate { get; set; }

    [MaxLength(100)]
    public string? PayoutReference { get; set; }

    // Navigation properties
    [ForeignKey("TransactionId")]
    public virtual Transaction Transaction { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [ForeignKey("EntityId")]
    public virtual Tour? Tour { get; set; }

    [ForeignKey("EntityId")]
    public virtual Product? Product { get; set; }

    // Computed properties
    [NotMapped]
    public bool IsPaid => PayoutStatus == "paid";

    [NotMapped]
    public bool IsPending => PayoutStatus == "pending";

    [NotMapped]
    public bool IsHeld => PayoutStatus == "held";

    [NotMapped]
    public decimal CommissionPercentage => CommissionRate * 100;
}
