# TouriMate Database Schema

## Database Overview

**Database Engine**: SQL Server  
**ORM**: Entity Framework Core 8.0  
**Architecture**: Code-First Approach with Migrations

## Schema Conventions

- Primary keys: `Id` (Guid)
- Foreign keys: `{EntityName}Id` (Guid)
- Timestamps: `CreatedAt`, `UpdatedAt` (DateTime, UTC)
- Soft delete: `IsDeleted` (bool), `DeletedAt` (DateTime?)
- All string fields have defined max lengths
- Indexes on frequently queried fields
- Audit trails for sensitive data

---

## Core Tables

### 1. Users Table

```sql
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email NVARCHAR(320) NOT NULL UNIQUE,
    PhoneNumber NVARCHAR(20) UNIQUE,
    PasswordHash NVARCHAR(256) NOT NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Avatar NVARCHAR(500),
    Role NVARCHAR(20) NOT NULL DEFAULT 'Customer', -- Customer, TourGuide, Admin
    IsPhoneVerified BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    AcceptEmailMarketing BIT NOT NULL DEFAULT 0,
    LastLoginAt DATETIME2,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL
);

CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_PhoneNumber ON Users(PhoneNumber);
CREATE INDEX IX_Users_Role ON Users(Role);
CREATE INDEX IX_Users_IsActive ON Users(IsActive);
```

### 2. UserProfiles Table

```sql
CREATE TABLE UserProfiles (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    DateOfBirth DATE,
    Gender NVARCHAR(10), -- Male, Female, Other
    Address NVARCHAR(500),
    City NVARCHAR(100),
    Country NVARCHAR(100) DEFAULT 'Vietnam',
    Bio NVARCHAR(2000),
    Website NVARCHAR(300),
    SocialMedia NVARCHAR(MAX), -- JSON
    NotificationSettings NVARCHAR(MAX), -- JSON: {"emailNotifications": true, "smsNotifications": false, "pushNotifications": true, "marketingEmails": false}
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IX_UserProfiles_UserId ON UserProfiles(UserId);
```

### 3. OtpCodes Table

```sql
CREATE TABLE OtpCodes (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PhoneNumber NVARCHAR(20) NOT NULL,
    Code NVARCHAR(10) NOT NULL,
    Purpose NVARCHAR(50) NOT NULL, -- registration, password_reset, phone_verification
    ExpiresAt DATETIME2 NOT NULL,
    IsUsed BIT NOT NULL DEFAULT 0,
    UsedAt DATETIME2 NULL,
    AttemptCount INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX IX_OtpCodes_PhoneNumber_Purpose ON OtpCodes(PhoneNumber, Purpose);
CREATE INDEX IX_OtpCodes_ExpiresAt ON OtpCodes(ExpiresAt);
```

### 4. RefreshTokens Table

```sql
CREATE TABLE RefreshTokens (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Token NVARCHAR(500) NOT NULL UNIQUE,
    ExpiresAt DATETIME2 NOT NULL,
    IsRevoked BIT NOT NULL DEFAULT 0,
    RevokedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IX_RefreshTokens_UserId ON RefreshTokens(UserId);
CREATE INDEX IX_RefreshTokens_Token ON RefreshTokens(Token);
CREATE INDEX IX_RefreshTokens_ExpiresAt ON RefreshTokens(ExpiresAt);
```

---

## Tour Management Tables

### 5. TourGuideApplications Table

```sql
CREATE TABLE TourGuideApplications (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    ApplicationData NVARCHAR(MAX) NOT NULL, -- JSON containing all application info
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending_review', -- pending_review, approved, rejected
    ReviewedBy UNIQUEIDENTIFIER NULL,
    ReviewedAt DATETIME2 NULL,
    Feedback NVARCHAR(1000),
    Documents NVARCHAR(MAX), -- JSON array of document URLs
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    FOREIGN KEY (ReviewedBy) REFERENCES Users(Id)
);

CREATE INDEX IX_TourGuideApplications_UserId ON TourGuideApplications(UserId);
CREATE INDEX IX_TourGuideApplications_Status ON TourGuideApplications(Status);
```

### 6. Tours Table

```sql
CREATE TABLE Tours (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    ShortDescription NVARCHAR(500) NOT NULL,
    Location NVARCHAR(200) NOT NULL,
    Duration INT NOT NULL, -- days
    MaxParticipants INT NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    Currency NVARCHAR(3) NOT NULL DEFAULT 'VND',
    Category NVARCHAR(50) NOT NULL,
    Difficulty NVARCHAR(20) NOT NULL, -- Easy, Moderate, Challenging, Expert
    Images NVARCHAR(MAX), -- JSON array of image URLs
    Itinerary NVARCHAR(MAX), -- JSON
    Includes NVARCHAR(MAX), -- JSON array
    Excludes NVARCHAR(MAX), -- JSON array
    Terms NVARCHAR(MAX),
    IsActive BIT NOT NULL DEFAULT 1,
    IsFeatured BIT NOT NULL DEFAULT 0,
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending_approval', -- pending_approval, approved, rejected, inactive
    TourGuideId UNIQUEIDENTIFIER NOT NULL,
    AverageRating DECIMAL(3,2) NOT NULL DEFAULT 0,
    TotalReviews INT NOT NULL DEFAULT 0,
    TotalBookings INT NOT NULL DEFAULT 0,
    ViewCount INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL,
    
    FOREIGN KEY (TourGuideId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IX_Tours_TourGuideId ON Tours(TourGuideId);
CREATE INDEX IX_Tours_Location ON Tours(Location);
CREATE INDEX IX_Tours_Category ON Tours(Category);
CREATE INDEX IX_Tours_Price ON Tours(Price);
CREATE INDEX IX_Tours_IsActive ON Tours(IsActive);
CREATE INDEX IX_Tours_IsFeatured ON Tours(IsFeatured);
CREATE INDEX IX_Tours_Status ON Tours(Status);
CREATE INDEX IX_Tours_AverageRating ON Tours(AverageRating);
```

### 7. TourAvailability Table

```sql
CREATE TABLE TourAvailability (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TourId UNIQUEIDENTIFIER NOT NULL,
    Date DATE NOT NULL,
    TimeSlots NVARCHAR(MAX), -- JSON array of available time slots
    MaxParticipants INT NOT NULL,
    BookedParticipants INT NOT NULL DEFAULT 0,
    IsAvailable BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (TourId) REFERENCES Tours(Id) ON DELETE CASCADE,
    UNIQUE(TourId, Date)
);

CREATE INDEX IX_TourAvailability_TourId ON TourAvailability(TourId);
CREATE INDEX IX_TourAvailability_Date ON TourAvailability(Date);
CREATE INDEX IX_TourAvailability_IsAvailable ON TourAvailability(IsAvailable);
```

### 8. Bookings Table

```sql
CREATE TABLE Bookings (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    BookingNumber NVARCHAR(20) NOT NULL UNIQUE,
    TourId UNIQUEIDENTIFIER NOT NULL,
    CustomerId UNIQUEIDENTIFIER NOT NULL,
    TourDate DATE NOT NULL,
    TimeSlot NVARCHAR(10),
    Participants INT NOT NULL,
    ParticipantDetails NVARCHAR(MAX), -- JSON
    TotalAmount DECIMAL(18,2) NOT NULL,
    Currency NVARCHAR(3) NOT NULL DEFAULT 'VND',
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending_payment', -- pending_payment, confirmed, cancelled, completed, refunded
    PaymentStatus NVARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
    PaymentId NVARCHAR(100),
    PaymentMethod NVARCHAR(50),
    SpecialRequests NVARCHAR(1000),
    ContactInfo NVARCHAR(MAX), -- JSON
    CancellationReason NVARCHAR(500),
    CancelledAt DATETIME2 NULL,
    RefundAmount DECIMAL(18,2) NULL,
    RefundedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (TourId) REFERENCES Tours(Id),
    FOREIGN KEY (CustomerId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IX_Bookings_BookingNumber ON Bookings(BookingNumber);
CREATE INDEX IX_Bookings_TourId ON Bookings(TourId);
CREATE INDEX IX_Bookings_CustomerId ON Bookings(CustomerId);
CREATE INDEX IX_Bookings_Status ON Bookings(Status);
CREATE INDEX IX_Bookings_PaymentStatus ON Bookings(PaymentStatus);
CREATE INDEX IX_Bookings_TourDate ON Bookings(TourDate);
```

---

## Product Management Tables

### 9. ProductCategories Table

```sql
CREATE TABLE ProductCategories (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(500),
    Icon NVARCHAR(200),
    ParentId UNIQUEIDENTIFIER NULL,
    SortOrder INT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (ParentId) REFERENCES ProductCategories(Id)
);

CREATE INDEX IX_ProductCategories_ParentId ON ProductCategories(ParentId);
CREATE INDEX IX_ProductCategories_IsActive ON ProductCategories(IsActive);
```

### 10. Products Table

```sql
CREATE TABLE Products (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    ShortDescription NVARCHAR(500) NOT NULL,
    CategoryId UNIQUEIDENTIFIER NOT NULL,
    Brand NVARCHAR(100),
    Region NVARCHAR(100),
    Price DECIMAL(18,2) NOT NULL,
    Currency NVARCHAR(3) NOT NULL DEFAULT 'VND',
    OriginalPrice DECIMAL(18,2),
    Stock INT NOT NULL DEFAULT 0,
    LowStockThreshold INT NOT NULL DEFAULT 10,
    Images NVARCHAR(MAX), -- JSON array of image URLs
    Specifications NVARCHAR(MAX), -- JSON
    Ingredients NVARCHAR(MAX), -- JSON array
    NutritionFacts NVARCHAR(MAX), -- JSON
    IsActive BIT NOT NULL DEFAULT 1,
    IsFeatured BIT NOT NULL DEFAULT 0,
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending_approval', -- pending_approval, approved, rejected, inactive
    VendorId UNIQUEIDENTIFIER NOT NULL,
    AverageRating DECIMAL(3,2) NOT NULL DEFAULT 0,
    TotalReviews INT NOT NULL DEFAULT 0,
    TotalSales INT NOT NULL DEFAULT 0,
    ViewCount INT NOT NULL DEFAULT 0,
    Weight DECIMAL(10,3), -- kg
    Dimensions NVARCHAR(100), -- L x W x H in cm
    ShippingInfo NVARCHAR(MAX), -- JSON
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL,
    
    FOREIGN KEY (CategoryId) REFERENCES ProductCategories(Id),
    FOREIGN KEY (VendorId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IX_Products_VendorId ON Products(VendorId);
CREATE INDEX IX_Products_CategoryId ON Products(CategoryId);
CREATE INDEX IX_Products_Region ON Products(Region);
CREATE INDEX IX_Products_Price ON Products(Price);
CREATE INDEX IX_Products_IsActive ON Products(IsActive);
CREATE INDEX IX_Products_IsFeatured ON Products(IsFeatured);
CREATE INDEX IX_Products_Status ON Products(Status);
CREATE INDEX IX_Products_Stock ON Products(Stock);
CREATE INDEX IX_Products_AverageRating ON Products(AverageRating);
```

### 11. Orders Table

```sql
CREATE TABLE Orders (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    OrderNumber NVARCHAR(20) NOT NULL UNIQUE,
    CustomerId UNIQUEIDENTIFIER NOT NULL,
    Subtotal DECIMAL(18,2) NOT NULL,
    ShippingFee DECIMAL(18,2) NOT NULL DEFAULT 0,
    Tax DECIMAL(18,2) NOT NULL DEFAULT 0,
    Discount DECIMAL(18,2) NOT NULL DEFAULT 0,
    TotalAmount DECIMAL(18,2) NOT NULL,
    Currency NVARCHAR(3) NOT NULL DEFAULT 'VND',
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending_payment', -- pending_payment, processing, shipped, delivered, cancelled, returned
    PaymentStatus NVARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
    PaymentId NVARCHAR(100),
    PaymentMethod NVARCHAR(50),
    ShippingAddress NVARCHAR(MAX) NOT NULL, -- JSON
    BillingAddress NVARCHAR(MAX), -- JSON
    TrackingNumber NVARCHAR(100),
    ShippingMethod NVARCHAR(50),
    EstimatedDelivery DATE,
    DeliveredAt DATETIME2 NULL,
    Notes NVARCHAR(1000),
    CancellationReason NVARCHAR(500),
    CancelledAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (CustomerId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IX_Orders_OrderNumber ON Orders(OrderNumber);
CREATE INDEX IX_Orders_CustomerId ON Orders(CustomerId);
CREATE INDEX IX_Orders_Status ON Orders(Status);
CREATE INDEX IX_Orders_PaymentStatus ON Orders(PaymentStatus);
CREATE INDEX IX_Orders_TrackingNumber ON Orders(TrackingNumber);
```

### 12. OrderItems Table

```sql
CREATE TABLE OrderItems (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    OrderId UNIQUEIDENTIFIER NOT NULL,
    ProductId UNIQUEIDENTIFIER NOT NULL,
    ProductName NVARCHAR(200) NOT NULL,
    ProductImage NVARCHAR(500),
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    Subtotal DECIMAL(18,2) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (OrderId) REFERENCES Orders(Id) ON DELETE CASCADE,
    FOREIGN KEY (ProductId) REFERENCES Products(Id)
);

CREATE INDEX IX_OrderItems_OrderId ON OrderItems(OrderId);
CREATE INDEX IX_OrderItems_ProductId ON OrderItems(ProductId);
```

### 13. ShoppingCart Table

```sql
CREATE TABLE ShoppingCart (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    ProductId UNIQUEIDENTIFIER NOT NULL,
    Quantity INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE,
    UNIQUE(UserId, ProductId)
);

CREATE INDEX IX_ShoppingCart_UserId ON ShoppingCart(UserId);
CREATE INDEX IX_ShoppingCart_ProductId ON ShoppingCart(ProductId);
```

---

## Review and Rating Tables

### 14. Reviews Table

```sql
CREATE TABLE Reviews (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    EntityId UNIQUEIDENTIFIER NOT NULL, -- Tour or Product ID
    EntityType NVARCHAR(20) NOT NULL, -- Tour, Product
    BookingId UNIQUEIDENTIFIER NULL, -- For tour reviews
    OrderId UNIQUEIDENTIFIER NULL, -- For product reviews
    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    Title NVARCHAR(200),
    Content NVARCHAR(MAX) NOT NULL,
    Images NVARCHAR(MAX), -- JSON array of image URLs
    IsVerified BIT NOT NULL DEFAULT 0,
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    HelpfulVotes INT NOT NULL DEFAULT 0,
    ReportCount INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL,
    
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    FOREIGN KEY (BookingId) REFERENCES Bookings(Id),
    FOREIGN KEY (OrderId) REFERENCES Orders(Id)
);

CREATE INDEX IX_Reviews_UserId ON Reviews(UserId);
CREATE INDEX IX_Reviews_EntityId_EntityType ON Reviews(EntityId, EntityType);
CREATE INDEX IX_Reviews_Rating ON Reviews(Rating);
CREATE INDEX IX_Reviews_Status ON Reviews(Status);
CREATE INDEX IX_Reviews_CreatedAt ON Reviews(CreatedAt);
```

### 15. ReviewReplies Table

```sql
CREATE TABLE ReviewReplies (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ReviewId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    Content NVARCHAR(1000) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL,
    
    FOREIGN KEY (ReviewId) REFERENCES Reviews(Id) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IX_ReviewReplies_ReviewId ON ReviewReplies(ReviewId);
CREATE INDEX IX_ReviewReplies_UserId ON ReviewReplies(UserId);
```

### 16. ReviewHelpfulVotes Table

```sql
CREATE TABLE ReviewHelpfulVotes (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ReviewId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    IsHelpful BIT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (ReviewId) REFERENCES Reviews(Id) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    UNIQUE(ReviewId, UserId)
);

CREATE INDEX IX_ReviewHelpfulVotes_ReviewId ON ReviewHelpfulVotes(ReviewId);
CREATE INDEX IX_ReviewHelpfulVotes_UserId ON ReviewHelpfulVotes(UserId);
```

---

## Promotion and Marketing Tables

### 17. Promotions Table

```sql
CREATE TABLE Promotions (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    EntityId UNIQUEIDENTIFIER NOT NULL, -- Tour or Product ID
    EntityType NVARCHAR(20) NOT NULL, -- Tour, Product
    PromotionType NVARCHAR(20) NOT NULL, -- featured, sponsored, banner
    RequestedBy UNIQUEIDENTIFIER NOT NULL,
    Duration INT NOT NULL, -- days
    Cost DECIMAL(18,2) NOT NULL,
    Currency NVARCHAR(3) NOT NULL DEFAULT 'VND',
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending_payment', -- pending_payment, active, expired, cancelled
    PaymentStatus NVARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
    PaymentId NVARCHAR(100),
    StartDate DATETIME2 NULL,
    EndDate DATETIME2 NULL,
    ViewCount INT NOT NULL DEFAULT 0,
    ClickCount INT NOT NULL DEFAULT 0,
    ConversionCount INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (RequestedBy) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IX_Promotions_EntityId_EntityType ON Promotions(EntityId, EntityType);
CREATE INDEX IX_Promotions_RequestedBy ON Promotions(RequestedBy);
CREATE INDEX IX_Promotions_Status ON Promotions(Status);
CREATE INDEX IX_Promotions_StartDate_EndDate ON Promotions(StartDate, EndDate);
```

---

## Reporting and Moderation Tables

### 18. Reports Table

```sql
CREATE TABLE Reports (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ReportedBy UNIQUEIDENTIFIER NOT NULL,
    EntityId UNIQUEIDENTIFIER NOT NULL, -- Review, User, Tour, Product ID
    EntityType NVARCHAR(20) NOT NULL, -- Review, User, Tour, Product
    Reason NVARCHAR(50) NOT NULL, -- inappropriate_content, spam, fake_review, harassment
    Description NVARCHAR(1000),
    Evidence NVARCHAR(MAX), -- JSON array of evidence URLs
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, investigating, resolved, dismissed
    ReviewedBy UNIQUEIDENTIFIER NULL,
    ReviewedAt DATETIME2 NULL,
    Resolution NVARCHAR(1000),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (ReportedBy) REFERENCES Users(Id) ON DELETE CASCADE,
    FOREIGN KEY (ReviewedBy) REFERENCES Users(Id)
);

CREATE INDEX IX_Reports_ReportedBy ON Reports(ReportedBy);
CREATE INDEX IX_Reports_EntityId_EntityType ON Reports(EntityId, EntityType);
CREATE INDEX IX_Reports_Status ON Reports(Status);
CREATE INDEX IX_Reports_CreatedAt ON Reports(CreatedAt);
```

---

## Financial Tables

### 19. Transactions Table

```sql
CREATE TABLE Transactions (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TransactionId NVARCHAR(100) NOT NULL UNIQUE,
    UserId UNIQUEIDENTIFIER NOT NULL,
    Type NVARCHAR(20) NOT NULL, -- booking_payment, order_payment, promotion_payment, refund, payout
    EntityId UNIQUEIDENTIFIER, -- Booking, Order, or Promotion ID
    EntityType NVARCHAR(20), -- Booking, Order, Promotion
    Amount DECIMAL(18,2) NOT NULL,
    Currency NVARCHAR(3) NOT NULL DEFAULT 'VND',
    Status NVARCHAR(20) NOT NULL, -- pending, completed, failed, cancelled, refunded
    PaymentMethod NVARCHAR(50),
    PaymentGateway NVARCHAR(50),
    GatewayTransactionId NVARCHAR(200),
    GatewayResponse NVARCHAR(MAX), -- JSON
    Description NVARCHAR(500),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IX_Transactions_TransactionId ON Transactions(TransactionId);
CREATE INDEX IX_Transactions_UserId ON Transactions(UserId);
CREATE INDEX IX_Transactions_Type ON Transactions(Type);
CREATE INDEX IX_Transactions_Status ON Transactions(Status);
CREATE INDEX IX_Transactions_EntityId_EntityType ON Transactions(EntityId, EntityType);
CREATE INDEX IX_Transactions_CreatedAt ON Transactions(CreatedAt);
```

### 20. Revenue Table

```sql
CREATE TABLE Revenue (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TransactionId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL, -- Tour guide or vendor
    EntityId UNIQUEIDENTIFIER NOT NULL, -- Tour or Product ID
    EntityType NVARCHAR(20) NOT NULL, -- Tour, Product
    GrossAmount DECIMAL(18,2) NOT NULL,
    CommissionRate DECIMAL(5,4) NOT NULL, -- 0.15 for 15%
    CommissionAmount DECIMAL(18,2) NOT NULL,
    NetAmount DECIMAL(18,2) NOT NULL,
    Currency NVARCHAR(3) NOT NULL DEFAULT 'VND',
    PayoutStatus NVARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, held
    PayoutDate DATETIME2 NULL,
    PayoutReference NVARCHAR(100),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (TransactionId) REFERENCES Transactions(Id) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IX_Revenue_UserId ON Revenue(UserId);
CREATE INDEX IX_Revenue_EntityId_EntityType ON Revenue(EntityId, EntityType);
CREATE INDEX IX_Revenue_PayoutStatus ON Revenue(PayoutStatus);
CREATE INDEX IX_Revenue_CreatedAt ON Revenue(CreatedAt);
```

---

## System Tables

### 21. SystemSettings Table

```sql
CREATE TABLE SystemSettings (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Key NVARCHAR(100) NOT NULL UNIQUE,
    Value NVARCHAR(MAX),
    Description NVARCHAR(500),
    Category NVARCHAR(50),
    IsPublic BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX IX_SystemSettings_Key ON SystemSettings([Key]);
CREATE INDEX IX_SystemSettings_Category ON SystemSettings(Category);
```

### 22. AuditLogs Table

```sql
CREATE TABLE AuditLogs (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER,
    Action NVARCHAR(100) NOT NULL,
    EntityType NVARCHAR(50),
    EntityId UNIQUEIDENTIFIER,
    OldValues NVARCHAR(MAX), -- JSON
    NewValues NVARCHAR(MAX), -- JSON
    IpAddress NVARCHAR(45),
    UserAgent NVARCHAR(500),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

CREATE INDEX IX_AuditLogs_UserId ON AuditLogs(UserId);
CREATE INDEX IX_AuditLogs_Action ON AuditLogs(Action);
CREATE INDEX IX_AuditLogs_EntityType ON AuditLogs(EntityType);
CREATE INDEX IX_AuditLogs_CreatedAt ON AuditLogs(CreatedAt);
```

### 23. Files Table

```sql
CREATE TABLE Files (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    FileName NVARCHAR(255) NOT NULL,
    OriginalFileName NVARCHAR(255) NOT NULL,
    FileExtension NVARCHAR(10) NOT NULL,
    FileSize BIGINT NOT NULL,
    MimeType NVARCHAR(100) NOT NULL,
    FilePath NVARCHAR(500) NOT NULL,
    FileUrl NVARCHAR(500) NOT NULL,
    EntityId UNIQUEIDENTIFIER, -- Related entity ID
    EntityType NVARCHAR(50), -- Tour, Product, User, Review, etc.
    UploadedBy UNIQUEIDENTIFIER NOT NULL,
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UploadedBy) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IX_Files_EntityId_EntityType ON Files(EntityId, EntityType);
CREATE INDEX IX_Files_UploadedBy ON Files(UploadedBy);
CREATE INDEX IX_Files_CreatedAt ON Files(CreatedAt);
```

---

## Views for Analytics

### Revenue Analytics View

```sql
CREATE VIEW vw_RevenueAnalytics AS
SELECT 
    r.UserId,
    u.FirstName + ' ' + u.LastName AS UserName,
    r.EntityType,
    COUNT(*) AS TotalTransactions,
    SUM(r.GrossAmount) AS TotalGrossRevenue,
    SUM(r.CommissionAmount) AS TotalCommission,
    SUM(r.NetAmount) AS TotalNetRevenue,
    r.Currency,
    YEAR(r.CreatedAt) AS Year,
    MONTH(r.CreatedAt) AS Month
FROM Revenue r
JOIN Users u ON r.UserId = u.Id
WHERE r.CreatedAt >= DATEADD(YEAR, -2, GETDATE())
GROUP BY 
    r.UserId, u.FirstName, u.LastName, r.EntityType, r.Currency,
    YEAR(r.CreatedAt), MONTH(r.CreatedAt);
```

### Tour Performance View

```sql
CREATE VIEW vw_TourPerformance AS
SELECT 
    t.Id AS TourId,
    t.Title,
    t.TourGuideId,
    u.FirstName + ' ' + u.LastName AS TourGuideName,
    t.AverageRating,
    t.TotalReviews,
    t.TotalBookings,
    t.ViewCount,
    COUNT(b.Id) AS ActiveBookings,
    SUM(CASE WHEN b.Status = 'completed' THEN b.TotalAmount ELSE 0 END) AS TotalRevenue,
    AVG(CASE WHEN b.Status = 'completed' THEN b.TotalAmount ELSE NULL END) AS AverageBookingValue
FROM Tours t
JOIN Users u ON t.TourGuideId = u.Id
LEFT JOIN Bookings b ON t.Id = b.TourId
WHERE t.IsActive = 1 AND t.IsDeleted = 0
GROUP BY 
    t.Id, t.Title, t.TourGuideId, u.FirstName, u.LastName,
    t.AverageRating, t.TotalReviews, t.TotalBookings, t.ViewCount;
```

---

## Stored Procedures

### Update Tour Rating Procedure

```sql
CREATE PROCEDURE sp_UpdateTourRating
    @TourId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Tours 
    SET 
        AverageRating = (
            SELECT COALESCE(AVG(CAST(r.Rating AS DECIMAL(3,2))), 0)
            FROM Reviews r 
            WHERE r.EntityId = @TourId 
              AND r.EntityType = 'Tour' 
              AND r.Status = 'approved'
              AND r.IsDeleted = 0
        ),
        TotalReviews = (
            SELECT COUNT(*)
            FROM Reviews r 
            WHERE r.EntityId = @TourId 
              AND r.EntityType = 'Tour' 
              AND r.Status = 'approved'
              AND r.IsDeleted = 0
        )
    WHERE Id = @TourId;
END;
```

### Update Product Rating Procedure

```sql
CREATE PROCEDURE sp_UpdateProductRating
    @ProductId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Products 
    SET 
        AverageRating = (
            SELECT COALESCE(AVG(CAST(r.Rating AS DECIMAL(3,2))), 0)
            FROM Reviews r 
            WHERE r.EntityId = @ProductId 
              AND r.EntityType = 'Product' 
              AND r.Status = 'approved'
              AND r.IsDeleted = 0
        ),
        TotalReviews = (
            SELECT COUNT(*)
            FROM Reviews r 
            WHERE r.EntityId = @ProductId 
              AND r.EntityType = 'Product' 
              AND r.Status = 'approved'
              AND r.IsDeleted = 0
        )
    WHERE Id = @ProductId;
END;
```

---

## Triggers

### Update Timestamp Trigger (Example for Users table)

```sql
CREATE TRIGGER tr_Users_UpdateTimestamp
ON Users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Users 
    SET UpdatedAt = GETUTCDATE()
    FROM Users u
    INNER JOIN inserted i ON u.Id = i.Id;
END;
```

---

## Initial Data Seeds

### Default System Settings

```sql
INSERT INTO SystemSettings ([Key], Value, Description, Category, IsPublic) VALUES
('CommissionRate_Tours', '0.15', 'Commission rate for tour bookings', 'Finance', 1),
('CommissionRate_Products', '0.15', 'Commission rate for product sales', 'Finance', 1),
('OTP_ExpiryMinutes', '5', 'OTP expiry time in minutes', 'Security', 0),
('MaxOTP_Attempts', '3', 'Maximum OTP verification attempts', 'Security', 0),
('FileUpload_MaxSize', '10485760', 'Maximum file upload size in bytes (10MB)', 'Files', 0),
('Review_AutoApprove', 'false', 'Auto-approve reviews without moderation', 'Content', 0),
('Booking_CancellationHours', '24', 'Minimum hours before tour for cancellation', 'Booking', 1),
('Product_LowStockThreshold', '10', 'Low stock alert threshold', 'Inventory', 0);
```

### Default Product Categories

```sql
INSERT INTO ProductCategories (Id, Name, Description, SortOrder) VALUES
(NEWID(), 'Food & Beverages', 'Traditional Vietnamese food and drinks', 1),
(NEWID(), 'Handicrafts', 'Handmade crafts and artisan products', 2),
(NEWID(), 'Textiles', 'Traditional clothing and fabrics', 3),
(NEWID(), 'Souvenirs', 'Tourist souvenirs and gifts', 4),
(NEWID(), 'Accessories', 'Traditional accessories and jewelry', 5);
```

---

This comprehensive database schema provides a solid foundation for the TouriMate platform, covering all the required functionality with proper relationships, indexing, and data integrity constraints. The schema is designed to be scalable and maintainable while supporting all the business requirements outlined in your specifications.
