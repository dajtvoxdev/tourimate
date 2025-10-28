using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using tourimate.Contracts.Costs;
using tourimate.Contracts.Common;
using TouriMate.Data;
using Entities.Models;
using Entities.Enums;

namespace tourimate.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CostController : ControllerBase
{
    private readonly TouriMateDbContext _db;

    public CostController(TouriMateDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<CostSearchResponse>> GetCosts([FromQuery] CostSearchRequest request)
    {
        try
        {
            var query = _db.Costs
                .Include(c => c.Payer)
                .Include(c => c.Recipient)
                    .ThenInclude(u => u.Profile)
                .Include(c => c.Creator)
                .Include(c => c.Updater)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(request.Type))
            {
                if (Enum.TryParse<CostType>(request.Type, out var costType))
                {
                    query = query.Where(c => c.Type == costType);
                }
            }

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                if (Enum.TryParse<CostStatus>(request.Status, out var costStatus))
                {
                    query = query.Where(c => c.Status == costStatus);
                }
            }

            if (request.PayerId.HasValue)
            {
                query = query.Where(c => c.PayerId == request.PayerId.Value);
            }

            if (request.RecipientId.HasValue)
            {
                query = query.Where(c => c.RecipientId == request.RecipientId.Value);
            }

            if (request.FromDate.HasValue)
            {
                query = query.Where(c => c.CreatedAt >= request.FromDate.Value);
            }

            if (request.ToDate.HasValue)
            {
                query = query.Where(c => c.CreatedAt <= request.ToDate.Value);
            }

            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var searchTerm = request.SearchTerm.ToLower();
                query = query.Where(c => c.CostName.ToLower().Contains(searchTerm) ||
                                       c.CostCode.ToLower().Contains(searchTerm) ||
                                       c.Description.ToLower().Contains(searchTerm) ||
                                       (c.ReferenceNumber != null && c.ReferenceNumber.ToLower().Contains(searchTerm)));
            }

            // Apply pagination
            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

            var costs = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(c => new CostDto
                {
                    Id = c.Id,
                    CostCode = c.CostCode,
                    CostName = c.CostName,
                    Description = c.Description,
                    Amount = c.Amount,
                    Currency = c.Currency,
                    Type = c.Type.ToString(),
                    Status = c.Status.ToString(),
                    PayerId = c.PayerId,
                    PayerName = $"{c.Payer.FirstName} {c.Payer.LastName}",
                    RecipientId = c.RecipientId,
                    RecipientName = $"{c.Recipient.FirstName} {c.Recipient.LastName}",
                    RecipientBankCode = c.Recipient.Profile != null ? c.Recipient.Profile.BankCode : null,
                    RecipientBankName = c.Recipient.Profile != null ? c.Recipient.Profile.BankName : null,
                    RecipientBankAccount = c.Recipient.Profile != null ? c.Recipient.Profile.BankAccount : null,
                    RecipientBankAccountName = c.Recipient.Profile != null ? c.Recipient.Profile.BankAccountName : null,
                    RelatedEntityId = c.RelatedEntityId,
                    RelatedEntityType = c.RelatedEntityType,
                    ReferenceNumber = c.ReferenceNumber,
                    DueDate = c.DueDate,
                    PaidDate = c.PaidDate,
                    PaymentMethod = c.PaymentMethod,
                    Notes = c.Notes,
                    IsRecurring = c.IsRecurring,
                    RecurringIntervalDays = c.RecurringIntervalDays,
                    NextDueDate = c.NextDueDate,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    CreatedByName = c.Creator != null ? $"{c.Creator.FirstName} {c.Creator.LastName}" : null,
                    UpdatedByName = c.Updater != null ? $"{c.Updater.FirstName} {c.Updater.LastName}" : null
                })
                .ToListAsync();

            return Ok(new CostSearchResponse
            {
                Costs = costs,
                Pagination = new PaginationInfo
                {
                    Page = request.Page,
                    PageSize = request.PageSize,
                    TotalCount = totalCount,
                    TotalPages = totalPages
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CostDto>> GetCost(Guid id)
    {
        try
        {
            var cost = await _db.Costs
                .Include(c => c.Payer)
                .Include(c => c.Recipient)
                .Include(c => c.Creator)
                .Include(c => c.Updater)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (cost == null)
            {
                return NotFound("Không tìm thấy chi phí");
            }

            var costDto = new CostDto
            {
                Id = cost.Id,
                CostCode = cost.CostCode,
                CostName = cost.CostName,
                Description = cost.Description,
                Amount = cost.Amount,
                Currency = cost.Currency,
                Type = cost.Type.ToString(),
                Status = cost.Status.ToString(),
                PayerId = cost.PayerId,
                PayerName = $"{cost.Payer.FirstName} {cost.Payer.LastName}",
                RecipientId = cost.RecipientId,
                RecipientName = $"{cost.Recipient.FirstName} {cost.Recipient.LastName}",
                RelatedEntityId = cost.RelatedEntityId,
                RelatedEntityType = cost.RelatedEntityType,
                ReferenceNumber = cost.ReferenceNumber,
                DueDate = cost.DueDate,
                PaidDate = cost.PaidDate,
                PaymentMethod = cost.PaymentMethod,
                Notes = cost.Notes,
                IsRecurring = cost.IsRecurring,
                RecurringIntervalDays = cost.RecurringIntervalDays,
                NextDueDate = cost.NextDueDate,
                CreatedAt = cost.CreatedAt,
                UpdatedAt = cost.UpdatedAt,
                CreatedByName = cost.Creator != null ? $"{cost.Creator.FirstName} {cost.Creator.LastName}" : null,
                UpdatedByName = cost.Updater != null ? $"{cost.Updater.FirstName} {cost.Updater.LastName}" : null
            };

            return Ok(costDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    [HttpPost]
    public async Task<ActionResult<CostDto>> CreateCost([FromBody] CreateCostDto request)
    {
        try
        {
            // Check if cost code already exists
            var existingCost = await _db.Costs
                .FirstOrDefaultAsync(c => c.CostCode == request.CostCode);

            if (existingCost != null)
            {
                return BadRequest("Mã chi phí đã tồn tại");
            }

            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("Không có quyền truy cập");
            }

            if (!Enum.TryParse<CostType>(request.Type, out var costType))
            {
                return BadRequest("Loại chi phí không hợp lệ");
            }

            var cost = new Cost
            {
                CostCode = request.CostCode,
                CostName = request.CostName,
                Description = request.Description,
                Amount = request.Amount,
                Currency = request.Currency,
                Type = costType,
                Status = CostStatus.Pending,
                PayerId = request.PayerId,
                RecipientId = request.RecipientId,
                RelatedEntityId = request.RelatedEntityId,
                RelatedEntityType = request.RelatedEntityType,
                ReferenceNumber = request.ReferenceNumber,
                DueDate = request.DueDate,
                PaymentMethod = request.PaymentMethod,
                Notes = request.Notes,
                IsRecurring = request.IsRecurring,
                RecurringIntervalDays = request.RecurringIntervalDays,
                CreatedBy = userId.Value,
                UpdatedBy = userId.Value
            };

            if (request.IsRecurring && request.RecurringIntervalDays.HasValue)
            {
                cost.NextDueDate = request.DueDate?.AddDays(request.RecurringIntervalDays.Value);
            }

            _db.Costs.Add(cost);
            await _db.SaveChangesAsync();

            var costDto = new CostDto
            {
                Id = cost.Id,
                CostCode = cost.CostCode,
                CostName = cost.CostName,
                Description = cost.Description,
                Amount = cost.Amount,
                Currency = cost.Currency,
                Type = cost.Type.ToString(),
                Status = cost.Status.ToString(),
                PayerId = cost.PayerId,
                RecipientId = cost.RecipientId,
                DueDate = cost.DueDate,
                PaidDate = cost.PaidDate,
                PaymentMethod = cost.PaymentMethod,
                Notes = cost.Notes,
                IsRecurring = cost.IsRecurring,
                RecurringIntervalDays = cost.RecurringIntervalDays,
                NextDueDate = cost.NextDueDate,
                CreatedAt = cost.CreatedAt,
                UpdatedAt = cost.UpdatedAt
            };

            return CreatedAtAction(nameof(GetCost), new { id = cost.Id }, costDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CostDto>> UpdateCost(Guid id, [FromBody] UpdateCostDto request)
    {
        try
        {
            var cost = await _db.Costs.FindAsync(id);
            if (cost == null)
            {
                return NotFound("Không tìm thấy chi phí");
            }

            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("Không có quyền truy cập");
            }

            if (!Enum.TryParse<CostStatus>(request.Status, out var costStatus))
            {
                return BadRequest("Trạng thái chi phí không hợp lệ");
            }

            cost.CostName = request.CostName;
            cost.Description = request.Description;
            cost.Amount = request.Amount;
            cost.Currency = request.Currency;
            cost.Status = costStatus;
            cost.ReferenceNumber = request.ReferenceNumber;
            cost.DueDate = request.DueDate;
            cost.PaidDate = request.PaidDate;
            cost.PaymentMethod = request.PaymentMethod;
            cost.Notes = request.Notes;
            cost.IsRecurring = request.IsRecurring;
            cost.RecurringIntervalDays = request.RecurringIntervalDays;
            cost.UpdatedBy = userId.Value;

            if (request.IsRecurring && request.RecurringIntervalDays.HasValue && request.PaidDate.HasValue)
            {
                cost.NextDueDate = request.PaidDate.Value.AddDays(request.RecurringIntervalDays.Value);
            }

            await _db.SaveChangesAsync();

            var costDto = new CostDto
            {
                Id = cost.Id,
                CostCode = cost.CostCode,
                CostName = cost.CostName,
                Description = cost.Description,
                Amount = cost.Amount,
                Currency = cost.Currency,
                Type = cost.Type.ToString(),
                Status = cost.Status.ToString(),
                PayerId = cost.PayerId,
                RecipientId = cost.RecipientId,
                DueDate = cost.DueDate,
                PaidDate = cost.PaidDate,
                PaymentMethod = cost.PaymentMethod,
                Notes = cost.Notes,
                IsRecurring = cost.IsRecurring,
                RecurringIntervalDays = cost.RecurringIntervalDays,
                NextDueDate = cost.NextDueDate,
                CreatedAt = cost.CreatedAt,
                UpdatedAt = cost.UpdatedAt
            };

            return Ok(costDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteCost(Guid id)
    {
        try
        {
            var cost = await _db.Costs.FindAsync(id);
            if (cost == null)
            {
                return NotFound("Không tìm thấy chi phí");
            }

            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("Không có quyền truy cập");
            }

            _db.Costs.Remove(cost);
            await _db.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    [HttpGet("statistics")]
    public async Task<ActionResult<CostStatisticsDto>> GetCostStatistics()
    {
        try
        {
            var costs = await _db.Costs.ToListAsync();

            var statistics = new CostStatisticsDto
            {
                TotalPendingAmount = costs.Where(c => c.Status == CostStatus.Pending).Sum(c => c.Amount),
                TotalPaidAmount = costs.Where(c => c.Status == CostStatus.Paid).Sum(c => c.Amount),
                TotalOverdueAmount = costs.Where(c => c.Status == CostStatus.Overdue).Sum(c => c.Amount),
                PendingCount = costs.Count(c => c.Status == CostStatus.Pending),
                PaidCount = costs.Count(c => c.Status == CostStatus.Paid),
                OverdueCount = costs.Count(c => c.Status == CostStatus.Overdue),
                TypeSummary = costs.GroupBy(c => c.Type)
                    .Select(g => new CostTypeSummary
                    {
                        Type = g.Key.ToString(),
                        TypeName = GetCostTypeName(g.Key),
                        TotalAmount = g.Sum(c => c.Amount),
                        Count = g.Count()
                    }).ToList(),
                StatusSummary = costs.GroupBy(c => c.Status)
                    .Select(g => new CostStatusSummary
                    {
                        Status = g.Key.ToString(),
                        StatusName = GetCostStatusName(g.Key),
                        TotalAmount = g.Sum(c => c.Amount),
                        Count = g.Count()
                    }).ToList()
            };

            return Ok(statistics);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    /// <summary>
    /// Confirm payment request (admin): mark cost Paid, create transactions, add revenue
    /// </summary>
    [HttpPost("confirm-payment/{id}")]
    public async Task<IActionResult> ConfirmPayment(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized("Không có quyền truy cập");
            }

            var currentUser = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (currentUser == null || currentUser.Role != UserRole.Admin)
            {
                return Forbid("Chỉ admin mới được xác nhận thanh toán");
            }

            var cost = await _db.Costs
                .Include(c => c.Recipient)
                .ThenInclude(u => u.Profile)
                .FirstOrDefaultAsync(c => c.Id == id);
            
            if (cost == null)
            {
                return NotFound("Không tìm thấy chi phí");
            }

            if (cost.Type != CostType.TourGuidePayment)
            {
                return BadRequest("Chỉ xác nhận các chi phí thanh toán cho hướng dẫn viên");
            }

            // Check if tour guide has bank info
            var tourGuideProfile = cost.Recipient?.Profile;
            if (tourGuideProfile == null || 
                string.IsNullOrWhiteSpace(tourGuideProfile.BankCode) || 
                string.IsNullOrWhiteSpace(tourGuideProfile.BankAccount) || 
                string.IsNullOrWhiteSpace(tourGuideProfile.BankAccountName))
            {
                return BadRequest(new { 
                    message = "Hướng dẫn viên chưa cấu hình thông tin ngân hàng",
                    missingBankInfo = true,
                    tourGuideName = $"{cost.Recipient?.FirstName} {cost.Recipient?.LastName}".Trim()
                });
            }

            // Update cost to Paid
            cost.Status = CostStatus.Paid;
            cost.PaidDate = DateTime.UtcNow;
            cost.UpdatedAt = DateTime.UtcNow;

            // Create Admin OUT transaction
            var adminTx = new Transaction
            {
                TransactionId = $"COST_OUT_{cost.CostCode}",
                UserId = currentUser.Id,
                Type = "payout",
                EntityId = cost.Id,
                EntityType = "Cost",
                Amount = cost.Amount,
                Currency = cost.Currency,
                Status = "completed",
                TransactionDirection = "out",
                PaymentMethod = cost.PaymentMethod ?? "Bank Transfer",
                Description = $"Thanh toán chi phí cho hướng dẫn viên - {cost.CostName}",
                CreatedBy = userId,
                UpdatedBy = userId
            };

            // Create Tour Guide IN transaction
            var guideTx = new Transaction
            {
                TransactionId = $"COST_IN_{cost.CostCode}",
                UserId = cost.RecipientId,
                Type = "payout",
                EntityId = cost.Id,
                EntityType = "Cost",
                Amount = cost.Amount,
                Currency = cost.Currency,
                Status = "completed",
                TransactionDirection = "in",
                PaymentMethod = cost.PaymentMethod ?? "Bank Transfer",
                Description = $"Nhận thanh toán chi phí - {cost.CostName}",
                CreatedBy = userId,
                UpdatedBy = userId
            };

            _db.Transactions.Add(adminTx);
            _db.Transactions.Add(guideTx);

            // Revenue for tour guide
            var revenue = new Revenue
            {
                TransactionId = guideTx.Id,
                UserId = cost.RecipientId,
                EntityId = cost.RelatedEntityId,
                EntityType = cost.RelatedEntityType ?? "Tour",
                GrossAmount = cost.Amount,
                CommissionRate = 0m,
                CommissionAmount = 0m,
                NetAmount = cost.Amount,
                Currency = cost.Currency,
                PayoutStatus = "paid",
                PayoutDate = DateTime.UtcNow
            };
            _db.Revenues.Add(revenue);

            await _db.SaveChangesAsync();
            return Ok(new { message = "Xác nhận thanh toán thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi phía ứng dụng: {ex.Message}");
        }
    }

    [HttpGet("types")]
    public ActionResult<List<object>> GetCostTypes()
    {
        var types = Enum.GetValues<CostType>()
            .Select(t => new { Value = t.ToString(), Name = GetCostTypeName(t) })
            .ToList();

        return Ok(types);
    }

    [HttpGet("statuses")]
    public ActionResult<List<object>> GetCostStatuses()
    {
        var statuses = Enum.GetValues<CostStatus>()
            .Select(s => new { Value = s.ToString(), Name = GetCostStatusName(s) })
            .ToList();

        return Ok(statuses);
    }

    private string GetCostTypeName(CostType type)
    {
        return type switch
        {
            CostType.TourGuidePayment => "Thanh toán cho hướng dẫn viên",
            CostType.RefundPayment => "Hoàn tiền cho khách",
            CostType.FeaturedTourFee => "Phí đăng tour nổi bật",
            CostType.CommissionFee => "Phí hoa hồng",
            CostType.ServiceFee => "Phí dịch vụ",
            CostType.PenaltyFee => "Phí phạt",
            CostType.Other => "Chi phí khác",
            _ => type.ToString()
        };
    }

    private string GetCostStatusName(CostStatus status)
    {
        return status switch
        {
            CostStatus.Pending => "Chờ thanh toán",
            CostStatus.Approved => "Đã duyệt",
            CostStatus.Paid => "Đã thanh toán",
            CostStatus.Cancelled => "Đã hủy",
            CostStatus.Overdue => "Quá hạn",
            _ => status.ToString()
        };
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("userId");
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return userId;
        }
        return null;
    }
}

