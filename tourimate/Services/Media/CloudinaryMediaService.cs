using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;
using TouriMate.Services.Abstractions;

namespace TouriMate.Services.Media;

public sealed class CloudinaryOptions
{
    public string CloudName { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string ApiSecret { get; set; } = string.Empty;
    public string DefaultFolder { get; set; } = "tourimate";
}

public sealed class CloudinaryMediaService : IMediaService
{
    private readonly Cloudinary _cloudinary;
    private readonly CloudinaryOptions _options;

    public CloudinaryMediaService(IOptions<CloudinaryOptions> options)
    {
        _options = options.Value;
        _cloudinary = new Cloudinary(new Account(_options.CloudName, _options.ApiKey, _options.ApiSecret));
        _cloudinary.Api.Secure = true;
    }

    public async Task<string> UploadAsync(Stream fileStream, string fileName, string? folder = null, CancellationToken cancellationToken = default)
    {
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, fileStream),
            Folder = string.IsNullOrWhiteSpace(folder) ? _options.DefaultFolder : folder,
            UseFilename = true,
            UniqueFilename = true,
            Overwrite = false
        };

        var result = await _cloudinary.UploadAsync(uploadParams, cancellationToken);
        if (result.Error != null)
        {
            throw new InvalidOperationException(result.Error.Message);
        }
        return result.SecureUrl?.ToString() ?? result.Url?.ToString() ?? string.Empty;
    }
}


