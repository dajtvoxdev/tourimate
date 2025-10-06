using Entities.Enums;

namespace TouriMate.Contracts.Tours;

public class TourDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public int Duration { get; set; }
    public int MaxParticipants { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "VND";
    public string Category { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public string? Images { get; set; }
    public List<string>? ImageUrls { get; set; }
    public string? Itinerary { get; set; }
    public string? Includes { get; set; }
    public string? Excludes { get; set; }
    public string? Terms { get; set; }
    public bool IsActive { get; set; }
    public bool IsFeatured { get; set; }
    public TourStatus Status { get; set; }
    public int? DivisionCode { get; set; }
    public int? ProvinceCode { get; set; }
    public int? WardCode { get; set; }
    public Guid TourGuideId { get; set; }
    public string TourGuideName { get; set; } = string.Empty;
    public string TourGuideEmail { get; set; } = string.Empty;
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public int TotalBookings { get; set; }
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class TourListDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public int Duration { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "VND";
    public string Category { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public string? Images { get; set; }
    public List<string>? ImageUrls { get; set; }
    public bool IsActive { get; set; }
    public bool IsFeatured { get; set; }
    public TourStatus Status { get; set; }
    public int? DivisionCode { get; set; }
    public int? ProvinceCode { get; set; }
    public int? WardCode { get; set; }
    public Guid TourGuideId { get; set; }
    public string TourGuideName { get; set; } = string.Empty;
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public int TotalBookings { get; set; }
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TourSearchRequest
{
    public string SearchTerm { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public int? MinDuration { get; set; }
    public int? MaxDuration { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsFeatured { get; set; }
    public TourStatus? Status { get; set; }
    public Guid? TourGuideId { get; set; }
    public int? DivisionCode { get; set; }
    public int? ProvinceCode { get; set; }
    public int? WardCode { get; set; }
    public string SortBy { get; set; } = "createdat";
    public string SortDirection { get; set; } = "desc";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class TourSearchResponse
{
    public List<TourListDto> Tours { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class CreateTourRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public int Duration { get; set; }
    public int MaxParticipants { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "VND";
    public string Category { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public string? Images { get; set; }
    public List<string>? ImageUrls { get; set; }
    public string? Itinerary { get; set; }
    public string? Includes { get; set; }
    public string? Excludes { get; set; }
    public string? Terms { get; set; }
    public bool IsFeatured { get; set; }
    public int? DivisionCode { get; set; }
    public int? ProvinceCode { get; set; }
    public int? WardCode { get; set; }
}

public class UpdateTourRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? ShortDescription { get; set; }
    public string? Location { get; set; }
    public int? Duration { get; set; }
    public int? MaxParticipants { get; set; }
    public decimal? Price { get; set; }
    public string? Currency { get; set; }
    public string? Category { get; set; }
    public string? Difficulty { get; set; }
    public string? Images { get; set; }
    public List<string>? ImageUrls { get; set; }
    public string? Itinerary { get; set; }
    public string? Includes { get; set; }
    public string? Excludes { get; set; }
    public string? Terms { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsFeatured { get; set; }
    public TourStatus? Status { get; set; }
    public int? DivisionCode { get; set; }
    public int? ProvinceCode { get; set; }
    public int? WardCode { get; set; }
}

public class TourStatsDto
{
    public int TotalTours { get; set; }
    public int ActiveTours { get; set; }
    public int PendingTours { get; set; }
    public int RejectedTours { get; set; }
    public int FeaturedTours { get; set; }
    public decimal AveragePrice { get; set; }
    public decimal TotalRevenue { get; set; }
    public int TotalBookings { get; set; }
    public decimal AverageRating { get; set; }
}
