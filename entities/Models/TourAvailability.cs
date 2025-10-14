using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;

namespace Entities.Models;

[Table("TourAvailability")]
public class TourAvailability : BaseEntity
{
    [Required]
    public Guid TourId { get; set; }

    [Required]
    public DateTime Date { get; set; }

    [Required]
    public int MaxParticipants { get; set; }

    public int BookedParticipants { get; set; } = 0;

    public bool IsAvailable { get; set; } = true;

    // Departure information
    [Required]
    public int DepartureDivisionCode { get; set; }
    [ForeignKey("DepartureDivisionCode")]
    public virtual Division DepartureDivision { get; set; } = null!;

    // Vehicle information
    [MaxLength(100)]
    public string? Vehicle { get; set; } // e.g., "Bus 45 chỗ", "Xe máy", "Tàu"

    // Pricing information
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal AdultPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ChildPrice { get; set; } = 0; // 0 means same as adult price

    [Column(TypeName = "decimal(18,2)")]
    public decimal Surcharge { get; set; } = 0; // Additional charges if any

    // Trip information
    [MaxLength(200)]
    public string? TripTime { get; set; } // e.g., "4 ngày 3 đêm", "1 ngày"

    [MaxLength(500)]
    public string? Note { get; set; } // Additional notes for this specific date

    // Navigation properties
    [ForeignKey("TourId")]
    public virtual Tour Tour { get; set; } = null!;

    // Computed properties
    [NotMapped]
    public int AvailableSpots => MaxParticipants - BookedParticipants;

    [NotMapped]
    public bool HasAvailableSpots => AvailableSpots > 0 && IsAvailable;

    [NotMapped]
    public decimal TotalAdultPrice => AdultPrice + Surcharge;

    [NotMapped]
    public decimal TotalChildPrice => ChildPrice + Surcharge;
}
