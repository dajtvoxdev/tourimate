using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using Entities.Models;
using Entities.Enums;

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
}
