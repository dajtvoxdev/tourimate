using System.ComponentModel.DataAnnotations;

namespace tourimate.Contracts.Common;

/// <summary>
/// Common pagination information used across all API responses
/// </summary>
public class PaginationInfo
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
}
