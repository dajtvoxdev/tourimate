using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;

namespace Entities.Models;

[Table("UserProfiles")]
public class UserProfile : BaseEntity
{
    [Required]
    public Guid UserId { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    [MaxLength(10)]
    public string? Gender { get; set; } // Male, Female, Other

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string Country { get; set; } = "Vietnam";

    [MaxLength(2000)]
    public string? Bio { get; set; }

    [MaxLength(300)]
    public string? Website { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? SocialMedia { get; set; } // JSON

    [Column(TypeName = "nvarchar(max)")]
    public string? NotificationSettings { get; set; } // JSON: {"emailNotifications": true, "smsNotifications": false, "pushNotifications": true, "marketingEmails": false}

    public int? ProvinceCode { get; set; }
    public int? WardCode { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
