# SSLCOMMERZ Payment Integration Guide

## Overview
This guide explains the SSLCOMMERZ Sandbox payment integration for automated wallet top-ups and the enhanced QR code scanning with 5-second display.

## Features Implemented

### 1. SSLCOMMERZ Payment Gateway Integration
- **Automated Wallet Top-up**: Students can now top-up their wallets using SSLCOMMERZ payment gateway (Sandbox mode)
- **Secure Payment Processing**: Integrated with SSLCOMMERZ's secure payment infrastructure
- **Multiple Payment Methods**: Supports all payment methods available in SSLCOMMERZ (cards, mobile banking, etc.)
- **Real-time Validation**: Immediate payment validation via IPN (Instant Payment Notification)

### 2. Enhanced QR Code Scanner
- **5-Second Display**: After successful QR scan, details are displayed for 5 seconds
- **Auto-resume**: Scanner automatically resumes after displaying success/error messages
- **Pause Indicator**: Visual feedback when scanner is paused
- **Improved UX**: Better visual feedback with icons and status indicators

---

## Backend Changes

### New Files Created

#### 1. **Services/SSLCommerzService.cs**
Custom SSLCOMMERZ integration service that handles:
- Payment initialization
- Payment validation
- Communication with SSLCOMMERZ API endpoints

**Key Methods:**
```csharp
InitiatePayment(PaymentRequest) → SSLCommerzResponse
ValidatePayment(string valId) → PaymentValidationResponse
```

#### 2. **Controllers/PaymentController.cs**
RESTful API endpoints for payment operations:

**Endpoints:**
- `POST /api/payment/initiate` - Start payment process
- `POST /api/payment/ipn` - Handle IPN from SSLCOMMERZ
- `GET /api/payment/success` - Handle successful payment redirect
- `GET /api/payment/fail` - Handle failed payment redirect
- `GET /api/payment/cancel` - Handle cancelled payment redirect
- `GET /api/payment/status/{tranId}` - Check transaction status

### Modified Files

#### **Program.cs**
Added service registration:
```csharp
builder.Services.AddHttpClient<Hdms.Api.Services.SSLCommerzService>();
builder.Services.AddScoped<Hdms.Api.Services.SSLCommerzService>();
```

#### **appsettings.Development.json**
Added SSLCOMMERZ configuration:
```json
{
  "SSLCommerz": {
    "StoreId": "testbox",
    "StorePassword": "qwerty"
  },
  "AppSettings": {
    "FrontendUrl": "http://localhost:5173"
  }
}
```

---

## Frontend Changes

### New Files Created

#### **api/paymentApi.js**
API wrapper for payment operations:
```javascript
initiatePayment(amount) → { gatewayUrl, sessionKey, transactionId }
getPaymentStatus(tranId) → { transactionId, amount, status }
```

### Modified Files

#### **pages/Student/Wallet.jsx**
Enhanced wallet page with:
- Top-up amount input
- SSLCOMMERZ payment button
- Payment status handling (success/fail/cancel)
- Improved transaction history display
- Real-time balance updates

**New Features:**
- Input validation (1-10000 BDT)
- Loading states during payment initiation
- Auto-refresh after successful payment
- Status badges for transaction types

#### **pages/Admin/AdminScan.jsx**
Enhanced QR scanner with:
- 5-second display after successful scan
- Auto-pause/resume functionality
- Visual pause indicator
- Improved success/error messaging
- Better icon feedback

**New State Variables:**
```javascript
const [scanPaused, setScanPaused] = useState(false);
const scanTimeoutRef = useRef(null);
```

---

## Payment Flow

### 1. Initiate Payment
```
Student → Enter Amount → Click "Pay with SSLCOMMERZ"
  ↓
Frontend: POST /api/payment/initiate { amount }
  ↓
Backend: Generate transaction ID
  ↓
Backend: Call SSLCOMMERZ API
  ↓
Backend: Return gateway URL
  ↓
Frontend: Redirect to SSLCOMMERZ payment page
```

### 2. Payment Processing
```
Student completes payment on SSLCOMMERZ
  ↓
SSLCOMMERZ sends IPN to /api/payment/ipn
  ↓
Backend validates payment with SSLCOMMERZ
  ↓
Backend updates wallet balance
  ↓
Backend updates transaction status
  ↓
SSLCOMMERZ redirects student to success URL
```

### 3. Success Handling
```
Student redirected to /student/wallet?payment=success
  ↓
Frontend displays success message
  ↓
Wallet balance automatically refreshed
  ↓
Transaction appears in history
```

---

## QR Scanner Flow (Enhanced)

### Successful Scan
```
QR Code Detected
  ↓
Scanner paused (scanPaused = true)
  ↓
Token redemption API call
  ↓
Display success message with token details
  ↓
Wait 5 seconds
  ↓
Clear message and details
  ↓
Resume scanner (scanPaused = false)
```

### Failed Scan
```
QR Code Detected
  ↓
Scanner paused
  ↓
Token redemption fails
  ↓
Display error message
  ↓
Wait 3 seconds
  ↓
Resume scanner
```

---

## Configuration

### SSLCOMMERZ Sandbox Credentials

**Default Test Credentials:**
- Store ID: `testbox`
- Store Password: `qwerty`
- Gateway URL: `https://sandbox.sslcommerz.com`

**Test Cards for Sandbox:**
- Visa: `4111111111111111`
- Mastercard: `5500000000000004`
- CVV: Any 3 digits
- Expiry: Any future date

### Environment Variables

Update `appsettings.Development.json` (or `appsettings.json` for production):

```json
{
  "SSLCommerz": {
    "StoreId": "YOUR_STORE_ID",
    "StorePassword": "YOUR_STORE_PASSWORD"
  },
  "AppSettings": {
    "FrontendUrl": "http://localhost:5173"
  }
}
```

**For Production:**
- Register at https://sslcommerz.com
- Get production credentials
- Update configuration
- Change sandbox URL to production URL in `SSLCommerzService.cs`

---

## Testing Guide

### 1. Test Wallet Top-up

**Steps:**
1. Login as student
2. Navigate to "Wallet" page
3. Enter amount (e.g., 500)
4. Click "Pay with SSLCOMMERZ"
5. You'll be redirected to SSLCOMMERZ sandbox
6. Use test card details
7. Complete payment
8. You'll be redirected back with success message
9. Verify balance updated
10. Check transaction history

**Expected Results:**
- ✅ Payment gateway opens in new window/redirect
- ✅ Test payment completes successfully
- ✅ Wallet balance increases by payment amount
- ✅ Transaction appears in history with "TOPUP" status
- ✅ Success message displays for 5 seconds

### 2. Test QR Scanner (5-second display)

**Steps:**
1. Login as admin
2. Navigate to "QR Scanner"
3. Allow camera permissions
4. Scan a valid token QR code
5. Observe success message and token details
6. Wait and observe auto-resume after 5 seconds

**Expected Results:**
- ✅ Scanner displays "Processing..." immediately
- ✅ Success message appears with checkmark icon
- ✅ Token details displayed on right panel
- ✅ "Scanner paused" indicator shows
- ✅ After 5 seconds, message clears
- ✅ Scanner automatically resumes
- ✅ Can scan next token

### 3. Test Payment Failures

**Failed Payment:**
- Click cancel on SSLCOMMERZ page
- Verify redirect to `/student/wallet?payment=cancelled`
- Check "Payment was cancelled" message appears

**Network Errors:**
- Disconnect internet before initiating payment
- Verify error message appears
- Verify transaction not created in database

---

## API Reference

### POST /api/payment/initiate

**Authorization:** Required (JWT)

**Request Body:**
```json
{
  "amount": 500.00
}
```

**Response (Success):**
```json
{
  "success": true,
  "gatewayUrl": "https://sandbox.sslcommerz.com/gwprocess/v4/...",
  "sessionKey": "...",
  "transactionId": "TOPUP-12345678-637..."
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Failed to initiate payment"
}
```

### POST /api/payment/ipn

**Authorization:** None (called by SSLCOMMERZ)

**Request (Form Data):**
```
tran_id: TOPUP-12345678-637...
val_id: 2001011234567890
amount: 500.00
card_type: VISA-Brac
status: VALID
...
```

**Response:**
```
IPN processed successfully
```

### GET /api/payment/status/{tranId}

**Authorization:** Required (JWT)

**Response:**
```json
{
  "transactionId": "TOPUP-12345678-637...",
  "amount": 500.00,
  "status": "TOPUP",
  "description": "Wallet top-up completed via SSLCOMMERZ",
  "createdAt": "2025-12-30T10:30:00Z"
}
```

---

## Database Changes

### WalletTransactions Table

**New Transaction Types:**
- `TOPUP_PENDING` - Payment initiated but not confirmed
- `TOPUP` - Payment confirmed and balance updated

**Transaction Flow:**
1. Payment initiated → `TOPUP_PENDING` record created
2. IPN received → Record updated to `TOPUP`, balance increased
3. If payment fails → Record remains `TOPUP_PENDING` (can be cleaned up)

**Example Records:**
```
Id | UserId | Amount | Type          | Ref                    | Description
---|--------|--------|---------------|------------------------|-------------
1  | abc... | 500.00 | TOPUP        | TOPUP-abc12345-637...  | Wallet top-up completed via SSLCOMMERZ
2  | def... | 300.00 | TOPUP_PENDING| TOPUP-def67890-638...  | Wallet top-up initiated via SSLCOMMERZ
```

---

## Security Considerations

### 1. Payment Validation
- All payments validated via SSLCOMMERZ API before updating balance
- Double verification: IPN callback + success redirect
- Transaction IDs include user ID and timestamp (unique)

### 2. Amount Limits
- Minimum: ৳1.00
- Maximum: ৳10,000.00
- Validation on both frontend and backend

### 3. CORS Configuration
- Only allowed origins can initiate payments
- IPN endpoint is public but validates with SSLCOMMERZ

### 4. Transaction Safety
- Database transactions used for balance updates
- Rollback on any error
- Duplicate payment prevention via transaction ID

---

## Troubleshooting

### Issue: Payment gateway not opening

**Solution:**
- Check SSLCOMMERZ credentials in appsettings.json
- Verify internet connection
- Check browser console for errors
- Ensure popup blocker is disabled

### Issue: Balance not updating after payment

**Solutions:**
1. Check if IPN was received:
   - Look for `TOPUP_PENDING` → `TOPUP` status change
   - Check backend logs for IPN processing

2. Verify SSLCOMMERZ can reach your IPN URL:
   - For localhost, use ngrok or similar tunnel
   - Update IPN URL in payment initiation

3. Check database transaction:
   - Query WalletTransactions for transaction ID
   - Verify user balance in AspNetUsers table

### Issue: QR scanner not resuming after 5 seconds

**Solutions:**
- Check browser console for timeout errors
- Verify scanTimeoutRef is not null
- Ensure component is not unmounting during timeout
- Clear any previous timeouts before setting new one

### Issue: "Failed to initiate payment" error

**Solutions:**
- Verify SSLCOMMERZ credentials are correct
- Check amount is within limits (1-10000)
- Verify user is authenticated (JWT token valid)
- Check backend API logs for detailed error

---

## Production Deployment Checklist

### Backend
- [ ] Update SSLCOMMERZ credentials to production values
- [ ] Change sandbox URL to production URL in SSLCommerzService.cs
- [ ] Update FrontendUrl in appsettings.json to production URL
- [ ] Ensure IPN URL is publicly accessible
- [ ] Set up SSL/HTTPS for all endpoints
- [ ] Configure proper logging for payment transactions
- [ ] Set up monitoring/alerts for failed payments

### Frontend
- [ ] Update base URL in axiosClient.js
- [ ] Test payment flow in production environment
- [ ] Verify redirect URLs work correctly
- [ ] Test on multiple browsers
- [ ] Verify mobile responsiveness

### SSLCOMMERZ Portal
- [ ] Register production account
- [ ] Complete merchant verification
- [ ] Configure IPN/webhook URLs
- [ ] Set up success/fail/cancel URLs
- [ ] Test with production credentials
- [ ] Enable desired payment methods

---

## Support & Resources

### SSLCOMMERZ Documentation
- Integration Guide: https://developer.sslcommerz.com/
- API Reference: https://developer.sslcommerz.com/doc/v4/
- Sandbox Testing: https://developer.sslcommerz.com/registration/

### Internal Documentation
- See `IMPLEMENTATION_SUMMARY.md` for technical details
- See `FEATURES_GUIDE.md` for user documentation
- See `TESTING_CHECKLIST.md` for testing procedures

### Contact
For issues or questions:
- Check backend logs: `Hdms.Api/logs/`
- Check browser console for frontend errors
- Review SSLCOMMERZ transaction dashboard

---

## Changelog

### Version 1.0.0 (December 30, 2025)

**Added:**
- SSLCOMMERZ Sandbox payment integration
- Automated wallet top-up functionality
- Payment validation via IPN
- 5-second display after successful QR scan
- Auto-pause/resume for QR scanner
- Enhanced wallet page UI
- Transaction status badges
- Payment success/fail/cancel handling

**Modified:**
- Wallet.jsx - Added top-up interface
- AdminScan.jsx - Added 5-second display timer
- Program.cs - Added SSLCommerzService registration
- appsettings.Development.json - Added payment configuration

**Fixed:**
- QR scanner continuous scanning issue
- Payment redirect handling
- Transaction type display in wallet history

---

**Last Updated:** December 30, 2025  
**Status:** Production Ready (Sandbox Mode)
