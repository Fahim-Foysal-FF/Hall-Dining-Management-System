# IPN Tunnel Setup Guide for SSLCOMMERZ Local Testing

## Overview
To enable SSLCOMMERZ IPN callbacks in your local development environment, you need to expose your API to the internet using a tunnel. This guide walks you through the setup.

## Prerequisites
- Backend running: `http://localhost:5045`
- Frontend running: `http://localhost:5173`
- ngrok installed (https://ngrok.com)

## Step 1: Install ngrok

### Windows
```powershell
# Download from https://ngrok.com/download
# Or use Chocolatey:
choco install ngrok
```

### macOS
```bash
brew install ngrok/ngrok/ngrok
```

### Linux
```bash
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok-agent-v3-stable-linux-386.zip -o ngrok.zip
unzip ngrok.zip
sudo mv ngrok /usr/local/bin
```

## Step 2: Start ngrok Tunnel

```bash
ngrok http 5045
```

This will output:
```
Session Status                online
Account                       [your email]
Version                        3.x.x
Region                         us (US)
Forwarding                     https://abc123def456.ngrok.io -> http://localhost:5045
Forwarding                     http://abc123def456.ngrok.io -> http://localhost:5045
```

**Save the forwarding URL** (e.g., `https://abc123def456.ngrok.io`)

## Step 3: Update Backend Configuration

Edit `Hdms.Api\appsettings.Development.json`:

```json
{
  "AppSettings": {
    "FrontendUrl": "http://localhost:5173",
    "IpnHostUrl": "https://abc123def456.ngrok.io"
  }
}
```

Replace `abc123def456.ngrok.io` with your actual ngrok URL.

## Step 4: Restart Backend

Stop the backend (Ctrl+C) and restart:
```bash
dotnet run --project Hdms.Api/Hdms.Api.csproj
```

## Step 5: Test Payment Workflow

### As Student (Payment Initiation):
1. Login as student: `student@hdms.com` / `Student@12345`
2. Go to **Student > Wallet**
3. Enter amount (e.g., 100 BDT)
4. Click **Pay with SSLCOMMERZ**
5. In the sandbox payment gateway:
   - Card: `4111111111111111`
   - Expiry: `12/25`
   - CVV: `123`
   - Click **Pay**

### Expected Flow:
✅ SSLCOMMERZ processes payment
✅ Redirects to `http://localhost:5173/payment/success?tran_id=...&val_id=...`
✅ Frontend shows success message
✅ **Behind the scenes:** SSLCOMMERZ sends IPN callback to `https://[ngrok-url]/api/payment/ipn`
✅ Backend validates and credits wallet

### As Admin (Manual Revalidation):
If IPN fails, you can manually revalidate pending transactions:

1. Login as admin: `admin@hdms.com` / `Admin@12345`
2. Go to **Admin > Wallets**
3. Click **Show Pending Transactions**
4. Find the pending TOPUP transaction
5. Click **Revalidate** button
6. Wallet balance updates immediately

## Troubleshooting

### IPN Still Not Working?
Check backend logs for:
```
POST /api/payment/ipn - [Status Code]
```

Common issues:
- ngrok URL not saved correctly in config
- Frontend not running (SSLCOMMERZ can't reach success URL)
- Typo in forwarding URL

### ngrok Session Expires
ngrok free tier sessions expire after 2 hours. Restart:
```bash
ngrok http 5045
```
And update `appsettings.Development.json` with the new URL.

### Permission Denied
Make sure you have permission to run ngrok:
```bash
chmod +x /usr/local/bin/ngrok  # macOS/Linux
```

## Resetting to Localhost (Production Testing Disabled)

To go back to localhost-only testing:

```json
{
  "AppSettings": {
    "FrontendUrl": "http://localhost:5173",
    "IpnHostUrl": "http://localhost:5045"
  }
}
```

**Note:** In this mode, IPN callbacks will fail because SSLCOMMERZ can't reach `http://localhost:5045`. Use the admin **Revalidate** button to manually approve pending transactions.

## Production Setup

For production, use your actual API domain:

```json
{
  "AppSettings": {
    "FrontendUrl": "https://yourdomain.com",
    "IpnHostUrl": "https://api.yourdomain.com"
  }
}
```

SSLCOMMERZ will automatically send IPN callbacks to `https://api.yourdomain.com/api/payment/ipn`.

---

**Questions?** Check the SSLCOMMERZ documentation: https://developer.sslcommerz.com/
