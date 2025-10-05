using FirebaseAdmin;
using FirebaseAdmin.Auth;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Configuration;
using TouriMate.Services.Abstractions;

namespace TouriMate.Services;

public interface IFirebaseAuthService
{
    Task<string> VerifyIdTokenAsync(string idToken);
    Task<UserRecord> GetUserAsync(string uid);
}

public class FirebaseAuthService : IFirebaseAuthService
{
    private readonly FirebaseAuth _firebaseAuth;

    public FirebaseAuthService(IConfiguration configuration)
    {
        if (FirebaseApp.DefaultInstance == null)
        {
            var firebaseConfig = new
            {
                type = "service_account",
                project_id = configuration["Firebase:ProjectId"],
                private_key_id = configuration["Firebase:PrivateKeyId"],
                private_key = configuration["Firebase:PrivateKey"]?.Replace("\\n", "\n"),
                client_email = configuration["Firebase:ClientEmail"],
                client_id = configuration["Firebase:ClientId"],
                auth_uri = "https://accounts.google.com/o/oauth2/auth",
                token_uri = "https://oauth2.googleapis.com/token",
                auth_provider_x509_cert_url = "https://www.googleapis.com/oauth2/v1/certs",
                client_x509_cert_url = $"https://www.googleapis.com/robot/v1/metadata/x509/{configuration["Firebase:ClientEmail"]}"
            };

            var credential = GoogleCredential.FromJson(System.Text.Json.JsonSerializer.Serialize(firebaseConfig));
            FirebaseApp.Create(new AppOptions()
            {
                Credential = credential,
                ProjectId = configuration["Firebase:ProjectId"]
            });
        }

        _firebaseAuth = FirebaseAuth.DefaultInstance;
    }

    public async Task<string> VerifyIdTokenAsync(string idToken)
    {
        try
        {
            var decodedToken = await _firebaseAuth.VerifyIdTokenAsync(idToken);
            return decodedToken.Uid;
        }
        catch (Exception ex)
        {
            throw new UnauthorizedAccessException($"Invalid Firebase ID token: {ex.Message}");
        }
    }

    public async Task<UserRecord> GetUserAsync(string uid)
    {
        try
        {
            return await _firebaseAuth.GetUserAsync(uid);
        }
        catch (Exception ex)
        {
            throw new UnauthorizedAccessException($"Failed to get user: {ex.Message}");
        }
    }
}

