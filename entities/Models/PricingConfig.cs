using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;

namespace Entities.Models;

[Table("PricingConfigs")]
public class PricingConfig : BaseEntity, IAuditableEntity
{
    [Required]
    [MaxLength(50)]
    public string ConfigKey { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string ConfigName { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Value { get; set; }

    [Required]
    [MaxLength(10)]
    public string Unit { get; set; } = "VND"; // VND, USD, EUR, %

    [Required]
    [MaxLength(20)]
    public string Category { get; set; } = string.Empty; // TourPush, TourCommission, ProductCommission

    public bool IsActive { get; set; } = true;

    public DateTime? EffectiveDate { get; set; }

    public DateTime? ExpiryDate { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    // IAuditableEntity properties
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("CreatedBy")]
    public virtual User? Creator { get; set; }

    [ForeignKey("UpdatedBy")]
    public virtual User? Updater { get; set; }
}

