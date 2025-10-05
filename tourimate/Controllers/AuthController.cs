using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TouriMate.Contracts.Auth;
using TouriMate.Data;
using TouriMate.Services.Abstractions;
using TouriMate.Services.Auth;
using TouriMate.Services;
using Entities.Models;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
    private readonly TouriMateDbContext _db;
    private readonly IJwtTokenService _tokenService;
    private readonly IOtpService _otpService;
    private readonly IFirebaseAuthService _firebaseAuthService;

    public AuthController(TouriMateDbContext db, IJwtTokenService tokenService, IOtpService otpService, IFirebaseAuthService firebaseAuthService)
    {
        _db = db;
        _tokenService = tokenService;
        _otpService = otpService;
        _firebaseAuthService = firebaseAuthService;
    }

    private static string NormalizeToE164VN(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var v = new string(raw.Where(ch => !char.IsWhiteSpace(ch) && ch != '(' && ch != ')' && ch != '-').ToArray());
        if (v.StartsWith("+84")) return v;
        if (v.StartsWith("84")) return "+" + v;
        if (v.StartsWith("0")) return "+84" + v.Substring(1);
        if (v.StartsWith("+")) return v; // other country codes (fallback)
        return "+84" + v; // assume local
    }

    [HttpGet("exists")]
    public async Task<IActionResult> CheckPhoneExists([FromQuery] string phoneNumberE164)
    {
        try
        {
            var phone = NormalizeToE164VN(phoneNumberE164);
            var exists = await _db.Users.AnyAsync(u => u.PhoneNumber == phone);
            return Ok(new { exists });
        }
        catch
        {
            return StatusCode(500, "Lỗi phía ứng dụng, vui lòng thử lại sau");
        }
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var phoneE164 = NormalizeToE164VN(request.PhoneNumberE164);
            if (await _db.Users.AnyAsync(u => u.PhoneNumber == phoneE164))
                return Conflict("Phone number already exists");

            // Verify Firebase ID token
            var firebaseUid = await _firebaseAuthService.VerifyIdTokenAsync(request.FirebaseIdToken);
            
            // Get Firebase user to verify phone number
            var firebaseUser = await _firebaseAuthService.GetUserAsync(firebaseUid);
            if (NormalizeToE164VN(firebaseUser.PhoneNumber) != phoneE164)
                return Unauthorized("Phone number verification failed");

            var user = new User
            {
                Email = request.Email ?? string.Empty,
                PhoneNumber = phoneE164,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                AcceptEmailMarketing = request.AcceptEmailMarketing,
                FirebaseUid = firebaseUid,
                IsPhoneVerified = true // Set to true since we verified with Firebase
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var (token, exp) = _tokenService.GenerateAccessTokenWithExpiry(user.Id, user.Email, user.Role.ToString());
            // Create refresh token
            var refresh = new RefreshToken
            {
                UserId = user.Id,
                Token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()) + Convert.ToBase64String(Guid.NewGuid().ToByteArray()),
                ExpiresAt = DateTime.UtcNow.AddDays(14)
            };
            _db.RefreshTokens.Add(refresh);
            await _db.SaveChangesAsync();

            return Ok(new AuthResponse { AccessToken = token, ExpiresIn = (int)(exp - DateTime.UtcNow).TotalSeconds, RefreshToken = refresh.Token, RefreshTokenExpiresAt = refresh.ExpiresAt });
        }
        catch
        {
            return StatusCode(500, "Lỗi phía ứng dụng, vui lòng thử lại sau");
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            var phoneE164 = NormalizeToE164VN(request.PhoneNumberE164);
            var user = await _db.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phoneE164);
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Unauthorized("Sai số điện thoại hoặc mật khẩu");

            var (token, exp) = _tokenService.GenerateAccessTokenWithExpiry(user.Id, user.Email, user.Role.ToString());
            // issue refresh token
            var refresh = new RefreshToken
            {
                UserId = user.Id,
                Token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()) + Convert.ToBase64String(Guid.NewGuid().ToByteArray()),
                ExpiresAt = DateTime.UtcNow.AddDays(14)
            };
            _db.RefreshTokens.Add(refresh);
            await _db.SaveChangesAsync();
            return Ok(new AuthResponse { AccessToken = token, ExpiresIn = (int)(exp - DateTime.UtcNow).TotalSeconds, RefreshToken = refresh.Token, RefreshTokenExpiresAt = refresh.ExpiresAt });
        }
        catch
        {
            return StatusCode(500, "Lỗi phía ứng dụng, vui lòng thử lại sau");
        }
    }

    [HttpPost("start")]
    public async Task<IActionResult> ForgotStart([FromBody] ForgotPasswordStartRequest request)
    {
        try
        {
            var providerJson = await _otpService.StartPhoneVerificationAsync(request.PhoneNumberE164, recaptchaToken: string.Empty);
            return Content(providerJson, "application/json");
        }
        catch
        {
            return StatusCode(500, "Lỗi phía ứng dụng, vui lòng thử lại sau");
        }
    }

    [HttpPost("forgot/verify")]
    public async Task<IActionResult> ForgotVerify([FromBody] ForgotPasswordVerifyRequest request)
    {
        try
        {
            // Verify Firebase ID token
            var firebaseUid = await _firebaseAuthService.VerifyIdTokenAsync(request.FirebaseIdToken);
            
            // Get Firebase user to verify phone number
            var firebaseUser = await _firebaseAuthService.GetUserAsync(firebaseUid);
            var phoneE164 = NormalizeToE164VN(request.PhoneNumberE164);
            if (NormalizeToE164VN(firebaseUser.PhoneNumber) != phoneE164)
                return Unauthorized("Phone number verification failed");

            var user = await _db.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phoneE164);
            if (user == null) return NotFound();
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.IsPhoneVerified = true; // Set to true since we verified with Firebase
            await _db.SaveChangesAsync();
            return Ok();
        }
        catch
        {
            return StatusCode(500, "Lỗi phía ứng dụng, vui lòng thử lại sau");
        }
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshTokenRequest request)
    {
        try
        {
            var token = await _db.RefreshTokens.Include(r => r.User).FirstOrDefaultAsync(r => r.Token == request.RefreshToken);
            if (token == null || token.IsRevoked || token.ExpiresAt <= DateTime.UtcNow)
                return Unauthorized("Refresh token không hợp lệ hoặc đã hết hạn");

            var user = token.User;
            var (access, exp) = _tokenService.GenerateAccessTokenWithExpiry(user.Id, user.Email, user.Role.ToString());
            return Ok(new AuthResponse
            {
                AccessToken = access,
                ExpiresIn = (int)(exp - DateTime.UtcNow).TotalSeconds,
                RefreshToken = token.Token,
                RefreshTokenExpiresAt = token.ExpiresAt
            });
        }
        catch
        {
            return StatusCode(500, "Lỗi phía ứng dụng, vui lòng thử lại sau");
        }
    }

    [HttpPost("logout")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
    {
        try
        {
            var token = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.Token == request.RefreshToken);
            if (token != null)
            {
                token.IsRevoked = true;
                token.RevokedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
            return NoContent();
        }
        catch
        {
            return StatusCode(500, "Lỗi phía ứng dụng, vui lòng thử lại sau");
        }
    }

    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> GetProfile()
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
            var userId = Guid.Parse(userIdClaim);
            var user = await _db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound();
            var dto = new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                FirstName = user.FirstName,
                LastName = user.LastName,
                AcceptEmailMarketing = user.AcceptEmailMarketing,
                IsPhoneVerified = user.IsPhoneVerified,
                    Avatar = user.Avatar,
                Address = user.Profile?.Address,
                City = user.Profile?.City,
                Country = user.Profile?.Country ?? "Vietnam",
                DateOfBirth = user.Profile?.DateOfBirth,
                    Bio = user.Profile?.Bio,
                    Gender = user.Profile?.Gender,
                    Website = user.Profile?.Website
            };
            return Ok(dto);
        }
        catch
        {
            return StatusCode(500, "Lỗi phía ứng dụng, vui lòng thử lại sau");
        }
    }

    [HttpPut("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserProfileRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
            var userId = Guid.Parse(userIdClaim);
            var user = await _db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound();

            // Basic fields - Note: Phone number is intentionally excluded and cannot be updated
            // as it is verified during registration and used as the primary identifier
            if (!string.IsNullOrWhiteSpace(request.Email)) user.Email = request.Email!;
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.AcceptEmailMarketing = request.AcceptEmailMarketing;
            if (!string.IsNullOrWhiteSpace(request.Avatar)) user.Avatar = request.Avatar;

            // Profile
            if (user.Profile == null)
            {
                user.Profile = new UserProfile { UserId = user.Id };
                _db.UserProfiles.Add(user.Profile);
            }
            user.Profile.Address = request.Address;
            user.Profile.City = request.City;
            user.Profile.Country = request.Country;
            user.Profile.DateOfBirth = request.DateOfBirth;
            user.Profile.Bio = request.Bio;
            user.Profile.Gender = request.Gender;
            user.Profile.Website = request.Website;

            await _db.SaveChangesAsync();
            return NoContent();
        }
        catch
        {
            return StatusCode(500, "Lỗi phía ứng dụng, vui lòng thử lại sau");
        }
    }
}


