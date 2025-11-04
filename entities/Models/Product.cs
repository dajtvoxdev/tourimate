using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Enums;

namespace Entities.Models;

// Helper class for VariantsJson deserialization
public class ProductVariant
{
    public decimal NetAmount { get; set; }
    public string NetUnit { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public bool IsOnSale { get; set; }
    public decimal? SalePrice { get; set; }
    public DateTime? SaleStartDate { get; set; }
    public DateTime? SaleEndDate { get; set; }
}

public class Product
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string? Description { get; set; }

    [StringLength(500)]
    public string? ShortDescription { get; set; }

    [StringLength(500)]
    public string? Images { get; set; } // JSON string of image URLs

    [Required]
    public Guid TourId { get; set; }

    [Required]
    public Guid TourGuideId { get; set; }

    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "Draft"; // Draft, PendingApproval, Approved, Rejected, Discontinued

    [StringLength(100)]
    public string? Category { get; set; }

    [StringLength(100)]
    public string? Brand { get; set; }

    public int MinOrderQuantity { get; set; } = 1;

    public int MaxOrderQuantity { get; set; } = 100;

    public bool IsFeatured { get; set; } = false;

    public bool IsBestSeller { get; set; } = false;

    public bool IsNewArrival { get; set; } = false;

    public bool IsOnSale { get; set; } = false;

    [Column(TypeName = "decimal(18,2)")]
    public decimal? SalePrice { get; set; }

    public DateTime? SaleStartDate { get; set; }

    public DateTime? SaleEndDate { get; set; }

    public int ViewCount { get; set; } = 0;

    public int PurchaseCount { get; set; } = 0;

    [Column(TypeName = "decimal(3,2)")]
    public decimal? Rating { get; set; }

    public int ReviewCount { get; set; } = 0;

    // Variants JSON: [{ "netAmount": 250, "netUnit": "ml", "price": 20000, "stockQuantity": 10, "isOnSale": false, "salePrice": null, "saleStartDate": null, "saleEndDate": null }]
    [Column(TypeName = "nvarchar(max)")]
    public string? VariantsJson { get; set; }

    // Persistence columns to satisfy existing DB schema
    [Required]
    [Column("Price", TypeName = "decimal(18,2)")]
    public decimal DbPrice { get; set; } = 0m;

    [Required]
    [Column("Currency")]
    [StringLength(10)]
    public string DbCurrency { get; set; } = "VND";

    [Required]
    [Column("StockQuantity")]
    public int DbStockQuantity { get; set; } = 0;

    // Computed properties derived from VariantsJson (not stored in DB)
    [NotMapped]
    public decimal Price
    {
        get
        {
            if (string.IsNullOrEmpty(VariantsJson)) return 0;
            try
            {
                var variants = System.Text.Json.JsonSerializer.Deserialize<List<ProductVariant>>(VariantsJson);
                return variants?.Where(v => v.Price > 0).Min(v => v.Price) ?? 0;
            }
            catch { return 0; }
        }
    }

    [NotMapped]
    public string Currency => "VND";

    [NotMapped]
    public int StockQuantity
    {
        get
        {
            if (string.IsNullOrEmpty(VariantsJson)) return 0;
            try
            {
                var variants = System.Text.Json.JsonSerializer.Deserialize<List<ProductVariant>>(VariantsJson);
                return variants?.Sum(v => v.StockQuantity) ?? 0;
            }
            catch { return 0; }
        }
    }

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