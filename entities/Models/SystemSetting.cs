using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;

namespace Entities.Models;

[Table("SystemSettings")]
public class SystemSetting : BaseEntity
{
    [Required]
    [MaxLength(100)]
    public string Key { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string? Value { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? Category { get; set; }

    public bool IsPublic { get; set; } = false;

    // Helper methods (methods don't need NotMapped attribute)
    public T? GetValue<T>() where T : class
    {
        if (string.IsNullOrEmpty(Value))
            return null;
            
        if (typeof(T) == typeof(string))
            return Value as T;
            
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<T>(Value);
        }
        catch
        {
            return null;
        }
    }

    public T GetValueOrDefault<T>(T defaultValue) where T : struct
    {
        if (string.IsNullOrEmpty(Value))
            return defaultValue;
            
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<T>(Value);
        }
        catch
        {
            return defaultValue;
        }
    }
}
