using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using Entities.Models;
using Entities.Enums;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly TouriMateDbContext _context;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(TouriMateDbContext context, ILogger<DashboardController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return string.IsNullOrEmpty(userIdClaim) ? null : Guid.Parse(userIdClaim);
    }

    /// <summary>
    /// Get dashboard metrics
    /// </summary>
    /// <returns>Dashboard metrics including revenue, users, transactions, and reviews</returns>
    [HttpGet("metrics")]
    public async Task<IActionResult> GetDashboardMetrics()
    {
        try
        {
            // Total Revenue (from completed bookings and orders)
            var totalRevenue = await _context.Bookings
                .Where(b => b.Status == BookingStatus.Completed)
                .SumAsync(b => b.TotalAmount) +
                await _context.Orders
                .Where(o => o.Status == OrderStatus.Delivered)
                .SumAsync(o => o.TotalAmount);

            // Total Users
            var totalUsers = await _context.Users.CountAsync();

            // Total Transactions (bookings + orders)
            var totalTransactions = await _context.Bookings.CountAsync() + 
                                  await _context.Orders.CountAsync();

            // Total Reviews
            var totalReviews = await _context.Reviews.CountAsync();

            // Recent activity (last 30 days)
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            
            var recentRevenue = await _context.Bookings
                .Where(b => b.Status == BookingStatus.Completed && b.CreatedAt >= thirtyDaysAgo)
                .SumAsync(b => b.TotalAmount) +
                await _context.Orders
                .Where(o => o.Status == OrderStatus.Delivered && o.CreatedAt >= thirtyDaysAgo)
                .SumAsync(o => o.TotalAmount);

            var recentUsers = await _context.Users
                .Where(u => u.CreatedAt >= thirtyDaysAgo)
                .CountAsync();

            var recentTransactions = await _context.Bookings
                .Where(b => b.CreatedAt >= thirtyDaysAgo)
                .CountAsync() +
                await _context.Orders
                .Where(o => o.CreatedAt >= thirtyDaysAgo)
                .CountAsync();

            var recentReviews = await _context.Reviews
                .Where(r => r.CreatedAt >= thirtyDaysAgo)
                .CountAsync();

            // Booking status distribution
            var bookingStats = await _context.Bookings
                .GroupBy(b => b.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            // Order status distribution
            var orderStats = await _context.Orders
                .GroupBy(o => o.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            // Review status distribution
            var reviewStats = await _context.Reviews
                .GroupBy(r => r.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            // Top tours by bookings
            var topTours = await _context.Bookings
                .Include(b => b.Tour)
                .Where(b => b.Status == BookingStatus.Completed)
                .GroupBy(b => new { b.TourId, b.Tour.Title })
                .Select(g => new { 
                    TourId = g.Key.TourId, 
                    TourTitle = g.Key.Title, 
                    BookingCount = g.Count(),
                    Revenue = g.Sum(b => b.TotalAmount)
                })
                .OrderByDescending(x => x.BookingCount)
                .Take(5)
                .ToListAsync();

            return Ok(new
            {
                totalRevenue,
                totalUsers,
                totalTransactions,
                totalReviews,
                recent = new
                {
                    revenue = recentRevenue,
                    users = recentUsers,
                    transactions = recentTransactions,
                    reviews = recentReviews
                },
                statistics = new
                {
                    bookings = bookingStats,
                    orders = orderStats,
                    reviews = reviewStats
                },
                topTours
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting dashboard metrics");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get revenue chart data for the last 12 months
    /// </summary>
    /// <returns>Monthly revenue data</returns>
    [HttpGet("revenue-chart")]
    public async Task<IActionResult> GetRevenueChart()
    {
        try
        {
            var twelveMonthsAgo = DateTime.UtcNow.AddMonths(-12);
            
            var monthlyRevenue = await _context.Bookings
                .Where(b => b.Status == BookingStatus.Completed && b.CreatedAt >= twelveMonthsAgo)
                .GroupBy(b => new { b.CreatedAt.Year, b.CreatedAt.Month })
                .Select(g => new
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Revenue = g.Sum(b => b.TotalAmount)
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToListAsync();

            var monthlyOrderRevenue = await _context.Orders
                .Where(o => o.Status == OrderStatus.Delivered && o.CreatedAt >= twelveMonthsAgo)
                .GroupBy(o => new { o.CreatedAt.Year, o.CreatedAt.Month })
                .Select(g => new
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Revenue = g.Sum(o => o.TotalAmount)
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToListAsync();

            // Combine booking and order revenue by month
            var combinedRevenue = monthlyRevenue
                .Concat(monthlyOrderRevenue)
                .GroupBy(x => new { x.Year, x.Month })
                .Select(g => new
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Revenue = g.Sum(x => x.Revenue),
                    MonthName = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy")
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToList();

            return Ok(combinedRevenue);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting revenue chart data");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get dashboard metrics for tour guide (only their own tours)
    /// </summary>
    /// <returns>Dashboard metrics for tour guide's tours</returns>
    [HttpGet("tour-guide/metrics")]
    public async Task<IActionResult> GetTourGuideDashboardMetrics()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            // Check if user is tour guide
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null || user.Role != UserRole.TourGuide)
            {
                return Forbid("Only tour guides can access this endpoint");
            }

            // Total Revenue (from payments received by tour guide, not from bookings)
            // Tour guide revenue comes from Cost records where they are the recipient
            var totalRevenue = await _context.Costs
                .Where(c => c.RecipientId == userId.Value && c.Status == CostStatus.Paid)
                .SumAsync(c => c.Amount);

            // Total Users (customers who booked tour guide's tours)
            var totalUsers = await _context.Bookings
                .Where(b => b.Tour.TourGuideId == userId.Value)
                .Select(b => b.CustomerId)
                .Distinct()
                .CountAsync();

            // Total Transactions (payments received by tour guide)
            var totalTransactions = await _context.Costs
                .Where(c => c.RecipientId == userId.Value && c.Status == CostStatus.Paid)
                .CountAsync();

            // Total Reviews (reviews for tour guide's tours only)
            var totalReviews = await _context.Reviews
                .Where(r => r.EntityType == "Tour" && 
                           _context.Tours.Any(t => t.Id == r.EntityId && t.TourGuideId == userId.Value))
                .CountAsync();

            // Recent activity (last 30 days) - payments received
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            
            var recentRevenue = await _context.Costs
                .Where(c => c.RecipientId == userId.Value && c.Status == CostStatus.Paid && c.PaidDate >= thirtyDaysAgo)
                .SumAsync(c => c.Amount);

            var recentUsers = await _context.Bookings
                .Where(b => b.CreatedAt >= thirtyDaysAgo && b.Tour.TourGuideId == userId.Value)
                .Select(b => b.CustomerId)
                .Distinct()
                .CountAsync();

            var recentTransactions = await _context.Costs
                .Where(c => c.RecipientId == userId.Value && c.Status == CostStatus.Paid && c.PaidDate >= thirtyDaysAgo)
                .CountAsync();

            var recentReviews = await _context.Reviews
                .Where(r => r.CreatedAt >= thirtyDaysAgo && 
                           r.EntityType == "Tour" && 
                           _context.Tours.Any(t => t.Id == r.EntityId && t.TourGuideId == userId.Value))
                .CountAsync();

            // Booking status distribution for tour guide's tours
            var bookingStats = await _context.Bookings
                .Where(b => b.Tour.TourGuideId == userId.Value)
                .GroupBy(b => b.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            // Orders are not tour-specific, so no order stats for tour guide
            var orderStats = new List<object>();

            // Review status distribution for tour guide's tours
            var reviewStats = await _context.Reviews
                .Where(r => r.EntityType == "Tour" && 
                           _context.Tours.Any(t => t.Id == r.EntityId && t.TourGuideId == userId.Value))
                .GroupBy(r => r.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            // Top tours by payments received (not by bookings)
            var topTours = await _context.Costs
                .Where(c => c.RecipientId == userId.Value && 
                           c.Status == CostStatus.Paid && 
                           c.Type == CostType.TourGuidePayment &&
                           c.RelatedEntityType == "Tour")
                .Join(_context.Tours, 
                      c => c.RelatedEntityId, 
                      t => t.Id, 
                      (c, t) => new { Cost = c, Tour = t })
                .GroupBy(x => new { x.Tour.Id, x.Tour.Title })
                .Select(g => new { 
                    TourId = g.Key.Id, 
                    TourTitle = g.Key.Title, 
                    BookingCount = g.Count(),
                    Revenue = g.Sum(x => x.Cost.Amount)
                })
                .OrderByDescending(x => x.BookingCount)
                .Take(5)
                .ToListAsync();

            return Ok(new
            {
                totalRevenue,
                totalUsers,
                totalTransactions,
                totalReviews,
                recent = new
                {
                    revenue = recentRevenue,
                    users = recentUsers,
                    transactions = recentTransactions,
                    reviews = recentReviews
                },
                statistics = new
                {
                    bookings = bookingStats,
                    orders = orderStats,
                    reviews = reviewStats
                },
                topTours
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tour guide dashboard metrics");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get revenue chart data for tour guide (only their own tours)
    /// </summary>
    /// <returns>Monthly revenue data for tour guide's tours</returns>
    [HttpGet("tour-guide/revenue-chart")]
    public async Task<IActionResult> GetTourGuideRevenueChart()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("User not authenticated");
            }

            // Check if user is tour guide
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null || user.Role != UserRole.TourGuide)
            {
                return Forbid("Only tour guides can access this endpoint");
            }

            var twelveMonthsAgo = DateTime.UtcNow.AddMonths(-12);
            
            // Monthly revenue from payments received (not from bookings)
            var monthlyRevenue = await _context.Costs
                .Where(c => c.RecipientId == userId.Value && 
                           c.Status == CostStatus.Paid && 
                           c.PaidDate >= twelveMonthsAgo)
                .GroupBy(c => new { c.PaidDate.Value.Year, c.PaidDate.Value.Month })
                .Select(g => new
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Revenue = g.Sum(c => c.Amount)
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToListAsync();

            // Orders are not tour-specific, so no order revenue for tour guide

            var combinedRevenue = monthlyRevenue
                .Select(x => new
                {
                    Year = x.Year,
                    Month = x.Month,
                    Revenue = x.Revenue,
                    MonthName = new DateTime(x.Year, x.Month, 1).ToString("MMM yyyy")
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToList();

            return Ok(combinedRevenue);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tour guide revenue chart data");
            return StatusCode(500, "Internal server error");
        }
    }
}
