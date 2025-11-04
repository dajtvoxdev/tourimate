using System.ComponentModel.DataAnnotations;

namespace tourimate.Contracts.ShoppingCart;

public class AddToCartRequest
{
    [Required]
    public Guid ProductId { get; set; }

    [Required]
    [Range(1, 1000)]
    public int Quantity { get; set; }

    // Selected variant as JSON string
    // Format: {"netAmount": 250, "netUnit": "ml", "price": 50000, "stockQuantity": 10}
    public string? SelectedVariant { get; set; }
}

public class UpdateCartItemRequest
{
    [Required]
    [Range(1, 1000)]
    public int Quantity { get; set; }
}

public class CartItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductImage { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "VND";
    public decimal Subtotal { get; set; }
    public string? SelectedVariant { get; set; }
    public bool IsAvailable { get; set; }
    public int AvailableStock { get; set; }
    public string? TourTitle { get; set; }
    public Guid TourId { get; set; }
    public string? TourGuideName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CartSummaryDto
{
    public List<CartItemDto> Items { get; set; } = new();
    public int TotalItems { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "VND";
}

