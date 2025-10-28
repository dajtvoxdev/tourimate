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
using System.Text.Json;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
    private readonly TouriMateDbContext _db;
    private readonly IJwtTokenService _tokenService;
    private readonly IOtpService _otpService;
    private readonly IFirebaseAuthService _firebaseAuthService;
    private readonly IEmailService _emailService;

    public AuthController(TouriMateDbContext db, IJwtTokenService tokenService, IOtpService otpService, IFirebaseAuthService firebaseAuthService, IEmailService emailService)
    {
        _db = db;
        _tokenService = tokenService;
        _otpService = otpService;
        _firebaseAuthService = firebaseAuthService;
        _emailService = emailService;
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
            var refreshToken = await _db.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken && !rt.IsRevoked);

            if (refreshToken == null || refreshToken.ExpiresAt < DateTime.UtcNow)
            {
                return Unauthorized("Invalid or expired refresh token");
            }

            // Generate new access token
            var (newToken, exp) = _tokenService.GenerateAccessTokenWithExpiry(
                refreshToken.UserId, 
                refreshToken.User.Email, 
                refreshToken.User.Role.ToString()
            );

            // Optionally rotate refresh token for security
            var newRefreshToken = new RefreshToken
            {
                UserId = refreshToken.UserId,
                Token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()) + Convert.ToBase64String(Guid.NewGuid().ToByteArray()),
                ExpiresAt = DateTime.UtcNow.AddDays(14)
            };

            // Revoke old refresh token
            refreshToken.IsRevoked = true;
            refreshToken.RevokedAt = DateTime.UtcNow;

            // Add new refresh token
            _db.RefreshTokens.Add(newRefreshToken);
            await _db.SaveChangesAsync();

            return Ok(new AuthResponse
            {
                AccessToken = newToken,
                ExpiresIn = (int)(exp - DateTime.UtcNow).TotalSeconds,
                RefreshToken = newRefreshToken.Token,
                RefreshTokenExpiresAt = newRefreshToken.ExpiresAt
            });
        }
        catch (Exception ex)
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
                Role = user.Role.ToString(),
                AcceptEmailMarketing = user.AcceptEmailMarketing,
                IsPhoneVerified = user.IsPhoneVerified,
                Avatar = user.Avatar,
                Address = user.Profile?.Address,
                Country = user.Profile?.Country ?? "Vietnam",
                DateOfBirth = user.Profile?.DateOfBirth,
                Bio = user.Profile?.Bio,
                Gender = user.Profile?.Gender,
                Website = user.Profile?.Website,
                SocialMedia = user.Profile?.SocialMedia,
                NotificationSettings = user.Profile?.NotificationSettings,
                ProvinceCode = user.Profile?.ProvinceCode,
                WardCode = user.Profile?.WardCode,
                LastLoginAt = user.LastLoginAt,
                BankCode = user.Profile?.BankCode,
                BankName = user.Profile?.BankName,
                BankAccountName = user.Profile?.BankAccountName,
                BankAccount = user.Profile?.BankAccount
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
            user.Profile.Country = request.Country;
            user.Profile.DateOfBirth = request.DateOfBirth;
            user.Profile.Bio = request.Bio;
            user.Profile.Gender = request.Gender;
            user.Profile.Website = request.Website;
            user.Profile.SocialMedia = request.SocialMedia;
            user.Profile.NotificationSettings = request.NotificationSettings;
            user.Profile.ProvinceCode = request.ProvinceCode;
            user.Profile.WardCode = request.WardCode;
            user.Profile.BankCode = request.BankCode;
            user.Profile.BankName = request.BankName;
            user.Profile.BankAccountName = request.BankAccountName;
            user.Profile.BankAccount = request.BankAccount;

            await _db.SaveChangesAsync();
            return NoContent();
        }
        catch
        {
            return StatusCode(500, "Lỗi phía ứng dụng, vui lòng thử lại sau");
        }
    }

    [HttpGet("tour-guide-application")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> GetTourGuideApplication()
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
            var userId = Guid.Parse(userIdClaim);

            var application = await _db.TourGuideApplications
                .FirstOrDefaultAsync(a => a.UserId == userId);

            if (application == null)
            {
                return NotFound(new { message = "Chưa có đơn đăng ký nào" });
            }

            return Ok(new { 
                id = application.Id,
                status = application.Status,
                applicationData = application.ApplicationData,
                documents = application.Documents,
                feedback = application.Feedback,
                reviewedAt = application.ReviewedAt,
                createdAt = application.CreatedAt
            });
        }
        catch
        {
            return StatusCode(500, "Lỗi phía ứng dụng, vui lòng thử lại sau");
        }
    }

    [HttpPost("tour-guide-application")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> SubmitTourGuideApplication([FromBody] TourGuideApplicationRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
            var userId = Guid.Parse(userIdClaim);

            // Check if user is already a tour guide
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user?.Role == Entities.Enums.UserRole.TourGuide || user?.Role == Entities.Enums.UserRole.Admin)
            {
                return Conflict("Bạn đã là hướng dẫn viên");
            }

            // Check for existing application
            var existingApplication = await _db.TourGuideApplications
                .FirstOrDefaultAsync(a => a.UserId == userId);

            if (existingApplication != null)
            {
                // Only allow updates if status is "allow_edit" or "rejected"
                if (existingApplication.Status == "allow_edit" || existingApplication.Status == "rejected")
                {
                    // Update existing application
                    existingApplication.ApplicationData = request.ApplicationData;
                    existingApplication.Documents = request.Documents;
                    existingApplication.Status = "pending_review";
                    existingApplication.UpdatedBy = userId;
                    existingApplication.UpdatedAt = DateTime.UtcNow;
                    existingApplication.ReviewedAt = null;
                    existingApplication.ReviewedBy = null;
                    existingApplication.Feedback = null;

                    await _db.SaveChangesAsync();
                    return Ok(new { message = "Đơn đăng ký đã được cập nhật thành công", applicationId = existingApplication.Id });
                }
                else
                {
                    return Conflict($"Không thể chỉnh sửa đơn đăng ký với trạng thái: {existingApplication.Status}");
                }
            }

            // Create new application
            var application = new TourGuideApplication
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ApplicationData = request.ApplicationData,
                Documents = request.Documents,
                Status = "pending_review",
                CreatedBy = userId
            };

            _db.TourGuideApplications.Add(application);
            await _db.SaveChangesAsync();

            // Notify admin via email about new application (best-effort)
            try
            {
                var html = $@"<h3>Đơn đăng ký hướng dẫn viên mới</h3>
<p>Người dùng: <strong>{user!.FirstName} {user.LastName}</strong> ({user.Email})</p>
<p>Thời gian: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC</p>
<p>Vui lòng vào trang quản trị để xem và phê duyệt.</p>";
                await _emailService.SendAdminNotificationAsync("Đơn đăng ký hướng dẫn viên mới", html);
            }
            catch { }

            return Ok(new { message = "Đơn đăng ký đã được gửi thành công", applicationId = application.Id });
        }
        catch
        {
            return StatusCode(500, "Lỗi phía ứng dụng, vui lòng thử lại sau");
        }
    }

    [HttpGet("tour-guide-applications")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetTourGuideApplications(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        try
        {
            var query = _db.TourGuideApplications
                .Include(a => a.User)
                .AsQueryable();

            // Filter by status
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(a => a.Status == status);
            }

            // Search by user name or email (including email from application data)
            if (!string.IsNullOrEmpty(search))
            {
                // For now, we'll search by user profile data since LINQ can't easily search JSON
                // The application data email will be handled in the display logic above
                query = query.Where(a => 
                    a.User.FirstName.Contains(search) || 
                    a.User.LastName.Contains(search) ||
                    a.User.Email.Contains(search) ||
                    a.ApplicationData.Contains(search)); // This will search within the JSON string
            }

            var totalCount = await query.CountAsync();
            var applications = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Process applications to get email from application data
            var processedApplications = applications.Select(a => {
                string emailToUse = a.User.Email;
                string firstName = a.User.FirstName;
                string lastName = a.User.LastName;
                
                try
                {
                    var applicationData = JsonSerializer.Deserialize<Dictionary<string, object>>(a.ApplicationData);
                    if (applicationData != null)
                    {
                        // Try to get email from application data
                        if (applicationData.ContainsKey("email") && !string.IsNullOrWhiteSpace(applicationData["email"]?.ToString()))
                        {
                            emailToUse = applicationData["email"].ToString();
                        }
                        
                        // Try to get name from application data
                        if (applicationData.ContainsKey("fullName") && !string.IsNullOrWhiteSpace(applicationData["fullName"]?.ToString()))
                        {
                            var fullName = applicationData["fullName"].ToString().Split(' ', 2);
                            if (fullName.Length >= 1) firstName = fullName[0];
                            if (fullName.Length >= 2) lastName = string.Join(" ", fullName.Skip(1));
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to parse application data for application {a.Id}: {ex.Message}");
                }
                
                return new
                {
                    id = a.Id,
                    userId = a.UserId,
                    userFirstName = firstName,
                    userLastName = lastName,
                    userEmail = emailToUse,
                    userPhone = a.User.PhoneNumber,
                    status = a.Status,
                    createdAt = a.CreatedAt,
                    reviewedAt = a.ReviewedAt,
                    feedback = a.Feedback
                };
            }).ToList();

            return Ok(new
            {
                applications = processedApplications,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }
        catch
        {
            return StatusCode(500, "Lỗi phía ứng dụng, vui lòng thử lại sau");
        }
    }

    [HttpGet("tour-guide-applications/{id}")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetTourGuideApplication(Guid id)
    {
        try
        {
            var application = await _db.TourGuideApplications
                .Include(a => a.User)
                .Include(a => a.Reviewer)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (application == null)
            {
                return NotFound("Không tìm thấy đơn đăng ký");
            }

            // Try to get email and name from application data first
            string emailToUse = application.User.Email;
            string firstName = application.User.FirstName;
            string lastName = application.User.LastName;
            
            try
            {
                var applicationData = JsonSerializer.Deserialize<Dictionary<string, object>>(application.ApplicationData);
                if (applicationData != null)
                {
                    // Try to get email from application data
                    if (applicationData.ContainsKey("email") && !string.IsNullOrWhiteSpace(applicationData["email"]?.ToString()))
                    {
                        emailToUse = applicationData["email"].ToString();
                    }
                    
                    // Try to get name from application data
                    if (applicationData.ContainsKey("fullName") && !string.IsNullOrWhiteSpace(applicationData["fullName"]?.ToString()))
                    {
                        var fullName = applicationData["fullName"].ToString().Split(' ', 2);
                        if (fullName.Length >= 1) firstName = fullName[0];
                        if (fullName.Length >= 2) lastName = string.Join(" ", fullName.Skip(1));
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to parse application data for application {application.Id}: {ex.Message}");
            }

            return Ok(new
            {
                id = application.Id,
                userId = application.UserId,
                userFirstName = firstName,
                userLastName = lastName,
                userEmail = emailToUse,
                userPhone = application.User.PhoneNumber,
                status = application.Status,
                applicationData = application.ApplicationData,
                documents = application.Documents,
                feedback = application.Feedback,
                createdAt = application.CreatedAt,
                reviewedAt = application.ReviewedAt,
                reviewerName = application.Reviewer != null ? $"{application.Reviewer.FirstName} {application.Reviewer.LastName}" : null
            });
        }
        catch
        {
            return StatusCode(500, "Lỗi phía ứng dụng, vui lòng thử lại sau");
        }
    }

    [HttpPost("tour-guide-applications/{id}/review")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    public async Task<IActionResult> ReviewTourGuideApplication(
        Guid id, 
        [FromBody] ReviewTourGuideApplicationRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
            var reviewerId = Guid.Parse(userIdClaim);

            var application = await _db.TourGuideApplications
                .Include(a => a.User)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (application == null)
            {
                return NotFound("Không tìm thấy đơn đăng ký");
            }

            if (application.Status != "pending_review")
            {
                return BadRequest($"Không thể xem xét đơn đăng ký với trạng thái: {application.Status}");
            }

            // Update application status
            application.Status = request.Status;
            application.ReviewedBy = reviewerId;
            application.ReviewedAt = DateTime.UtcNow;
            application.Feedback = request.Feedback;
            application.UpdatedBy = reviewerId;
            application.UpdatedAt = DateTime.UtcNow;

            // If approved, update user role to TourGuide
            if (request.Status == "approved")
            {
                application.User.Role = Entities.Enums.UserRole.TourGuide;
                application.User.UpdatedBy = reviewerId;
                application.User.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();

            // Send email notification to the applicant
            try
            {
                var userFullName = $"{application.User.FirstName} {application.User.LastName}".Trim();
                
                // Try to get email from application data first, fallback to user profile
                string emailToUse = null;
                string applicantName = userFullName;
                
                try
                {
                    var applicationData = JsonSerializer.Deserialize<Dictionary<string, object>>(application.ApplicationData);
                    if (applicationData != null && applicationData.ContainsKey("email") && !string.IsNullOrWhiteSpace(applicationData["email"]?.ToString()))
                    {
                        emailToUse = applicationData["email"].ToString();
                        // Also get name from application data if available
                        if (applicationData.ContainsKey("fullName") && !string.IsNullOrWhiteSpace(applicationData["fullName"]?.ToString()))
                        {
                            applicantName = applicationData["fullName"].ToString();
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to parse application data for email: {ex.Message}");
                }
                
                // Fallback to user profile email if application email not found
                if (string.IsNullOrWhiteSpace(emailToUse))
                {
                    emailToUse = application.User.Email;
                }
                
                // Debug logging
                Console.WriteLine($"Attempting to send email to: '{emailToUse}' for user: '{applicantName}' with status: '{request.Status}'");
                
                if (string.IsNullOrWhiteSpace(emailToUse))
                {
                    Console.WriteLine("Warning: No email found in application data or user profile, skipping email notification");
                }
                else
                {
                    await _emailService.SendTourGuideApplicationStatusEmailAsync(
                        emailToUse, 
                        applicantName, 
                        request.Status, 
                        request.Feedback
                    );
                    Console.WriteLine("Email notification sent successfully");
                }
            }
            catch (Exception emailEx)
            {
                // Log email error but don't fail the request
                // The status update was successful, email is secondary
                Console.WriteLine($"Failed to send email notification: {emailEx.Message}");
                Console.WriteLine($"Stack trace: {emailEx.StackTrace}");
            }

            return Ok(new { message = "Đánh giá đơn đăng ký thành công" });
        }
        catch
        {
            return StatusCode(500, "Lỗi phía ứng dụng, vui lòng thử lại sau");
        }
    }

    [HttpGet("users")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, [FromQuery] string? role = null)
    {
        try
        {
            var query = _db.Users.AsQueryable();
            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(u =>
                    u.Email.Contains(search) ||
                    u.FirstName.Contains(search) ||
                    u.LastName.Contains(search) ||
                    u.PhoneNumber!.Contains(search));
            }
            if (!string.IsNullOrWhiteSpace(role))
            {
                if (Enum.TryParse<Entities.Enums.UserRole>(role, true, out var r))
                {
                    query = query.Where(u => u.Role == r);
                }
            }
            var totalCount = await query.CountAsync();
            var items = await query.OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new AdminUserListItemDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Role = u.Role.ToString(),
                    IsPhoneVerified = u.IsPhoneVerified,
                    IsActive = u.IsActive,
                    Avatar = u.Avatar,
                    CreatedAt = u.CreatedAt,
                    LastLoginAt = u.LastLoginAt
                })
                .ToListAsync();

            return Ok(new { items, totalCount, page, pageSize, totalPages = (int)Math.Ceiling((double)totalCount / pageSize) });
        }
        catch
        {
            return StatusCode(500, "Lỗi phía ứng dụng, vui lòng thử lại sau");
        }
    }

    [HttpGet("guides")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetGuides([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
    {
        try
        {
            var query = _db.Users.Where(u => u.Role == Entities.Enums.UserRole.TourGuide);
            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(u =>
                    u.Email.Contains(search) ||
                    u.FirstName.Contains(search) ||
                    u.LastName.Contains(search) ||
                    u.PhoneNumber!.Contains(search));
            }
            var totalCount = await query.CountAsync();
            var items = await query.OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new AdminUserListItemDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Role = u.Role.ToString(),
                    IsPhoneVerified = u.IsPhoneVerified,
                    IsActive = u.IsActive,
                    Avatar = u.Avatar,
                    CreatedAt = u.CreatedAt,
                    LastLoginAt = u.LastLoginAt
                })
                .ToListAsync();

            return Ok(new { items, totalCount, page, pageSize, totalPages = (int)Math.Ceiling((double)totalCount / pageSize) });
        }
        catch
        {
            return StatusCode(500, "Lỗi phía ứng dụng, vui lòng thử lại sau");
        }
    }

    [HttpGet("users/{id}")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUser(Guid id)
    {
        var user = await _db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();
        var dto = new AdminUserDetailDto
        {
            Id = user.Id,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role.ToString(),
            IsPhoneVerified = user.IsPhoneVerified,
            IsActive = user.IsActive,
            Avatar = user.Avatar,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            Address = user.Profile?.Address,
            Country = user.Profile?.Country ?? "Vietnam",
            DateOfBirth = user.Profile?.DateOfBirth,
            Bio = user.Profile?.Bio,
            Gender = user.Profile?.Gender,
                Website = user.Profile?.Website,
                SocialMedia = user.Profile?.SocialMedia,
                NotificationSettings = user.Profile?.NotificationSettings,
                ProvinceCode = user.Profile?.ProvinceCode,
                WardCode = user.Profile?.WardCode,
                BankCode = user.Profile?.BankCode,
                BankName = user.Profile?.BankName,
                BankAccountName = user.Profile?.BankAccountName,
                BankAccount = user.Profile?.BankAccount
            };
            return Ok(dto);
    }

    [HttpPost("users")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password)) return BadRequest("Email/Password required");
        if (await _db.Users.AnyAsync(u => u.Email == request.Email)) return BadRequest("Email đã tồn tại");
        if (!Enum.TryParse<Entities.Enums.UserRole>(request.Role, true, out var role)) role = Entities.Enums.UserRole.Customer;
        var user = new Entities.Models.User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.PhoneNumber,
            Role = role,
            IsActive = request.IsActive
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return Ok(new { id = user.Id });
    }

    [HttpPut("users/{id}")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();
        // Admin cannot edit another admin if caller isn't same admin
        if (user.Role == Entities.Enums.UserRole.Admin)
        {
            return BadRequest("Không thể chỉnh sửa tài khoản quản trị");
        }
        if (!string.IsNullOrWhiteSpace(request.FirstName)) user.FirstName = request.FirstName!;
        if (!string.IsNullOrWhiteSpace(request.LastName)) user.LastName = request.LastName!;
        if (!string.IsNullOrWhiteSpace(request.PhoneNumber)) user.PhoneNumber = request.PhoneNumber!;
        if (!string.IsNullOrWhiteSpace(request.Avatar)) user.Avatar = request.Avatar!;
        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;
        if (!string.IsNullOrWhiteSpace(request.Role) && Enum.TryParse<Entities.Enums.UserRole>(request.Role, true, out var role))
        {
            if (role == Entities.Enums.UserRole.Admin) return BadRequest("Không thể nâng cấp lên quản trị tại đây");
            user.Role = role;
        }
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("users/{id}/active")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    public async Task<IActionResult> ChangeUserActive(Guid id, [FromBody] ChangeUserActiveRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();
        if (user.Role == Entities.Enums.UserRole.Admin) return BadRequest("Không thể thay đổi trạng thái quản trị");
        user.IsActive = request.IsActive;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("guides/{id}/revoke")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    public async Task<IActionResult> RevokeGuide(Guid id)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id && u.Role == Entities.Enums.UserRole.TourGuide);
        if (user == null) return NotFound();
        user.Role = Entities.Enums.UserRole.Customer;
        await _db.SaveChangesAsync();
        return NoContent();
    }

}


