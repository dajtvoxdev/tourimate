using System.ComponentModel.DataAnnotations;

namespace tourimate.Contracts.Pricing;

public class PricingConfigDto
{
    public Guid Id { get; set; }
    public string ConfigKey { get; set; } = string.Empty;
    public string ConfigName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public string? UpdatedByName { get; set; }
}

public class CreatePricingConfigDto
{
    [Required]
    [MaxLength(50)]
    public string ConfigKey { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string ConfigName { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Giá trị phải lớn hơn hoặc bằng 0")]
    public decimal Value { get; set; }

    [Required]
    [MaxLength(10)]
    public string Unit { get; set; } = "VND";

    [Required]
    [MaxLength(20)]
    public string Category { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime? EffectiveDate { get; set; }

    public DateTime? ExpiryDate { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class UpdatePricingConfigDto
{
    [Required]
    [MaxLength(200)]
    public string ConfigName { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Giá trị phải lớn hơn hoặc bằng 0")]
    public decimal Value { get; set; }

    [Required]
    [MaxLength(10)]
    public string Unit { get; set; } = "VND";

    public bool IsActive { get; set; } = true;

    public DateTime? EffectiveDate { get; set; }

    public DateTime? ExpiryDate { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class PricingConfigSearchRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Category { get; set; }
    public string? SearchTerm { get; set; }
    public bool? IsActive { get; set; }
}

public class PricingConfigSearchResponse
{
    public List<PricingConfigDto> Configs { get; set; } = new();
    public PaginationInfo Pagination { get; set; } = new();
}

public class PaginationInfo
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
}

