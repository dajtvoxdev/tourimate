namespace TouriMate.Contracts.Guides;

public class GuideListDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Avatar { get; set; }
    public int? Age { get; set; }
    public string? ProvinceName { get; set; }
    public int TotalActiveTours { get; set; }
    public string? SocialMedia { get; set; } // JSON string; client can parse
    public bool IsActive { get; set; }
}

public class GuideProfileDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Bio { get; set; }
    public string? Location { get; set; }
    public int ActiveTours { get; set; }
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public bool IsActive { get; set; }
}
