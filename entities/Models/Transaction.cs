using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;
using Entities.Enums;

namespace Entities.Models;

[Table("Transactions")]
public class Transaction : BaseEntity, IAuditableEntity
{
    [Required]
    [MaxLength(100)]
    public string TransactionId { get; set; } = string.Empty;

    [Required]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(20)]
    public string Type { get; set; } = string.Empty; // booking_payment, order_payment, promotion_payment, refund, payout

    public Guid? EntityId { get; set; } // Booking, Order, or Promotion ID

    [MaxLength(20)]
    public string? EntityType { get; set; } // Booking, Order, Promotion

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "VND";

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "pending"; // pending, completed, failed, cancelled, refunded

    [MaxLength(50)]
    public string? PaymentMethod { get; set; }

    [MaxLength(50)]
    public string? PaymentGateway { get; set; }

    [MaxLength(200)]
    public string? GatewayTransactionId { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? GatewayResponse { get; set; } // JSON

    [MaxLength(500)]
    public string? Description { get; set; }

    // IAuditableEntity properties
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [ForeignKey("EntityId")]
    public virtual Booking? Booking { get; set; }

    [ForeignKey("EntityId")]
    public virtual Order? Order { get; set; }

    [ForeignKey("EntityId")]
    public virtual Promotion? Promotion { get; set; }

    public virtual ICollection<Revenue> Revenues { get; set; } = new List<Revenue>();

    // Computed properties
    [NotMapped]
    public bool IsCompleted => Status == "completed";

    [NotMapped]
    public bool IsPending => Status == "pending";

    [NotMapped]
    public bool IsFailed => Status == "failed";

    [NotMapped]
    public bool IsPayment => Type.EndsWith("_payment");

    [NotMapped]
    public bool IsRefund => Type == "refund";
}
