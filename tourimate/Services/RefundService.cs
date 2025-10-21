using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using Entities.Models;
using Entities.Enums;

namespace TouriMate.Services;

public interface IRefundService
{
    Task<RefundCalculationResult> CalculateRefundAsync(Guid bookingId, string cancellationReason);
    Task<Refund> ProcessRefundAsync(Guid bookingId, string cancellationReason, string? refundBankName, string? refundBankAccount, string? refundAccountName);
    Task<bool> CancelBookingAsync(Guid bookingId, string cancellationReason, string? refundBankName, string? refundBankAccount, string? refundAccountName);
}

public class RefundCalculationResult
{
    public bool CanRefund { get; set; }
    public int DaysBeforeTour { get; set; }
    public decimal RefundPercentage { get; set; }
    public decimal OriginalAmount { get; set; }
    public decimal RefundAmount { get; set; }
    public string RefundPolicy { get; set; } = string.Empty;
}

public class RefundService : IRefundService
{
    private readonly TouriMateDbContext _db;
    private readonly ILogger<RefundService> _logger;

    public RefundService(TouriMateDbContext db, ILogger<RefundService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<RefundCalculationResult> CalculateRefundAsync(Guid bookingId, string cancellationReason)
    {
        var booking = await _db.Bookings
            .Include(b => b.TourAvailability)
            .FirstOrDefaultAsync(b => b.Id == bookingId);

        if (booking == null)
        {
            throw new ArgumentException("Booking not found");
        }

        var tourDate = booking.TourDate.ToDateTime(TimeOnly.MinValue);
        var currentDate = DateTime.UtcNow;
        var daysBeforeTour = (int)(tourDate - currentDate).TotalDays;

        var result = new RefundCalculationResult
        {
            DaysBeforeTour = daysBeforeTour,
            OriginalAmount = booking.TotalAmount
        };

        // Business rules for refund
        if (daysBeforeTour >= 7)
        {
            // More than 1 week: 100% refund
            result.CanRefund = true;
            result.RefundPercentage = 100;
            result.RefundAmount = booking.TotalAmount;
            result.RefundPolicy = "Hủy trước 7 ngày: Hoàn 100%";
        }
        else if (daysBeforeTour >= 1)
        {
            // 1-6 days: 50% refund
            result.CanRefund = true;
            result.RefundPercentage = 50;
            result.RefundAmount = booking.TotalAmount * 0.5m;
            result.RefundPolicy = "Hủy 1-6 ngày trước: Hoàn 50%";
        }
        else
        {
            // Less than 1 day: No refund
            result.CanRefund = false;
            result.RefundPercentage = 0;
            result.RefundAmount = 0;
            result.RefundPolicy = "Hủy trong vòng 24 giờ: Không hoàn tiền";
        }

        return result;
    }

    public async Task<Refund> ProcessRefundAsync(Guid bookingId, string cancellationReason, string? refundBankName, string? refundBankAccount, string? refundAccountName)
    {
        var calculation = await CalculateRefundAsync(bookingId, cancellationReason);
        
        if (!calculation.CanRefund)
        {
            throw new InvalidOperationException("Refund not allowed based on cancellation policy");
        }

        var refund = new Refund
        {
            BookingId = bookingId,
            RefundAmount = calculation.RefundAmount,
            Currency = "VND",
            RefundStatus = "Pending",
            RefundBankName = refundBankName,
            RefundBankAccount = refundBankAccount,
            RefundAccountName = refundAccountName,
            RefundReason = cancellationReason,
            DaysBeforeTour = calculation.DaysBeforeTour,
            RefundPercentage = calculation.RefundPercentage,
            OriginalAmount = calculation.OriginalAmount,
            RefundNotes = $"Refund processed automatically. Policy: {calculation.RefundPolicy}",
            CreatedBy = Guid.NewGuid(), // TODO: Get from current user context
            UpdatedBy = Guid.NewGuid()  // TODO: Get from current user context
        };

        _db.Refunds.Add(refund);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Refund created for booking {BookingId}: {RefundAmount} VND ({RefundPercentage}%)", 
            bookingId, refund.RefundAmount, refund.RefundPercentage);

        return refund;
    }

    public async Task<bool> CancelBookingAsync(Guid bookingId, string cancellationReason, string? refundBankName, string? refundBankAccount, string? refundAccountName)
    {
        using var transaction = await _db.Database.BeginTransactionAsync();
        
        try
        {
            var booking = await _db.Bookings
                .Include(b => b.TourAvailability)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
            {
                throw new ArgumentException("Booking not found");
            }

            if (booking.Status == BookingStatus.Cancelled)
            {
                throw new InvalidOperationException("Booking is already cancelled");
            }

            // Calculate refund
            var calculation = await CalculateRefundAsync(bookingId, cancellationReason);

            // Update booking status
            booking.Status = BookingStatus.Cancelled;
            booking.CancellationReason = cancellationReason;
            booking.CancelledAt = DateTime.UtcNow;
            booking.UpdatedAt = DateTime.UtcNow;

            // Update refund information if applicable
            if (calculation.CanRefund)
            {
                booking.RefundAmount = calculation.RefundAmount;
                booking.RefundBankName = refundBankName;
                booking.RefundBankAccount = refundBankAccount;
                booking.RefundAccountName = refundAccountName;
                booking.RefundedAt = DateTime.UtcNow;

                // Create refund record
                var refund = new Refund
                {
                    BookingId = bookingId,
                    RefundAmount = calculation.RefundAmount,
                    Currency = "VND",
                    RefundStatus = "Pending",
                    RefundBankName = refundBankName,
                    RefundBankAccount = refundBankAccount,
                    RefundAccountName = refundAccountName,
                    RefundReason = cancellationReason,
                    DaysBeforeTour = calculation.DaysBeforeTour,
                    RefundPercentage = calculation.RefundPercentage,
                    OriginalAmount = calculation.OriginalAmount,
                    RefundNotes = $"Booking cancelled. Policy: {calculation.RefundPolicy}",
                    CreatedBy = Guid.NewGuid(), // TODO: Get from current user context
                    UpdatedBy = Guid.NewGuid()  // TODO: Get from current user context
                };

                _db.Refunds.Add(refund);
            }

            // Update tour availability - reduce booked participants
            if (booking.TourAvailability != null)
            {
                booking.TourAvailability.BookedParticipants = Math.Max(0, booking.TourAvailability.BookedParticipants - booking.Participants);
                booking.TourAvailability.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("Booking {BookingId} cancelled successfully. Refund: {RefundAmount} VND", 
                bookingId, calculation.RefundAmount);

            return true;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error cancelling booking {BookingId}", bookingId);
            throw;
        }
    }
}

