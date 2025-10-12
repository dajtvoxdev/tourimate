namespace TouriMate.Contracts.Auth;

public sealed class RegisterRequest
{
    public string? Email { get; set; }
    public string PhoneNumberE164 { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool AcceptEmailMarketing { get; set; }
    public string FirebaseIdToken { get; set; } = string.Empty;        // Firebase ID token for phone verification
}

public sealed class LoginRequest
{
    public string PhoneNumberE164 { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public sealed class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public int ExpiresIn { get; set; } = 0; // seconds
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime RefreshTokenExpiresAt { get; set; }
}

public sealed class ForgotPasswordStartRequest
{
    public string PhoneNumberE164 { get; set; } = string.Empty;
}

public sealed class ForgotPasswordStartResponse { }

public sealed class ForgotPasswordVerifyRequest
{
    public string FirebaseIdToken { get; set; } = string.Empty;
    public string PhoneNumberE164 { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public sealed class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

public sealed class UserProfileDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool AcceptEmailMarketing { get; set; }
    public bool IsPhoneVerified { get; set; }
    public string? Avatar { get; set; }

    // Profile extras
    public string? Address { get; set; }
    public string Country { get; set; } = "Vietnam";
    public DateOnly? DateOfBirth { get; set; }
    public string? Bio { get; set; }
    public string? Gender { get; set; }
    public string? Website { get; set; }
    public string? SocialMedia { get; set; }
    public string? NotificationSettings { get; set; }
    public int? ProvinceCode { get; set; }
    public int? WardCode { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

public sealed class UpdateUserProfileRequest
{
    public string? Email { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool AcceptEmailMarketing { get; set; }
    public string? Avatar { get; set; }

    // Profile extras
    public string? Address { get; set; }
    public string Country { get; set; } = "Vietnam";
    public DateOnly? DateOfBirth { get; set; }
    public string? Bio { get; set; }
    public string? Gender { get; set; }
    public string? Website { get; set; }
    public string? SocialMedia { get; set; }
    public string? NotificationSettings { get; set; }
    public int? ProvinceCode { get; set; }
    public int? WardCode { get; set; }
}


