using System.Net;
using System.Net.Mail;
using System.Text;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using TouriMate.Data;
using Entities.Enums;

namespace TouriMate.Services
{
    public interface IEmailService
    {
        Task<bool> SendTourGuideApplicationStatusEmailAsync(string toEmail, string toName, string status, string feedback = null);
        Task<bool> SendAdminNotificationAsync(string subject, string htmlContent);
        Task<bool> SendBookingConfirmationEmailAsync(string toEmail, string toName, string bookingNumber, string tourTitle, DateTime tourDate, decimal amount, string currency = "VND");
        Task<bool> SendOrderConfirmationEmailAsync(string toEmail, string toName, string orderNumber, decimal totalAmount, string currency = "VND", List<OrderItemInfo>? items = null, string? shippingAddress = null);
    }

    public class OrderItemInfo
    {
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public string? Variant { get; set; }
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;
        private readonly TouriMateDbContext _dbContext;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger, TouriMateDbContext dbContext)
        {
            _configuration = configuration;
            _logger = logger;
            _dbContext = dbContext;
        }

        public async Task<bool> SendBookingConfirmationEmailAsync(string toEmail, string toName, string bookingNumber, string tourTitle, DateTime tourDate, decimal amount, string currency = "VND")
        {
            try
            {
                if (string.IsNullOrWhiteSpace(toEmail))
                {
                    _logger.LogWarning("Missing recipient email for booking confirmation {BookingNumber}", bookingNumber);
                    return false;
                }

                var fromEmail = _configuration["SendGrid:FromEmail"];
                var fromName = _configuration["SendGrid:FromName"] ?? "TouriMate";
                var sendGridApiKey = _configuration["SendGrid:ApiKey"];

                if (string.IsNullOrWhiteSpace(fromEmail) || string.IsNullOrWhiteSpace(sendGridApiKey))
                {
                    _logger.LogWarning("Missing email configs for booking confirmation");
                    return false;
                }

                var subject = $"Xác nhận đặt tour thành công - {bookingNumber}";
                var formattedAmount = string.Format(new System.Globalization.CultureInfo("vi-VN"), "{0:C0}", amount) + (currency == "VND" ? string.Empty : $" {currency}");
                var formattedDate = tourDate.ToString("dd/MM/yyyy");

                var htmlContent = $@"
<div style='font-family:Arial,sans-serif;font-size:14px;color:#333'>
  <h2>Xin chào {System.Net.WebUtility.HtmlEncode(toName)},</h2>
  <p>Bạn đã <strong>đặt tour thành công</strong> tại TouriMate.</p>
  <p><strong>Mã đặt tour:</strong> {System.Net.WebUtility.HtmlEncode(bookingNumber)}<br/>
     <strong>Tên tour:</strong> {System.Net.WebUtility.HtmlEncode(tourTitle)}<br/>
     <strong>Ngày khởi hành:</strong> {formattedDate}<br/>
     <strong>Số tiền:</strong> {formattedAmount}
  </p>
  <p>Vui lòng giữ lại email này để đối chiếu khi cần. Chúc bạn có một chuyến đi vui vẻ!</p>
  <p>Trân trọng,<br/>TouriMate</p>
 </div>";

                var message = new MailMessage
                {
                    From = new MailAddress(fromEmail!, fromName),
                    Subject = subject,
                    Body = htmlContent,
                    IsBodyHtml = true
                };
                message.To.Add(toEmail);

                using var smtpClient = new SmtpClient("smtp.sendgrid.net", 587);
                smtpClient.Credentials = new System.Net.NetworkCredential("apikey", sendGridApiKey);
                smtpClient.EnableSsl = true;
                await smtpClient.SendMailAsync(message);

                _logger.LogInformation("Booking confirmation email sent to {Email} for {Booking}", toEmail, bookingNumber);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send booking confirmation email for {Booking}", bookingNumber);
                return false;
            }
        }

        public async Task<bool> SendOrderConfirmationEmailAsync(string toEmail, string toName, string orderNumber, decimal totalAmount, string currency = "VND", List<OrderItemInfo>? items = null, string? shippingAddress = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(toEmail))
                {
                    _logger.LogWarning("Missing recipient email for order confirmation {OrderNumber}", orderNumber);
                    return false;
                }

                var fromEmail = _configuration["SendGrid:FromEmail"];
                var fromName = _configuration["SendGrid:FromName"] ?? "TouriMate";
                var sendGridApiKey = _configuration["SendGrid:ApiKey"];

                if (string.IsNullOrWhiteSpace(fromEmail) || string.IsNullOrWhiteSpace(sendGridApiKey))
                {
                    _logger.LogWarning("Missing email configs for order confirmation");
                    return false;
                }

                var subject = $"Xác nhận đặt hàng thành công - {orderNumber}";
                var formattedAmount = string.Format(new System.Globalization.CultureInfo("vi-VN"), "{0:C0}", totalAmount) + (currency == "VND" ? string.Empty : $" {currency}");

                // Build items list HTML
                var itemsHtml = "";
                if (items != null && items.Any())
                {
                    var itemsList = items.Select(item =>
                    {
                        var itemTotal = item.Price * item.Quantity;
                        var formattedItemTotal = string.Format(new System.Globalization.CultureInfo("vi-VN"), "{0:C0}", itemTotal);
                        var variantText = !string.IsNullOrWhiteSpace(item.Variant) ? $"<br/><span style='color:#666;font-size:12px;'>({System.Net.WebUtility.HtmlEncode(item.Variant)})</span>" : "";
                        return $@"
                        <tr>
                            <td style='padding:8px;border-bottom:1px solid #eee;'>{System.Net.WebUtility.HtmlEncode(item.ProductName)}{variantText}</td>
                            <td style='padding:8px;text-align:center;border-bottom:1px solid #eee;'>{item.Quantity}</td>
                            <td style='padding:8px;text-align:right;border-bottom:1px solid #eee;'>{formattedItemTotal}</td>
                        </tr>";
                    }).ToList();

                    itemsHtml = $@"
                    <table style='width:100%;border-collapse:collapse;margin:20px 0;'>
                        <thead>
                            <tr style='background-color:#f8f9fa;'>
                                <th style='padding:12px;text-align:left;border-bottom:2px solid #ddd;'>Sản phẩm</th>
                                <th style='padding:12px;text-align:center;border-bottom:2px solid #ddd;'>Số lượng</th>
                                <th style='padding:12px;text-align:right;border-bottom:2px solid #ddd;'>Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {string.Join("", itemsList)}
                        </tbody>
                    </table>";
                }

                var shippingHtml = !string.IsNullOrWhiteSpace(shippingAddress) 
                    ? $@"<p><strong>Địa chỉ giao hàng:</strong><br/>{System.Net.WebUtility.HtmlEncode(shippingAddress)}</p>"
                    : "";

                var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Xác nhận đặt hàng</title>
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
        .order-info {{
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
        }}
        .total-amount {{
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background-color: #eff6ff;
            border-radius: 8px;
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

        <h2>Xin chào {System.Net.WebUtility.HtmlEncode(toName)}!</h2>
        
        <p>Bạn đã <strong>đặt hàng thành công</strong> tại TouriMate.</p>
        
        <div class='order-info'>
            <p><strong>Mã đơn hàng:</strong> {System.Net.WebUtility.HtmlEncode(orderNumber)}</p>
            <p><strong>Ngày đặt hàng:</strong> {Entities.Common.TimeProvider.VietnamNow().ToString("dd/MM/yyyy HH:mm")}</p>
        </div>

        <h3>Chi tiết đơn hàng:</h3>
        {itemsHtml}
        
        <div class='total-amount'>
            Tổng tiền: {formattedAmount}
        </div>

        {shippingHtml}

        <p>Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất. Bạn sẽ nhận được thông báo khi đơn hàng được giao.</p>
        
        <p>Vui lòng giữ lại email này để đối chiếu khi cần.</p>
        
        <div class='footer'>
            <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.</p>
            <p>© 2024 TouriMate. Tất cả quyền được bảo lưu.</p>
        </div>
    </div>
</body>
</html>";

                var message = new MailMessage
                {
                    From = new MailAddress(fromEmail!, fromName),
                    Subject = subject,
                    Body = htmlContent,
                    IsBodyHtml = true
                };
                message.To.Add(toEmail);

                using var smtpClient = new SmtpClient("smtp.sendgrid.net", 587);
                smtpClient.Credentials = new System.Net.NetworkCredential("apikey", sendGridApiKey);
                smtpClient.EnableSsl = true;
                await smtpClient.SendMailAsync(message);

                _logger.LogInformation("Order confirmation email sent to {Email} for {Order}", toEmail, orderNumber);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send order confirmation email for {Order}", orderNumber);
                return false;
            }
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

                var sendGridConfig = _configuration.GetSection("SendGrid");
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

        public async Task<bool> SendAdminNotificationAsync(string subject, string htmlContent)
        {
            try
            {
                var sendGridConfig = _configuration.GetSection("SendGrid");
                var apiKey = sendGridConfig["ApiKey"];
                var fromEmail = sendGridConfig["FromEmail"];
                var fromName = sendGridConfig["FromName"];

                if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(fromEmail))
                {
                    _logger.LogWarning("Missing email configs for admin notifications");
                    return false;
                }

                // Get admin email from database
                var adminUser = await _dbContext.Users
                    .Where(u => u.Role == UserRole.Admin && u.IsActive && !u.IsDeleted)
                    .FirstOrDefaultAsync();

                if (adminUser == null || string.IsNullOrWhiteSpace(adminUser.Email))
                {
                    _logger.LogWarning("No active admin user found in database for admin notifications");
                    return false;
                }

                var adminEmail = adminUser.Email;

                var message = new MailMessage
                {
                    From = new MailAddress(fromEmail!, fromName),
                    Subject = subject,
                    Body = htmlContent,
                    IsBodyHtml = true
                };
                message.To.Add(adminEmail);

                using var smtpClient = new SmtpClient("smtp.sendgrid.net", 587);
                smtpClient.Credentials = new NetworkCredential("apikey", apiKey);
                smtpClient.EnableSsl = true;
                await smtpClient.SendMailAsync(message);
                
                _logger.LogInformation("Admin notification email sent to {AdminEmail}", adminEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send admin notification");
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
                    <a href='https://tourimate.site/admin/tour/create' class='action-button'>🚀 Tạo Tour Đầu Tiên</a>
                </div>",
                "rejected" => @"<div style='text-align: center;'>
                    <a href='https://tourimate.site/tour-guide-registration' class='action-button'>📝 Nộp Lại Đơn Đăng Ký</a>
                </div>",
                "allow_edit" => @"<div style='text-align: center;'>
                    <a href='https://tourimate.site/tour-guide-registration' class='action-button'>✏️ Chỉnh Sửa Đơn Đăng Ký</a>
                </div>",
                _ => ""
            };
        }
    }
}
