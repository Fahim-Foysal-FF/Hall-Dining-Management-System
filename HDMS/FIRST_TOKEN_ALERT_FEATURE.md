# First Free Token Alert & Email Notification Feature

## Overview
Implemented a complete system for distributing free tokens to all users with QR code emails and displaying alerts on the student dashboard.

## Features Implemented

### 1. Backend - Email with QR Code Sending
**File**: `Hdms.Api/Controllers/AdminTokensController.cs`

**Updated**: `SendFreeTokens` endpoint now:
- Creates free tokens for all users
- Automatically sends email to each user with:
  - QR code of the token (PNG attachment)
  - Token UID and ID
  - Meal date and type
  - Price (0 for free tokens)
  - Meal preference (if applicable)
  - Proper greeting with user's full name

**Implementation**:
```csharp
// Added EmailService injection to constructor
private readonly EmailService _emailService;

// In SendFreeTokens method, after saving tokens:
var tasks = new List<Task>();
foreach (var token in createdTokens)
{
    var user = users.FirstOrDefault(u => u.Id == token.StudentId);
    if (user != null && !string.IsNullOrEmpty(user.Email))
    {
        tasks.Add(_emailService.SendTokenQrEmailAsync(
            user.Email, user.FullName, token.Id, 
            token.Date, mealTypeStr, 0, 
            token.TokenUid, token.MealPreference
        ));
    }
}
await Task.WhenAll(tasks);
```

### 2. Backend - First Token Alert Endpoint
**File**: `Hdms.Api/Controllers/StudentDashboardController.cs`

**New Endpoint**: `GET /api/student/first-token-alert`
- Returns alert data if user has received a free token in the last 7 days
- Shows token details: date, meal type, expiration countdown
- Includes descriptive message about the gift

**Response Format**:
```json
{
  "hasAlert": true,
  "title": "Free Token Gift! 🎁",
  "message": "You have received a free meal token",
  "description": "Use your free Lunch token on Thursday, January 9, 2025",
  "tokenDate": "2025-01-09",
  "mealType": "Lunch",
  "expiresIn": 5,
  "tokenId": 123,
  "reason": "Special Gift - Check your email for QR code"
}
```

### 3. Frontend - API Client Update
**File**: `hdms-client/src/api/studentApi.js`

**New Function**: `getFirstTokenAlert()`
- Calls the backend endpoint
- Handles errors gracefully
- Returns alert data or `{ hasAlert: false }`

### 4. Frontend - Student Dashboard Integration
**File**: `hdms-client/src/pages/Student/StudentDashboard.jsx`

**New Alert Display**:
- Shows beautiful green gift alert with gradient background
- Displays:
  - Gift emoji and title ("Free Token Gift! 🎁")
  - Message explaining the gift
  - Token details (meal type and date)
  - Countdown timer ("Expires in X days")
  - Link to view in wallet
- Only displays if user has active free token
- Alert persists until token expires

**UI Elements**:
- Green gradient background (success colors)
- Gift icon (bi-gift)
- "View Your Token" button linking to wallet
- Expiration countdown
- Email reminder note

## How It Works

### Admin Workflow
1. Admin creates free tokens via Management → Admin Tokens → "Add Free Tokens"
2. Fills in: date, meal type (Breakfast/Lunch/Dinner), reason
3. Clicks "Send Free Tokens"
4. System:
   - Creates token for every active user
   - Generates unique QR code for each token
   - Sends individual email to each user with their QR code
   - Shows success message with count

### Student Workflow
1. User receives email with subject: "Your HDMS Meal Token QR Code"
2. Email contains:
   - Welcome message
   - Token details (UID, ID, date, meal type, price)
   - QR code as PNG attachment
   - Instructions to present at dining hall
3. Logs into HDMS and sees dashboard
4. Gets green gift alert showing:
   - Free token has been gifted
   - Which meal and which date
   - How many days until expiration
5. Can click "View Your Token" to go to wallet for more details

## Technical Details

### Email Service (Existing)
- Uses QRCoder to generate PNG QR codes
- Uses MailKit for SMTP
- Attachment filename: `token_qr.png`
- Content-type: `image/png`
- Handles errors without failing the token creation

### Database Queries
- First token alert checks for free tokens created in last 7 days
- Uses `Price == 0` to identify free tokens
- Orders by most recent first

### State Management (Frontend)
```javascript
const [firstTokenAlert, setFirstTokenAlert] = useState(null);

// In useEffect
const [dashboardData, closuresData, tokenAlertData] = await Promise.all([
  getStudentDashboard(),
  getActiveDiningClosures(),
  getFirstTokenAlert()
]);
setFirstTokenAlert(tokenAlertData);
```

## Response Examples

### When user has free token
```json
{
  "hasAlert": true,
  "title": "Free Token Gift! 🎁",
  "message": "You have received a free meal token",
  "description": "Use your free Dinner token on Friday, January 10, 2025",
  "tokenDate": "2025-01-10",
  "mealType": "Dinner",
  "expiresIn": 6,
  "tokenId": 456,
  "reason": "Special Gift - Check your email for QR code"
}
```

### When user has no free token
```json
{
  "hasAlert": false
}
```

## What Users See

### Email
```
Subject: Your HDMS Meal Token QR Code

Dear [User Name],

Thank you for purchasing a meal token!

Token Details:
- Token UID: [UUID]
- Token ID: [ID]
- Date: 2025-01-09
- Meal: Lunch
- Price: ৳0

Please present this QR code at the dining hall for redemption.

Best regards,
HDMS System

[QR Code attached as PNG image]
```

### Dashboard Alert
```
🎁 Free Token Gift!
You have received a free meal token

Use your free Lunch token on Wednesday, January 9, 2025

⏰ Expires in 5 days

📧 Special Gift - Check your email for QR code

[View Your Token] button
```

## Configuration Required

None! The feature uses existing:
- Email settings from `appsettings.json`
- User email addresses already in database
- MealToken entity already in place
- QRCoder library already installed

## Features Included

✅ Automatic email to all users when free token is sent
✅ QR code generation and attachment
✅ Individual token per user with unique QR code
✅ Dashboard alert shows gift information
✅ Expiration countdown on dashboard
✅ Beautiful green styling to highlight gift
✅ Link to wallet for token details
✅ Email reminder in alert description
✅ Graceful handling of missing emails
✅ Async parallel email sending for performance

## Edge Cases Handled

✅ Users without email addresses - skipped (logged in console)
✅ Multiple free tokens per user - shows most recent
✅ Very old free tokens (>7 days) - alert doesn't show
✅ Soft-deleted tokens - ignored
✅ Email send failures - don't block token creation
✅ Multiple free tokens same day - only shows one (latest)

## Testing Checklist

- [ ] Database migration applied: ✅ (Already up to date)
- [ ] Backend code compiles: ✅
- [ ] Frontend code compiles: ✅
- [ ] Create free token as admin and verify:
  - [ ] Tokens created for all users
  - [ ] Emails sent with QR codes
  - [ ] Dashboard shows alert for users
  - [ ] Alert disappears after 7 days
  - [ ] Countdown shows correct days remaining
  - [ ] "View Your Token" link works

## Ready for Testing

Both backend and frontend are ready:
- ✅ All code compiles without errors
- ✅ Email service already implemented
- ✅ Database ready (migration already applied)
- ✅ No new configuration needed

Just restart the backend and test!
