using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;
using Entities.Enums;

namespace Entities.Models;

[Table("Products")]
public class Product : BaseEntity, IAuditableEntity
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "nvarchar(max)")]
    public string Description { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string ShortDescription { get; set; } = string.Empty;

    [Required]
    public Guid CategoryId { get; set; }

    [MaxLength(100)]
    public string? Brand { get; set; }

    [MaxLength(100)]
    public string? Region { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "VND";

    [Column(TypeName = "decimal(18,2)")]
    public decimal? OriginalPrice { get; set; }

    [Required]
    public int Stock { get; set; } = 0;

    [Required]
    public int LowStockThreshold { get; set; } = 10;

    [Column(TypeName = "nvarchar(max)")]
    public string? Images { get; set; } // JSON array of image URLs

    [Column(TypeName = "nvarchar(max)")]
    public string? Specifications { get; set; } // JSON

    [Column(TypeName = "nvarchar(max)")]
    public string? Ingredients { get; set; } // JSON array

    [Column(TypeName = "nvarchar(max)")]
    public string? NutritionFacts { get; set; } // JSON

    public bool IsActive { get; set; } = true;

    public bool IsFeatured { get; set; } = false;

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "pending_approval"; // pending_approval, approved, rejected, inactive

    [Required]
    public Guid VendorId { get; set; }

    [Column(TypeName = "decimal(3,2)")]
    public decimal AverageRating { get; set; } = 0;

    public int TotalReviews { get; set; } = 0;

    public int TotalSales { get; set; } = 0;

    public int ViewCount { get; set; } = 0;

    [Column(TypeName = "decimal(10,3)")]
    public decimal? Weight { get; set; } // kg

    [MaxLength(100)]
    public string? Dimensions { get; set; } // L x W x H in cm

    [Column(TypeName = "nvarchar(max)")]
    public string? ShippingInfo { get; set; } // JSON

    // IAuditableEntity properties
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("CategoryId")]
    public virtual ProductCategory Category { get; set; } = null!;

    [ForeignKey("VendorId")]
    public virtual User Vendor { get; set; } = null!;

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public virtual ICollection<ShoppingCart> CartItems { get; set; } = new List<ShoppingCart>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
    public virtual ICollection<Promotion> Promotions { get; set; } = new List<Promotion>();

    // Computed properties
    [NotMapped]
    public bool IsInStock => Stock > 0;

    [NotMapped]
    public bool IsLowStock => Stock <= LowStockThreshold && Stock > 0;

    [NotMapped]
    public bool IsOutOfStock => Stock <= 0;

    [NotMapped]
    public decimal? DiscountPercentage => OriginalPrice.HasValue && OriginalPrice > Price 
        ? Math.Round(((OriginalPrice.Value - Price) / OriginalPrice.Value) * 100, 2) 
        : null;

    [NotMapped]
    public bool HasDiscount => DiscountPercentage.HasValue && DiscountPercentage > 0;
}
