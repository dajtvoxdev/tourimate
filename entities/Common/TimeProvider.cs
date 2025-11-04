using System;

namespace Entities.Common;

public static class TimeProvider
{
    private static readonly Lazy<TimeZoneInfo> VietnamTz = new(() =>
        TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"));

    public static DateTime UtcNow() => DateTime.UtcNow;

    public static DateTime VietnamNow()
    {
        // Convert from UTC to Vietnam local time (UTC+7)
        var utc = DateTime.UtcNow;
        return TimeZoneInfo.ConvertTimeFromUtc(utc, VietnamTz.Value);
    }
}


