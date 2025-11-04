using System.ComponentModel.DataAnnotations;

namespace tourimate.Contracts.Orders;

public class CreateOrderRequest
{
    [Required]
    [StringLength(200)]
    public string ReceiverName { get; set; } = string.Empty;

    [Required]
    [Phone]
    public string ReceiverPhone { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string ReceiverEmail { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string ShippingAddress { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Notes { get; set; }
}

public class CreateOrderResponse
{
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "VND";
}

public class OrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // Pending, Confirmed, Shipped, Delivered, Cancelled
    public string PaymentStatus { get; set; } = string.Empty; // Pending, Paid, Refunded
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "VND";
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverPhone { get; set; } = string.Empty;
    public string ReceiverEmail { get; set; } = string.Empty;
    public string ShippingAddress { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}

public class OrderItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductImage { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal Subtotal { get; set; }
    public string? SelectedVariant { get; set; }
}

