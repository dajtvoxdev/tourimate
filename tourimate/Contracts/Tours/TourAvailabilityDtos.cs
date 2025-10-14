using System.ComponentModel.DataAnnotations;

namespace tourimate.Contracts.Tours;

// Request DTOs
public class CreateTourAvailabilityRequest
{
    [Required]
    public Guid TourId { get; set; }

    [Required]
    public DateTime Date { get; set; }

    [Required]
    [Range(1, 1000, ErrorMessage = "MaxParticipants must be between 1 and 1000")]
    public int MaxParticipants { get; set; }

    public int BookedParticipants { get; set; } = 0;

    public bool IsAvailable { get; set; } = true;

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "DepartureDivisionCode is required")]
    public int DepartureDivisionCode { get; set; }

    [MaxLength(100)]
    public string? Vehicle { get; set; }

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "AdultPrice must be a positive number")]
    public decimal AdultPrice { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "ChildPrice must be a positive number")]
    public decimal ChildPrice { get; set; } = 0;

    [Range(0, double.MaxValue, ErrorMessage = "Surcharge must be a positive number")]
    public decimal Surcharge { get; set; } = 0;

    [MaxLength(200)]
    public string? TripTime { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }
}

public class UpdateTourAvailabilityRequest
{
    [Required]
    public DateTime Date { get; set; }

    [Range(1, 1000, ErrorMessage = "MaxParticipants must be between 1 and 1000")]
    public int? MaxParticipants { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "BookedParticipants must be non-negative")]
    public int? BookedParticipants { get; set; }

    public bool? IsAvailable { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "DepartureDivisionCode is required")]
    public int? DepartureDivisionCode { get; set; }

    [MaxLength(100)]
    public string? Vehicle { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "AdultPrice must be a positive number")]
    public decimal? AdultPrice { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "ChildPrice must be a positive number")]
    public decimal? ChildPrice { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Surcharge must be a positive number")]
    public decimal? Surcharge { get; set; }

    [MaxLength(200)]
    public string? TripTime { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }
}

public class TourAvailabilitySearchRequest
{
    public Guid? TourId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool? IsAvailable { get; set; }
    public int? MinPrice { get; set; }
    public int? MaxPrice { get; set; }
    public int? DepartureDivisionCode { get; set; }
    public string? Vehicle { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SortBy { get; set; } = "Date"; // Date, AdultPrice, MaxParticipants
    public string? SortDirection { get; set; } = "asc"; // asc, desc
}

// Response DTOs
public class TourAvailabilityDto
{
    public Guid Id { get; set; }
    public Guid TourId { get; set; }
    public string TourTitle { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int MaxParticipants { get; set; }
    public int BookedParticipants { get; set; }
    public bool IsAvailable { get; set; }
    public int AvailableSpots { get; set; }
    public bool HasAvailableSpots { get; set; }

    // Departure information
    public int DepartureDivisionCode { get; set; }
    public string DepartureDivisionName { get; set; } = string.Empty;

    // Vehicle information
    public string? Vehicle { get; set; }

    // Pricing information
    public decimal AdultPrice { get; set; }
    public decimal ChildPrice { get; set; }
    public decimal Surcharge { get; set; }
    public decimal TotalAdultPrice { get; set; }
    public decimal TotalChildPrice { get; set; }

    // Trip information
    public string? TripTime { get; set; }
    public string? Note { get; set; }

    // Audit fields
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class TourAvailabilitySearchResponse
{
    public List<TourAvailabilityDto> Data { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

