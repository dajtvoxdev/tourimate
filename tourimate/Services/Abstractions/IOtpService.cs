namespace TouriMate.Services.Abstractions;

public interface IOtpService
{
    Task<string> StartPhoneVerificationAsync(string phoneNumberE164, string recaptchaToken, CancellationToken ct = default);
    Task<(bool Success, string? PhoneNumber)> VerifyCodeAsync(string sessionInfo, string code, CancellationToken ct = default);
}


