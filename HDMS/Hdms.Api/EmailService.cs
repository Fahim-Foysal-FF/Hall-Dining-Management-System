using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using MimeKit;
using QRCoder;

public class EmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendTokenQrEmailAsync(string toEmail, string userName, int tokenId, DateTime date, string mealType, decimal price, Guid tokenUid, string? mealPreference)
    {
        try
        {
            var emailSettings = _config.GetSection("Email");
            var smtpServer = emailSettings["SmtpServer"];
            var smtpPort = emailSettings["Port"];
            var smtpUser = emailSettings["Username"];
            var smtpPass = emailSettings["Password"];
            if (string.IsNullOrWhiteSpace(smtpServer) || string.IsNullOrWhiteSpace(smtpPort) || string.IsNullOrWhiteSpace(smtpUser) || string.IsNullOrWhiteSpace(smtpPass))
            {
                throw new InvalidOperationException("Email settings are missing (SmtpServer/Port/Username/Password).");
            }

            // Generate QR code
            using var qrGenerator = new QRCodeGenerator();
            var qrCodeData = qrGenerator.CreateQrCode(tokenUid.ToString(), QRCodeGenerator.ECCLevel.Q);
            var qrCode = new PngByteQRCode(qrCodeData);
            var qrCodeBytes = qrCode.GetGraphic(20);

            // Create email
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(emailSettings["FromName"], emailSettings["FromEmail"]));
            message.To.Add(new MailboxAddress(userName, toEmail));
            message.Subject = "Your HDMS Meal Token QR Code";

            var bodyBuilder = new BodyBuilder();
                        bodyBuilder.TextBody = $@"
Dear {userName},

Thank you for purchasing a meal token!

Token Details:
- Token UID: {tokenUid}
- Token ID: {tokenId}
- Date: {date:yyyy-MM-dd}
- Meal: {mealType}
- Price: {price:C}
{(string.IsNullOrEmpty(mealPreference) ? "" : $"- Meal Preference: {mealPreference}\n")}

Please present this QR code at the dining hall for redemption.

Best regards,
HDMS System
";

            // Attach QR code
            bodyBuilder.Attachments.Add("token_qr.png", qrCodeBytes, ContentType.Parse("image/png"));

            message.Body = bodyBuilder.ToMessageBody();

            // Send email
            using var client = new SmtpClient();
            await client.ConnectAsync(smtpServer, int.Parse(smtpPort), SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(smtpUser, smtpPass);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Token QR email sent to {Email} for token {TokenId}", toEmail, tokenId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Token QR email send failed to {Email}", toEmail);
        }
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string userName, string resetToken, string userId)
    {
        try
        {
            var emailSettings = _config.GetSection("Email");
            var smtpServer = emailSettings["SmtpServer"];
            var smtpPort = emailSettings["Port"];
            var smtpUser = emailSettings["Username"];
            var smtpPass = emailSettings["Password"];
            if (string.IsNullOrWhiteSpace(smtpServer) || string.IsNullOrWhiteSpace(smtpPort) || string.IsNullOrWhiteSpace(smtpUser) || string.IsNullOrWhiteSpace(smtpPass))
            {
                throw new InvalidOperationException("Email settings are missing (SmtpServer/Port/Username/Password).");
            }

            // Build reset link using configured frontend URL so emails work outside localhost
            var frontendUrl = _config.GetValue<string>("AppSettings:FrontendUrl") ?? "http://localhost:5174";
            var resetLink = $"{frontendUrl.TrimEnd('/')}/reset-password?token={Uri.EscapeDataString(resetToken)}&userId={Uri.EscapeDataString(userId)}";

            // Create email
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(emailSettings["FromName"], emailSettings["FromEmail"]));
            message.To.Add(new MailboxAddress(userName, toEmail));
            message.Subject = "HDMS Password Reset";

            var bodyBuilder = new BodyBuilder();
            bodyBuilder.TextBody = $@"
Dear {userName},

You have requested to reset your password for your HDMS account.

Please click the following link to reset your password:
{resetLink}

This link will expire in 24 hours.

If you did not request this password reset, please ignore this email.

Best regards,
HDMS System
";

            message.Body = bodyBuilder.ToMessageBody();

            // Send email
            using var client = new SmtpClient();
            await client.ConnectAsync(smtpServer, int.Parse(smtpPort), SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(smtpUser, smtpPass);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Password reset email send failed to {Email}", toEmail);
        }
    }

    public async Task SendLowPurchaseAlertAsync(string toEmail, string userName, int year, int month, int purchased, int remaining)
    {
        try
        {
            var emailSettings = _config.GetSection("Email");
            var smtpServer = emailSettings["SmtpServer"];
            var smtpPort = emailSettings["Port"];
            var smtpUser = emailSettings["Username"];
            var smtpPass = emailSettings["Password"];
            if (string.IsNullOrWhiteSpace(smtpServer) || string.IsNullOrWhiteSpace(smtpPort) || string.IsNullOrWhiteSpace(smtpUser) || string.IsNullOrWhiteSpace(smtpPass))
            {
                throw new InvalidOperationException("Email settings are missing (SmtpServer/Port/Username/Password).");
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(emailSettings["FromName"], emailSettings["FromEmail"]));
            message.To.Add(new MailboxAddress(userName, toEmail));
            message.Subject = $"HDMS monthly tokens reminder ({year}-{month:00})";

            var bodyBuilder = new BodyBuilder();
            bodyBuilder.TextBody = $@"
Dear {userName},

Our records show you have purchased {purchased} token(s) for {year}-{month:00} and have {remaining} remaining under the current monthly allowance.

We are in the final 10 days of the month. If you still need meals for this month, please purchase the remaining tokens before the daily cutoffs.

Thanks,
HDMS Team
";

            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(smtpServer, int.Parse(smtpPort), SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(smtpUser, smtpPass);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Low purchase email send failed to {Email}", toEmail);
        }
    }

    public async Task SendComplaintConfirmationEmailAsync(string toEmail, string userName, string trackId, string title)
    {
        try
        {
            var emailSettings = _config.GetSection("Email");
            var smtpServer = emailSettings["SmtpServer"];
            var smtpPort = emailSettings["Port"];
            var smtpUser = emailSettings["Username"];
            var smtpPass = emailSettings["Password"];
            if (string.IsNullOrWhiteSpace(smtpServer) || string.IsNullOrWhiteSpace(smtpPort) || string.IsNullOrWhiteSpace(smtpUser) || string.IsNullOrWhiteSpace(smtpPass))
            {
                throw new InvalidOperationException("Email settings are missing (SmtpServer/Port/Username/Password).");
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(emailSettings["FromName"], emailSettings["FromEmail"]));
            message.To.Add(new MailboxAddress(userName, toEmail));
            message.Subject = $"Complaint Received - Track ID: {trackId}";

            var bodyBuilder = new BodyBuilder();
            bodyBuilder.HtmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #667eea; color: white; padding: 20px; border-radius: 5px; }}
        .track-id {{ background-color: #f0f0f0; padding: 15px; margin: 20px 0; border-left: 4px solid #667eea; }}
        .track-id-label {{ font-size: 12px; color: #666; }}
        .track-id-value {{ font-size: 24px; font-weight: bold; color: #667eea; margin-top: 5px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h2>Complaint Received</h2>
        </div>
        
        <p>Dear {userName},</p>
        
        <p>Thank you for submitting your complaint. We have received it and will review it shortly.</p>
        
        <div class=""track-id"">
            <div class=""track-id-label"">Your Complaint Track ID:</div>
            <div class=""track-id-value"">{trackId}</div>
        </div>
        
        <p><strong>Complaint Title:</strong> {title}</p>
        
        <p>You can use the track ID above to check the status of your complaint at any time. Our admin team will contact you with updates via email.</p>
        
        <p>If you have any questions, please don't hesitate to reach out to us.</p>
        
        <p>Best regards,<br/>HDMS System</p>
    </div>
</body>
</html>";

            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(smtpServer, int.Parse(smtpPort), SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(smtpUser, smtpPass);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Complaint confirmation email sent to {Email} with track ID {TrackId}", toEmail, trackId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Complaint confirmation email send failed to {Email}", toEmail);
            throw;
        }
    }

    public async Task SendComplaintResponseEmailAsync(string toEmail, string userName, string trackId, string title, string status, string? adminResponse)
    {
        try
        {
            var emailSettings = _config.GetSection("Email");
            var smtpServer = emailSettings["SmtpServer"];
            var smtpPort = emailSettings["Port"];
            var smtpUser = emailSettings["Username"];
            var smtpPass = emailSettings["Password"];
            if (string.IsNullOrWhiteSpace(smtpServer) || string.IsNullOrWhiteSpace(smtpPort) || string.IsNullOrWhiteSpace(smtpUser) || string.IsNullOrWhiteSpace(smtpPass))
            {
                throw new InvalidOperationException("Email settings are missing (SmtpServer/Port/Username/Password).");
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(emailSettings["FromName"], emailSettings["FromEmail"]));
            message.To.Add(new MailboxAddress(userName, toEmail));
            message.Subject = $"Complaint Update - Track ID: {trackId}";

            var statusColor = status == "Resolved" ? "#10b981" : status == "In Progress" ? "#3b82f6" : "#f59e0b";
            var responseHtml = string.IsNullOrWhiteSpace(adminResponse) 
                ? "" 
                : $@"
        <div class=""response-box"">
            <div class=""response-label"">Admin Response:</div>
            <div class=""response-content"">{adminResponse}</div>
        </div>";

            var bodyBuilder = new BodyBuilder();
            bodyBuilder.HtmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #667eea; color: white; padding: 20px; border-radius: 5px; }}
        .status-badge {{ display: inline-block; padding: 8px 16px; background-color: {statusColor}; color: white; border-radius: 4px; font-weight: bold; margin: 15px 0; }}
        .track-id {{ background-color: #f0f0f0; padding: 15px; margin: 20px 0; border-left: 4px solid #667eea; }}
        .track-id-label {{ font-size: 12px; color: #666; }}
        .track-id-value {{ font-size: 20px; font-weight: bold; color: #667eea; margin-top: 5px; }}
        .response-box {{ background-color: #f9fafb; padding: 15px; margin: 20px 0; border-radius: 5px; border: 1px solid #e5e7eb; }}
        .response-label {{ font-size: 12px; color: #666; font-weight: bold; margin-bottom: 8px; }}
        .response-content {{ color: #374151; line-height: 1.6; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h2>Complaint Update</h2>
        </div>
        
        <p>Dear {userName},</p>
        
        <p>Your complaint has been updated by our admin team.</p>
        
        <div class=""track-id"">
            <div class=""track-id-label"">Track ID:</div>
            <div class=""track-id-value"">{trackId}</div>
        </div>
        
        <p><strong>Complaint Title:</strong> {title}</p>
        
        <div>
            <strong>New Status:</strong>
            <div class=""status-badge"">{status}</div>
        </div>
        {responseHtml}
        
        <p>You can check your complaint status anytime using the track ID above.</p>
        
        <p>Thank you for your patience.</p>
        
        <p>Best regards,<br/>HDMS Admin Team</p>
    </div>
</body>
</html>";

            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(smtpServer, int.Parse(smtpPort), SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(smtpUser, smtpPass);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Complaint response email sent to {Email} for track ID {TrackId}", toEmail, trackId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Complaint response email send failed to {Email}", toEmail);
            throw;
        }
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        try
        {
            var emailSettings = _config.GetSection("Email");
            var smtpServer = emailSettings["SmtpServer"];
            var smtpPort = emailSettings["Port"];
            var smtpUser = emailSettings["Username"];
            var smtpPass = emailSettings["Password"];
            if (string.IsNullOrWhiteSpace(smtpServer) || string.IsNullOrWhiteSpace(smtpPort) || string.IsNullOrWhiteSpace(smtpUser) || string.IsNullOrWhiteSpace(smtpPass))
            {
                throw new InvalidOperationException("Email settings are missing (SmtpServer/Port/Username/Password).");
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(emailSettings["FromName"], emailSettings["FromEmail"]));
            message.To.Add(new MailboxAddress(toEmail, toEmail));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = htmlBody
            };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(smtpServer, int.Parse(smtpPort), SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(smtpUser, smtpPass);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Generic email sent to {Email} with subject {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Generic email send failed to {Email}", toEmail);
            throw;
        }
    }
}