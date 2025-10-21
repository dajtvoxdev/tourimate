using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;
using Entities.Enums;

namespace Entities.Models;

[Table("Reviews")]
public class Review : BaseEntity, IAuditableEntity
{
    [Required]
    public Guid UserId { get; set; }

    [Required]
    public Guid EntityId { get; set; } // Tour or Product ID

    [Required]
    [MaxLength(20)]
    public string EntityType { get; set; } = string.Empty; // Tour, Product

    public Guid? BookingId { get; set; } // For tour reviews

    public Guid? OrderId { get; set; } // For product reviews

    [Required]
    [Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(200)]
    public string? Title { get; set; }

    [Required]
    [Column(TypeName = "nvarchar(max)")]
    public string Content { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string? Images { get; set; } // JSON array of image URLs

    public bool IsVerified { get; set; } = false;

    [Required]
    public ReviewStatus Status { get; set; } = ReviewStatus.Pending;

    public int HelpfulVotes { get; set; } = 0;

    public int ReportCount { get; set; } = 0;

    // IAuditableEntity properties
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [ForeignKey("BookingId")]
    public virtual Booking? Booking { get; set; }

    [ForeignKey("OrderId")]
    public virtual Order? Order { get; set; }

    public virtual ICollection<ReviewReply> Replies { get; set; } = new List<ReviewReply>();
    public virtual ICollection<ReviewHelpfulVote> HelpfulVotesList { get; set; } = new List<ReviewHelpfulVote>();
    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();

    // Computed properties
    [NotMapped]
    public bool IsTourReview => EntityType == "Tour";

    [NotMapped]
    public bool IsProductReview => EntityType == "Product";

    [NotMapped]
    public bool CanBeEdited => Status == ReviewStatus.Pending || Status == ReviewStatus.Approved;

    [NotMapped]
    public bool HasReplies => Replies.Any();
}
