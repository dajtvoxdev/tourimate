using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using Entities.Models;
using Entities.Enums;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;

namespace TouriMate.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewController : ControllerBase
{
    private readonly TouriMateDbContext _context;
    private readonly ILogger<ReviewController> _logger;

    public ReviewController(TouriMateDbContext context, ILogger<ReviewController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Check if current user can review a tour
    /// </summary>
    /// <param name="tourId">Tour ID</param>
    /// <returns>Review eligibility information</returns>
    [HttpGet("tour/{tourId}/eligibility")]
    public async Task<IActionResult> CheckReviewEligibility(Guid tourId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Ok(new { 
                    canReview = false, 
                    reason = "not_authenticated",
                    message = "Bạn cần đăng nhập để đánh giá tour này" 
                });
            }

            // Check if user has already reviewed this tour
            var hasReviewed = await _context.Reviews
                .AnyAsync(r => r.UserId == userId.Value && 
                              r.EntityId == tourId && 
                              r.EntityType == "Tour");

            if (hasReviewed)
            {
                return Ok(new { 
                    canReview = false, 
                    reason = "already_reviewed",
                    message = "Bạn đã đánh giá tour này rồi" 
                });
            }

            // Check if user has a completed booking for this tour
            var hasCompletedBooking = await _context.Bookings
                .Include(b => b.TourAvailability)
                .Where(b => b.CustomerId == userId.Value && 
                           b.TourId == tourId && 
                           b.Status == BookingStatus.Completed)
                .Select(b => new { 
                    b.BookingNumber, 
                    b.TourAvailability.Date,
                    b.TourAvailability.Tour.Title
                })
                .FirstOrDefaultAsync();

            if (hasCompletedBooking == null)
            {
                return Ok(new { 
                    canReview = false, 
                    reason = "not_completed",
                    message = "Bạn chỉ có thể đánh giá tour sau khi đã trải nghiệm" 
                });
            }

            return Ok(new { 
                canReview = true, 
                reason = "eligible",
                message = "Bạn có thể đánh giá tour này",
                completedBooking = hasCompletedBooking
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking review eligibility for tour {TourId}", tourId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get reviews for a specific tour
    /// </summary>
    /// <param name="tourId">Tour ID</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 10)</param>
    /// <returns>List of reviews</returns>
    [HttpGet("tour/{tourId}")]
    public async Task<IActionResult> GetTourReviews(Guid tourId, int page = 1, int pageSize = 10)
    {
        try
        {
            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.Replies)
                .Where(r => r.EntityId == tourId && r.EntityType == "Tour" && r.Status == ReviewStatus.Approved)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.Id,
                    r.Rating,
                    r.Title,
                    r.Content,
                    r.Images,
                    r.HelpfulVotes,
                    r.CreatedAt,
                    r.IsVerified,
                    User = new
                    {
                        r.User.Id,
                        r.User.FirstName,
                        r.User.LastName,
                        r.User.Avatar
                    },
                    ReplyCount = r.Replies.Count,
                    Replies = r.Replies.Select(reply => new
                    {
                        reply.Id,
                        reply.Content,
                        reply.CreatedAt,
                        ReplyUser = new
                        {
                            reply.User.Id,
                            reply.User.FirstName,
                            reply.User.LastName
                        }
                    }).ToList()
                })
                .ToListAsync();

            var totalCount = await _context.Reviews
                .Where(r => r.EntityId == tourId && r.EntityType == "Tour" && r.Status == ReviewStatus.Approved)
                .CountAsync();

            return Ok(new
            {
                reviews,
                pagination = new
                {
                    page,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tour reviews for tour {TourId}", tourId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Create a new review for a tour
    /// </summary>
    /// <param name="request">Review creation request</param>
    /// <returns>Created review</returns>
    [HttpPost]
    public async Task<IActionResult> CreateReview([FromBody] CreateReviewRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized("User not authenticated");
            }

            // Check if user has already reviewed this tour
            var existingReview = await _context.Reviews
                .FirstOrDefaultAsync(r => r.UserId == userId.Value && r.EntityId == request.TourId && r.EntityType == "Tour");

            if (existingReview != null)
            {
                return BadRequest("You have already reviewed this tour");
            }

            // Verify user has a completed booking for this tour
            var hasCompletedBooking = await _context.Bookings
                .AnyAsync(b => b.CustomerId == userId.Value && 
                              b.TourId == request.TourId && 
                              b.Status == BookingStatus.Completed);

            if (!hasCompletedBooking)
            {
                return BadRequest("You can only review tours you have completed");
            }

            var review = new Review
            {
                UserId = userId.Value,
                EntityId = request.TourId,
                EntityType = "Tour",
                Rating = request.Rating,
                Title = request.Title,
                Content = request.Content,
                Images = request.Images != null ? JsonSerializer.Serialize(request.Images) : null,
                Status = ReviewStatus.Approved, // Auto-approve reviews
                CreatedBy = userId.Value,
                UpdatedBy = userId.Value
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            // Update tour average rating and total reviews
            await UpdateTourRating(request.TourId);

            return Ok(new { message = "Review submitted successfully", reviewId = review.Id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating review");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Update an existing review
    /// </summary>
    /// <param name="reviewId">Review ID</param>
    /// <param name="request">Review update request</param>
    /// <returns>Updated review</returns>
    [HttpPut("{reviewId}")]
    public async Task<IActionResult> UpdateReview(Guid reviewId, [FromBody] UpdateReviewRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized("User not authenticated");
            }

            var review = await _context.Reviews
                .FirstOrDefaultAsync(r => r.Id == reviewId && r.UserId == userId.Value);

            if (review == null)
            {
                return NotFound("Review not found");
            }

            if (!review.CanBeEdited)
            {
                return BadRequest("Review cannot be edited");
            }

            review.Rating = request.Rating;
            review.Title = request.Title;
            review.Content = request.Content;
            review.Images = request.Images != null ? JsonSerializer.Serialize(request.Images) : null;
            review.UpdatedAt = DateTime.UtcNow;
            review.UpdatedBy = userId.Value;

            await _context.SaveChangesAsync();

            // Update tour average rating
            await UpdateTourRating(review.EntityId);

            return Ok(new { message = "Review updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating review {ReviewId}", reviewId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Delete a review
    /// </summary>
    /// <param name="reviewId">Review ID</param>
    /// <returns>Success result</returns>
    [HttpDelete("{reviewId}")]
    public async Task<IActionResult> DeleteReview(Guid reviewId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized("User not authenticated");
            }

            var review = await _context.Reviews
                .FirstOrDefaultAsync(r => r.Id == reviewId && r.UserId == userId.Value);

            if (review == null)
            {
                return NotFound("Review not found");
            }

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            // Update tour average rating
            await UpdateTourRating(review.EntityId);

            return Ok(new { message = "Review deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting review {ReviewId}", reviewId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get all reviews for admin management
    /// </summary>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Page size</param>
    /// <param name="status">Filter by status</param>
    /// <param name="tourId">Filter by tour ID</param>
    /// <param name="search">Search term</param>
    /// <returns>List of reviews</returns>
    [HttpGet("admin")]
    public async Task<IActionResult> GetReviewsForAdmin(
        int page = 1, 
        int pageSize = 20, 
        string? status = null,
        string? tourId = null,
        string? search = null)
    {
        try
        {
            var query = _context.Reviews
                .Include(r => r.User)
                .Include(r => r.Booking)
                .ThenInclude(b => b.Tour)
                .AsQueryable();

            // Filter by status
            if (!string.IsNullOrEmpty(status) && Enum.TryParse<ReviewStatus>(status, true, out var reviewStatus))
            {
                query = query.Where(r => r.Status == reviewStatus);
            }

            // Filter by tour
            if (!string.IsNullOrEmpty(tourId) && Guid.TryParse(tourId, out var tourGuid))
            {
                query = query.Where(r => r.EntityId == tourGuid && r.EntityType == "Tour");
            }

            // Search functionality
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(r => 
                    r.Content.Contains(search) ||
                    (r.Title != null && r.Title.Contains(search)) ||
                    r.User.FirstName.Contains(search) ||
                    r.User.LastName.Contains(search) ||
                    (r.Booking != null && r.Booking.Tour.Title.Contains(search))
                );
            }

            var totalCount = await query.CountAsync();

            var reviews = await query
                // Sort reported reviews (ReportCount > 0) to the top, then by created date
                .OrderByDescending(r => r.ReportCount > 0)
                .ThenByDescending(r => r.ReportCount)
                .ThenByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.Id,
                    r.Rating,
                    r.Title,
                    r.Content,
                    r.Images,
                    r.HelpfulVotes,
                    r.ReportCount,
                    r.Status,
                    r.CreatedAt,
                    r.UpdatedAt,
                    User = new
                    {
                        r.User.Id,
                        r.User.FirstName,
                        r.User.LastName,
                        r.User.Email
                    },
                    Tour = r.Booking != null ? new
                    {
                        r.Booking.Tour.Id,
                        r.Booking.Tour.Title
                    } : null,
                    BookingNumber = r.Booking != null ? r.Booking.BookingNumber : null
                })
                .ToListAsync();

            return Ok(new
            {
                reviews,
                pagination = new
                {
                    page,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting reviews for admin");
            return StatusCode(500, "Internal server error");
        }
    }


   

    /// <summary>
    /// Delete review (admin only)
    /// </summary>
    /// <param name="reviewId">Review ID</param>
    /// <returns>Success result</returns>
    [HttpDelete("{reviewId}/admin")]
    public async Task<IActionResult> DeleteReviewAdmin(Guid reviewId)
    {
        try
        {
            var review = await _context.Reviews
                .FirstOrDefaultAsync(r => r.Id == reviewId);

            if (review == null)
            {
                return NotFound("Review not found");
            }

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            // Update tour average rating
            await UpdateTourRating(review.EntityId);

            return Ok(new { message = "Review deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting review {ReviewId}", reviewId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Vote helpful for a review
    /// </summary>
    /// <param name="reviewId">Review ID</param>
    /// <returns>Success result</returns>
    [HttpPost("{reviewId}/helpful")]
    public async Task<IActionResult> VoteHelpful(Guid reviewId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized("User not authenticated");
            }

            var review = await _context.Reviews
                .Include(r => r.HelpfulVotesList)
                .FirstOrDefaultAsync(r => r.Id == reviewId);

            if (review == null)
            {
                return NotFound("Review not found");
            }

            // Check if user already voted
            var existingVote = review.HelpfulVotesList
                .FirstOrDefault(v => v.UserId == userId.Value);

            if (existingVote != null)
            {
                // Remove vote
                _context.ReviewHelpfulVotes.Remove(existingVote);
                review.HelpfulVotes = Math.Max(0, review.HelpfulVotes - 1);
            }
            else
            {
                // Add vote
                var vote = new ReviewHelpfulVote
                {
                    ReviewId = reviewId,
                    UserId = userId.Value,
                    IsHelpful = true
                };
                _context.ReviewHelpfulVotes.Add(vote);
                review.HelpfulVotes += 1;
            }

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = existingVote != null ? "Vote removed" : "Vote added",
                helpfulVotes = review.HelpfulVotes
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error voting helpful for review {ReviewId}", reviewId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Report a review for inappropriate content
    /// </summary>
    /// <param name="reviewId">Review ID</param>
    /// <param name="request">Report request with reason</param>
    /// <returns>Success result</returns>
    [HttpPost("{reviewId}/report")]
    public async Task<IActionResult> ReportReview(Guid reviewId, [FromBody] ReportReviewRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized("User not authenticated");
            }

            var review = await _context.Reviews
                .FirstOrDefaultAsync(r => r.Id == reviewId);

            if (review == null)
            {
                return NotFound("Review not found");
            }

            // Check if user already reported this review
            var existingReport = await _context.Reports
                .FirstOrDefaultAsync(r => r.EntityId == reviewId && 
                                         r.EntityType == "Review" && 
                                         r.ReportedBy == userId.Value);

            if (existingReport != null)
            {
                return BadRequest("Bạn đã báo cáo phản hồi này rồi");
            }

            // Create report record
            var report = new Report
            {
                EntityId = reviewId,
                EntityType = "Review",
                Reason = request.Reason ?? "Inappropriate content",
                Description = request.Description,
                ReportedBy = userId.Value,
                Status = "Pending"
            };

            _context.Reports.Add(report);

            // Increment report count on review
            review.ReportCount += 1;
            review.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Review {ReviewId} reported by user {UserId}", reviewId, userId.Value);

            return Ok(new { 
                message = "Review reported successfully",
                reportCount = review.ReportCount
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reporting review {ReviewId}", reviewId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Reply to a review
    /// </summary>
    /// <param name="reviewId">Review ID</param>
    /// <param name="request">Reply request</param>
    /// <returns>Success result</returns>
    [HttpPost("{reviewId}/reply")]
    public async Task<IActionResult> ReplyToReview(Guid reviewId, [FromBody] ReplyToReviewRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized("User not authenticated");
            }

            var review = await _context.Reviews
                .FirstOrDefaultAsync(r => r.Id == reviewId);

            if (review == null)
            {
                return NotFound("Review not found");
            }

            // Create reply
            var reply = new ReviewReply
            {
                ReviewId = reviewId,
                UserId = userId.Value,
                Content = request.Content,
                CreatedBy = userId.Value,
                UpdatedBy = userId.Value
            };

            _context.ReviewReplies.Add(reply);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Reply added to review {ReviewId} by user {UserId}", reviewId, userId.Value);

            return Ok(new { 
                message = "Reply added successfully",
                replyId = reply.Id
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error replying to review {ReviewId}", reviewId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get replies for a review
    /// </summary>
    /// <param name="reviewId">Review ID</param>
    /// <returns>List of replies</returns>
    [HttpGet("{reviewId}/replies")]
    public async Task<IActionResult> GetReviewReplies(Guid reviewId)
    {
        try
        {
            var replies = await _context.ReviewReplies
                .Include(rr => rr.User)
                .Where(rr => rr.ReviewId == reviewId)
                .OrderBy(rr => rr.CreatedAt)
                .Select(rr => new
                {
                    rr.Id,
                    rr.Content,
                    rr.CreatedAt,
                    rr.UpdatedAt,
                    User = new
                    {
                        rr.User.Id,
                        rr.User.FirstName,
                        rr.User.LastName,
                        rr.User.Email
                    }
                })
                .ToListAsync();

            return Ok(replies);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting replies for review {ReviewId}", reviewId);
            return StatusCode(500, "Internal server error");
        }
    }

    private async Task UpdateTourRating(Guid tourId)
    {
        try
        {
            var approvedReviews = await _context.Reviews
                .Where(r => r.EntityId == tourId && r.EntityType == "Tour" && r.Status == ReviewStatus.Approved)
                .ToListAsync();

            var tour = await _context.Tours.FindAsync(tourId);
            if (tour != null)
            {
                tour.TotalReviews = approvedReviews.Count;
                tour.AverageRating = approvedReviews.Count > 0 
                    ? (decimal)approvedReviews.Average(r => r.Rating) 
                    : 0;
                tour.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating tour rating for tour {TourId}", tourId);
        }
    }

    /// <summary>
    /// Update review status (Admin only)
    /// </summary>
    [HttpPut("{reviewId}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdateReviewStatus(Guid reviewId, [FromBody] UpdateReviewStatusRequest request)
    {
        try
        {
            var review = await _context.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId);
            if (review == null)
            {
                return NotFound("Không tìm thấy đánh giá");
            }

            review.Status = request.Status;
            review.UpdatedAt = DateTime.UtcNow;
            review.UpdatedBy = GetCurrentUserId();

            await _context.SaveChangesAsync();

            // Update tour rating after status change
            await UpdateTourRating(review.EntityId);

            return Ok(new { message = "Cập nhật trạng thái thành công" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating review status for review {ReviewId}", reviewId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Recalculate all tour ratings (Admin only)
    /// </summary>
    [HttpPost("admin/recalculate-ratings")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> RecalculateAllTourRatings()
    {
        try
        {
            var tours = await _context.Tours.ToListAsync();
            var updatedCount = 0;

            foreach (var tour in tours)
            {
                var approvedReviews = await _context.Reviews
                    .Where(r => r.EntityId == tour.Id && r.EntityType == "Tour" && r.Status == ReviewStatus.Approved)
                    .ToListAsync();

                tour.TotalReviews = approvedReviews.Count;
                tour.AverageRating = approvedReviews.Count > 0 
                    ? (decimal)approvedReviews.Average(r => r.Rating) 
                    : 0;
                tour.UpdatedAt = DateTime.UtcNow;
                updatedCount++;
            }

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Recalculated ratings successfully", 
                updatedTours = updatedCount 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recalculating all tour ratings");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get reports for a specific review (Admin only)
    /// </summary>
    [HttpGet("{reviewId}/reports")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<ReviewReportDto>>> GetReviewReports(Guid reviewId)
    {
        try
        {
            var reports = await _context.Reports
                .Include(r => r.ReportedByUser)
                .Where(r => r.EntityId == reviewId && r.EntityType == "Review")
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var reportDtos = reports.Select(r => new ReviewReportDto
            {
                Id = r.Id,
                Reason = r.Reason,
                Description = r.Description,
                Status = r.Status,
                ReportedAt = r.CreatedAt,
                ReportedBy = new ReviewReportUserDto
                {
                    Id = r.ReportedByUser.Id,
                    FirstName = r.ReportedByUser.FirstName,
                    LastName = r.ReportedByUser.LastName,
                    Email = r.ReportedByUser.Email
                },
                ReviewedAt = r.ReviewedAt,
                Resolution = r.Resolution
            }).ToList();

            return Ok(reportDtos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return userId;
        }
        return null;
    }
}

public class CreateReviewRequest
{
    public Guid TourId { get; set; }
    public int Rating { get; set; }
    public string? Title { get; set; }
    public string Content { get; set; } = string.Empty;
    public List<string>? Images { get; set; }
}

public class UpdateReviewRequest
{
    public int Rating { get; set; }
    public string? Title { get; set; }
    public string Content { get; set; } = string.Empty;
    public List<string>? Images { get; set; }
}

public class UpdateReviewStatusRequest
{
    public ReviewStatus Status { get; set; }
}

public class ReportReviewRequest
{
    public string? Reason { get; set; }
    public string? Description { get; set; }
}

public class ReplyToReviewRequest
{
    public string Content { get; set; } = string.Empty;
}

public class ReviewReportDto
{
    public Guid Id { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime ReportedAt { get; set; }
    public ReviewReportUserDto ReportedBy { get; set; } = null!;
    public DateTime? ReviewedAt { get; set; }
    public string? Resolution { get; set; }
}

public class ReviewReportUserDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
