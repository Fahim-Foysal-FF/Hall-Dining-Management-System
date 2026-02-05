using System.Text;
using System.Text.Json;

namespace Hdms.Api.Services
{
    public class SSLCommerzService
    {
        private readonly string _storeId;
        private readonly string _storePassword;
        private readonly string _sandboxUrl = "https://sandbox.sslcommerz.com";
        private readonly HttpClient _httpClient;

        public SSLCommerzService(IConfiguration configuration, HttpClient httpClient)
        {
            _storeId = configuration["SSLCommerz:StoreId"] ?? "";
            _storePassword = configuration["SSLCommerz:StorePassword"] ?? "";
            _httpClient = httpClient;
        }

        public async Task<SSLCommerzResponse> InitiatePayment(PaymentRequest request)
        {
            var payload = new Dictionary<string, string>
            {
                { "store_id", _storeId },
                { "store_passwd", _storePassword },
                { "total_amount", request.Amount.ToString("F2") },
                { "currency", "BDT" },
                { "tran_id", request.TransactionId },
                { "success_url", request.SuccessUrl },
                { "fail_url", request.FailUrl },
                { "cancel_url", request.CancelUrl },
                { "ipn_url", request.IpnUrl },
                { "cus_name", request.CustomerName },
                { "cus_email", request.CustomerEmail },
                { "cus_phone", request.CustomerPhone },
                { "cus_add1", request.CustomerAddress ?? "N/A" },
                { "cus_city", request.CustomerCity ?? "Dhaka" },
                { "cus_country", "Bangladesh" },
                { "product_name", request.ProductName },
                { "product_category", request.ProductCategory },
                { "product_profile", "general" },
                { "shipping_method", "NO" },
                { "num_of_item", "1" }
            };

            var content = new FormUrlEncodedContent(payload);
            var response = await _httpClient.PostAsync($"{_sandboxUrl}/gwprocess/v4/api.php", content);
            var responseBody = await response.Content.ReadAsStringAsync();

            try
            {
                var result = JsonSerializer.Deserialize<SSLCommerzResponse>(responseBody, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return result ?? new SSLCommerzResponse { Status = "FAILED", FailedReason = "Invalid response from payment gateway" };
            }
            catch (Exception ex)
            {
                return new SSLCommerzResponse
                {
                    Status = "FAILED",
                    FailedReason = $"Failed to parse response: {ex.Message}"
                };
            }
        }

        public async Task<PaymentValidationResponse> ValidatePayment(string valId)
        {
            var url = $"{_sandboxUrl}/validator/api/validationserverAPI.php?val_id={valId}&store_id={_storeId}&store_passwd={_storePassword}&format=json";
            
            var response = await _httpClient.GetAsync(url);
            var responseBody = await response.Content.ReadAsStringAsync();

            try
            {
                var result = JsonSerializer.Deserialize<PaymentValidationResponse>(responseBody, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return result ?? new PaymentValidationResponse { Status = "INVALID" };
            }
            catch
            {
                return new PaymentValidationResponse { Status = "INVALID" };
            }
        }
    }

    public class PaymentRequest
    {
        public string TransactionId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string SuccessUrl { get; set; } = string.Empty;
        public string FailUrl { get; set; } = string.Empty;
        public string CancelUrl { get; set; } = string.Empty;
        public string IpnUrl { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string? CustomerAddress { get; set; }
        public string? CustomerCity { get; set; }
        public string ProductName { get; set; } = "Wallet Top-up";
        public string ProductCategory { get; set; } = "Wallet";
    }

    public class SSLCommerzResponse
    {
        public string Status { get; set; } = string.Empty;
        public string? FailedReason { get; set; }
        public string? GatewayPageURL { get; set; }
        public string? SessionKey { get; set; }
    }

    public class PaymentValidationResponse
    {
        public string Status { get; set; } = string.Empty;
        public string? TranId { get; set; }
        public string? ValId { get; set; }
        public decimal Amount { get; set; }
        public string? CardType { get; set; }
        public string? CardNo { get; set; }
        public string? BankTranId { get; set; }
        public string? TranDate { get; set; }
        public string? Currency { get; set; }
    }
}
