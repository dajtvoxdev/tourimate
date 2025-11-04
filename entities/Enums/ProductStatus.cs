namespace Entities.Enums;

public enum ProductStatus
{
    PendingApproval = 0,  // Waiting for admin approval
    Approved = 1,          // Approved by admin, can be sold
    Rejected = 2,          // Rejected by admin
    Discontinued = 3       // No longer available
}


