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
    
    // Bank info for payouts (TourGuide only)
    public string? BankCode { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountName { get; set; }
    public string? BankAccount { get; set; }
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
    
    // Bank info for payouts (TourGuide only)
    public string? BankCode { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountName { get; set; }
    public string? BankAccount { get; set; }
}

public sealed class TourGuideApplicationRequest
{
    public string ApplicationData { get; set; } = string.Empty; // JSON containing all application info
    public string? Documents { get; set; } // JSON array of document URLs
}

public sealed class ReviewTourGuideApplicationRequest
{
    public string Status { get; set; } = string.Empty; // approved, rejected, allow_edit
    public string? Feedback { get; set; }
}


public sealed class AdminUserListItemDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsPhoneVerified { get; set; }
    public bool IsActive { get; set; }
    public string? Avatar { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

public sealed class AdminUserDetailDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsPhoneVerified { get; set; }
    public bool IsActive { get; set; }
    public string? Avatar { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    // Profile
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
    
    // Bank info for payouts (TourGuide only)
    public string? BankCode { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountName { get; set; }
    public string? BankAccount { get; set; }
}

public sealed class CreateUserRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = "Customer";
    public bool IsActive { get; set; } = true;
}

public sealed class UpdateUserRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Avatar { get; set; }
    public bool? IsActive { get; set; }
    public string? Role { get; set; }
}

public sealed class ChangeUserActiveRequest { public bool IsActive { get; set; } }


