using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using TouriMate.Services;
using TouriMate.Services.Abstractions;
using TouriMate.Services.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using TouriMate.Services.Media;
using tourimate.Services.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add SignalR
builder.Services.AddSignalR();
// Register eSMS OTP service
builder.Services.Configure<EsmsOptions>(builder.Configuration.GetSection("Esms"));
builder.Services.AddHttpClient<EsmsOtpService>();
builder.Services.AddScoped<IOtpService, EsmsOtpService>();

// Register HttpClient for file operations
builder.Services.AddHttpClient();

// Bind JwtSettings and register token service
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

// Register Firebase Auth service
builder.Services.AddScoped<IFirebaseAuthService, FirebaseAuthService>();

// Register Cloudinary media service
builder.Services.Configure<CloudinaryOptions>(builder.Configuration.GetSection("Cloudinary"));
builder.Services.AddScoped<IMediaService, CloudinaryMediaService>();

// Register Email service
builder.Services.AddScoped<IEmailService, EmailService>();

// Register SePay service
builder.Services.AddScoped<ISePayService, SePayService>();

// Register Refund service
builder.Services.AddScoped<IRefundService, RefundService>();

// Register Commission service
builder.Services.AddScoped<ICommissionService, CommissionService>();

// Configure Entity Framework
builder.Services.AddDbContext<TouriMateDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
        }));

// Configure CORS (with credentials for SignalR)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.WithOrigins(
                "http://localhost:8080", 
                "http://localhost:5173",
                "https://tourimate.site",
                "https://www.tourimate.site"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials(); // Required for SignalR
        });
});

// Authentication / Authorization
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>() ?? new JwtSettings();
var keyBytes = Encoding.UTF8.GetBytes(jwtSettings.SecretKey ?? string.Empty);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ClockSkew = TimeSpan.Zero
    };
});
builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<PaymentHub>("/hubs/payment"); // SignalR payment hub endpoint

// Ensure database is created and migrated
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<TouriMateDbContext>();
    try
    {
        await context.Database.MigrateAsync();
        Console.WriteLine("Database migration completed successfully.");
        
        // Seed the database
        await DatabaseSeeder.SeedAsync(context);
        Console.WriteLine("Database seeding completed successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database migration/seeding failed: {ex.Message}");
    }
}

app.Run();
