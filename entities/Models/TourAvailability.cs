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
    public DateOnly Date { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? TimeSlots { get; set; } // JSON array of available time slots

    [Required]
    public int MaxParticipants { get; set; }

    public int BookedParticipants { get; set; } = 0;

    public bool IsAvailable { get; set; } = true;

    // Navigation properties
    [ForeignKey("TourId")]
    public virtual Tour Tour { get; set; } = null!;

    // Computed properties
    [NotMapped]
    public int AvailableSpots => MaxParticipants - BookedParticipants;

    [NotMapped]
    public bool HasAvailableSpots => AvailableSpots > 0 && IsAvailable;
}
