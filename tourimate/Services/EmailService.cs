using System.Net;
using System.Net.Mail;
using System.Text;

namespace TouriMate.Services
{
    public interface IEmailService
    {
        Task<bool> SendTourGuideApplicationStatusEmailAsync(string toEmail, string toName, string status, string feedback = null);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> SendTourGuideApplicationStatusEmailAsync(string toEmail, string toName, string status, string? feedback = null)
        {
            try
            {
                // Validate email address
                if (string.IsNullOrWhiteSpace(toEmail))
                {
                    _logger.LogWarning("Email address is null or empty, cannot send notification");
                    return false;
                }

                var sendGridConfig = _configuration.GetSection("ExternalServices:SendGrid");
                var apiKey = sendGridConfig["ApiKey"];
                var fromEmail = sendGridConfig["FromEmail"];
                var fromName = sendGridConfig["FromName"];

                if (string.IsNullOrEmpty(apiKey))
                {
                    _logger.LogWarning("SendGrid API key not configured");
                    return false;
                }

                if (string.IsNullOrEmpty(fromEmail))
                {
                    _logger.LogWarning("From email not configured");
                    return false;
                }

                var subject = GetSubjectForStatus(status);
                var htmlContent = GenerateHtmlEmail(toName, status, feedback);

                // Create the email message
                var message = new MailMessage
                {
                    From = new MailAddress(fromEmail!, fromName),
                    Subject = subject,
                    Body = htmlContent,
                    IsBodyHtml = true
                };

                message.To.Add(toEmail);

                // For now, we'll use SMTP instead of SendGrid API to keep it simple
                // You can replace this with SendGrid's .NET SDK later if needed
                using var smtpClient = new SmtpClient("smtp.sendgrid.net", 587);
                smtpClient.Credentials = new NetworkCredential("apikey", apiKey);
                smtpClient.EnableSsl = true;

                await smtpClient.SendMailAsync(message);
                
                _logger.LogInformation($"Email sent successfully to {toEmail} for status {status}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send email to {toEmail}");
                return false;
            }
        }

        private string GetSubjectForStatus(string status)
        {
            return status.ToLower() switch
            {
                "approved" => "🎉 Chúc mừng! Đơn đăng ký hướng dẫn viên của bạn đã được phê duyệt",
                "rejected" => "Thông báo về đơn đăng ký hướng dẫn viên",
                "allow_edit" => "Yêu cầu cập nhật thông tin đơn đăng ký hướng dẫn viên",
                _ => "Cập nhật trạng thái đơn đăng ký hướng dẫn viên"
            };
        }

        private string GenerateHtmlEmail(string toName, string status, string? feedback)
        {
            var statusInfo = GetStatusInfo(status);
            var actionButton = GetActionButton(status);

            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Thông báo từ TouriMate</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }}
        .container {{
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .logo {{
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }}
        .status-badge {{
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            margin: 20px 0;
        }}
        .status-approved {{
            background-color: #dcfce7;
            color: #166534;
        }}
        .status-rejected {{
            background-color: #fee2e2;
            color: #991b1b;
        }}
        .status-allow-edit {{
            background-color: #dbeafe;
            color: #1e40af;
        }}
        .feedback-section {{
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
        }}
        .action-button {{
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
        }}
        .footer {{
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <div class='logo'>🏖️ TouriMate</div>
            <p>Nền tảng du lịch hàng đầu Việt Nam</p>
        </div>

        <h2>Xin chào {toName}!</h2>
        
        <p>Chúng tôi muốn thông báo về trạng thái đơn đăng ký hướng dẫn viên của bạn:</p>
        
        <div class='status-badge status-{status.ToLower()}'>
            {statusInfo.Icon} {statusInfo.Title}
        </div>
        
        <p>{statusInfo.Description}</p>
        
        {(!string.IsNullOrEmpty(feedback) ? $@"
        <div class='feedback-section'>
            <h3>📝 Phản hồi từ ban quản trị:</h3>
            <p style='font-style: italic;'>""{feedback}""</p>
        </div>
        " : "")}
        
        {actionButton}
        
        <div class='footer'>
            <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.</p>
            <p>© 2024 TouriMate. Tất cả quyền được bảo lưu.</p>
        </div>
    </div>
</body>
</html>";
        }

        private (string Icon, string Title, string Description) GetStatusInfo(string status)
        {
            return status.ToLower() switch
            {
                "approved" => ("🎉", "Đã được phê duyệt", "Chúc mừng! Đơn đăng ký hướng dẫn viên của bạn đã được phê duyệt. Bạn giờ đây đã trở thành một hướng dẫn viên chính thức của TouriMate và có thể bắt đầu tạo các tour của mình."),
                "rejected" => ("❌", "Bị từ chối", "Rất tiếc, đơn đăng ký hướng viên của bạn chưa đạt yêu cầu. Vui lòng xem phản hồi bên dưới và có thể nộp đơn lại sau khi đã hoàn thiện các yêu cầu còn thiếu."),
                "allow_edit" => ("✏️", "Yêu cầu chỉnh sửa", "Chúng tôi cần bạn cập nhật một số thông tin trong đơn đăng ký. Vui lòng đăng nhập vào tài khoản và chỉnh sửa theo phản hồi bên dưới."),
                _ => ("📋", "Cập nhật trạng thái", "Trạng thái đơn đăng ký của bạn đã được cập nhật.")
            };
        }

        private string GetActionButton(string status)
        {
            return status.ToLower() switch
            {
                "approved" => @"<div style='text-align: center;'>
                    <a href='https://localhost:8080/create-tour' class='action-button'>🚀 Tạo Tour Đầu Tiên</a>
                </div>",
                "rejected" => @"<div style='text-align: center;'>
                    <a href='https://localhost:8080/tour-guide-registration' class='action-button'>📝 Nộp Lại Đơn Đăng Ký</a>
                </div>",
                "allow_edit" => @"<div style='text-align: center;'>
                    <a href='https://localhost:8080/tour-guide-registration' class='action-button'>✏️ Chỉnh Sửa Đơn Đăng Ký</a>
                </div>",
                _ => ""
            };
        }
    }
}
