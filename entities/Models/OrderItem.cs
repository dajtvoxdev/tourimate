using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;

namespace Entities.Models;

[Table("OrderItems")]
public class OrderItem : BaseEntity
{
    [Required]
    public Guid OrderId { get; set; }

    [Required]
    public Guid ProductId { get; set; }

    [Required]
    [MaxLength(200)]
    public string ProductName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? ProductImage { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    // For backward compatibility
    [NotMapped]
    public decimal Price 
    { 
        get => UnitPrice; 
        set => UnitPrice = value; 
    }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal { get; set; }

    // Store selected variant info as JSON string (for products with variants)
    [Column(TypeName = "nvarchar(500)")]
    public string? SelectedVariant { get; set; }

    // Navigation properties
    [ForeignKey("OrderId")]
    public virtual Order Order { get; set; } = null!;

    [ForeignKey("ProductId")]
    public virtual Product Product { get; set; } = null!;

    // Computed properties
    [NotMapped]
    public decimal CalculatedSubtotal => Quantity * UnitPrice;
}
