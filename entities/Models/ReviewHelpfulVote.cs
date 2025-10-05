using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Entities.Common;

namespace Entities.Models;

[Table("ReviewHelpfulVotes")]
public class ReviewHelpfulVote : BaseEntity
{
    [Required]
    public Guid ReviewId { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [Required]
    public bool IsHelpful { get; set; }

    // Navigation properties
    [ForeignKey("ReviewId")]
    public virtual Review Review { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
