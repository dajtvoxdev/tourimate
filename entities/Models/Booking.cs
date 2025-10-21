using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;
using Entities.Enums;

namespace Entities.Models;

[Table("Bookings")]
public class Booking : BaseEntity, IAuditableEntity
{
    [Required]
    [MaxLength(20)]
    public string BookingNumber { get; set; } = string.Empty;

    [Required]
    public Guid TourId { get; set; }

    [Required]
    public Guid TourAvailabilityId { get; set; }

    [Required]
    public Guid CustomerId { get; set; }

    [Required]
    public DateOnly TourDate { get; set; }

    [MaxLength(10)]
    public string? TimeSlot { get; set; }

    [Required]
    public int AdultCount { get; set; }

    [Required]
    public int ChildCount { get; set; }

    [NotMapped]
    public int Participants => AdultCount + ChildCount;

    [Column(TypeName = "nvarchar(max)")]
    public string? ParticipantDetails { get; set; } // JSON

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "VND";

    [Required]
    public BookingStatus Status { get; set; } = BookingStatus.PendingPayment;

    [Required]
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

    [MaxLength(100)]
    public string? PaymentId { get; set; }

    [MaxLength(50)]
    public string? PaymentMethod { get; set; }

    [MaxLength(1000)]
    public string? SpecialRequests { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? ContactInfo { get; set; } // JSON

    [MaxLength(500)]
    public string? CancellationReason { get; set; }

    public DateTime? CancelledAt { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? RefundAmount { get; set; }

    public DateTime? RefundedAt { get; set; }

    // Refund bank information
    [MaxLength(100)]
    public string? RefundBankName { get; set; }

    [MaxLength(50)]
    public string? RefundBankAccount { get; set; }

    [MaxLength(100)]
    public string? RefundBankCode { get; set; }

    [MaxLength(100)]
    public string? RefundAccountName { get; set; }

    // IAuditableEntity properties
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("TourId")]
    public virtual Tour Tour { get; set; } = null!;

    [ForeignKey("TourAvailabilityId")]
    public virtual TourAvailability TourAvailability { get; set; } = null!;

    [ForeignKey("CustomerId")]
    public virtual User Customer { get; set; } = null!;

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public virtual ICollection<Refund> Refunds { get; set; } = new List<Refund>();

    // Computed properties
    [NotMapped]
    public bool CanBeCancelled => Status == BookingStatus.Confirmed && TourDate > DateOnly.FromDateTime(DateTime.UtcNow.AddHours(24));

    [NotMapped]
    public bool CanBeReviewed => Status == BookingStatus.Completed && !Reviews.Any();

    [NotMapped]
    public bool IsUpcoming => TourDate > DateOnly.FromDateTime(DateTime.UtcNow) && Status == BookingStatus.Confirmed;
}
