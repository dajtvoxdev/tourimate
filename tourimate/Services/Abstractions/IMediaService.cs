namespace TouriMate.Services.Abstractions;

public interface IMediaService
{
    Task<string> UploadAsync(Stream fileStream, string fileName, string? folder = null, CancellationToken cancellationToken = default);
}


