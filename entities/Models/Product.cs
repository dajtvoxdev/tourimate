using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.Models;

public class Product
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [StringLength(500)]
    public string? ShortDescription { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    [Required]
    [StringLength(3)]
    public string Currency { get; set; } = "VND";

    [StringLength(500)]
    public string? Images { get; set; } // JSON string of image URLs

    [Required]
    public Guid TourId { get; set; }

    [Required]
    public Guid TourGuideId { get; set; }

    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "Draft"; // Draft, Active, Inactive, Discontinued

    [StringLength(100)]
    public string? Category { get; set; }

    [StringLength(100)]
    public string? Brand { get; set; }

    [StringLength(50)]
    public string? Unit { get; set; } // piece, kg, liter, etc.

    [Column(TypeName = "decimal(18,2)")]
    public decimal? Weight { get; set; }

    [StringLength(200)]
    public string? Dimensions { get; set; } // "L x W x H"

    [StringLength(1000)]
    public string? Specifications { get; set; } // JSON string

    [StringLength(1000)]
    public string? Features { get; set; } // JSON string

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

    public int StockQuantity { get; set; } = 0;

    public int MinOrderQuantity { get; set; } = 1;

    public int MaxOrderQuantity { get; set; } = 100;

    public bool IsDigital { get; set; } = false;

    public bool IsFeatured { get; set; } = false;

    public bool IsBestSeller { get; set; } = false;

    public bool IsNewArrival { get; set; } = false;

    public bool IsOnSale { get; set; } = false;

    [Column(TypeName = "decimal(18,2)")]
    public decimal? SalePrice { get; set; }

    public DateTime? SaleStartDate { get; set; }

    public DateTime? SaleEndDate { get; set; }

    [StringLength(1000)]
    public string? Tags { get; set; } // JSON string

    [StringLength(1000)]
    public string? SEOKeywords { get; set; }

    [StringLength(200)]
    public string? SEODescription { get; set; }

    public int ViewCount { get; set; } = 0;

    public int PurchaseCount { get; set; } = 0;

    [Column(TypeName = "decimal(3,2)")]
    public decimal? Rating { get; set; }

    public int ReviewCount { get; set; } = 0;

    [StringLength(1000)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Guid CreatedBy { get; set; }

    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("TourId")]
    public virtual Tour Tour { get; set; } = null!;

    [ForeignKey("TourGuideId")]
    public virtual User TourGuide { get; set; } = null!;

    [ForeignKey("CreatedBy")]
    public virtual User Creator { get; set; } = null!;

    [ForeignKey("UpdatedBy")]
    public virtual User? Updater { get; set; }
}