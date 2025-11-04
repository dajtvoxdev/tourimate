using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;
using Entities.Enums;

namespace Entities.Models;

[Table("Users")]
public class User : BaseEntity, IAuditableEntity
{
    [Required]
    [MaxLength(320)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(128)]
    public string? FirebaseUid { get; set; }

    [Required]
    [MaxLength(256)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Avatar { get; set; }

    [Required]
    public UserRole Role { get; set; } = UserRole.Customer;

    public bool IsPhoneVerified { get; set; } = false;

    public bool IsActive { get; set; } = true;

    public bool AcceptEmailMarketing { get; set; } = false;

    public DateTime? LastLoginAt { get; set; }

    // IAuditableEntity properties
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    public virtual UserProfile? Profile { get; set; }
    public virtual ICollection<TourGuideApplication> TourGuideApplications { get; set; } = new List<TourGuideApplication>();
    public virtual ICollection<Tour> Tours { get; set; } = new List<Tour>();
    // Products relationship handled via Product.TourGuide navigation (TourGuideId FK)
    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
    public virtual ICollection<ReviewReply> ReviewReplies { get; set; } = new List<ReviewReply>();
    public virtual ICollection<ShoppingCart> ShoppingCartItems { get; set; } = new List<ShoppingCart>();
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    // Computed properties
    [NotMapped]
    public string FullName => $"{FirstName} {LastName}";

    [NotMapped]
    public bool IsTourGuide => Role == UserRole.TourGuide || Role == UserRole.Admin;

    [NotMapped]
    public bool IsAdmin => Role == UserRole.Admin;
}
