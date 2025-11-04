using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using Entities.Models;
using Entities.Enums;

namespace TouriMate.Services;

public interface ICommissionService
{
    Task<decimal> CalculateTourGuideCommissionAsync(Guid bookingId);
    Task<Cost> CreateTourGuidePaymentRequestAsync(Guid bookingId, Guid tourGuideId);
    Task<bool> ProcessTourGuidePaymentAsync(Guid costId, Guid adminId);
    Task<Cost> CreateTourGuideOrderPaymentRequestAsync(Guid orderId, Guid tourGuideId);
}

public class CommissionService : ICommissionService
{
    private readonly TouriMateDbContext _context;
    private readonly ILogger<CommissionService> _logger;

    public CommissionService(TouriMateDbContext context, ILogger<CommissionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Calculate commission for tour guide based on booking amount and commission percentage
    /// </summary>
    public async Task<decimal> CalculateTourGuideCommissionAsync(Guid bookingId)
    {
        try
        {
            var booking = await _context.Bookings
                .Include(b => b.Tour)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
            {
                throw new ArgumentException("Booking not found");
            }

            // Get commission percentage from system settings or default to 80%
            var commissionPercentage = await GetCommissionPercentageAsync();
            
            var commissionAmount = booking.TotalAmount * (commissionPercentage / 100m);
            
            _logger.LogInformation("Calculated commission for booking {BookingId}: {Amount} ({Percentage}%)", 
                bookingId, commissionAmount, commissionPercentage);
            
            return Math.Round(commissionAmount, 2);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating tour guide commission for booking {BookingId}", bookingId);
            throw;
        }
    }

    /// <summary>
    /// Create a payment request for tour guide after tour completion
    /// </summary>
    public async Task<Cost> CreateTourGuidePaymentRequestAsync(Guid bookingId, Guid tourGuideId)
    {
        try
        {
            var booking = await _context.Bookings
                .Include(b => b.Tour)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
            {
                throw new ArgumentException("Booking not found");
            }

            if (booking.Tour.TourGuideId != tourGuideId)
            {
                throw new UnauthorizedAccessException("Tour guide can only request payment for their own tours");
            }

            if (booking.Status != BookingStatus.Completed)
            {
                throw new InvalidOperationException("Can only request payment for completed tours");
            }

            // Check if payment request already exists
            var existingCost = await _context.Costs
                .FirstOrDefaultAsync(c => c.RelatedEntityId == bookingId && 
                                         c.RelatedEntityType == "Booking" &&
                                         c.Type == CostType.TourGuidePayment);

            if (existingCost != null)
            {
                throw new InvalidOperationException("Payment request already exists for this booking");
            }

            var commissionAmount = await CalculateTourGuideCommissionAsync(bookingId);

            // Get admin user (assuming first admin user)
            var admin = await _context.Users
                .FirstOrDefaultAsync(u => u.Role == UserRole.Admin);

            if (admin == null)
            {
                throw new InvalidOperationException("No admin user found");
            }

            var cost = new Cost
            {
                CostCode = $"TG-{bookingId.ToString()[..8].ToUpper()}",
                CostName = $"Tour Guide Payment - {booking.Tour.Title}",
                Description = $"Payment for completed tour: {booking.Tour.Title}",
                Amount = commissionAmount,
                Currency = "VND",
                Type = CostType.TourGuidePayment,
                Status = CostStatus.Pending,
                PayerId = admin.Id, // Admin pays
                RecipientId = tourGuideId, // Tour guide receives
                RelatedEntityId = bookingId,
                RelatedEntityType = "Booking",
                ReferenceNumber = booking.BookingNumber,
                DueDate = DateTime.UtcNow.AddDays(7), // Due in 7 days
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Costs.Add(cost);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created tour guide payment request {CostId} for booking {BookingId}, amount: {Amount}", 
                cost.Id, bookingId, commissionAmount);

            return cost;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating tour guide payment request for booking {BookingId}", bookingId);
            throw;
        }
    }

    /// <summary>
    /// Process tour guide payment (admin approves and pays)
    /// </summary>
    public async Task<bool> ProcessTourGuidePaymentAsync(Guid costId, Guid adminId)
    {
        try
        {
            var cost = await _context.Costs
                .FirstOrDefaultAsync(c => c.Id == costId);

            if (cost == null)
            {
                throw new ArgumentException("Cost not found");
            }

            if (cost.PayerId != adminId)
            {
                throw new UnauthorizedAccessException("Only the designated payer can process this payment");
            }

            if (cost.Status != CostStatus.Pending)
            {
                throw new InvalidOperationException("Can only process pending payments");
            }

            // Update cost status to paid
            cost.Status = CostStatus.Paid;
            cost.PaidDate = DateTime.UtcNow;
            cost.PaymentMethod = "Bank Transfer"; // Default payment method
            cost.UpdatedAt = DateTime.UtcNow;
            cost.UpdatedBy = adminId;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Processed tour guide payment {CostId}, amount: {Amount}", 
                cost.Id, cost.Amount);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing tour guide payment {CostId}", costId);
            throw;
        }
    }

    /// <summary>
    /// Create a payment request for tour guide based on paid & delivered product order items
    /// </summary>
    public async Task<Cost> CreateTourGuideOrderPaymentRequestAsync(Guid orderId, Guid tourGuideId)
    {
        try
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
            {
                throw new ArgumentException("Order not found");
            }

            if (order.PaymentStatus != PaymentStatus.Paid)
            {
                throw new InvalidOperationException("Can only request payment for orders that are paid");
            }

            if (order.Status != OrderStatus.Delivered)
            {
                throw new InvalidOperationException("Can only request payment for orders that are delivered");
            }

            // Items that belong to the requesting tour guide
            var guideItems = order.Items.Where(i => i.Product.TourGuideId == tourGuideId).ToList();
            if (guideItems.Count == 0)
            {
                throw new UnauthorizedAccessException("Tour guide can only request payment for their own order items");
            }

            // Prevent duplicate requests per order-guide pair
            var existingCost = await _context.Costs
                .FirstOrDefaultAsync(c => c.RelatedEntityId == orderId &&
                                          c.RelatedEntityType == "Order" &&
                                          c.Type == CostType.TourGuidePayment &&
                                          c.RecipientId == tourGuideId);
            if (existingCost != null)
            {
                throw new InvalidOperationException("Payment request already exists for this order");
            }

            // Calculate commission for the guide's portion of the order
            var guideGrossAmount = guideItems.Sum(i => i.Subtotal);
            var commissionPercentage = await GetCommissionPercentageAsync();
            var commissionAmount = Math.Round(guideGrossAmount * (commissionPercentage / 100m), 2);

            var admin = await _context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin);
            if (admin == null)
            {
                throw new InvalidOperationException("No admin user found");
            }

            var cost = new Cost
            {
                CostCode = $"TG-ORD-{order.OrderNumber}",
                CostName = $"Tour Guide Payment - Order {order.OrderNumber}",
                Description = $"Payment for delivered order items in {order.OrderNumber}",
                Amount = commissionAmount,
                Currency = order.Currency,
                Type = CostType.TourGuidePayment,
                Status = CostStatus.Pending,
                PayerId = admin.Id,
                RecipientId = tourGuideId,
                RelatedEntityId = order.Id,
                RelatedEntityType = "Order",
                ReferenceNumber = order.OrderNumber,
                DueDate = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Costs.Add(cost);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created tour guide order payment request {CostId} for order {OrderNumber}, amount: {Amount}",
                cost.Id, order.OrderNumber, commissionAmount);

            return cost;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating tour guide payment request for order {OrderId}", orderId);
            throw;
        }
    }

    /// <summary>
    /// Get commission percentage from system settings
    /// </summary>
    private async Task<decimal> GetCommissionPercentageAsync()
    {
        try
        {
            // Try to get from system settings first
            var setting = await _context.SystemSettings
                .FirstOrDefaultAsync(s => s.Key == "TourGuideCommissionPercentage");

            if (setting != null && decimal.TryParse(setting.Value, out var percentage))
            {
                return percentage;
            }

            // Default to 80% if no setting found
            return 80m;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error getting commission percentage, using default 80%");
            return 80m;
        }
    }
}
