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

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [ForeignKey("ProductId")]
    public virtual Product Product { get; set; } = null!;

    // Computed properties
    [NotMapped]
    public decimal Subtotal => Quantity * Product.Price;

    [NotMapped]
    public bool IsAvailable => Product.IsInStock && Product.Stock >= Quantity;
}
