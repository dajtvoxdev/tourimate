using System.ComponentModel.DataAnnotations;

namespace tourimate.Contracts.Products;

public class ProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ShortDescription { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "VND";
    public string? Images { get; set; }
    public Guid TourId { get; set; }
    public string TourTitle { get; set; } = string.Empty;
    public Guid TourGuideId { get; set; }
    public string TourGuideName { get; set; } = string.Empty;
    public string Status { get; set; } = "Draft";
    public string? Category { get; set; }
    public string? Brand { get; set; }
    public string? Unit { get; set; }
    public decimal? Weight { get; set; }
    public string? Dimensions { get; set; }
    public string? Specifications { get; set; }
    public string? Features { get; set; }
    public string? UsageInstructions { get; set; }
    public string? CareInstructions { get; set; }
    public string? Warranty { get; set; }
    public string? ReturnPolicy { get; set; }
    public string? ShippingInfo { get; set; }
    public int StockQuantity { get; set; }
    public int MinOrderQuantity { get; set; }
    public int MaxOrderQuantity { get; set; }
    public bool IsDigital { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsBestSeller { get; set; }
    public bool IsNewArrival { get; set; }
    public bool IsOnSale { get; set; }
    public decimal? SalePrice { get; set; }
    public DateTime? SaleStartDate { get; set; }
    public DateTime? SaleEndDate { get; set; }
    public string? Tags { get; set; }
    public string? SEOKeywords { get; set; }
    public string? SEODescription { get; set; }
    public int ViewCount { get; set; }
    public int PurchaseCount { get; set; }
    public decimal? Rating { get; set; }
    public int ReviewCount { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateProductDto
{
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [StringLength(500)]
    public string? ShortDescription { get; set; }

    [Required]
    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }

    [StringLength(3)]
    public string Currency { get; set; } = "VND";

    [StringLength(500)]
    public string? Images { get; set; }

    [Required]
    public Guid TourId { get; set; }

    [StringLength(100)]
    public string? Category { get; set; }

    [StringLength(100)]
    public string? Brand { get; set; }

    [StringLength(50)]
    public string? Unit { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? Weight { get; set; }

    [StringLength(200)]
    public string? Dimensions { get; set; }

    [StringLength(1000)]
    public string? Specifications { get; set; }

    [StringLength(1000)]
    public string? Features { get; set; }

    [StringLength(1000)]
    public string? UsageInstructions { get; set; }

    [StringLength(1000)]
    public string? CareInstructions { get; set; }

    [StringLength(1000)]
    public string? Warranty { get; set; }

    [StringLength(1000)]
    public string? ReturnPolicy { get; set; }

    [StringLength(1000)]
    public string? ShippingInfo { get; set; }

    [Range(0, int.MaxValue)]
    public int StockQuantity { get; set; } = 0;

    [Range(1, int.MaxValue)]
    public int MinOrderQuantity { get; set; } = 1;

    [Range(1, int.MaxValue)]
    public int MaxOrderQuantity { get; set; } = 100;

    public bool IsDigital { get; set; } = false;

    public bool IsFeatured { get; set; } = false;

    public bool IsBestSeller { get; set; } = false;

    public bool IsNewArrival { get; set; } = false;

    public bool IsOnSale { get; set; } = false;

    [Range(0, double.MaxValue)]
    public decimal? SalePrice { get; set; }

    public DateTime? SaleStartDate { get; set; }

    public DateTime? SaleEndDate { get; set; }

    [StringLength(1000)]
    public string? Tags { get; set; }

    [StringLength(1000)]
    public string? SEOKeywords { get; set; }

    [StringLength(200)]
    public string? SEODescription { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}

public class UpdateProductDto
{
    [StringLength(200)]
    public string? Name { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    [StringLength(500)]
    public string? ShortDescription { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? Price { get; set; }

    [StringLength(3)]
    public string? Currency { get; set; }

    [StringLength(500)]
    public string? Images { get; set; }

    [StringLength(50)]
    public string? Status { get; set; }

    [StringLength(100)]
    public string? Category { get; set; }

    [StringLength(100)]
    public string? Brand { get; set; }

    [StringLength(50)]
    public string? Unit { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? Weight { get; set; }

    [StringLength(200)]
    public string? Dimensions { get; set; }

    [StringLength(1000)]
    public string? Specifications { get; set; }

    [StringLength(1000)]
    public string? Features { get; set; }

    [StringLength(1000)]
    public string? UsageInstructions { get; set; }

    [StringLength(1000)]
    public string? CareInstructions { get; set; }

    [StringLength(1000)]
    public string? Warranty { get; set; }

    [StringLength(1000)]
    public string? ReturnPolicy { get; set; }

    [StringLength(1000)]
    public string? ShippingInfo { get; set; }

    [Range(0, int.MaxValue)]
    public int? StockQuantity { get; set; }

    [Range(1, int.MaxValue)]
    public int? MinOrderQuantity { get; set; }

    [Range(1, int.MaxValue)]
    public int? MaxOrderQuantity { get; set; }

    public bool? IsDigital { get; set; }

    public bool? IsFeatured { get; set; }

    public bool? IsBestSeller { get; set; }

    public bool? IsNewArrival { get; set; }

    public bool? IsOnSale { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? SalePrice { get; set; }

    public DateTime? SaleStartDate { get; set; }

    public DateTime? SaleEndDate { get; set; }

    [StringLength(1000)]
    public string? Tags { get; set; }

    [StringLength(1000)]
    public string? SEOKeywords { get; set; }

    [StringLength(200)]
    public string? SEODescription { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}

public class ProductSearchRequest
{
    public string? SearchTerm { get; set; }
    public string? Category { get; set; }
    public string? Brand { get; set; }
    public string? Status { get; set; }
    public Guid? TourId { get; set; }
    public Guid? TourGuideId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool? IsFeatured { get; set; }
    public bool? IsBestSeller { get; set; }
    public bool? IsNewArrival { get; set; }
    public bool? IsOnSale { get; set; }
    public bool? IsDigital { get; set; }
    public string? SortBy { get; set; } // name, price, createdAt, rating, viewCount, purchaseCount
    public string? SortOrder { get; set; } // asc, desc
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class ProductSearchResponse
{
    public List<ProductDto> Products { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class ProductStatisticsDto
{
    public int TotalProducts { get; set; }
    public int ActiveProducts { get; set; }
    public int DraftProducts { get; set; }
    public int InactiveProducts { get; set; }
    public int FeaturedProducts { get; set; }
    public int BestSellerProducts { get; set; }
    public int NewArrivalProducts { get; set; }
    public int OnSaleProducts { get; set; }
    public int DigitalProducts { get; set; }
    public decimal TotalValue { get; set; }
    public decimal AveragePrice { get; set; }
    public int TotalViews { get; set; }
    public int TotalPurchases { get; set; }
    public decimal AverageRating { get; set; }
}
