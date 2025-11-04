using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using System.Security.Claims;
using System.Text.Json;
using tourimate.Contracts.Orders;
using TouriMate.Data;
using Entities.Models;
using Entities.Enums;

namespace tourimate.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly TouriMateDbContext _db;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(TouriMateDbContext db, ILogger<OrdersController> logger)
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

    // POST: api/orders
    [HttpPost]
    public async Task<ActionResult<CreateOrderResponse>> CreateOrder([FromBody] CreateOrderRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            // Get cart items
            var cartItems = await _db.ShoppingCarts
                .Include(c => c.Product)
                    .ThenInclude(p => p.Tour)
                .Include(c => c.Product)
                    .ThenInclude(p => p.TourGuide)
                .Where(c => c.UserId == userId.Value)
                .ToListAsync();

            if (cartItems.Count == 0)
            {
                return BadRequest("Cart is empty");
            }

            // Validate stock and calculate total
            decimal totalAmount = 0;
            var orderItems = new List<OrderItem>();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            foreach (var cartItem in cartItems)
            {
                var product = cartItem.Product;
                if (product.Status != "Approved")
                {
                    return BadRequest($"Product '{product.Name}' is not available");
                }

                // Determine price and stock based on variant
                decimal price = product.Price;
                int availableStock = product.StockQuantity;

                if (!string.IsNullOrEmpty(cartItem.SelectedVariant))
                {
                    try
                    {
                        var variant = JsonSerializer.Deserialize<ProductVariant>(cartItem.SelectedVariant, options);
                        if (variant != null)
                        {
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
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to parse variant for product {ProductId}", product.Id);
                    }
                }

                // Validate stock
                if (availableStock < cartItem.Quantity)
                {
                    return BadRequest($"Insufficient stock for '{product.Name}'. Only {availableStock} available");
                }

                var subtotal = price * cartItem.Quantity;
                totalAmount += subtotal;

                // Extract first image URL from JSON if available
                string? productImage = null;
                if (!string.IsNullOrEmpty(product.Images))
                {
                    try
                    {
                        var images = JsonSerializer.Deserialize<List<string>>(product.Images, options);
                        if (images != null && images.Count > 0)
                        {
                            productImage = images[0];
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to parse product images for product {ProductId}", product.Id);
                    }
                }

                // Truncate ProductName to match MaxLength(200) and log warnings
                var productName = product.Name;
                if (productName?.Length > 200)
                {
                    _logger.LogWarning("ProductName exceeds MaxLength(200) for ProductId {ProductId}: {Length} chars. Value: {Value}", 
                        product.Id, productName.Length, productName);
                    productName = productName.Substring(0, 200);
                }
                
                // Truncate SelectedVariant to match nvarchar(500) and log warnings
                var selectedVariant = cartItem.SelectedVariant;
                if (selectedVariant?.Length > 500)
                {
                    _logger.LogWarning("SelectedVariant exceeds nvarchar(500) for ProductId {ProductId}: {Length} chars. Value: {Value}", 
                        product.Id, selectedVariant.Length, selectedVariant);
                    selectedVariant = selectedVariant.Substring(0, 500);
                }

                orderItems.Add(new OrderItem
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    ProductName = productName ?? string.Empty,
                    ProductImage = productImage,
                    Quantity = cartItem.Quantity,
                    Price = price,
                    Subtotal = subtotal,
                    SelectedVariant = selectedVariant,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            // Generate order number (MaxLength 20: ORD=3 + yyyyMMddHHmmss=14 + random=3 = 20)
            var orderNumber = $"ORD{DateTime.UtcNow:yyyyMMddHHmmss}{new Random().Next(100, 999)}";
            
            // Validate OrderNumber length
            if (orderNumber.Length > 20)
            {
                _logger.LogWarning("OrderNumber exceeds MaxLength(20): {Length} chars. Value: {Value}", 
                    orderNumber.Length, orderNumber);
                orderNumber = orderNumber.Substring(0, 20);
            }

            // Truncate fields to match MaxLength constraints and log warnings
            var receiverName = request.ReceiverName;
            if (receiverName?.Length > 200)
            {
                _logger.LogWarning("ReceiverName exceeds MaxLength(200): {Length} chars. Value: {Value}", 
                    receiverName.Length, receiverName);
                receiverName = receiverName.Substring(0, 200);
            }
            
            var receiverPhone = request.ReceiverPhone;
            if (receiverPhone?.Length > 20)
            {
                _logger.LogWarning("ReceiverPhone exceeds MaxLength(20): {Length} chars. Value: {Value}", 
                    receiverPhone.Length, receiverPhone);
                receiverPhone = receiverPhone.Substring(0, 20);
            }
            
            var receiverEmail = request.ReceiverEmail;
            if (receiverEmail?.Length > 200)
            {
                _logger.LogWarning("ReceiverEmail exceeds MaxLength(200): {Length} chars. Value: {Value}", 
                    receiverEmail.Length, receiverEmail);
                receiverEmail = receiverEmail.Substring(0, 200);
            }
            
            var notes = request.Notes;
            if (notes?.Length > 1000)
            {
                _logger.LogWarning("Notes exceeds MaxLength(1000): {Length} chars. Value: {Value}", 
                    notes.Length, notes);
                notes = notes.Substring(0, 1000);
            }

            // Create order
            var order = new Order
            {
                Id = Guid.NewGuid(),
                CustomerId = userId.Value,
                OrderNumber = orderNumber,
                Status = OrderStatus.PendingPayment,
                PaymentStatus = PaymentStatus.Pending,
                TotalAmount = totalAmount,
                Subtotal = totalAmount,
                ShippingFee = 0,
                Tax = 0,
                Discount = 0,
                Currency = "VND",
                ReceiverName = receiverName ?? string.Empty,
                ReceiverPhone = receiverPhone ?? string.Empty,
                ReceiverEmail = receiverEmail ?? string.Empty,
                ShippingAddress = request.ShippingAddress ?? string.Empty,
                Notes = notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Log all Order field lengths before insert for debugging
            _logger.LogInformation("Creating Order - Field lengths: OrderNumber={OrderNumberLen} ({OrderNumber}), " +
                "ReceiverName={ReceiverNameLen}, ReceiverPhone={ReceiverPhoneLen}, ReceiverEmail={ReceiverEmailLen}, " +
                "ShippingAddress={ShippingAddressLen}, Notes={NotesLen}, Currency={Currency}",
                order.OrderNumber.Length, order.OrderNumber,
                order.ReceiverName.Length, order.ReceiverPhone.Length, order.ReceiverEmail.Length,
                order.ShippingAddress?.Length ?? 0, order.Notes?.Length ?? 0, order.Currency);

            _db.Orders.Add(order);
            
            // Save order first to get the ID in database
            await _db.SaveChangesAsync();

            // Add order items after order is saved
            foreach (var item in orderItems)
            {
                // Log OrderItem field lengths for debugging
                _logger.LogInformation("Adding OrderItem - Field lengths: ProductName={ProductNameLen}, " +
                    "ProductImage={ProductImageLen}, SelectedVariant={SelectedVariantLen}",
                    item.ProductName.Length, item.ProductImage?.Length ?? 0, item.SelectedVariant?.Length ?? 0);
                
                item.OrderId = order.Id;
                _db.OrderItems.Add(item);
            }

            // Clear cart
            _db.ShoppingCarts.RemoveRange(cartItems);

            // Create corresponding Transaction for the order
            var transaction = new Transaction
            {
                TransactionId = orderNumber, // Use order number as transaction ID
                UserId = userId.Value,
                Type = "order_payment",
                EntityId = order.Id,
                EntityType = "Order",
                Amount = totalAmount,
                Currency = "VND",
                Status = "pending",
                TransactionDirection = "in", // Money coming in from customer
                PaymentMethod = "Bank Transfer",
                PaymentGateway = "SePay",
                Description = $"Order payment for products",
                CreatedBy = userId,
                UpdatedBy = userId
            };

            _db.Transactions.Add(transaction);

            // Save all changes (order items, cart removal, and transaction)
            await _db.SaveChangesAsync();

            _logger.LogInformation("Order {OrderNumber} created successfully for user {UserId}", orderNumber, userId.Value);

            return Ok(new CreateOrderResponse
            {
                OrderId = order.Id,
                OrderNumber = orderNumber,
                TotalAmount = totalAmount,
                Currency = "VND"
            });
        }
        catch (SqlException sqlEx)
        {
            // Log detailed SQL error information
            _logger.LogError(sqlEx, "SQL Error creating order. Error Number: {ErrorNumber}, Message: {Message}", 
                sqlEx.Number, sqlEx.Message);
            
            // Check if it's a truncation error
            if (sqlEx.Message.Contains("String or binary data would be truncated") || sqlEx.Number == 8152)
            {
                _logger.LogError("TRUNCATION ERROR DETECTED! This means a field value exceeds database column size. " +
                    "Check the warning logs above for which fields were truncated. " +
                    "You may need to increase MaxLength in the database schema.");
                return StatusCode(500, "Dữ liệu quá dài. Vui lòng kiểm tra lại thông tin nhập.");
            }
            
            return StatusCode(500, "Lỗi khi tạo đơn hàng: " + sqlEx.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating order");
            return StatusCode(500, "Internal server error");
        }
    }

    // GET: api/orders/{orderNumber}
    [HttpGet("{orderNumber}")]
    public async Task<ActionResult<OrderDto>> GetOrder(string orderNumber)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            var order = await _db.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber && o.CustomerId == userId.Value);

            if (order == null)
            {
                return NotFound("Order not found");
            }

            var orderDto = new OrderDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                Status = order.Status.ToString(),
                PaymentStatus = order.PaymentStatus.ToString(),
                TotalAmount = order.TotalAmount,
                Currency = order.Currency ?? "VND",
                ReceiverName = order.ReceiverName,
                ReceiverPhone = order.ReceiverPhone,
                ReceiverEmail = order.ReceiverEmail,
                ShippingAddress = order.ShippingAddress,
                Notes = order.Notes,
                CreatedAt = order.CreatedAt,
                Items = order.Items.Select(item => new OrderItemDto
                {
                    Id = item.Id,
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    ProductImage = item.ProductImage,
                    Quantity = item.Quantity,
                    Price = item.Price,
                    Subtotal = item.Subtotal,
                    SelectedVariant = item.SelectedVariant
                }).ToList()
            };

            return Ok(orderDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting order");
            return StatusCode(500, "Internal server error");
        }
    }

    // GET: api/orders
    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> GetMyOrders()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            var orders = await _db.Orders
                .Include(o => o.Items)
                .Where(o => o.CustomerId == userId.Value)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            var orderDtos = orders.Select(order => new OrderDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                Status = order.Status.ToString(),
                PaymentStatus = order.PaymentStatus.ToString(),
                TotalAmount = order.TotalAmount,
                Currency = order.Currency ?? "VND",
                ReceiverName = order.ReceiverName,
                ReceiverPhone = order.ReceiverPhone,
                ReceiverEmail = order.ReceiverEmail,
                ShippingAddress = order.ShippingAddress,
                Notes = order.Notes,
                CreatedAt = order.CreatedAt,
                Items = order.Items.Select(item => new OrderItemDto
                {
                    Id = item.Id,
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    ProductImage = item.ProductImage,
                    Quantity = item.Quantity,
                    Price = item.Price,
                    Subtotal = item.Subtotal,
                    SelectedVariant = item.SelectedVariant
                }).ToList()
            }).ToList();

            return Ok(orderDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user orders");
            return StatusCode(500, "Internal server error");
        }
    }

    // PUT: api/orders/{orderNumber}
    [HttpPut("{orderNumber}")]
    public async Task<ActionResult<CreateOrderResponse>> UpdateOrder(string orderNumber, [FromBody] CreateOrderRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            // Find existing order
            var order = await _db.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber && o.CustomerId == userId.Value);

            if (order == null)
            {
                return NotFound("Order not found");
            }

            // Only allow update if order is in PendingPayment status
            if (order.Status != OrderStatus.PendingPayment || order.PaymentStatus != PaymentStatus.Pending)
            {
                return BadRequest("Cannot update order that is not pending payment");
            }

            // Truncate fields to match MaxLength constraints
            var receiverName = request.ReceiverName?.Trim();
            var receiverPhone = request.ReceiverPhone?.Trim();
            var receiverEmail = request.ReceiverEmail?.Trim();
            var shippingAddress = request.ShippingAddress?.Trim();
            var notes = request.Notes?.Trim();

            if (receiverName?.Length > 200)
            {
                _logger.LogWarning("ReceiverName exceeds MaxLength(200): {Length} chars. Truncating.", receiverName.Length);
                receiverName = receiverName.Substring(0, 200);
            }

            if (receiverPhone?.Length > 20)
            {
                _logger.LogWarning("ReceiverPhone exceeds MaxLength(20): {Length} chars. Truncating.", receiverPhone.Length);
                receiverPhone = receiverPhone.Substring(0, 20);
            }

            if (receiverEmail?.Length > 200)
            {
                _logger.LogWarning("ReceiverEmail exceeds MaxLength(200): {Length} chars. Truncating.", receiverEmail.Length);
                receiverEmail = receiverEmail.Substring(0, 200);
            }

            if (notes?.Length > 1000)
            {
                _logger.LogWarning("Notes exceeds MaxLength(1000): {Length} chars. Truncating.", notes.Length);
                notes = notes.Substring(0, 1000);
            }

            // Update order fields
            order.ReceiverName = receiverName ?? string.Empty;
            order.ReceiverPhone = receiverPhone ?? string.Empty;
            order.ReceiverEmail = receiverEmail ?? string.Empty;
            order.ShippingAddress = shippingAddress ?? string.Empty;
            order.Notes = notes;
            order.UpdatedAt = DateTime.UtcNow;
            order.UpdatedBy = userId.Value;

            await _db.SaveChangesAsync();

            return Ok(new CreateOrderResponse
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                TotalAmount = order.TotalAmount,
                Currency = order.Currency ?? "VND"
            });
        }
        catch (SqlException sqlEx)
        {
            _logger.LogError(sqlEx, "SQL Error updating order. Error Number: {ErrorNumber}, Message: {Message}", 
                sqlEx.Number, sqlEx.Message);
            
            if (sqlEx.Message.Contains("String or binary data would be truncated") || sqlEx.Number == 8152)
            {
                _logger.LogError("TRUNCATION ERROR DETECTED! This means a field value exceeds database column size.");
                return StatusCode(500, "Dữ liệu quá dài. Vui lòng kiểm tra lại thông tin nhập.");
            }
            
            return StatusCode(500, "Lỗi khi cập nhật đơn hàng: " + sqlEx.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating order");
            return StatusCode(500, "Internal server error");
        }
    }

    public class UpdateOrderStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }

    // PUT: api/orders/{orderId}/status
    [HttpPut("{orderId:guid}/status")]
    [Authorize]
    public async Task<IActionResult> UpdateOrderStatus(Guid orderId, [FromBody] UpdateOrderStatusRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            var order = await _db.Orders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
            {
                return NotFound("Order not found");
            }

            // Role-based access: Admin can update any; TourGuide can update orders that have their products
            var isAdmin = User.IsInRole("Admin")
                || string.Equals(User.FindFirst("role")?.Value, "Admin", StringComparison.OrdinalIgnoreCase)
                || string.Equals(User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value, "Admin", StringComparison.OrdinalIgnoreCase);
            var isTourGuide = User.IsInRole("TourGuide")
                || string.Equals(User.FindFirst("role")?.Value, "TourGuide", StringComparison.OrdinalIgnoreCase)
                || string.Equals(User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value, "TourGuide", StringComparison.OrdinalIgnoreCase);

            if (isTourGuide)
            {
                var ownsAnyItem = order.Items.Any(i => i.Product.TourGuideId == userId.Value);
                if (!ownsAnyItem)
                {
                    return Forbid("You do not have permission to update this order");
                }
            }

            // Parse requested status
            if (!Enum.TryParse<OrderStatus>(request.Status, true, out var newStatus))
            {
                return BadRequest("Invalid order status");
            }

            // Transition rules
            var current = order.Status;

            bool allowed = false;
            if (isAdmin)
            {
                // Admin may set any transition, with a few guards
                if (current == OrderStatus.Delivered && newStatus == OrderStatus.Processing) allowed = false;
                else allowed = true;
            }
            else if (isTourGuide)
            {
                // Tour guide allowed transitions
                // Processing -> Shipped / Cancelled
                // Shipped -> Delivered / Cancelled
                // Delivered -> Returned
                allowed = (current == OrderStatus.Processing && (newStatus == OrderStatus.Shipped || newStatus == OrderStatus.Cancelled))
                       || (current == OrderStatus.Shipped && (newStatus == OrderStatus.Delivered || newStatus == OrderStatus.Cancelled))
                       || (current == OrderStatus.Delivered && newStatus == OrderStatus.Returned);

                // Tour guide cannot move from PendingPayment; payment handled by webhook/admin
                if (current == OrderStatus.PendingPayment)
                {
                    allowed = false;
                }
            }

            if (!allowed)
            {
                return BadRequest($"Transition {current} -> {newStatus} is not allowed");
            }

            order.Status = newStatus;
            order.UpdatedAt = DateTime.UtcNow;
            order.UpdatedBy = userId.Value;

            // Increment PurchaseCount and reduce stock for products when order is marked as Delivered
            if (newStatus == OrderStatus.Delivered && order.Status != OrderStatus.Delivered)
            {
                foreach (var item in order.Items)
                {
                    if (item.Product != null)
                    {
                        item.Product.PurchaseCount++;
                        _logger.LogInformation("Incremented PurchaseCount for Product {ProductId} to {Count}", 
                            item.ProductId, item.Product.PurchaseCount);

                        // Reduce stock from variant if SelectedVariant is stored
                        if (!string.IsNullOrEmpty(item.SelectedVariant) && !string.IsNullOrEmpty(item.Product.VariantsJson))
                        {
                            try
                            {
                                var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                                
                                // Parse the selected variant
                                var selectedVariant = System.Text.Json.JsonSerializer.Deserialize<ProductVariant>(item.SelectedVariant, options);
                                
                                // Parse product variants
                                var variants = System.Text.Json.JsonSerializer.Deserialize<List<ProductVariant>>(item.Product.VariantsJson, options);
                                
                                if (variants != null && selectedVariant != null)
                                {
                                    // Find matching variant (by price and unit)
                                    var matchingVariant = variants.FirstOrDefault(v => 
                                        v.Price == selectedVariant.Price && 
                                        v.NetUnit == selectedVariant.NetUnit &&
                                        v.NetAmount == selectedVariant.NetAmount);
                                    
                                    if (matchingVariant != null)
                                    {
                                        matchingVariant.StockQuantity -= item.Quantity;
                                        if (matchingVariant.StockQuantity < 0)
                                        {
                                            matchingVariant.StockQuantity = 0;
                                        }
                                        
                                        // Save updated variants back to product
                                        item.Product.VariantsJson = System.Text.Json.JsonSerializer.Serialize(variants, options);
                                        
                                        _logger.LogInformation("Reduced stock for Product {ProductId}, Variant {Unit}: {Amount}, Quantity: {Qty}, Remaining: {Remaining}",
                                            item.ProductId, selectedVariant.NetUnit, selectedVariant.NetAmount, item.Quantity, matchingVariant.StockQuantity);
                                    }
                                    else
                                    {
                                        _logger.LogWarning("Could not find matching variant for Product {ProductId}", item.ProductId);
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Error reducing stock for Product {ProductId}", item.ProductId);
                            }
                        }
                    }
                }
            }

            await _db.SaveChangesAsync();

            return Ok(new { message = "Order status updated", status = order.Status.ToString() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating order status");
            return StatusCode(500, "Internal server error");
        }
    }

    // GET: api/orders/admin
    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<object>> GetOrdersForAdmin(
        int page = 1,
        int pageSize = 20,
        string? status = null,
        string? paymentStatus = null,
        string? search = null)
    {
        try
        {
            var query = _db.Orders
                .Include(o => o.Customer)
                .Include(o => o.Items)
                .AsQueryable();

            // Filter by order status
            if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var orderStatus))
            {
                query = query.Where(o => o.Status == orderStatus);
            }

            // Filter by payment status
            if (!string.IsNullOrEmpty(paymentStatus) && Enum.TryParse<PaymentStatus>(paymentStatus, true, out var payStatus))
            {
                query = query.Where(o => o.PaymentStatus == payStatus);
            }

            // Search functionality
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(o =>
                    o.OrderNumber.Contains(search) ||
                    o.ReceiverName.Contains(search) ||
                    o.ReceiverEmail.Contains(search) ||
                    o.ReceiverPhone.Contains(search));
            }

            var totalCount = await query.CountAsync();

            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var orderDtos = orders.Select(order => new OrderDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                Status = order.Status.ToString(),
                PaymentStatus = order.PaymentStatus.ToString(),
                TotalAmount = order.TotalAmount,
                Currency = order.Currency ?? "VND",
                ReceiverName = order.ReceiverName,
                ReceiverPhone = order.ReceiverPhone,
                ReceiverEmail = order.ReceiverEmail,
                ShippingAddress = order.ShippingAddress,
                Notes = order.Notes,
                CreatedAt = order.CreatedAt,
                Items = order.Items.Select(item => new OrderItemDto
                {
                    Id = item.Id,
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    ProductImage = item.ProductImage,
                    Quantity = item.Quantity,
                    Price = item.Price,
                    Subtotal = item.Subtotal,
                    SelectedVariant = item.SelectedVariant
                }).ToList()
            }).ToList();

            return Ok(new
            {
                orders = orderDtos,
                pagination = new
                {
                    page,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting orders for admin");
            return StatusCode(500, "Internal server error");
        }
    }

    // GET: api/orders/tour-guide
    [HttpGet("tour-guide")]
    [Authorize(Roles = "TourGuide")]
    public async Task<ActionResult<object>> GetOrdersForTourGuide(
        int page = 1,
        int pageSize = 20,
        string? status = null,
        string? paymentStatus = null,
        string? search = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            // Get orders where at least one item belongs to a product owned by this tour guide
            var query = _db.Orders
                .Include(o => o.Customer)
                .Include(o => o.Items)
                    .ThenInclude(item => item.Product)
                .Where(o => o.Items.Any(item => item.Product.TourGuideId == userId.Value))
                .AsQueryable();

            // Filter by order status
            if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var orderStatus))
            {
                query = query.Where(o => o.Status == orderStatus);
            }

            // Filter by payment status
            if (!string.IsNullOrEmpty(paymentStatus) && Enum.TryParse<PaymentStatus>(paymentStatus, true, out var payStatus))
            {
                query = query.Where(o => o.PaymentStatus == payStatus);
            }

            // Search functionality
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(o =>
                    o.OrderNumber.Contains(search) ||
                    o.ReceiverName.Contains(search) ||
                    o.ReceiverEmail.Contains(search) ||
                    o.ReceiverPhone.Contains(search));
            }

            var totalCount = await query.CountAsync();

            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Filter items to only include those from this tour guide's products
            var orderDtos = orders.Select(order => new OrderDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                Status = order.Status.ToString(),
                PaymentStatus = order.PaymentStatus.ToString(),
                TotalAmount = order.Items
                    .Where(item => item.Product.TourGuideId == userId.Value)
                    .Sum(item => item.Subtotal),
                Currency = order.Currency ?? "VND",
                ReceiverName = order.ReceiverName,
                ReceiverPhone = order.ReceiverPhone,
                ReceiverEmail = order.ReceiverEmail,
                ShippingAddress = order.ShippingAddress,
                Notes = order.Notes,
                CreatedAt = order.CreatedAt,
                Items = order.Items
                    .Where(item => item.Product.TourGuideId == userId.Value)
                    .Select(item => new OrderItemDto
                    {
                        Id = item.Id,
                        ProductId = item.ProductId,
                        ProductName = item.ProductName,
                        ProductImage = item.ProductImage,
                        Quantity = item.Quantity,
                        Price = item.Price,
                        Subtotal = item.Subtotal,
                        SelectedVariant = item.SelectedVariant
                    }).ToList()
            }).Where(o => o.Items.Any()).ToList(); // Only return orders that have items from this tour guide

            return Ok(new
            {
                orders = orderDtos,
                pagination = new
                {
                    page,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting orders for tour guide");
            return StatusCode(500, "Internal server error");
        }
    }
}

