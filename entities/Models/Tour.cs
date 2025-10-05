using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;
using Entities.Enums;

namespace Entities.Models;

[Table("Tours")]
public class Tour : BaseEntity, IAuditableEntity
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "nvarchar(max)")]
    public string Description { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string ShortDescription { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Location { get; set; } = string.Empty;

    [Required]
    public int Duration { get; set; } // days

    [Required]
    public int MaxParticipants { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "VND";

    [Required]
    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Difficulty { get; set; } = string.Empty; // Easy, Moderate, Challenging, Expert

    [Column(TypeName = "nvarchar(max)")]
    public string? Images { get; set; } // JSON array of image URLs

    [Column(TypeName = "nvarchar(max)")]
    public string? Itinerary { get; set; } // JSON

    [Column(TypeName = "nvarchar(max)")]
    public string? Includes { get; set; } // JSON array

    [Column(TypeName = "nvarchar(max)")]
    public string? Excludes { get; set; } // JSON array

    [Column(TypeName = "nvarchar(max)")]
    public string? Terms { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsFeatured { get; set; } = false;

    [Required]
    [MaxLength(20)]
    public TourStatus Status { get; set; } = TourStatus.PendingApproval;

    [Required]
    public Guid TourGuideId { get; set; }

    [Column(TypeName = "decimal(3,2)")]
    public decimal AverageRating { get; set; } = 0;

    public int TotalReviews { get; set; } = 0;

    public int TotalBookings { get; set; } = 0;

    public int ViewCount { get; set; } = 0;

    // IAuditableEntity properties
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("TourGuideId")]
    public virtual User TourGuide { get; set; } = null!;

    public virtual ICollection<TourAvailability> Availabilities { get; set; } = new List<TourAvailability>();
    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
    public virtual ICollection<Promotion> Promotions { get; set; } = new List<Promotion>();
}
