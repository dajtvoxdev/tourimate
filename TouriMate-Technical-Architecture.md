# TouriMate Technical Architecture

## Overview

TouriMate is a comprehensive tourism platform built using modern .NET technologies, implementing Clean Architecture principles with a focus on scalability, maintainability, and performance.

## Architecture Patterns

### Clean Architecture
- **Presentation Layer**: Controllers, DTOs, API responses
- **Application Layer**: Use cases, business logic, application services
- **Domain Layer**: Entities, value objects, domain services
- **Infrastructure Layer**: Data access, external services, file storage

### CQRS (Command Query Responsibility Segregation)
- **Commands**: Create, Update, Delete operations
- **Queries**: Read operations with optimized data transfer objects
- **Handlers**: MediatR pattern for handling commands and queries

---

## Project Structure

```
TouriMate.Solution/
├── src/
│   ├── TouriMate.API/                 # Web API (Presentation Layer)
│   ├── TouriMate.Application/         # Application Layer
│   ├── TouriMate.Domain/              # Domain Layer
│   ├── TouriMate.Infrastructure/      # Infrastructure Layer
│   └── TouriMate.Shared/              # Shared utilities and constants
├── tests/
│   ├── TouriMate.UnitTests/
│   ├── TouriMate.IntegrationTests/
│   └── TouriMate.PerformanceTests/
├── docs/
└── docker/
```

## Technology Stack

### Core Framework
- **ASP.NET Core 8.0** - Web API framework
- **Entity Framework Core 8.0** - ORM for database operations
- **SQL Server** - Primary database
- **Redis** - Caching and session storage
- **MediatR** - CQRS implementation
- **AutoMapper** - Object-to-object mapping

### Authentication & Security
- **JWT Bearer Tokens** - API authentication
- **Identity Framework** - User management
- **IdentityServer** - OAuth 2.0/OpenID Connect (future enhancement)
- **Data Protection API** - Sensitive data encryption
- **Rate Limiting** - API protection

### External Services
- **Azure Blob Storage** - File and image storage
- **SendGrid** - Email services
- **Twilio** - SMS/OTP services
- **VNPay/MoMo/ZaloPay** - Payment gateways
- **Google Maps API** - Location services

### Development Tools
- **Swagger/OpenAPI** - API documentation
- **Serilog** - Structured logging
- **FluentValidation** - Input validation
- **Hangfire** - Background job processing
- **SignalR** - Real-time notifications

---

## Detailed Architecture

### 1. API Layer (TouriMate.API)

#### Controllers Structure
```
Controllers/
├── v1/
│   ├── AuthController.cs
│   ├── UsersController.cs
│   ├── ToursController.cs
│   ├── ProductsController.cs
│   ├── BookingsController.cs
│   ├── OrdersController.cs
│   ├── TourGuidesController.cs
│   └── AdminController.cs
├── Common/
│   ├── BaseController.cs
│   └── ApiController.cs
└── Filters/
    ├── ValidationFilter.cs
    ├── ExceptionFilter.cs
    └── AuthorizationFilter.cs
```

#### Key Features
- **API Versioning**: URL-based versioning (`/api/v1/`)
- **Global Exception Handling**: Consistent error responses
- **Request/Response Logging**: Comprehensive audit trail
- **Rate Limiting**: Protect against abuse
- **CORS Configuration**: Cross-origin support
- **Compression**: Response compression for performance

#### Configuration (Program.cs)
```csharp
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddApiVersioning();
builder.Services.AddSwaggerGen();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { /* JWT config */ });
builder.Services.AddAuthorization(options => { /* Authorization policies */ });

// Add application services
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// Add middleware
var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiting();
app.MapControllers();
```

### 2. Application Layer (TouriMate.Application)

#### Structure
```
Application/
├── Common/
│   ├── Interfaces/
│   ├── Mappings/
│   ├── Models/
│   └── Behaviors/
├── Features/
│   ├── Auth/
│   │   ├── Commands/
│   │   ├── Queries/
│   │   └── DTOs/
│   ├── Tours/
│   ├── Products/
│   ├── Bookings/
│   └── Users/
└── Services/
    ├── IEmailService.cs
    ├── ISmsService.cs
    ├── IPaymentService.cs
    └── IFileStorageService.cs
```

#### CQRS Implementation

**Command Example:**
```csharp
public class CreateTourCommand : IRequest<Result<Guid>>
{
    public string Title { get; set; }
    public string Description { get; set; }
    public string Location { get; set; }
    public int Duration { get; set; }
    public decimal Price { get; set; }
    // ... other properties
}

public class CreateTourCommandHandler : IRequestHandler<CreateTourCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUser;

    public async Task<Result<Guid>> Handle(CreateTourCommand request, CancellationToken cancellationToken)
    {
        var tour = _mapper.Map<Tour>(request);
        tour.TourGuideId = _currentUser.UserId;
        tour.Status = TourStatus.PendingApproval;

        _context.Tours.Add(tour);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(tour.Id);
    }
}
```

**Query Example:**
```csharp
public class GetToursQuery : IRequest<PaginatedResult<TourDto>>
{
    public string? Location { get; set; }
    public decimal? PriceMin { get; set; }
    public decimal? PriceMax { get; set; }
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 20;
}

public class GetToursQueryHandler : IRequestHandler<GetToursQuery, PaginatedResult<TourDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public async Task<PaginatedResult<TourDto>> Handle(GetToursQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Tours
            .Where(t => t.IsActive && !t.IsDeleted)
            .Include(t => t.TourGuide);

        if (!string.IsNullOrEmpty(request.Location))
            query = query.Where(t => t.Location.Contains(request.Location));

        if (request.PriceMin.HasValue)
            query = query.Where(t => t.Price >= request.PriceMin);

        if (request.PriceMax.HasValue)
            query = query.Where(t => t.Price <= request.PriceMax);

        var totalCount = await query.CountAsync(cancellationToken);
        var tours = await query
            .Skip((request.Page - 1) * request.Limit)
            .Take(request.Limit)
            .ToListAsync(cancellationToken);

        var tourDtos = _mapper.Map<List<TourDto>>(tours);

        return PaginatedResult<TourDto>.Success(tourDtos, totalCount, request.Page, request.Limit);
    }
}
```

#### Pipeline Behaviors
```csharp
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (_validators.Any())
        {
            var context = new ValidationContext<TRequest>(request);
            var validationResults = await Task.WhenAll(_validators.Select(v => v.ValidateAsync(context, cancellationToken)));
            var failures = validationResults.SelectMany(r => r.Errors).Where(f => f != null).ToList();

            if (failures.Count != 0)
                throw new ValidationException(failures);
        }

        return await next();
    }
}

public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        _logger.LogInformation("Handling {RequestName}", requestName);

        var stopwatch = Stopwatch.StartNew();
        var response = await next();
        stopwatch.Stop();

        _logger.LogInformation("Handled {RequestName} in {ElapsedMs}ms", requestName, stopwatch.ElapsedMilliseconds);
        return response;
    }
}
```

### 3. Domain Layer (TouriMate.Domain)

#### Structure
```
Domain/
├── Entities/
│   ├── User.cs
│   ├── Tour.cs
│   ├── Product.cs
│   ├── Booking.cs
│   ├── Order.cs
│   └── Review.cs
├── ValueObjects/
│   ├── Address.cs
│   ├── Money.cs
│   └── Rating.cs
├── Enums/
│   ├── UserRole.cs
│   ├── BookingStatus.cs
│   └── PaymentStatus.cs
├── Events/
│   ├── UserRegisteredEvent.cs
│   ├── BookingCreatedEvent.cs
│   └── ReviewSubmittedEvent.cs
├── Exceptions/
│   ├── DomainException.cs
│   └── BusinessRuleViolationException.cs
└── Common/
    ├── BaseEntity.cs
    ├── IAuditableEntity.cs
    └── IDomainEvent.cs
```

#### Entity Examples
```csharp
public class Tour : BaseEntity, IAuditableEntity
{
    public string Title { get; private set; }
    public string Description { get; private set; }
    public string Location { get; private set; }
    public int Duration { get; private set; }
    public Money Price { get; private set; }
    public TourStatus Status { get; private set; }
    public Guid TourGuideId { get; private set; }
    public User TourGuide { get; private set; }
    public ICollection<Booking> Bookings { get; private set; } = new List<Booking>();
    public ICollection<Review> Reviews { get; private set; } = new List<Review>();

    private Tour() { } // For EF Core

    public Tour(string title, string description, string location, int duration, Money price, Guid tourGuideId)
    {
        Title = title ?? throw new ArgumentNullException(nameof(title));
        Description = description ?? throw new ArgumentNullException(nameof(description));
        Location = location ?? throw new ArgumentNullException(nameof(location));
        Duration = duration > 0 ? duration : throw new ArgumentException("Duration must be positive");
        Price = price ?? throw new ArgumentNullException(nameof(price));
        TourGuideId = tourGuideId;
        Status = TourStatus.PendingApproval;

        AddDomainEvent(new TourCreatedEvent(Id, TourGuideId));
    }

    public void UpdateDetails(string title, string description, string location, int duration, Money price)
    {
        if (Status == TourStatus.Active)
        {
            Status = TourStatus.PendingApproval; // Require re-approval for active tours
        }

        Title = title;
        Description = description;
        Location = location;
        Duration = duration;
        Price = price;

        AddDomainEvent(new TourUpdatedEvent(Id));
    }

    public void Approve()
    {
        if (Status != TourStatus.PendingApproval)
            throw new DomainException("Only pending tours can be approved");

        Status = TourStatus.Approved;
        AddDomainEvent(new TourApprovedEvent(Id, TourGuideId));
    }
}

public class Money : ValueObject
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency = "VND")
    {
        if (amount < 0)
            throw new ArgumentException("Amount cannot be negative");

        Amount = amount;
        Currency = currency ?? throw new ArgumentNullException(nameof(currency));
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Amount;
        yield return Currency;
    }

    public static Money operator +(Money left, Money right)
    {
        if (left.Currency != right.Currency)
            throw new InvalidOperationException("Cannot add money with different currencies");

        return new Money(left.Amount + right.Amount, left.Currency);
    }
}
```

### 4. Infrastructure Layer (TouriMate.Infrastructure)

#### Structure
```
Infrastructure/
├── Data/
│   ├── ApplicationDbContext.cs
│   ├── Configurations/
│   └── Migrations/
├── Services/
│   ├── EmailService.cs
│   ├── SmsService.cs
│   ├── PaymentService.cs
│   ├── FileStorageService.cs
│   └── CacheService.cs
├── External/
│   ├── VNPayPaymentGateway.cs
│   ├── TwilioSmsProvider.cs
│   └── SendGridEmailProvider.cs
└── Authentication/
    ├── JwtTokenService.cs
    └── CurrentUserService.cs
```

#### Database Context
```csharp
public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTimeService _dateTimeService;
    private readonly IDomainEventService _domainEventService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService currentUserService,
        IDateTimeService dateTimeService,
        IDomainEventService domainEventService) : base(options)
    {
        _currentUserService = currentUserService;
        _dateTimeService = dateTimeService;
        _domainEventService = domainEventService;
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Tour> Tours { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<Review> Reviews { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<IAuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedBy = _currentUserService.UserId;
                    entry.Entity.CreatedAt = _dateTimeService.Now;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedBy = _currentUserService.UserId;
                    entry.Entity.UpdatedAt = _dateTimeService.Now;
                    break;
            }
        }

        var events = ChangeTracker.Entries<BaseEntity>()
            .Select(x => x.Entity)
            .SelectMany(x => x.DomainEvents)
            .ToList();

        var result = await base.SaveChangesAsync(cancellationToken);

        await _domainEventService.PublishEvents(events);

        return result;
    }
}
```

#### Service Implementations
```csharp
public class PaymentService : IPaymentService
{
    private readonly Dictionary<string, IPaymentGateway> _gateways;
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(
        IEnumerable<IPaymentGateway> gateways,
        ILogger<PaymentService> logger)
    {
        _gateways = gateways.ToDictionary(g => g.Name, g => g);
        _logger = logger;
    }

    public async Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request)
    {
        if (!_gateways.TryGetValue(request.Gateway, out var gateway))
            throw new NotSupportedException($"Payment gateway '{request.Gateway}' is not supported");

        try
        {
            _logger.LogInformation("Processing payment via {Gateway} for amount {Amount}", 
                request.Gateway, request.Amount);

            var result = await gateway.ProcessPaymentAsync(request);
            
            _logger.LogInformation("Payment {Status} for transaction {TransactionId}", 
                result.Status, result.TransactionId);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Payment processing failed for gateway {Gateway}", request.Gateway);
            throw;
        }
    }
}

public class EmailService : IEmailService
{
    private readonly IEmailProvider _emailProvider;
    private readonly ITemplateEngine _templateEngine;
    private readonly ILogger<EmailService> _logger;

    public async Task SendEmailAsync(string to, string subject, string template, object model)
    {
        try
        {
            var htmlContent = await _templateEngine.RenderAsync(template, model);
            await _emailProvider.SendAsync(to, subject, htmlContent);
            
            _logger.LogInformation("Email sent successfully to {Email}", to);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", to);
            throw;
        }
    }
}
```

---

## Security Architecture

### Authentication Flow
1. **User Registration**: Email/Phone + OTP verification
2. **Login**: Credentials validation → JWT generation
3. **Token Refresh**: Refresh token → New access token
4. **Authorization**: JWT validation + role-based access

### JWT Configuration
```csharp
public class JwtSettings
{
    public string SecretKey { get; set; }
    public string Issuer { get; set; }
    public string Audience { get; set; }
    public int AccessTokenExpirationMinutes { get; set; } = 15;
    public int RefreshTokenExpirationDays { get; set; } = 7;
}

public class JwtTokenService : ITokenService
{
    public async Task<TokenResult> GenerateTokenAsync(User user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("phone_verified", user.IsPhoneVerified.ToString()),
        };

        var accessToken = GenerateAccessToken(claims);
        var refreshToken = await GenerateRefreshTokenAsync(user.Id);

        return new TokenResult
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken.Token,
            ExpiresIn = _jwtSettings.AccessTokenExpirationMinutes * 60
        };
    }
}
```

### Authorization Policies
```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CustomerPolicy", policy =>
        policy.RequireRole("Customer", "TourGuide", "Admin"));
    
    options.AddPolicy("TourGuidePolicy", policy =>
        policy.RequireRole("TourGuide", "Admin"));
    
    options.AddPolicy("AdminPolicy", policy =>
        policy.RequireRole("Admin"));
    
    options.AddPolicy("VerifiedPhonePolicy", policy =>
        policy.RequireClaim("phone_verified", "true"));
});
```

---

## Caching Strategy

### Multi-Level Caching
1. **In-Memory Cache**: Frequently accessed data
2. **Distributed Cache (Redis)**: Session data, temporary data
3. **Database Query Cache**: EF Core query caching
4. **CDN Cache**: Static content, images

### Cache Implementation
```csharp
public class CacheService : ICacheService
{
    private readonly IDistributedCache _distributedCache;
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<CacheService> _logger;

    public async Task<T?> GetAsync<T>(string key)
    {
        // Try memory cache first
        if (_memoryCache.TryGetValue(key, out T? memoryValue))
            return memoryValue;

        // Try distributed cache
        var distributedValue = await _distributedCache.GetStringAsync(key);
        if (distributedValue != null)
        {
            var value = JsonSerializer.Deserialize<T>(distributedValue);
            // Cache in memory for faster access
            _memoryCache.Set(key, value, TimeSpan.FromMinutes(5));
            return value;
        }

        return default;
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
    {
        var serializedValue = JsonSerializer.Serialize(value);
        
        var options = new DistributedCacheEntryOptions();
        if (expiration.HasValue)
            options.SetAbsoluteExpiration(expiration.Value);

        await _distributedCache.SetStringAsync(key, serializedValue, options);
        
        // Also cache in memory
        _memoryCache.Set(key, value, expiration ?? TimeSpan.FromMinutes(5));
    }
}
```

---

## Background Jobs

### Hangfire Jobs
```csharp
public class BackgroundJobService
{
    [AutomaticRetry(Attempts = 3)]
    public async Task SendBookingConfirmationEmail(Guid bookingId)
    {
        // Send confirmation email logic
    }

    [AutomaticRetry(Attempts = 5)]
    public async Task ProcessPaymentWebhook(string paymentId, string status)
    {
        // Process payment webhook logic
    }

    [RecurringJob("0 */6 * * *")] // Every 6 hours
    public async Task CleanupExpiredOtpCodes()
    {
        // Cleanup expired OTP codes
    }

    [RecurringJob("0 2 * * *")] // Daily at 2 AM
    public async Task GenerateAnalyticsReports()
    {
        // Generate daily analytics reports
    }
}
```

---

## Monitoring and Logging

### Structured Logging with Serilog
```csharp
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "TouriMate.API")
    .WriteTo.Console()
    .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day)
    .WriteTo.Elasticsearch(new ElasticsearchSinkOptions(new Uri("http://elasticsearch:9200"))
    {
        AutoRegisterTemplate = true,
        IndexFormat = "tourimate-{0:yyyy.MM.dd}"
    })
    .CreateLogger();
```

### Health Checks
```csharp
builder.Services.AddHealthChecks()
    .AddDbContext<ApplicationDbContext>()
    .AddRedis(connectionString)
    .AddUrlGroup(new Uri("https://api.vnpay.vn/health"), "VNPay")
    .AddUrlGroup(new Uri("https://api.sendgrid.com/health"), "SendGrid");

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});
```

---

## Performance Optimization

### Database Optimization
- **Indexes**: Strategic indexing on frequently queried columns
- **Query Optimization**: LINQ query optimization and SQL profiling
- **Connection Pooling**: Optimized connection pool settings
- **Read Replicas**: Separate read/write databases for scaling

### API Optimization
- **Response Compression**: Gzip compression for API responses
- **Output Caching**: Cache frequently requested data
- **Pagination**: Efficient pagination for large datasets
- **GraphQL**: Future consideration for flexible queries

### File Storage Optimization
- **CDN Integration**: Azure CDN for global content delivery
- **Image Optimization**: Automatic image resizing and format conversion
- **Lazy Loading**: Load images on demand

---

## Deployment Architecture

### Containerization (Docker)
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/TouriMate.API/TouriMate.API.csproj", "src/TouriMate.API/"]
RUN dotnet restore "src/TouriMate.API/TouriMate.API.csproj"
COPY . .
WORKDIR "/src/src/TouriMate.API"
RUN dotnet build "TouriMate.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "TouriMate.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "TouriMate.API.dll"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tourimate-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tourimate-api
  template:
    metadata:
      labels:
        app: tourimate-api
    spec:
      containers:
      - name: api
        image: tourimate/api:latest
        ports:
        - containerPort: 80
        env:
        - name: ConnectionStrings__DefaultConnection
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: connection-string
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

---

## Testing Strategy

### Unit Tests
- **Domain Logic**: Test business rules and validations
- **Application Services**: Test command/query handlers
- **API Controllers**: Test request/response handling

### Integration Tests
- **Database Integration**: Test data access layer
- **External Services**: Test third-party integrations
- **End-to-End**: Test complete user workflows

### Performance Tests
- **Load Testing**: Test system under normal load
- **Stress Testing**: Test system limits
- **Spike Testing**: Test sudden traffic increases

This technical architecture provides a solid foundation for building a scalable, maintainable, and secure tourism platform that can handle the complex requirements of the TouriMate system.
