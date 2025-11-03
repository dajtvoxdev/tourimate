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

    [HttpGet]
    public async Task<ActionResult<ProductSearchResponse>> GetProducts([FromQuery] ProductSearchRequest request)
    {
        try
        {
            var query = _db.Products
                .Include(p => p.Tour)
                .Include(p => p.TourGuide)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                query = query.Where(p => p.Name.Contains(request.SearchTerm) ||
                                       (p.Description != null && p.Description.Contains(request.SearchTerm)) ||
                                       (p.ShortDescription != null && p.ShortDescription.Contains(request.SearchTerm)));
            }

            if (!string.IsNullOrWhiteSpace(request.Category))
            {
                query = query.Where(p => p.Category == request.Category);
            }

            if (!string.IsNullOrWhiteSpace(request.Brand))
            {
                query = query.Where(p => p.Brand == request.Brand);
            }

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                query = query.Where(p => p.Status == request.Status);
            }

            if (request.TourId.HasValue)
            {
                query = query.Where(p => p.TourId == request.TourId.Value);
            }

            if (request.TourGuideId.HasValue)
            {
                query = query.Where(p => p.TourGuideId == request.TourGuideId.Value);
            }

            if (request.MinPrice.HasValue)
            {
                query = query.Where(p => p.Price >= request.MinPrice.Value);
            }

            if (request.MaxPrice.HasValue)
            {
                query = query.Where(p => p.Price <= request.MaxPrice.Value);
            }

            if (request.IsFeatured.HasValue)
            {
                query = query.Where(p => p.IsFeatured == request.IsFeatured.Value);
            }

            if (request.IsBestSeller.HasValue)
            {
                query = query.Where(p => p.IsBestSeller == request.IsBestSeller.Value);
            }

            if (request.IsNewArrival.HasValue)
            {
                query = query.Where(p => p.IsNewArrival == request.IsNewArrival.Value);
            }

            if (request.IsOnSale.HasValue)
            {
                query = query.Where(p => p.IsOnSale == request.IsOnSale.Value);
            }

            if (request.IsDigital.HasValue)
            {
                query = query.Where(p => p.IsDigital == request.IsDigital.Value);
            }

            // Apply sorting
            query = request.SortBy?.ToLower() switch
            {
                "name" => request.SortOrder == "desc" ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
                "price" => request.SortOrder == "desc" ? query.OrderByDescending(p => p.Price) : query.OrderBy(p => p.Price),
                "createdat" => request.SortOrder == "desc" ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
                "rating" => request.SortOrder == "desc" ? query.OrderByDescending(p => p.Rating) : query.OrderBy(p => p.Rating),
                "viewcount" => request.SortOrder == "desc" ? query.OrderByDescending(p => p.ViewCount) : query.OrderBy(p => p.ViewCount),
                "purchasecount" => request.SortOrder == "desc" ? query.OrderByDescending(p => p.PurchaseCount) : query.OrderBy(p => p.PurchaseCount),
                _ => query.OrderByDescending(p => p.CreatedAt)
            };

            var totalCount = await query.CountAsync();

            var products = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    ShortDescription = p.ShortDescription,
                    Price = p.Price,
                    Currency = p.Currency,
                    Images = p.Images,
                    TourId = p.TourId,
                    TourTitle = p.Tour.Title,
                    TourGuideId = p.TourGuideId,
                    TourGuideName = p.TourGuide.FirstName + " " + p.TourGuide.LastName,
                    Status = p.Status,
                    Category = p.Category,
                    Brand = p.Brand,
                    Unit = p.Unit,
                    Weight = p.Weight,
                    Dimensions = p.Dimensions,
                    Specifications = p.Specifications,
                    Features = p.Features,
                    UsageInstructions = p.UsageInstructions,
                    CareInstructions = p.CareInstructions,
                    Warranty = p.Warranty,
                    ReturnPolicy = p.ReturnPolicy,
                    ShippingInfo = p.ShippingInfo,
                    StockQuantity = p.StockQuantity,
                    MinOrderQuantity = p.MinOrderQuantity,
                    MaxOrderQuantity = p.MaxOrderQuantity,
                    IsDigital = p.IsDigital,
                    IsFeatured = p.IsFeatured,
                    IsBestSeller = p.IsBestSeller,
                    IsNewArrival = p.IsNewArrival,
                    IsOnSale = p.IsOnSale,
                    SalePrice = p.SalePrice,
                    SaleStartDate = p.SaleStartDate,
                    SaleEndDate = p.SaleEndDate,
                    Tags = p.Tags,
                    SEOKeywords = p.SEOKeywords,
                    SEODescription = p.SEODescription,
                    ViewCount = p.ViewCount,
                    PurchaseCount = p.PurchaseCount,
                    Rating = p.Rating,
                    ReviewCount = p.ReviewCount,
                    Notes = p.Notes,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                })
                .ToListAsync();

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

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProduct(Guid id)
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

            // Increment view count
            product.ViewCount++;
            await _db.SaveChangesAsync();

            var productDto = new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                ShortDescription = product.ShortDescription,
                Price = product.Price,
                Currency = product.Currency,
                Images = product.Images,
                TourId = product.TourId,
                TourTitle = product.Tour.Title,
                TourGuideId = product.TourGuideId,
                TourGuideName = product.TourGuide.FirstName + " " + product.TourGuide.LastName,
                Status = product.Status,
                Category = product.Category,
                Brand = product.Brand,
                Unit = product.Unit,
                Weight = product.Weight,
                Dimensions = product.Dimensions,
                Specifications = product.Specifications,
                Features = product.Features,
                UsageInstructions = product.UsageInstructions,
                CareInstructions = product.CareInstructions,
                Warranty = product.Warranty,
                ReturnPolicy = product.ReturnPolicy,
                ShippingInfo = product.ShippingInfo,
                StockQuantity = product.StockQuantity,
                MinOrderQuantity = product.MinOrderQuantity,
                MaxOrderQuantity = product.MaxOrderQuantity,
                IsDigital = product.IsDigital,
                IsFeatured = product.IsFeatured,
                IsBestSeller = product.IsBestSeller,
                IsNewArrival = product.IsNewArrival,
                IsOnSale = product.IsOnSale,
                SalePrice = product.SalePrice,
                SaleStartDate = product.SaleStartDate,
                SaleEndDate = product.SaleEndDate,
                Tags = product.Tags,
                SEOKeywords = product.SEOKeywords,
                SEODescription = product.SEODescription,
                ViewCount = product.ViewCount,
                PurchaseCount = product.PurchaseCount,
                Rating = product.Rating,
                ReviewCount = product.ReviewCount,
                Notes = product.Notes,
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt
            };

            return Ok(productDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting product {ProductId}", id);
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
                Price = request.Price,
                Currency = request.Currency,
                Images = request.Images,
                TourId = request.TourId,
                TourGuideId = userId.Value,
                Status = "Draft",
                Category = request.Category,
                Brand = request.Brand,
                Unit = request.Unit,
                Weight = request.Weight,
                Dimensions = request.Dimensions,
                Specifications = request.Specifications,
                Features = request.Features,
                UsageInstructions = request.UsageInstructions,
                CareInstructions = request.CareInstructions,
                Warranty = request.Warranty,
                ReturnPolicy = request.ReturnPolicy,
                ShippingInfo = request.ShippingInfo,
                StockQuantity = request.StockQuantity,
                MinOrderQuantity = request.MinOrderQuantity,
                MaxOrderQuantity = request.MaxOrderQuantity,
                IsDigital = request.IsDigital,
                IsFeatured = request.IsFeatured,
                IsBestSeller = request.IsBestSeller,
                IsNewArrival = request.IsNewArrival,
                IsOnSale = request.IsOnSale,
                SalePrice = request.SalePrice,
                SaleStartDate = request.SaleStartDate,
                SaleEndDate = request.SaleEndDate,
                Tags = request.Tags,
                SEOKeywords = request.SEOKeywords,
                SEODescription = request.SEODescription,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = userId.Value
            };

            _db.Products.Add(product);
            await _db.SaveChangesAsync();

            // Return the created product
            var createdProduct = await _db.Products
                .Include(p => p.Tour)
                .Include(p => p.TourGuide)
                .FirstOrDefaultAsync(p => p.Id == product.Id);

            var productDto = new ProductDto
            {
                Id = createdProduct!.Id,
                Name = createdProduct.Name,
                Description = createdProduct.Description,
                ShortDescription = createdProduct.ShortDescription,
                Price = createdProduct.Price,
                Currency = createdProduct.Currency,
                Images = createdProduct.Images,
                TourId = createdProduct.TourId,
                TourTitle = createdProduct.Tour.Title,
                TourGuideId = createdProduct.TourGuideId,
                TourGuideName = createdProduct.TourGuide.FirstName + " " + createdProduct.TourGuide.LastName,
                Status = createdProduct.Status,
                Category = createdProduct.Category,
                Brand = createdProduct.Brand,
                Unit = createdProduct.Unit,
                Weight = createdProduct.Weight,
                Dimensions = createdProduct.Dimensions,
                Specifications = createdProduct.Specifications,
                Features = createdProduct.Features,
                UsageInstructions = createdProduct.UsageInstructions,
                CareInstructions = createdProduct.CareInstructions,
                Warranty = createdProduct.Warranty,
                ReturnPolicy = createdProduct.ReturnPolicy,
                ShippingInfo = createdProduct.ShippingInfo,
                StockQuantity = createdProduct.StockQuantity,
                MinOrderQuantity = createdProduct.MinOrderQuantity,
                MaxOrderQuantity = createdProduct.MaxOrderQuantity,
                IsDigital = createdProduct.IsDigital,
                IsFeatured = createdProduct.IsFeatured,
                IsBestSeller = createdProduct.IsBestSeller,
                IsNewArrival = createdProduct.IsNewArrival,
                IsOnSale = createdProduct.IsOnSale,
                SalePrice = createdProduct.SalePrice,
                SaleStartDate = createdProduct.SaleStartDate,
                SaleEndDate = createdProduct.SaleEndDate,
                Tags = createdProduct.Tags,
                SEOKeywords = createdProduct.SEOKeywords,
                SEODescription = createdProduct.SEODescription,
                ViewCount = createdProduct.ViewCount,
                PurchaseCount = createdProduct.PurchaseCount,
                Rating = createdProduct.Rating,
                ReviewCount = createdProduct.ReviewCount,
                Notes = createdProduct.Notes,
                CreatedAt = createdProduct.CreatedAt,
                UpdatedAt = createdProduct.UpdatedAt
            };

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, productDto);
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
            if (request.Price.HasValue)
                product.Price = request.Price.Value;
            if (!string.IsNullOrWhiteSpace(request.Currency))
                product.Currency = request.Currency;
            if (request.Images != null)
                product.Images = request.Images;
            if (!string.IsNullOrWhiteSpace(request.Status))
                product.Status = request.Status;
            if (request.Category != null)
                product.Category = request.Category;
            if (request.Brand != null)
                product.Brand = request.Brand;
            if (request.Unit != null)
                product.Unit = request.Unit;
            if (request.Weight.HasValue)
                product.Weight = request.Weight;
            if (request.Dimensions != null)
                product.Dimensions = request.Dimensions;
            if (request.Specifications != null)
                product.Specifications = request.Specifications;
            if (request.Features != null)
                product.Features = request.Features;
            if (request.UsageInstructions != null)
                product.UsageInstructions = request.UsageInstructions;
            if (request.CareInstructions != null)
                product.CareInstructions = request.CareInstructions;
            if (request.Warranty != null)
                product.Warranty = request.Warranty;
            if (request.ReturnPolicy != null)
                product.ReturnPolicy = request.ReturnPolicy;
            if (request.ShippingInfo != null)
                product.ShippingInfo = request.ShippingInfo;
            if (request.StockQuantity.HasValue)
                product.StockQuantity = request.StockQuantity.Value;
            if (request.MinOrderQuantity.HasValue)
                product.MinOrderQuantity = request.MinOrderQuantity.Value;
            if (request.MaxOrderQuantity.HasValue)
                product.MaxOrderQuantity = request.MaxOrderQuantity.Value;
            if (request.IsDigital.HasValue)
                product.IsDigital = request.IsDigital.Value;
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
            if (request.Tags != null)
                product.Tags = request.Tags;
            if (request.SEOKeywords != null)
                product.SEOKeywords = request.SEOKeywords;
            if (request.SEODescription != null)
                product.SEODescription = request.SEODescription;
            if (request.Notes != null)
                product.Notes = request.Notes;

            // Reset approval status when product is updated (requires re-approval)
            // Only reset if product was previously approved
            if (product.ApprovalStatus == ProductStatus.Approved)
            {
                product.ApprovalStatus = ProductStatus.PendingApproval;
                product.ApprovedBy = null;
                product.ApprovedAt = null;
                product.RejectionReason = null;
                
                _logger.LogInformation("Product {ProductId} approval status reset to PendingApproval after update by tour guide {UserId}", 
                    product.Id, userId.Value);
            }

            product.UpdatedAt = DateTime.UtcNow;
            product.UpdatedBy = userId.Value;

            await _db.SaveChangesAsync();

            // Return updated product
            var updatedProduct = await _db.Products
                .Include(p => p.Tour)
                .Include(p => p.TourGuide)
                .FirstOrDefaultAsync(p => p.Id == id);

            var productDto = new ProductDto
            {
                Id = updatedProduct!.Id,
                Name = updatedProduct.Name,
                Description = updatedProduct.Description,
                ShortDescription = updatedProduct.ShortDescription,
                Price = updatedProduct.Price,
                Currency = updatedProduct.Currency,
                Images = updatedProduct.Images,
                TourId = updatedProduct.TourId,
                TourTitle = updatedProduct.Tour.Title,
                TourGuideId = updatedProduct.TourGuideId,
                TourGuideName = updatedProduct.TourGuide.FirstName + " " + updatedProduct.TourGuide.LastName,
                Status = updatedProduct.Status,
                Category = updatedProduct.Category,
                Brand = updatedProduct.Brand,
                Unit = updatedProduct.Unit,
                Weight = updatedProduct.Weight,
                Dimensions = updatedProduct.Dimensions,
                Specifications = updatedProduct.Specifications,
                Features = updatedProduct.Features,
                UsageInstructions = updatedProduct.UsageInstructions,
                CareInstructions = updatedProduct.CareInstructions,
                Warranty = updatedProduct.Warranty,
                ReturnPolicy = updatedProduct.ReturnPolicy,
                ShippingInfo = updatedProduct.ShippingInfo,
                StockQuantity = updatedProduct.StockQuantity,
                MinOrderQuantity = updatedProduct.MinOrderQuantity,
                MaxOrderQuantity = updatedProduct.MaxOrderQuantity,
                IsDigital = updatedProduct.IsDigital,
                IsFeatured = updatedProduct.IsFeatured,
                IsBestSeller = updatedProduct.IsBestSeller,
                IsNewArrival = updatedProduct.IsNewArrival,
                IsOnSale = updatedProduct.IsOnSale,
                SalePrice = updatedProduct.SalePrice,
                SaleStartDate = updatedProduct.SaleStartDate,
                SaleEndDate = updatedProduct.SaleEndDate,
                Tags = updatedProduct.Tags,
                SEOKeywords = updatedProduct.SEOKeywords,
                SEODescription = updatedProduct.SEODescription,
                ViewCount = updatedProduct.ViewCount,
                PurchaseCount = updatedProduct.PurchaseCount,
                Rating = updatedProduct.Rating,
                ReviewCount = updatedProduct.ReviewCount,
                Notes = updatedProduct.Notes,
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
            var products = await _db.Products
                .Include(p => p.Tour)
                .Include(p => p.TourGuide)
                .Where(p => p.TourId == tourId && p.Status == "Active")
                .OrderBy(p => p.Name)
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    ShortDescription = p.ShortDescription,
                    Price = p.Price,
                    Currency = p.Currency,
                    Images = p.Images,
                    TourId = p.TourId,
                    TourTitle = p.Tour.Title,
                    TourGuideId = p.TourGuideId,
                    TourGuideName = p.TourGuide.FirstName + " " + p.TourGuide.LastName,
                    Status = p.Status,
                    Category = p.Category,
                    Brand = p.Brand,
                    Unit = p.Unit,
                    Weight = p.Weight,
                    Dimensions = p.Dimensions,
                    Specifications = p.Specifications,
                    Features = p.Features,
                    UsageInstructions = p.UsageInstructions,
                    CareInstructions = p.CareInstructions,
                    Warranty = p.Warranty,
                    ReturnPolicy = p.ReturnPolicy,
                    ShippingInfo = p.ShippingInfo,
                    StockQuantity = p.StockQuantity,
                    MinOrderQuantity = p.MinOrderQuantity,
                    MaxOrderQuantity = p.MaxOrderQuantity,
                    IsDigital = p.IsDigital,
                    IsFeatured = p.IsFeatured,
                    IsBestSeller = p.IsBestSeller,
                    IsNewArrival = p.IsNewArrival,
                    IsOnSale = p.IsOnSale,
                    SalePrice = p.SalePrice,
                    SaleStartDate = p.SaleStartDate,
                    SaleEndDate = p.SaleEndDate,
                    Tags = p.Tags,
                    SEOKeywords = p.SEOKeywords,
                    SEODescription = p.SEODescription,
                    ViewCount = p.ViewCount,
                    PurchaseCount = p.PurchaseCount,
                    Rating = p.Rating,
                    ReviewCount = p.ReviewCount,
                    Notes = p.Notes,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                })
                .ToListAsync();

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

            var query = _db.Products.Where(p => p.TourGuideId == userId.Value);

            var statistics = new ProductStatisticsDto
            {
                TotalProducts = await query.CountAsync(),
                ActiveProducts = await query.CountAsync(p => p.Status == "Active"),
                DraftProducts = await query.CountAsync(p => p.Status == "Draft"),
                InactiveProducts = await query.CountAsync(p => p.Status == "Inactive"),
                FeaturedProducts = await query.CountAsync(p => p.IsFeatured),
                BestSellerProducts = await query.CountAsync(p => p.IsBestSeller),
                NewArrivalProducts = await query.CountAsync(p => p.IsNewArrival),
                OnSaleProducts = await query.CountAsync(p => p.IsOnSale),
                DigitalProducts = await query.CountAsync(p => p.IsDigital),
                TotalValue = await query.SumAsync(p => p.Price * p.StockQuantity),
                AveragePrice = await query.AverageAsync(p => p.Price),
                TotalViews = await query.SumAsync(p => p.ViewCount),
                TotalPurchases = await query.SumAsync(p => p.PurchaseCount),
                AverageRating = await query.AverageAsync(p => p.Rating ?? 0)
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

            if (product.ApprovalStatus == ProductStatus.Approved)
            {
                return BadRequest("Product is already approved");
            }

            product.ApprovalStatus = ProductStatus.Approved;
            product.ApprovedBy = userId.Value;
            product.ApprovedAt = DateTime.UtcNow;
            product.RejectionReason = null;
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

            if (product.ApprovalStatus == ProductStatus.Rejected)
            {
                return BadRequest("Product is already rejected");
            }

            product.ApprovalStatus = ProductStatus.Rejected;
            product.RejectionReason = request.RejectionReason;
            product.ApprovedBy = null;
            product.ApprovedAt = null;
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
