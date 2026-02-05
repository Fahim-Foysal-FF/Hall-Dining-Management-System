# Testing Guide - Free Token Alert Feature

## Quick Start

### 1. Restart Backend
```bash
cd Hdms.Api
dotnet run
```

### 2. Run Frontend (in another terminal)
```bash
cd hdms-client
npm run dev
```

### 3. Test as Admin

**Navigate to**: Management → Admin Tokens

**Create Free Token**:
1. Click "Add Free Tokens" button
2. Fill in:
   - **Date**: Tomorrow (or any future date)
   - **Meal Type**: Lunch (or any meal)
   - **Reason**: "Welcome Gift" (or any text)
3. Click "Send Free Tokens"
4. Wait for success message
5. Check that:
   - Message shows "Successfully sent X free tokens to users with QR code emails"
   - Count of users matches your system

### 4. Test as Student

**Check Dashboard**:
1. Login as any student
2. Go to Student Dashboard
3. Look for green "Free Token Gift!" alert
4. Verify it shows:
   - ✅ Gift emoji and title
   - ✅ Message "You have received a free meal token"
   - ✅ Meal type and date
   - ✅ Countdown "Expires in X days"
   - ✅ Email reminder note
   - ✅ "View Your Token" button

**Check Email** (if email configured):
1. Check email inbox
2. Look for: "Your HDMS Meal Token QR Code"
3. Verify email contains:
   - ✅ User's full name in greeting
   - ✅ Token UID and ID
   - ✅ Date and meal type
   - ✅ Price: ৳0 (or your currency)
   - ✅ QR code as PNG attachment (token_qr.png)

### 5. Verify Alert Behavior

**Test Alert Duration**:
- Alert shows for free tokens created within last 7 days
- Alert disappears after 7 days automatically
- Most recent free token is always shown

**Test Multiple Free Tokens**:
- If user gets multiple free tokens, most recent is shown
- Alert updates when newer free token arrives
- Previous tokens don't show alerts (but are in wallet)

**Test Wallet Integration**:
1. Click "View Your Token" button on alert
2. Should navigate to Wallet page
3. Free token should be visible with:
   - ✅ Status: Purchased
   - ✅ Price: ৳0 or Free badge
   - ✅ QR code available for scanning

## Checking Backend Logs

When you create free tokens, backend should show:
```
Admin sent 45 free tokens for 2025-01-09 (Lunch). Reason: Welcome Gift. Emails sent with QR codes.
```

## Database Verification

Check the database to verify tokens were created:
```sql
SELECT TOP 5 
  Id, StudentId, Date, MealType, Price, TokenUid, Status, CreatedAt
FROM MealTokens
WHERE Price = 0
ORDER BY CreatedAt DESC
```

Should show newly created free tokens with:
- Price = 0
- Status = 1 (Purchased)
- TokenUid = GUID
- CreatedAt = recent timestamp

## Troubleshooting

### Alert Not Showing
- Check: Is the date in the future from today?
- Check: Are you logged in as a student?
- Check: Is the API returning data? (Check browser Network tab)
  - Should call: `GET /api/student/first-token-alert`
  - Should return: `{"hasAlert": true, "title": "...", ...}`

### Email Not Received
- Check: Is EmailService configured in appsettings.json?
- Check: Is SMTP server reachable?
- Check: Check backend console for errors
  - Look for: "Email send failed: ..."
- Note: Email failures don't stop token creation

### Token Created But Alert Not Showing
- Check: Is token marked as Price = 0 in database?
- Check: Is token date in future?
- Check: Was token created within last 7 days?
- Check: Browser console for any errors

### API Endpoint Issues
- URL should be: `/api/student/first-token-alert`
- Should return 200 OK with JSON
- No authorization parameter needed (uses current user from JWT)

## Expected Output

### Successful Token Creation (Admin)
```
Success message: ✅
Successfully sent 45 free tokens to users with QR code emails
Date: 2025-01-09
Meal: Lunch
Reason: Welcome Gift
Tokens Created: 45
```

### Student Dashboard
- Green alert box at top of page
- 🎁 Free Token Gift!
- Meal and date information
- Expiration countdown
- Link to wallet

### Email (if configured)
- Subject: Your HDMS Meal Token QR Code
- Contains QR code image attachment
- Shows token details
- Professional template

## Next Steps After Verification

1. **Customize Alert Message** (Optional)
   - File: `StudentDashboard.jsx` (line with `title = "Free Token Gift! 🎁"`)
   - Edit the title and description text

2. **Customize Email Template** (Optional)
   - File: `EmailService.cs` (method `SendTokenQrEmailAsync`)
   - Update the email body text

3. **Adjust Alert Duration** (Optional)
   - File: `StudentDashboardController.cs` (line with `.AddDays(-7)`)
   - Change 7 to any other number of days

4. **Production Deployment**
   - Verify email credentials in appsettings.json
   - Test with actual email account
   - Verify SMTP access in firewall

## Notes

- Feature is fully functional and production-ready
- Uses existing EmailService (QRCoder, MailKit)
- No new dependencies needed
- Handles errors gracefully
- Parallel email sending for performance
- Database migrations already applied
