using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using tourimate.Contracts.ShoppingCart;
using Entities.Models;
using TouriMate.Data;

namespace tourimate.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ShoppingCartController : ControllerBase
{
    private readonly TouriMateDbContext _db;
    private readonly ILogger<ShoppingCartController> _logger;

    public ShoppingCartController(TouriMateDbContext db, ILogger<ShoppingCartController> logger)
    {
        _db = db;
        _logger = logger;
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }
        return null;
    }

    // GET: api/shoppingcart
    [HttpGet]
    public async Task<ActionResult<CartSummaryDto>> GetCart()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            var cartItems = await _db.ShoppingCarts
                .Include(c => c.Product)
                    .ThenInclude(p => p.Tour)
                .Include(c => c.Product)
                    .ThenInclude(p => p.TourGuide)
                .Where(c => c.UserId == userId.Value)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            var cartItemDtos = new List<CartItemDto>();
            decimal totalAmount = 0;

            foreach (var item in cartItems)
            {
                var product = item.Product;
                if (product == null) continue;

                // Parse images
                var images = string.IsNullOrEmpty(product.Images) 
                    ? new List<string>() 
                    : JsonSerializer.Deserialize<List<string>>(product.Images) ?? new List<string>();

                // Determine price and stock based on selected variant
                decimal price = product.Price;
                int availableStock = product.StockQuantity;
                bool isAvailable = product.Status == "Approved";

                if (!string.IsNullOrEmpty(item.SelectedVariant))
                {
                    try
                    {
                        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                        var selectedVariant = JsonSerializer.Deserialize<ProductVariant>(item.SelectedVariant, options);
                        if (selectedVariant != null)
                        {
                            // Use sale price if on sale
                            if (selectedVariant.IsOnSale && selectedVariant.SalePrice.HasValue &&
                                selectedVariant.SaleStartDate <= DateTime.UtcNow &&
                                (!selectedVariant.SaleEndDate.HasValue || selectedVariant.SaleEndDate >= DateTime.UtcNow))
                            {
                                price = selectedVariant.SalePrice.Value;
                            }
                            else
                            {
                                price = selectedVariant.Price;
                            }
                            availableStock = selectedVariant.StockQuantity;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to parse selected variant for cart item {CartItemId}", item.Id);
                    }
                }

                isAvailable = isAvailable && availableStock >= item.Quantity;
                var subtotal = price * item.Quantity;

                if (isAvailable)
                {
                    totalAmount += subtotal;
                }

                cartItemDtos.Add(new CartItemDto
                {
                    Id = item.Id,
                    ProductId = product.Id,
                    ProductName = product.Name,
                    ProductImage = images.FirstOrDefault(),
                    Quantity = item.Quantity,
                    Price = price,
                    Currency = product.Currency ?? "VND",
                    Subtotal = subtotal,
                    SelectedVariant = item.SelectedVariant,
                    IsAvailable = isAvailable,
                    AvailableStock = availableStock,
                    TourTitle = product.Tour?.Title,
                    TourId = product.TourId,
                    TourGuideName = product.TourGuide?.FullName,
                    CreatedAt = item.CreatedAt
                });
            }

            return Ok(new CartSummaryDto
            {
                Items = cartItemDtos,
                TotalItems = cartItemDtos.Count,
                TotalAmount = totalAmount,
                Currency = "VND"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting shopping cart");
            return StatusCode(500, "Internal server error");
        }
    }

    // POST: api/shoppingcart
    [HttpPost]
    public async Task<ActionResult<CartItemDto>> AddToCart([FromBody] AddToCartRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            // Verify product exists and is approved
            var product = await _db.Products
                .Include(p => p.Tour)
                .Include(p => p.TourGuide)
                .FirstOrDefaultAsync(p => p.Id == request.ProductId);

            if (product == null)
            {
                return NotFound("Product not found");
            }

            if (product.Status != "Approved")
            {
                return BadRequest("Product is not available for purchase");
            }

            // Verify stock availability
            int availableStock = product.StockQuantity;
            decimal price = product.Price;

            _logger.LogInformation("Initial stock check - Product {ProductId}, StockQuantity: {Stock}, HasSelectedVariant: {HasVariant}", 
                product.Id, product.StockQuantity, !string.IsNullOrEmpty(request.SelectedVariant));

            if (!string.IsNullOrEmpty(request.SelectedVariant))
            {
                try
                {
                    _logger.LogInformation("Parsing selected variant: {VariantJson}", request.SelectedVariant);
                    
                    var options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    var variant = JsonSerializer.Deserialize<ProductVariant>(request.SelectedVariant, options);
                    if (variant != null)
                    {
                        _logger.LogInformation("Variant parsed successfully - NetAmount: {NetAmount}, NetUnit: {NetUnit}, StockQuantity: {Stock}", 
                            variant.NetAmount, variant.NetUnit, variant.StockQuantity);
                        
                        availableStock = variant.StockQuantity;
                        
                        // Use sale price if on sale
                        if (variant.IsOnSale && variant.SalePrice.HasValue &&
                            variant.SaleStartDate <= DateTime.UtcNow &&
                            (!variant.SaleEndDate.HasValue || variant.SaleEndDate >= DateTime.UtcNow))
                        {
                            price = variant.SalePrice.Value;
                        }
                        else
                        {
                            price = variant.Price;
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Variant deserialized to null");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to parse selected variant: {VariantJson}", request.SelectedVariant);
                    return BadRequest("Invalid variant data");
                }
            }

            _logger.LogInformation("Final stock check - AvailableStock: {Stock}, RequestedQuantity: {Quantity}", 
                availableStock, request.Quantity);

            if (availableStock < request.Quantity)
            {
                return BadRequest($"Insufficient stock. Only {availableStock} items available");
            }

            // Check if item already exists in cart (same product and variant)
            var existingItem = await _db.ShoppingCarts
                .FirstOrDefaultAsync(c => 
                    c.UserId == userId.Value && 
                    c.ProductId == request.ProductId &&
                    c.SelectedVariant == request.SelectedVariant);

            if (existingItem != null)
            {
                // Update quantity
                var newQuantity = existingItem.Quantity + request.Quantity;
                
                if (newQuantity > availableStock)
                {
                    return BadRequest($"Cannot add more items. Maximum available: {availableStock}");
                }

                existingItem.Quantity = newQuantity;
                existingItem.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                // Return updated item
                var images = string.IsNullOrEmpty(product.Images) 
                    ? new List<string>() 
                    : JsonSerializer.Deserialize<List<string>>(product.Images) ?? new List<string>();

                return Ok(new CartItemDto
                {
                    Id = existingItem.Id,
                    ProductId = product.Id,
                    ProductName = product.Name,
                    ProductImage = images.FirstOrDefault(),
                    Quantity = existingItem.Quantity,
                    Price = price,
                    Currency = product.Currency ?? "VND",
                    Subtotal = price * existingItem.Quantity,
                    SelectedVariant = existingItem.SelectedVariant,
                    IsAvailable = true,
                    AvailableStock = availableStock,
                    TourTitle = product.Tour?.Title,
                    TourId = product.TourId,
                    TourGuideName = product.TourGuide?.FullName,
                    CreatedAt = existingItem.CreatedAt
                });
            }

            // Create new cart item
            var cartItem = new ShoppingCart
            {
                Id = Guid.NewGuid(),
                UserId = userId.Value,
                ProductId = request.ProductId,
                Quantity = request.Quantity,
                SelectedVariant = request.SelectedVariant,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.ShoppingCarts.Add(cartItem);
            await _db.SaveChangesAsync();

            // Return created item
            var productImages = string.IsNullOrEmpty(product.Images) 
                ? new List<string>() 
                : JsonSerializer.Deserialize<List<string>>(product.Images) ?? new List<string>();

            return CreatedAtAction(nameof(GetCart), new CartItemDto
            {
                Id = cartItem.Id,
                ProductId = product.Id,
                ProductName = product.Name,
                ProductImage = productImages.FirstOrDefault(),
                Quantity = cartItem.Quantity,
                Price = price,
                Currency = product.Currency ?? "VND",
                Subtotal = price * cartItem.Quantity,
                SelectedVariant = cartItem.SelectedVariant,
                IsAvailable = true,
                AvailableStock = availableStock,
                TourTitle = product.Tour?.Title,
                TourId = product.TourId,
                TourGuideName = product.TourGuide?.FullName,
                CreatedAt = cartItem.CreatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding item to cart");
            return StatusCode(500, "Internal server error");
        }
    }

    // PUT: api/shoppingcart/{id}
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateCartItem(Guid id, [FromBody] UpdateCartItemRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            var cartItem = await _db.ShoppingCarts
                .Include(c => c.Product)
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId.Value);

            if (cartItem == null)
            {
                return NotFound("Cart item not found");
            }

            // Verify stock availability
            int availableStock = cartItem.Product.StockQuantity;

            if (!string.IsNullOrEmpty(cartItem.SelectedVariant))
            {
                try
                {
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var variant = JsonSerializer.Deserialize<ProductVariant>(cartItem.SelectedVariant, options);
                    if (variant != null)
                    {
                        availableStock = variant.StockQuantity;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse selected variant");
                }
            }

            if (availableStock < request.Quantity)
            {
                return BadRequest($"Insufficient stock. Only {availableStock} items available");
            }

            cartItem.Quantity = request.Quantity;
            cartItem.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Cart item updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cart item");
            return StatusCode(500, "Internal server error");
        }
    }

    // DELETE: api/shoppingcart/{id}
    [HttpDelete("{id}")]
    public async Task<ActionResult> RemoveFromCart(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            var cartItem = await _db.ShoppingCarts
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId.Value);

            if (cartItem == null)
            {
                return NotFound("Cart item not found");
            }

            _db.ShoppingCarts.Remove(cartItem);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Item removed from cart successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing item from cart");
            return StatusCode(500, "Internal server error");
        }
    }

    // DELETE: api/shoppingcart/clear
    [HttpDelete("clear")]
    public async Task<ActionResult> ClearCart()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            var cartItems = await _db.ShoppingCarts
                .Where(c => c.UserId == userId.Value)
                .ToListAsync();

            _db.ShoppingCarts.RemoveRange(cartItems);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Cart cleared successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing cart");
            return StatusCode(500, "Internal server error");
        }
    }

    // GET: api/shoppingcart/count
    [HttpGet("count")]
    public async Task<ActionResult<int>> GetCartItemCount()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            var count = await _db.ShoppingCarts
                .Where(c => c.UserId == userId.Value)
                .SumAsync(c => c.Quantity);

            return Ok(count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cart item count");
            return StatusCode(500, "Internal server error");
        }
    }
}

