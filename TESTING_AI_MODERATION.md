# 🚀 Quick Start: Testing AI User Moderation System

## Prerequisites
- Backend running on `http://localhost:5045`
- Frontend running on `http://localhost:5175`
- Admin account with credentials

## Access the System

### 1. Login as Admin
1. Navigate to: `http://localhost:5175`
2. Login with admin credentials
3. You will be redirected to admin dashboard

### 2. Navigate to User Moderation
- **URL**: `http://localhost:5175/admin/moderation`
- **Or**: Look for "User Moderation" link in admin navigation menu

## Testing the Features

### Test 1: View Flagged Users (AI Detection)

**What it does**: Shows users automatically flagged by AI with abuse score ≥25

**Steps**:
1. Click "🚩 Flagged Users" tab
2. If empty, the system is clean (no abusive users detected)
3. To generate test data, create abuse patterns (see below)

**Expected Result**:
- Table showing flagged users
- Columns: User, Email, Abuse Score, Risk Level, Suggested Duration, Primary Reason
- Color-coded badges:
  - 🔴 Red = Score ≥75 (Critical)
  - 🟡 Yellow = Score 50-74 (High)
  - 🔵 Blue = Score 25-49 (Moderate)

### Test 2: Analyze User Behavior

**What it does**: Shows detailed breakdown of abuse score calculation

**Steps**:
1. On a flagged user row, click "🔍 Analyze" button
2. View popup alert with:
   - Total abuse score
   - Risk level
   - Suggested suspension duration
   - Detailed reasons (point breakdown)

**Expected Result**:
```
Analysis for user:

Abuse Score: 45.5
Risk Level: High
Suggested Duration: 3 weeks

Reasons:
20 pts: Spam listings (12 in 1h)
15 pts: Excessive purchases (24 in 24h)
10 pts: Complaint spam (6 in 24h)
```

### Test 3: Suspend User

**What it does**: Suspends a user for 1-10 weeks

**Steps**:
1. Click "🔒 Suspend" button on any flagged user
2. Review modal showing:
   - User details
   - AI-suggested duration (pre-filled)
3. Adjust duration if needed (dropdown 1-10 weeks)
4. Review pre-filled reason
5. Add additional details (optional)
6. Click "🔒 Suspend User"

**Expected Result**:
- Success message: "User suspended for X week(s)"
- User removed from flagged list
- Suspension appears in "🔒 Suspensions" tab

### Test 4: View Active Suspensions

**What it does**: Shows all active and past user suspensions

**Steps**:
1. Click "🔒 Suspensions" tab
2. View table with all suspensions
3. Active suspensions highlighted in red
4. Check columns:
   - User info
   - Duration
   - Reason
   - Suspended dates
   - Status (Active/Expired/Revoked)
   - AI Detected badge

**Expected Result**:
- Table showing suspension history
- Active suspensions at top
- Red background for active rows
- 🤖 AI badge for AI-detected suspensions

### Test 5: Revoke Suspension Early

**What it does**: Lifts suspension before expiration date

**Steps**:
1. On active suspension row, click "✅ Revoke" button
2. Confirm in dialog
3. Enter reason for revocation (e.g., "Appeal approved")
4. Submit

**Expected Result**:
- Success message: "Suspension revoked successfully"
- Suspension status changes to "Revoked"
- Revoke button disappears
- Revocation reason displayed

### Test 6: View Abuse Logs

**What it does**: Shows all abuse detection events for audit trail

**Steps**:
1. Click "📊 Abuse Logs" tab
2. View detection event history
3. Check columns:
   - Detection timestamp
   - User
   - Action type (e.g., EXCESSIVE_PURCHASE)
   - Description
   - Severity (1-10)
   - Abuse score contribution
   - Review status

**Expected Result**:
- Table of detection events
- Color-coded severity badges
- Pending/Reviewed status indicators

## Generating Test Abuse Data

### Create Test User with Abusive Behavior

**Option 1: Via API (Recommended for testing)**

Use Postman or curl to create test scenarios:

```bash
# Login as test user
POST http://localhost:5045/api/auth/login
{
  "email": "testuser@example.com",
  "password": "Test123!"
}

# Create 21 purchases (triggers EXCESSIVE_PURCHASE rule - 15 pts)
for i in {1..21}; do
  POST http://localhost:5045/api/tokens/purchase
  {
    "quantity": 1,
    "paymentMethod": "wallet"
  }
done

# Create 11 marketplace listings (triggers SPAM_LISTING rule - 20 pts)
for i in {1..11}; do
  POST http://localhost:5045/api/marketplace/list
  {
    "tokenId": "some-token-id",
    "price": 100,
    "description": "Test listing"
  }
done

# Create 6 complaints (triggers COMPLAINT_SPAM rule - 10 pts)
for i in {1..6}; do
  POST http://localhost:5045/api/complaints
  {
    "title": "Test complaint",
    "message": "Testing abuse detection"
  }
done
```

**Total Score**: 15 + 20 + 10 = 45 points → High Risk → Flagged ✅

**Option 2: Via UI (Manual)**

1. **Excessive Purchases** (15 pts):
   - Go to `/student/buy-token`
   - Purchase tokens 21 times in quick succession

2. **Marketplace Spam** (20 pts):
   - Go to `/student/marketplace`
   - Create 11 listings within 1 hour

3. **Complaint Spam** (10 pts):
   - Go to `/student/complaints`
   - Submit 6 complaints rapidly

### Run Analysis

After creating test data:

1. Login as admin
2. Navigate to `/admin/moderation`
3. Click "🚩 Flagged Users" tab
4. Test user should appear with calculated abuse score

## API Testing (Advanced)

### Check User Suspension Status

```bash
GET http://localhost:5045/api/admin/usermoderation/check-suspension/{userId}
Authorization: Bearer <admin_jwt_token>

# Response:
{
  "isSuspended": true,
  "suspension": {
    "id": 1,
    "reason": "Marketplace spam",
    "suspendedUntil": "2024-01-29T10:30:00Z",
    "durationWeeks": 2
  }
}
```

### Get All Flagged Users

```bash
GET http://localhost:5045/api/admin/usermoderation/flagged-users
Authorization: Bearer <admin_jwt_token>

# Response: Array of flagged users with abuse scores ≥25
```

### Suspend User Programmatically

```bash
POST http://localhost:5045/api/admin/usermoderation/suspend
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "userId": "user-id-here",
  "durationWeeks": 2,
  "reason": "Testing suspension system",
  "details": "Manual test suspension"
}
```

## Expected UI Behavior

### Flagged Users Tab
- ✅ Shows users with score ≥25
- ✅ Color-coded risk badges
- ✅ AI-suggested durations
- ✅ Analyze and Suspend buttons

### Suspensions Tab
- ✅ Active suspensions highlighted
- ✅ Shows duration, dates, reasons
- ✅ AI/Manual badges
- ✅ Revoke button for active suspensions
- ✅ Revocation reason for revoked suspensions

### Abuse Logs Tab
- ✅ All detection events visible
- ✅ Severity badges (color-coded)
- ✅ User info and timestamps
- ✅ Review status indicators

## Troubleshooting

### Problem: Flagged Users tab is empty

**Solutions**:
1. Check if any users have abuse scores ≥25
2. Create test abuse data (see above)
3. Check browser console for API errors
4. Verify admin JWT token is valid

### Problem: "Failed to load data" error

**Solutions**:
1. Verify backend is running: `http://localhost:5045`
2. Check browser console for CORS errors
3. Verify you're logged in as Admin
4. Check JWT token in localStorage

### Problem: Suspend button not working

**Solutions**:
1. Check browser console for errors
2. Verify duration is 1-10 weeks
3. Ensure reason field is not empty
4. Check backend logs for validation errors

### Problem: Revoke button missing

**Solutions**:
1. Verify suspension `isActive` is true
2. Refresh the page
3. Check if suspension already expired

## Success Criteria

After testing, you should see:

✅ Flagged users appear with correct abuse scores  
✅ Analyze shows detailed breakdown  
✅ Suspend creates active suspension  
✅ Suspensions tab shows all suspensions  
✅ Revoke lifts suspension early  
✅ Abuse logs track all detections  
✅ Color-coded risk levels work correctly  
✅ AI badges appear for automated detections  
✅ Duration dropdown shows 1-10 weeks  
✅ Success/error messages display properly  

## Next Steps

1. **Add to Admin Navigation**: Link to `/admin/moderation` in sidebar
2. **Test with Real Users**: Monitor actual abuse patterns
3. **Adjust Thresholds**: Fine-tune detection rules as needed
4. **Add Suspension Middleware**: Block suspended users from API access
5. **Enable Notifications**: Email admins when users are flagged

## Quick Reference

| Feature | URL | Action |
|---------|-----|--------|
| User Moderation | `/admin/moderation` | Access main interface |
| Flagged Users | Tab 1 | View AI-detected abusers |
| Suspensions | Tab 2 | Manage active/past suspensions |
| Abuse Logs | Tab 3 | Review detection history |
| Analyze User | Button | See detailed score breakdown |
| Suspend User | Button | Create suspension (1-10 weeks) |
| Revoke Suspension | Button | Lift active suspension early |

## Support

- **Documentation**: See `AI_MODERATION_SYSTEM_GUIDE.md` for complete details
- **API Docs**: Check endpoint examples in main guide
- **Logs**: Check browser console and backend logs for errors

---

**Happy Testing! 🚀**
