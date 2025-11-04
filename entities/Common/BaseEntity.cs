using System.ComponentModel.DataAnnotations;

namespace Entities.Common;

public abstract class BaseEntity
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    // Store Vietnam local time by default
    public DateTime CreatedAt { get; set; } = TimeProvider.VietnamNow();
    
    public DateTime UpdatedAt { get; set; } = TimeProvider.VietnamNow();
    
    public bool IsDeleted { get; set; } = false;
    
    public DateTime? DeletedAt { get; set; }
}
