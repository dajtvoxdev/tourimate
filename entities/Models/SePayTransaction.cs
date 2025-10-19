using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;

namespace Entities.Models;

[Table("SePayTransactions")]
public class SePayTransaction : BaseEntity, IAuditableEntity
{
    [Required]
    public int SePayTransactionId { get; set; } // ID giao dịch từ SePay

    [Required]
    [MaxLength(100)]
    public string Gateway { get; set; } = string.Empty; // Brand name của ngân hàng

    [Required]
    public DateTime TransactionDate { get; set; } // Thời gian xảy ra giao dịch

    [Required]
    [MaxLength(20)]
    public string AccountNumber { get; set; } = string.Empty; // Số tài khoản ngân hàng

    [MaxLength(50)]
    public string? Code { get; set; } // Mã code thanh toán

    [Required]
    [Column(TypeName = "nvarchar(max)")]
    public string Content { get; set; } = string.Empty; // Nội dung chuyển khoản

    [Required]
    [MaxLength(10)]
    public string TransferType { get; set; } = string.Empty; // "in" hoặc "out"

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TransferAmount { get; set; } // Số tiền giao dịch

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Accumulated { get; set; } // Số dư tài khoản (lũy kế)

    [MaxLength(20)]
    public string? SubAccount { get; set; } // Tài khoản ngân hàng phụ

    [MaxLength(100)]
    public string? ReferenceCode { get; set; } // Mã tham chiếu của tin nhắn SMS

    [Column(TypeName = "nvarchar(max)")]
    public string? Description { get; set; } // Toàn bộ nội dung tin nhắn SMS

    // Foreign key to Order or Booking
    public Guid? EntityId { get; set; }
    
    [MaxLength(20)]
    public string? EntityType { get; set; } // "Order", "Booking"

    // Processing status
    [Required]
    [MaxLength(20)]
    public string ProcessingStatus { get; set; } = "pending"; // pending, processed, failed

    [MaxLength(500)]
    public string? ProcessingNotes { get; set; }

    public DateTime? ProcessedAt { get; set; }

    // IAuditableEntity properties
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("EntityId")]
    public virtual Order? Order { get; set; }

    [ForeignKey("EntityId")]
    public virtual Booking? Booking { get; set; }

    // Computed properties
    [NotMapped]
    public bool IsMoneyIn => TransferType == "in";

    [NotMapped]
    public bool IsMoneyOut => TransferType == "out";

    [NotMapped]
    public bool IsProcessed => ProcessingStatus == "processed";

    [NotMapped]
    public bool HasPaymentCode => !string.IsNullOrEmpty(Code);
}
