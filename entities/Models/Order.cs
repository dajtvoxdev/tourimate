using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;
using Entities.Enums;

namespace Entities.Models;

[Table("Orders")]
public class Order : BaseEntity, IAuditableEntity
{
    [Required]
    [MaxLength(20)]
    public string OrderNumber { get; set; } = string.Empty;

    [Required]
    public Guid CustomerId { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal ShippingFee { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Tax { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Discount { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "VND";

    [Required]
    public OrderStatus Status { get; set; } = OrderStatus.PendingPayment;

    [Required]
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

    [MaxLength(100)]
    public string? PaymentId { get; set; }

    [MaxLength(50)]
    public string? PaymentMethod { get; set; }

    [Required]
    [Column(TypeName = "nvarchar(max)")]
    public string ShippingAddress { get; set; } = string.Empty; // JSON

    [Column(TypeName = "nvarchar(max)")]
    public string? BillingAddress { get; set; } // JSON

    [MaxLength(100)]
    public string? TrackingNumber { get; set; }

    [MaxLength(50)]
    public string? ShippingMethod { get; set; }

    public DateOnly? EstimatedDelivery { get; set; }

    public DateTime? DeliveredAt { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [MaxLength(500)]
    public string? CancellationReason { get; set; }

    public DateTime? CancelledAt { get; set; }

    // IAuditableEntity properties
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("CustomerId")]
    public virtual User Customer { get; set; } = null!;

    public virtual ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();

    // Computed properties
    [NotMapped]
    public int TotalItems => Items.Sum(i => i.Quantity);

    [NotMapped]
    public bool CanBeCancelled => Status == OrderStatus.Processing && PaymentStatus == PaymentStatus.Paid;

    [NotMapped]
    public bool CanBeReturned => Status == OrderStatus.Delivered && 
        DeliveredAt.HasValue && 
        DateTime.UtcNow.Subtract(DeliveredAt.Value).TotalDays <= 30;

    [NotMapped]
    public bool IsDelivered => Status == OrderStatus.Delivered;

    [NotMapped]
    public decimal EffectiveTotal => Subtotal + ShippingFee + Tax - Discount;
}
