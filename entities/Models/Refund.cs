using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;
using Entities.Enums;

namespace Entities.Models;

[Table("Refunds")]
public class Refund : BaseEntity, IAuditableEntity
{
    [Required]
    public Guid BookingId { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal RefundAmount { get; set; }

    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "VND";

    [Required]
    [MaxLength(20)]
    public string RefundStatus { get; set; } = "Pending"; // Pending, Processing, Completed, Failed, Cancelled

    [MaxLength(100)]
    public string? RefundBankName { get; set; }

    [MaxLength(50)]
    public string? RefundBankAccount { get; set; }

    [MaxLength(100)]
    public string? RefundBankCode { get; set; }

    [MaxLength(100)]
    public string? RefundAccountName { get; set; }

    [MaxLength(500)]
    public string? RefundReason { get; set; }

    [MaxLength(100)]
    public string? RefundReference { get; set; }

    public DateTime? RefundProcessedAt { get; set; }

    public DateTime? RefundCompletedAt { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? RefundNotes { get; set; }

    // Business rule fields
    [Required]
    public int DaysBeforeTour { get; set; } // Days before tour date when cancelled

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal RefundPercentage { get; set; } // Percentage of refund (100%, 50%, 0%)

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal OriginalAmount { get; set; } // Original booking amount

    // IAuditableEntity properties
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("BookingId")]
    public virtual Booking Booking { get; set; } = null!;

    // Computed properties
    [NotMapped]
    public bool IsPending => RefundStatus == "Pending";

    [NotMapped]
    public bool IsCompleted => RefundStatus == "Completed";

    [NotMapped]
    public bool IsFailed => RefundStatus == "Failed";

    [NotMapped]
    public bool IsProcessing => RefundStatus == "Processing";

    [NotMapped]
    public string RefundStatusText => RefundStatus switch
    {
        "Pending" => "Chờ xử lý",
        "Processing" => "Đang xử lý",
        "Completed" => "Hoàn thành",
        "Failed" => "Thất bại",
        "Cancelled" => "Đã hủy",
        _ => RefundStatus
    };
}

