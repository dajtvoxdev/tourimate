using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;

namespace Entities.Models;

[Table("Costs")]
public class Cost : BaseEntity, IAuditableEntity
{
    [Required]
    [MaxLength(50)]
    public string CostCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string CostName { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "VND";

    [Required]
    [MaxLength(20)]
    public CostType Type { get; set; }

    [Required]
    [MaxLength(20)]
    public CostStatus Status { get; set; } = CostStatus.Pending;

    [Required]
    public Guid PayerId { get; set; } // Người trả tiền (Admin hoặc Tour Guide)

    [Required]
    public Guid RecipientId { get; set; } // Người nhận tiền (Tour Guide hoặc Admin)

    public Guid? RelatedEntityId { get; set; } // ID của tour, booking, refund liên quan

    [MaxLength(20)]
    public string? RelatedEntityType { get; set; } // Tour, Booking, Refund, etc.

    [MaxLength(100)]
    public string? ReferenceNumber { get; set; } // Số tham chiếu giao dịch

    public DateTime? DueDate { get; set; } // Ngày đến hạn thanh toán

    public DateTime? PaidDate { get; set; } // Ngày thanh toán thực tế

    [MaxLength(500)]
    public string? PaymentMethod { get; set; } // Phương thức thanh toán

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public bool IsRecurring { get; set; } = false; // Chi phí định kỳ

    public int? RecurringIntervalDays { get; set; } // Số ngày lặp lại

    public DateTime? NextDueDate { get; set; } // Ngày đến hạn tiếp theo

    // IAuditableEntity properties
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("PayerId")]
    public virtual User Payer { get; set; } = null!;

    [ForeignKey("RecipientId")]
    public virtual User Recipient { get; set; } = null!;

    [ForeignKey("CreatedBy")]
    public virtual User? Creator { get; set; }

    [ForeignKey("UpdatedBy")]
    public virtual User? Updater { get; set; }
}

public enum CostType
{
    TourGuidePayment = 1,      // Admin trả cho tour guide
    RefundPayment = 2,         // Admin hoàn tiền cho khách
    FeaturedTourFee = 3,       // Tour guide trả phí đăng tour nổi bật
    CommissionFee = 4,         // Phí hoa hồng
    ServiceFee = 5,            // Phí dịch vụ
    PenaltyFee = 6,            // Phí phạt
    Other = 7                  // Chi phí khác
}

public enum CostStatus
{
    Pending = 1,               // Chờ thanh toán
    Approved = 2,              // Đã duyệt
    Paid = 3,                  // Đã thanh toán
    Cancelled = 4,             // Đã hủy
    Overdue = 5                // Quá hạn
}

