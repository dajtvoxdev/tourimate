using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using tourimate.Contracts.Products;
using TouriMate.Data;
using Entities.Models;
using Entities.Enums;
using System.Security.Claims;
using System.Text.Json;
using System.IdentityModel.Tokens.Jwt;

namespace tourimate.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductController : ControllerBase
{
    private readonly TouriMateDbContext _db;
    private readonly ILogger<ProductController> _logger;

    public ProductController(TouriMateDbContext db, ILogger<ProductController> logger)
    {
        _db = db;
        _logger = logger;
    }

    private static (decimal price, int stock, string currency) ComputeDerivedPricing(Product p)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(p.VariantsJson))
            {
                return (0m, 0, "VND");
            }
            var variants = JsonSerializer.Deserialize<List<VariantPayload>>(p.VariantsJson!) ?? new();
            var minPrice = variants.Count > 0 ? variants.Min(v => (decimal)(v.price ?? 0)) : 0m;
            var totalStock = variants.Sum(v => v.stockQuantity ?? 0);
            return (minPrice, totalStock, "VND");
        }
        catch
        {
            return (0m, 0, "VND");
        }
    }

    private class VariantPayload
    {
        public string? unit { get; set; }
        public decimal? price { get; set; }
        public int? stockQuantity { get; set; }
        public decimal? netAmount { get; set; }
        public string? netUnit { get; set; }
        public bool? isOnSale { get; set; }
        public decimal? salePrice { get; set; }
        public string? saleStartDate { get; set; }
        public string? saleEndDate { get; set; }
    }

    [HttpGet]
    public async Task<ActionResult<ProductSearchResponse>> GetProducts([FromQuery] ProductSearchRequest request)
    {
        try
        {
            var baseQuery = _db.Products
                .Include(p => p.Tour)
                .Include(p => p.TourGuide)
                .AsQueryable();

            // Apply simple string/eq filters server-side
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                baseQuery = baseQuery.Where(p => p.Name.Contains(request.SearchTerm) ||
                                           (p.Description != null && p.Description.Contains(request.SearchTerm)) ||
                                           (p.ShortDescription != null && p.ShortDescription.Contains(request.SearchTerm)));
            }

            if (!string.IsNullOrWhiteSpace(request.Category))
            {
                baseQuery = baseQuery.Where(p => p.Category == request.Category);
            }

            if (!string.IsNullOrWhiteSpace(request.Brand))
            {
                baseQuery = baseQuery.Where(p => p.Brand == request.Brand);
            }

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                baseQuery = baseQuery.Where(p => p.Status == request.Status);
            }

            if (request.TourId.HasValue)
            {
                baseQuery = baseQuery.Where(p => p.TourId == request.TourId.Value);
            }

            if (request.TourGuideId.HasValue)
            {
                baseQuery = baseQuery.Where(p => p.TourGuideId == request.TourGuideId.Value);
            }

            if (request.ProvinceCode.HasValue)
            {
                baseQuery = baseQuery.Where(p => p.Tour.ProvinceCode == request.ProvinceCode.Value);
            }

            if (request.IsFeatured.HasValue)
            {
                baseQuery = baseQuery.Where(p => p.IsFeatured == request.IsFeatured.Value);
            }

            if (request.IsBestSeller.HasValue)
            {
                baseQuery = baseQuery.Where(p => p.IsBestSeller == request.IsBestSeller.Value);
            }

            if (request.IsNewArrival.HasValue)
            {
                baseQuery = baseQuery.Where(p => p.IsNewArrival == request.IsNewArrival.Value);
            }

            if (request.IsOnSale.HasValue)
            {
                baseQuery = baseQuery.Where(p => p.IsOnSale == request.IsOnSale.Value);
            }

            // Materialize then apply price filters/sorts based on VariantsJson
            var all = await baseQuery
                .OrderByDescending(p => p.CreatedAt) // temp ordering before in-memory adjustments
                .ToListAsync();

            // Derived filters
            if (request.MinPrice.HasValue)
            {
                all = all.Where(p => ComputeDerivedPricing(p).price >= request.MinPrice.Value).ToList();
            }
            if (request.MaxPrice.HasValue)
            {
                all = all.Where(p => ComputeDerivedPricing(p).price <= request.MaxPrice.Value).ToList();
            }

            // Sorting
            if (!string.IsNullOrWhiteSpace(request.SortBy) && request.SortBy.Equals("price", StringComparison.OrdinalIgnoreCase))
            {
                all = (request.SortOrder?.ToLower() == "desc")
                    ? all.OrderByDescending(p => ComputeDerivedPricing(p).price).ToList()
                    : all.OrderBy(p => ComputeDerivedPricing(p).price).ToList();
            }
            else
            {
                // keep createdAt desc as default
                if (!string.IsNullOrWhiteSpace(request.SortBy))
                {
                    // fallback to name/rating/viewcount/purchasecount using in-memory if needed
                    switch (request.SortBy.ToLower())
                    {
                        case "name":
                            all = (request.SortOrder?.ToLower() == "desc") ? all.OrderByDescending(p => p.Name).ToList() : all.OrderBy(p => p.Name).ToList();
                            break;
                        case "rating":
                            all = (request.SortOrder?.ToLower() == "desc") ? all.OrderByDescending(p => p.Rating).ToList() : all.OrderBy(p => p.Rating).ToList();
                            break;
                        case "viewcount":
                            all = (request.SortOrder?.ToLower() == "desc") ? all.OrderByDescending(p => p.ViewCount).ToList() : all.OrderBy(p => p.ViewCount).ToList();
                            break;
                        case "purchasecount":
                            all = (request.SortOrder?.ToLower() == "desc") ? all.OrderByDescending(p => p.PurchaseCount).ToList() : all.OrderBy(p => p.PurchaseCount).ToList();
                            break;
                        default:
                            all = all.OrderByDescending(p => p.CreatedAt).ToList();
                            break;
                    }
                }
            }

            var totalCount = all.Count;

            var pageItems = all
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToList();

            var products = pageItems.Select(p =>
            {
                var (price, stock, currency) = ComputeDerivedPricing(p);
                return new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    ShortDescription = p.ShortDescription,
                    Price = price,
                    Currency = currency,
                    Images = p.Images,
                    TourId = p.TourId,
                    TourTitle = p.Tour.Title,
                    TourGuideId = p.TourGuideId,
                    TourGuideName = p.TourGuide.FirstName + " " + p.TourGuide.LastName,
                    Status = p.Status,
                    Category = p.Category,
                    Brand = p.Brand,
                    StockQuantity = stock,
                    MinOrderQuantity = p.MinOrderQuantity,
                    MaxOrderQuantity = p.MaxOrderQuantity,
                    IsFeatured = p.IsFeatured,
                    IsBestSeller = p.IsBestSeller,
                    IsNewArrival = p.IsNewArrival,
                    IsOnSale = p.IsOnSale,
                    SalePrice = p.SalePrice,
                    SaleStartDate = p.SaleStartDate,
                    SaleEndDate = p.SaleEndDate,
                    ViewCount = p.ViewCount,
                    PurchaseCount = p.PurchaseCount,
                    Rating = p.Rating,
                    ReviewCount = p.ReviewCount,
                    VariantsJson = p.VariantsJson,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                };
            }).ToList();

            return Ok(new ProductSearchResponse
            {
                Products = products,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / request.PageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting products");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductDto request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            // Check if user is tour guide
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null || user.Role != UserRole.TourGuide)
            {
                return Forbid("Only tour guides can create products");
            }

            // Verify tour exists and belongs to the tour guide
            var tour = await _db.Tours.FirstOrDefaultAsync(t => t.Id == request.TourId);
            if (tour == null)
            {
                return BadRequest("Tour not found");
            }

            if (tour.TourGuideId != userId.Value)
            {
                return Forbid("You can only create products for your own tours");
            }

            var product = new Product
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                ShortDescription = request.ShortDescription,
                Images = request.Images,
                TourId = request.TourId,
                TourGuideId = userId.Value,
                Status = "Draft",
                Category = request.Category,
                Brand = request.Brand,
                MinOrderQuantity = request.MinOrderQuantity,
                MaxOrderQuantity = request.MaxOrderQuantity,
                IsFeatured = request.IsFeatured,
                IsBestSeller = request.IsBestSeller,
                IsNewArrival = request.IsNewArrival,
                IsOnSale = request.IsOnSale,
                SalePrice = request.SalePrice,
                SaleStartDate = request.SaleStartDate,
                SaleEndDate = request.SaleEndDate,
                VariantsJson = request.VariantsJson,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = userId.Value
            };

            // Set DB-backed columns from derived pricing (cheapest variant and total stock)
            var (cPrice, cStock, cCurr) = ComputeDerivedPricing(product);
            product.DbPrice = cPrice;
            product.DbStockQuantity = cStock;
            product.DbCurrency = cCurr;

            _db.Products.Add(product);
            await _db.SaveChangesAsync();

            // Return the created product
            var createdProduct = await _db.Products
                .Include(p => p.Tour)
                .Include(p => p.TourGuide)
                .FirstOrDefaultAsync(p => p.Id == product.Id);

            var (price, stock, currency) = ComputeDerivedPricing(createdProduct!);

            var productDto = new ProductDto
            {
                Id = createdProduct!.Id,
                Name = createdProduct.Name,
                Description = createdProduct.Description,
                ShortDescription = createdProduct.ShortDescription,
                Price = price,
                Currency = currency,
                Images = createdProduct.Images,
                TourId = createdProduct.TourId,
                TourTitle = createdProduct.Tour.Title,
                TourGuideId = createdProduct.TourGuideId,
                TourGuideName = createdProduct.TourGuide.FirstName + " " + createdProduct.TourGuide.LastName,
                Status = createdProduct.Status,
                Category = createdProduct.Category,
                Brand = createdProduct.Brand,
                StockQuantity = stock,
                MinOrderQuantity = createdProduct.MinOrderQuantity,
                MaxOrderQuantity = createdProduct.MaxOrderQuantity,
                IsFeatured = createdProduct.IsFeatured,
                IsBestSeller = createdProduct.IsBestSeller,
                IsNewArrival = createdProduct.IsNewArrival,
                IsOnSale = createdProduct.IsOnSale,
                SalePrice = createdProduct.SalePrice,
                SaleStartDate = createdProduct.SaleStartDate,
                SaleEndDate = createdProduct.SaleEndDate,
                ViewCount = createdProduct.ViewCount,
                PurchaseCount = createdProduct.PurchaseCount,
                Rating = createdProduct.Rating,
                ReviewCount = createdProduct.ReviewCount,
                VariantsJson = createdProduct.VariantsJson,
                CreatedAt = createdProduct.CreatedAt,
                UpdatedAt = createdProduct.UpdatedAt
            };

            return CreatedAtAction(nameof(GetProductById), new { id = product.Id }, productDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProductDto>> UpdateProduct(Guid id, [FromBody] UpdateProductDto request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
            {
                return NotFound("Product not found");
            }

            // Check if user is the tour guide who created the product
            if (product.TourGuideId != userId.Value)
            {
                return Forbid("You can only update your own products");
            }

            // Update fields if provided
            if (!string.IsNullOrWhiteSpace(request.Name))
                product.Name = request.Name;
            if (request.Description != null)
                product.Description = request.Description;
            if (request.ShortDescription != null)
                product.ShortDescription = request.ShortDescription;
            if (request.Images != null)
                product.Images = request.Images;
            if (!string.IsNullOrWhiteSpace(request.Status))
                product.Status = request.Status;
            if (request.Category != null)
                product.Category = request.Category;
            if (request.Brand != null)
                product.Brand = request.Brand;
            if (request.MinOrderQuantity.HasValue)
                product.MinOrderQuantity = request.MinOrderQuantity.Value;
            if (request.MaxOrderQuantity.HasValue)
                product.MaxOrderQuantity = request.MaxOrderQuantity.Value;
            if (request.IsFeatured.HasValue)
                product.IsFeatured = request.IsFeatured.Value;
            if (request.IsBestSeller.HasValue)
                product.IsBestSeller = request.IsBestSeller.Value;
            if (request.IsNewArrival.HasValue)
                product.IsNewArrival = request.IsNewArrival.Value;
            if (request.IsOnSale.HasValue)
                product.IsOnSale = request.IsOnSale.Value;
            if (request.SalePrice.HasValue)
                product.SalePrice = request.SalePrice;
            if (request.SaleStartDate.HasValue)
                product.SaleStartDate = request.SaleStartDate;
            if (request.SaleEndDate.HasValue)
                product.SaleEndDate = request.SaleEndDate;
            if (request.VariantsJson != null)
                product.VariantsJson = request.VariantsJson;

            // Reset status when product is updated (requires re-approval)
            // Only reset if product was previously approved
            if (product.Status == "Approved")
            {
                product.Status = "PendingApproval"; // Require re-approval after update
                
                _logger.LogInformation("Product {ProductId} status reset to PendingApproval after update by tour guide {UserId}", 
                    product.Id, userId.Value);
            }

            // Update DB-backed columns from derived pricing
            var (uPrice, uStock, uCurr) = ComputeDerivedPricing(product);
            product.DbPrice = uPrice;
            product.DbStockQuantity = uStock;
            product.DbCurrency = uCurr;

            product.UpdatedAt = DateTime.UtcNow;
            product.UpdatedBy = userId.Value;

            await _db.SaveChangesAsync();

            // Return updated product
            var updatedProduct = await _db.Products
                .Include(p => p.Tour)
                .Include(p => p.TourGuide)
                .FirstOrDefaultAsync(p => p.Id == id);

            var (price, stock, currency) = ComputeDerivedPricing(updatedProduct!);

            var productDto = new ProductDto
            {
                Id = updatedProduct!.Id,
                Name = updatedProduct.Name,
                Description = updatedProduct.Description,
                ShortDescription = updatedProduct.ShortDescription,
                Price = price,
                Currency = currency,
                Images = updatedProduct.Images,
                TourId = updatedProduct.TourId,
                TourTitle = updatedProduct.Tour.Title,
                TourGuideId = updatedProduct.TourGuideId,
                TourGuideName = updatedProduct.TourGuide.FirstName + " " + updatedProduct.TourGuide.LastName,
                Status = updatedProduct.Status,
                Category = updatedProduct.Category,
                Brand = updatedProduct.Brand,
                StockQuantity = stock,
                MinOrderQuantity = updatedProduct.MinOrderQuantity,
                MaxOrderQuantity = updatedProduct.MaxOrderQuantity,
                IsFeatured = updatedProduct.IsFeatured,
                IsBestSeller = updatedProduct.IsBestSeller,
                IsNewArrival = updatedProduct.IsNewArrival,
                IsOnSale = updatedProduct.IsOnSale,
                SalePrice = updatedProduct.SalePrice,
                SaleStartDate = updatedProduct.SaleStartDate,
                SaleEndDate = updatedProduct.SaleEndDate,
                ViewCount = updatedProduct.ViewCount,
                PurchaseCount = updatedProduct.PurchaseCount,
                Rating = updatedProduct.Rating,
                ReviewCount = updatedProduct.ReviewCount,
                VariantsJson = updatedProduct.VariantsJson,
                CreatedAt = updatedProduct.CreatedAt,
                UpdatedAt = updatedProduct.UpdatedAt
            };

            return Ok(productDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product {ProductId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
            {
                return NotFound("Product not found");
            }

            // Check if user is the tour guide who created the product
            if (product.TourGuideId != userId.Value)
            {
                return Forbid("You can only delete your own products");
            }

            _db.Products.Remove(product);
            await _db.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product {ProductId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("tour/{tourId}")]
    public async Task<ActionResult<List<ProductDto>>> GetProductsByTour(Guid tourId)
    {
        try
        {
            var list = await _db.Products
                .Include(p => p.Tour)
                .Include(p => p.TourGuide)
                .Where(p => p.TourId == tourId && p.Status == "Active")
                .OrderBy(p => p.Name)
                .ToListAsync();

            var products = list.Select(p =>
            {
                var (price, stock, currency) = ComputeDerivedPricing(p);
                return new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    ShortDescription = p.ShortDescription,
                    Price = price,
                    Currency = currency,
                    Images = p.Images,
                    TourId = p.TourId,
                    TourTitle = p.Tour.Title,
                    TourGuideId = p.TourGuideId,
                    TourGuideName = p.TourGuide.FirstName + " " + p.TourGuide.LastName,
                    Status = p.Status,
                    Category = p.Category,
                    Brand = p.Brand,
                    StockQuantity = stock,
                    MinOrderQuantity = p.MinOrderQuantity,
                    MaxOrderQuantity = p.MaxOrderQuantity,
                    IsFeatured = p.IsFeatured,
                    IsBestSeller = p.IsBestSeller,
                    IsNewArrival = p.IsNewArrival,
                    IsOnSale = p.IsOnSale,
                    SalePrice = p.SalePrice,
                    SaleStartDate = p.SaleStartDate,
                    SaleEndDate = p.SaleEndDate,
                    ViewCount = p.ViewCount,
                    PurchaseCount = p.PurchaseCount,
                    Rating = p.Rating,
                    ReviewCount = p.ReviewCount,
                    VariantsJson = p.VariantsJson,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                };
            }).ToList();

            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting products for tour {TourId}", tourId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("my-products")]
    public async Task<ActionResult<ProductSearchResponse>> GetMyProducts([FromQuery] ProductSearchRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            // Override TourGuideId filter to only show current user's products
            request.TourGuideId = userId.Value;

            return await GetProducts(request);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting my products");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("pending-approval")]
    public async Task<ActionResult<ProductSearchResponse>> GetProductsPendingApproval([FromQuery] ProductSearchRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            // Check if user is admin
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null || user.Role != UserRole.Admin)
            {
                return Forbid("Only admins can access this endpoint");
            }

            // Get all products regardless of tour guide, but filter by status if not specified
            // If no status filter is provided, default to showing products that need review
            if (string.IsNullOrWhiteSpace(request.Status))
            {
                // Show products pending approval by default, but allow filtering
                request.Status = null; // Allow all statuses but admin can filter
            }

            return await GetProducts(request);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting products pending approval");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("statistics")]
    public async Task<ActionResult<ProductStatisticsDto>> GetProductStatistics()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            var query = _db.Products.Where(p => p.TourGuideId == userId.Value).AsEnumerable();

            var statsSource = query.ToList();

            var statistics = new ProductStatisticsDto
            {
                TotalProducts = statsSource.Count,
                ActiveProducts = statsSource.Count(p => p.Status == "Approved"), // Count approved products as active
                DraftProducts = statsSource.Count(p => p.Status == "Draft"),
                InactiveProducts = statsSource.Count(p => p.Status == "Rejected" || p.Status == "Discontinued"), // Count rejected and discontinued as inactive
                FeaturedProducts = statsSource.Count(p => p.IsFeatured),
                BestSellerProducts = statsSource.Count(p => p.IsBestSeller),
                NewArrivalProducts = statsSource.Count(p => p.IsNewArrival),
                OnSaleProducts = statsSource.Count(p => p.IsOnSale),
                TotalValue = statsSource.Select(p => ComputeDerivedPricing(p).price * ComputeDerivedPricing(p).stock).DefaultIfEmpty(0m).Sum(),
                AveragePrice = statsSource.Any() ? statsSource.Average(p => ComputeDerivedPricing(p).price) : 0m,
                TotalViews = statsSource.Select(p => p.ViewCount).DefaultIfEmpty(0).Sum(),
                TotalPurchases = statsSource.Select(p => p.PurchaseCount).DefaultIfEmpty(0).Sum(),
                AverageRating = statsSource.Any() ? statsSource.Average(p => p.Rating.HasValue ? (decimal)p.Rating.Value : 0m) : 0m
            };

            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting product statistics");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveProduct(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            // Check if user is admin
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null || user.Role != UserRole.Admin)
            {
                return Forbid("Only admins can approve products");
            }

            var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
            {
                return NotFound("Product not found");
            }

            if (product.Status == "Approved")
            {
                return BadRequest("Product is already approved");
            }

            product.Status = "Approved";
            product.UpdatedAt = DateTime.UtcNow;
            product.UpdatedBy = userId.Value;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Product approved successfully", productId = product.Id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving product {ProductId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectProduct(Guid id, [FromBody] RejectProductDto request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            // Check if user is admin
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null || user.Role != UserRole.Admin)
            {
                return Forbid("Only admins can reject products");
            }

            var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
            {
                return NotFound("Product not found");
            }

            if (product.Status == "Rejected")
            {
                return BadRequest("Product is already rejected");
            }

            product.Status = "Rejected";
            product.UpdatedAt = DateTime.UtcNow;
            product.UpdatedBy = userId.Value;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Product rejected successfully", productId = product.Id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting product {ProductId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("{id}/request-approval")]
    public async Task<IActionResult> RequestApproval(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
            {
                return NotFound("Product not found");
            }

            if (product.TourGuideId != userId.Value)
            {
                return Forbid("You can only request approval for your own products");
            }

            // Move to PendingApproval
            product.Status = "PendingApproval";
            product.UpdatedAt = DateTime.UtcNow;
            product.UpdatedBy = userId.Value;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Approval requested", productId = product.Id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error requesting approval for product {ProductId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get featured products (TOP 5)
    /// </summary>
    [HttpGet("featured")]
    public async Task<ActionResult<List<ProductDto>>> GetFeaturedProducts()
    {
        try
        {
            var products = await _db.Products
                .Include(p => p.Tour)
                .Include(p => p.TourGuide)
                .Where(p => p.Status == "Approved" && p.IsFeatured)
                .OrderByDescending(p => p.CreatedAt)
                .Take(5)
                .ToListAsync();

            var productDtos = products.Select(p =>
            {
                var (price, stock, currency) = ComputeDerivedPricing(p);
                return new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    ShortDescription = p.ShortDescription,
                    Price = price,
                    Currency = currency,
                    Images = p.Images,
                    TourId = p.TourId,
                    TourTitle = p.Tour.Title,
                    TourGuideId = p.TourGuideId,
                    TourGuideName = p.TourGuide.FirstName + " " + p.TourGuide.LastName,
                    Status = p.Status,
                    Category = p.Category,
                    Brand = p.Brand,
                    StockQuantity = stock,
                    MinOrderQuantity = p.MinOrderQuantity,
                    MaxOrderQuantity = p.MaxOrderQuantity,
                    IsFeatured = p.IsFeatured,
                    IsBestSeller = p.IsBestSeller,
                    IsNewArrival = p.IsNewArrival,
                    IsOnSale = p.IsOnSale,
                    SalePrice = p.SalePrice,
                    SaleStartDate = p.SaleStartDate,
                    SaleEndDate = p.SaleEndDate,
                    ViewCount = p.ViewCount,
                    PurchaseCount = p.PurchaseCount,
                    Rating = p.Rating,
                    ReviewCount = p.ReviewCount,
                    VariantsJson = p.VariantsJson,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                };
            }).ToList();

            return Ok(productDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting featured products");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get best-selling products (TOP 6)
    /// </summary>
    [HttpGet("best-selling")]
    public async Task<ActionResult<List<ProductDto>>> GetBestSellingProducts()
    {
        try
        {
            var products = await _db.Products
                .Include(p => p.Tour)
                .Include(p => p.TourGuide)
                .Where(p => p.Status == "Approved")
                .OrderByDescending(p => p.PurchaseCount)
                .Take(6)
                .ToListAsync();

            var productDtos = products.Select(p =>
            {
                var (price, stock, currency) = ComputeDerivedPricing(p);
                return new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    ShortDescription = p.ShortDescription,
                    Price = price,
                    Currency = currency,
                    Images = p.Images,
                    TourId = p.TourId,
                    TourTitle = p.Tour.Title,
                    TourGuideId = p.TourGuideId,
                    TourGuideName = p.TourGuide.FirstName + " " + p.TourGuide.LastName,
                    Status = p.Status,
                    Category = p.Category,
                    Brand = p.Brand,
                    StockQuantity = stock,
                    MinOrderQuantity = p.MinOrderQuantity,
                    MaxOrderQuantity = p.MaxOrderQuantity,
                    IsFeatured = p.IsFeatured,
                    IsBestSeller = p.IsBestSeller,
                    IsNewArrival = p.IsNewArrival,
                    IsOnSale = p.IsOnSale,
                    SalePrice = p.SalePrice,
                    SaleStartDate = p.SaleStartDate,
                    SaleEndDate = p.SaleEndDate,
                    ViewCount = p.ViewCount,
                    PurchaseCount = p.PurchaseCount,
                    Rating = p.Rating,
                    ReviewCount = p.ReviewCount,
                    VariantsJson = p.VariantsJson,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                };
            }).ToList();

            return Ok(productDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting best-selling products");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get related products from the same tour
    /// </summary>
    [HttpGet("{id}/related")]
    public async Task<ActionResult<List<ProductDto>>> GetRelatedProducts(Guid id)
    {
        try
        {
            var product = await _db.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound("Product not found");
            }

            var relatedProducts = await _db.Products
                .Include(p => p.Tour)
                .Include(p => p.TourGuide)
                .Where(p => p.TourId == product.TourId && p.Id != id && p.Status == "Approved")
                .OrderByDescending(p => p.PurchaseCount)
                .Take(4)
                .ToListAsync();

            var productDtos = relatedProducts.Select(p =>
            {
                var (price, stock, currency) = ComputeDerivedPricing(p);
                return new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    ShortDescription = p.ShortDescription,
                    Price = price,
                    Currency = currency,
                    Images = p.Images,
                    TourId = p.TourId,
                    TourTitle = p.Tour.Title,
                    TourGuideId = p.TourGuideId,
                    TourGuideName = p.TourGuide.FirstName + " " + p.TourGuide.LastName,
                    Status = p.Status,
                    Category = p.Category,
                    Brand = p.Brand,
                    StockQuantity = stock,
                    MinOrderQuantity = p.MinOrderQuantity,
                    MaxOrderQuantity = p.MaxOrderQuantity,
                    IsFeatured = p.IsFeatured,
                    IsBestSeller = p.IsBestSeller,
                    IsNewArrival = p.IsNewArrival,
                    IsOnSale = p.IsOnSale,
                    SalePrice = p.SalePrice,
                    SaleStartDate = p.SaleStartDate,
                    SaleEndDate = p.SaleEndDate,
                    ViewCount = p.ViewCount,
                    PurchaseCount = p.PurchaseCount,
                    Rating = p.Rating,
                    ReviewCount = p.ReviewCount,
                    VariantsJson = p.VariantsJson,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                };
            }).ToList();

            return Ok(productDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting related products for product {ProductId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get product by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProductById(Guid id)
    {
        try
        {
            var product = await _db.Products
                .Include(p => p.Tour)
                .Include(p => p.TourGuide)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return NotFound("Product not found");
            }

            var (price, stock, currency) = ComputeDerivedPricing(product);
            var productDto = new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                ShortDescription = product.ShortDescription,
                Price = price,
                Currency = currency,
                Images = product.Images,
                TourId = product.TourId,
                TourTitle = product.Tour.Title,
                TourGuideId = product.TourGuideId,
                TourGuideName = product.TourGuide.FirstName + " " + product.TourGuide.LastName,
                Status = product.Status,
                Category = product.Category,
                Brand = product.Brand,
                StockQuantity = stock,
                MinOrderQuantity = product.MinOrderQuantity,
                MaxOrderQuantity = product.MaxOrderQuantity,
                IsFeatured = product.IsFeatured,
                IsBestSeller = product.IsBestSeller,
                IsNewArrival = product.IsNewArrival,
                IsOnSale = product.IsOnSale,
                SalePrice = product.SalePrice,
                SaleStartDate = product.SaleStartDate,
                SaleEndDate = product.SaleEndDate,
                ViewCount = product.ViewCount,
                PurchaseCount = product.PurchaseCount,
                Rating = product.Rating,
                ReviewCount = product.ReviewCount,
                VariantsJson = product.VariantsJson,
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt
            };

            // Increment view count
            product.ViewCount++;
            await _db.SaveChangesAsync();

            return Ok(productDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting product {ProductId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return string.IsNullOrEmpty(userIdClaim) ? null : Guid.Parse(userIdClaim);
    }
}

public class RejectProductDto
{
    public string? RejectionReason { get; set; }
}
