using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;

namespace Entities.Models;

[Table("ShoppingCart")]
public class ShoppingCart : BaseEntity
{
    [Required]
    public Guid UserId { get; set; }

    [Required]
    public Guid ProductId { get; set; }

    [Required]
    public int Quantity { get; set; }

    // Store selected variant info as JSON string
    // Format: {"netAmount": 250, "netUnit": "ml", "price": 50000, "stockQuantity": 10}
    [Column(TypeName = "nvarchar(500)")]
    public string? SelectedVariant { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [ForeignKey("ProductId")]
    public virtual Product Product { get; set; } = null!;

    // Note: Subtotal and IsAvailable should be computed from Product.VariantsJson and SelectedVariant in application logic
}
