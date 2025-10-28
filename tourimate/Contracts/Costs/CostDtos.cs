using System.ComponentModel.DataAnnotations;
using tourimate.Contracts.Common;

namespace tourimate.Contracts.Costs;

public class CostDto
{
    public Guid Id { get; set; }
    public string CostCode { get; set; } = string.Empty;
    public string CostName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid PayerId { get; set; }
    public string PayerName { get; set; } = string.Empty;
    public Guid RecipientId { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public string? RecipientBankCode { get; set; }
    public string? RecipientBankName { get; set; }
    public string? RecipientBankAccount { get; set; }
    public string? RecipientBankAccountName { get; set; }
    public Guid? RelatedEntityId { get; set; }
    public string? RelatedEntityType { get; set; }
    public string? ReferenceNumber { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? PaidDate { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Notes { get; set; }
    public bool IsRecurring { get; set; }
    public int? RecurringIntervalDays { get; set; }
    public DateTime? NextDueDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public string? UpdatedByName { get; set; }
}

public class CreateCostDto
{
    [Required]
    [MaxLength(50)]
    public string CostCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string CostName { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Số tiền phải lớn hơn hoặc bằng 0")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "VND";

    [Required]
    public string Type { get; set; } = string.Empty;

    [Required]
    public Guid PayerId { get; set; }

    [Required]
    public Guid RecipientId { get; set; }

    public Guid? RelatedEntityId { get; set; }

    [MaxLength(20)]
    public string? RelatedEntityType { get; set; }

    [MaxLength(100)]
    public string? ReferenceNumber { get; set; }

    public DateTime? DueDate { get; set; }

    [MaxLength(500)]
    public string? PaymentMethod { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public bool IsRecurring { get; set; } = false;

    public int? RecurringIntervalDays { get; set; }
}

public class UpdateCostDto
{
    [Required]
    [MaxLength(200)]
    public string CostName { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Số tiền phải lớn hơn hoặc bằng 0")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "VND";

    [Required]
    public string Status { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ReferenceNumber { get; set; }

    public DateTime? DueDate { get; set; }

    public DateTime? PaidDate { get; set; }

    [MaxLength(500)]
    public string? PaymentMethod { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public bool IsRecurring { get; set; } = false;

    public int? RecurringIntervalDays { get; set; }
}

public class CostSearchRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Type { get; set; }
    public string? Status { get; set; }
    public string? SearchTerm { get; set; }
    public Guid? PayerId { get; set; }
    public Guid? RecipientId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

public class CostSearchResponse
{
    public List<CostDto> Costs { get; set; } = new();
    public PaginationInfo Pagination { get; set; } = new();
}

public class CostStatisticsDto
{
    public decimal TotalPendingAmount { get; set; }
    public decimal TotalPaidAmount { get; set; }
    public decimal TotalOverdueAmount { get; set; }
    public int PendingCount { get; set; }
    public int PaidCount { get; set; }
    public int OverdueCount { get; set; }
    public List<CostTypeSummary> TypeSummary { get; set; } = new();
    public List<CostStatusSummary> StatusSummary { get; set; } = new();
}

public class CostTypeSummary
{
    public string Type { get; set; } = string.Empty;
    public string TypeName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public int Count { get; set; }
}

public class CostStatusSummary
{
    public string Status { get; set; } = string.Empty;
    public string StatusName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public int Count { get; set; }
}


