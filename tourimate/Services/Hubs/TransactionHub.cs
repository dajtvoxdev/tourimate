using Microsoft.AspNetCore.SignalR;

namespace tourimate.Services.Hubs;

/// <summary>
/// SignalR Hub for real-time transaction notifications
/// </summary>
public class TransactionHub : Hub
{
    /// <summary>
    /// Join admin group to receive all transaction updates
    /// </summary>
    public async Task JoinAdminGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "admin_transactions");
    }

    /// <summary>
    /// Leave admin group
    /// </summary>
    public async Task LeaveAdminGroup()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "admin_transactions");
    }

    /// <summary>
    /// Join tour guide group to receive their own transaction updates
    /// </summary>
    public async Task JoinTourGuideGroup(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"tourguide_transactions_{userId}");
    }

    /// <summary>
    /// Leave tour guide group
    /// </summary>
    public async Task LeaveTourGuideGroup(string userId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"tourguide_transactions_{userId}");
    }
}

