using Microsoft.AspNetCore.SignalR;

namespace tourimate.Services.Hubs;

/// <summary>
/// SignalR Hub for real-time payment notifications
/// </summary>
public class PaymentHub : Hub
{
    /// <summary>
    /// Join a payment notification group (by transaction ID or booking ID)
    /// </summary>
    public async Task JoinPaymentGroup(string paymentId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"payment_{paymentId}");
    }

    /// <summary>
    /// Leave a payment notification group
    /// </summary>
    public async Task LeavePaymentGroup(string paymentId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"payment_{paymentId}");
    }
}

