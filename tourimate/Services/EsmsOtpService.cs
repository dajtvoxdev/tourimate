using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TouriMate.Data;
using TouriMate.Services.Abstractions;

namespace TouriMate.Services;

public sealed class EsmsOptions
{
    public string ApiKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string Brandname { get; set; } = string.Empty;
    public string SmsType { get; set; } = "2";
    public string IsUnicode { get; set; } = "0";
    public string CallbackUrl { get; set; } = string.Empty;
    public string CampaignId { get; set; } = string.Empty;
}

public sealed class EsmsOtpService : IOtpService
{
    private readonly HttpClient _httpClient;
    private readonly EsmsOptions _options;
    private readonly TouriMateDbContext _db;

    public EsmsOtpService(HttpClient httpClient, IOptions<EsmsOptions> options, TouriMateDbContext db)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://rest.esms.vn/");
        _options = options.Value;
        _db = db;
    }

    // sessionInfo will be the phone number for compatibility
    public async Task<string> StartPhoneVerificationAsync(string phoneNumberE164, string recaptchaToken, CancellationToken ct = default)
    {
        // Generate a 6-digit OTP
        var rng = RandomNumberGenerator.Create();
        var bytes = new byte[4];
        rng.GetBytes(bytes);
        var otp = (BitConverter.ToUInt32(bytes) % 1000000).ToString("D6");

        // Persist OTP with expiry
        var now = DateTime.UtcNow;
        var expires = now.AddMinutes(5);

        // Remove previous active OTPs for this phone
        var old = await _db.OtpCodes.Where(x => x.PhoneNumber == phoneNumberE164 && !x.IsUsed && x.ExpiresAt > now).ToListAsync(ct);
        foreach (var o in old) { o.IsUsed = true; o.UsedAt = now; }

        _db.OtpCodes.Add(new Entities.Models.OtpCode
        {
            PhoneNumber = phoneNumberE164,
            Code = otp,
            Purpose = "register",
            ExpiresAt = expires,
            AttemptCount = 0,
            IsUsed = false,
            CreatedAt = now,
            UpdatedAt = now
        });
        await _db.SaveChangesAsync(ct);

        string localPhone = phoneNumberE164;
        if (localPhone.StartsWith("+84")) localPhone = "0" + localPhone.Substring(3);
        else if (localPhone.StartsWith("84")) localPhone = "0" + localPhone.Substring(2);
        else if (localPhone.StartsWith("+")) localPhone = localPhone.Substring(1);

        var payload = new
        {
            ApiKey = _options.ApiKey,
            Content = $"{otp} la ma xac minh dang ky {_options.Brandname} cua ban",
            Phone = localPhone,
            SecretKey = _options.SecretKey,
            Brandname = _options.Brandname,
            SmsType = _options.SmsType,
            IsUnicode = _options.IsUnicode,
        };

        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions { DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull });
        using var req = new HttpRequestMessage(HttpMethod.Post, "MainService.svc/json/SendMultipleMessage_V4_post_json/")
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
        };
        using var resp = await _httpClient.SendAsync(req, ct).ConfigureAwait(false);
        var text = await resp.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
        return text;
    }

    public async Task<(bool Success, string? PhoneNumber)> VerifyCodeAsync(string sessionInfo, string code, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var otp = await _db.OtpCodes
            .Where(x => x.PhoneNumber == sessionInfo && !x.IsUsed && x.ExpiresAt > now)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(ct);
        if (otp == null) return (false, null);
        if (!string.Equals(otp.Code, code, StringComparison.Ordinal)) return (false, null);

        otp.IsUsed = true;
        otp.UsedAt = now;
        await _db.SaveChangesAsync(ct);
        return (true, sessionInfo);
    }
}

public sealed class EsmsSendResponse
{
    public string? CodeResult { get; set; }
    public int CountRegenerate { get; set; }
    public string? SMSID { get; set; }
    public string? ErrorMessage { get; set; }
}


