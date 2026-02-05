# 🤖 AI User Moderation System - Complete Guide

## Overview

The AI User Moderation System is an intelligent abuse detection and user suspension management system that automatically identifies problematic user behavior and assists administrators in maintaining a healthy platform environment.

## System Architecture

### Backend Components

1. **UserSuspension Model** (`Models/UserSuspension.cs`)
   - Tracks user suspensions with configurable durations (1-10 weeks)
   - Supports both AI-detected and manual suspensions
   - Includes revocation capability for early release
   - Fields:
     - `UserId`, `Reason`, `Details`
     - `DurationWeeks` (1-10)
     - `SuspendedAt`, `SuspendedUntil`
     - `SuspendedById`, `RevokedById`
     - `IsActive`, `IsAIDetected`
     - `RevocationReason`

2. **UserAbuseLog Model** (`Models/UserAbuseLog.cs`)
   - Logs all detected abusive behaviors
   - Tracks severity (1-10) and abuse scores
   - Supports admin review workflow
   - Fields:
     - `UserId`, `ActionType`, `Description`
     - `Severity`, `AbuseScore`, `DetectedAt`
     - `Metadata` (JSON for additional context)
     - `IsReviewed`, `ReviewedAt`, `ReviewedById`, `ReviewNotes`

3. **AbuseDetectionService** (`Services/AbuseDetectionService.cs`)
   - Core AI engine for behavior analysis
   - Implements 9 detection rules with weighted scoring
   - Calculates risk levels and suspension recommendations
   - Methods:
     - `AnalyzeUserBehavior(userId)` - Comprehensive user analysis
     - `CalculateSuspensionDuration(score)` - Maps score to weeks
     - `LogAbuse()` - Records detection events
     - `GetFlaggedUsers()` - Returns users with score ≥25

4. **UserModerationController** (`Controllers/UserModerationController.cs`)
   - RESTful API for admin operations
   - Authorization: Admin role required
   - Endpoints: See API Reference section

### Frontend Components

1. **UserModeration Page** (`src/pages/Admin/UserModeration.jsx`)
   - Three-tab interface:
     - 🚩 Flagged Users - AI-detected abusive users
     - 🔒 Suspensions - Active and historical suspensions
     - 📊 Abuse Logs - Detection event history
   - Features:
     - Real-time abuse score visualization
     - One-click suspension with AI suggestions
     - Revocation workflow for early release
     - Detailed user analysis on-demand

2. **User Moderation API** (`src/api/userModerationApi.js`)
   - Axios-based API client
   - JWT authentication support
   - Error handling and response parsing

## AI Detection Rules

The system monitors user behavior across 9 categories with weighted scoring:

### 1. Excessive Purchases (15 points)
- **Trigger**: More than 20 token purchases in 24 hours
- **Severity**: 5/10
- **Reason**: Potential system abuse or resale activity

### 2. Marketplace Spam (20 points)
- **Trigger**: More than 10 listings created in 1 hour
- **Severity**: 8/10
- **Reason**: Marketplace flooding, spam listings

### 3. Complaint Spam (10 points)
- **Trigger**: More than 5 complaints filed in 24 hours
- **Severity**: 4/10
- **Reason**: System harassment or abuse

### 4. Excessive Cancellations (12 points)
- **Trigger**: More than 15 order cancellations in 7 days
- **Severity**: 6/10
- **Reason**: Disruptive behavior, poor faith usage

### 5. Excessive Transactions (8 points)
- **Trigger**: More than 50 wallet transactions in 24 hours
- **Severity**: 3/10
- **Reason**: Unusual financial activity

### 6. Rapid Buy-Sell Cycles (15 points)
- **Trigger**: More than 10 same-day purchase-sell cycles in 7 days
- **Severity**: 7/10
- **Reason**: Potential arbitrage or market manipulation

### 7. Payment Failures (10 points)
- **Trigger**: More than 20 failed payment attempts in 7 days
- **Severity**: 5/10
- **Reason**: Potential fraud or technical abuse

### 8. Historical Abuse (Variable)
- **Calculation**: Average abuse score from past 30 days
- **Severity**: Scaled based on history
- **Reason**: Repeat offender pattern

### 9. Prior Suspensions (10 points each)
- **Trigger**: Each suspension in last 90 days
- **Severity**: 9/10
- **Reason**: Recidivism, pattern of rule violations

## Abuse Score Thresholds

| Score Range | Risk Level | Suggested Duration | Action Required |
|-------------|------------|-------------------|-----------------|
| 0-24        | Low        | N/A               | No action       |
| 25-34       | Moderate   | 1 week            | Review flagged  |
| 35-44       | High       | 2 weeks           | Review flagged  |
| 45-54       | High       | 3 weeks           | Review flagged  |
| 55-64       | Severe     | 4 weeks           | Review flagged  |
| 65-74       | Severe     | 5 weeks           | Review flagged  |
| 75-84       | Critical   | 7 weeks           | Immediate review|
| 85-94       | Critical   | 9 weeks           | Immediate review|
| 95+         | Extreme    | 10 weeks          | Immediate action|

**Note**: Users with abuse score ≥25 are automatically flagged for admin review.

## API Reference

### Base URL
```
http://localhost:5045/api/admin/usermoderation
```

### Endpoints

#### 1. Get Flagged Users
```http
GET /flagged-users
Authorization: Bearer <admin_jwt_token>
```
**Response**: Array of users with abuse score ≥25
```json
[
  {
    "userId": "string",
    "fullName": "string",
    "email": "string",
    "abuseScore": 45.5,
    "riskLevel": "High",
    "suggestedSuspensionWeeks": 3,
    "primaryReason": "Marketplace spam detected",
    "reasons": ["20 pts: Spam listings", "15 pts: Rapid cycles"],
    "detectedAt": "2024-01-15T10:30:00Z"
  }
]
```

#### 2. Analyze Specific User
```http
GET /analyze/{userId}
Authorization: Bearer <admin_jwt_token>
```
**Response**: Detailed analysis for specific user
```json
{
  "userId": "string",
  "abuseScore": 32.5,
  "riskLevel": "Moderate",
  "suggestedSuspensionWeeks": 1,
  "reasons": [
    "15 pts: Excessive purchases (25 in 24h)",
    "10 pts: Complaint spam (7 in 24h)"
  ],
  "detectedAt": "2024-01-15T10:30:00Z"
}
```

#### 3. Suspend User
```http
POST /suspend
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "userId": "user-id-here",
  "durationWeeks": 2,
  "reason": "Marketplace spam",
  "details": "AI-detected: 30 listings in 1 hour"
}
```
**Response**: Created suspension object
```json
{
  "id": 1,
  "userId": "string",
  "durationWeeks": 2,
  "reason": "Marketplace spam",
  "suspendedAt": "2024-01-15T10:30:00Z",
  "suspendedUntil": "2024-01-29T10:30:00Z",
  "isActive": true,
  "isAIDetected": true
}
```

#### 4. Get All Suspensions
```http
GET /suspensions?activeOnly=true
Authorization: Bearer <admin_jwt_token>
```
**Response**: Array of suspensions
```json
[
  {
    "id": 1,
    "userId": "string",
    "user": {
      "fullName": "John Doe",
      "email": "john@example.com"
    },
    "reason": "Marketplace spam",
    "details": "AI-detected abuse",
    "durationWeeks": 2,
    "suspendedAt": "2024-01-15T10:30:00Z",
    "suspendedUntil": "2024-01-29T10:30:00Z",
    "suspendedById": "admin-id",
    "isActive": true,
    "isAIDetected": true,
    "revokedAt": null
  }
]
```

#### 5. Revoke Suspension
```http
POST /revoke/{suspensionId}
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "reason": "Appeal approved, good behavior demonstrated"
}
```
**Response**: Updated suspension object with revocation details

#### 6. Get Abuse Logs
```http
GET /abuse-logs?unreviewedOnly=false
Authorization: Bearer <admin_jwt_token>
```
**Response**: Array of abuse detection events
```json
[
  {
    "id": 1,
    "userId": "string",
    "user": {
      "fullName": "Jane Smith",
      "email": "jane@example.com"
    },
    "actionType": "EXCESSIVE_PURCHASE",
    "description": "User made 25 purchases in 24 hours",
    "severity": 5,
    "abuseScore": 15.0,
    "detectedAt": "2024-01-15T10:30:00Z",
    "metadata": "{\"count\":25,\"timeframe\":\"24h\"}",
    "isReviewed": false
  }
]
```

#### 7. Check User Suspension Status
```http
GET /check-suspension/{userId}
Authorization: Bearer <admin_jwt_token>
```
**Response**: Current suspension status
```json
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

## Admin Workflow

### Step 1: Monitor Flagged Users
1. Navigate to `/admin/moderation`
2. Click "🚩 Flagged Users" tab
3. Review users with abuse scores ≥25
4. Check risk levels and AI suggestions

### Step 2: Analyze User Behavior
1. Click "🔍 Analyze" button on any flagged user
2. Review detailed breakdown of violations
3. Check abuse score composition
4. Verify AI recommendations

### Step 3: Suspend User (if needed)
1. Click "🔒 Suspend" button
2. Review AI-suggested duration (1-10 weeks)
3. Adjust duration if necessary
4. Provide reason and additional details
5. Submit suspension

### Step 4: Monitor Active Suspensions
1. Click "🔒 Suspensions" tab
2. View all active and past suspensions
3. Check expiration dates
4. Monitor AI vs manual suspensions

### Step 5: Revoke Early (if needed)
1. Locate active suspension
2. Click "✅ Revoke" button
3. Provide revocation reason
4. Confirm revocation

### Step 6: Review Detection Logs
1. Click "📊 Abuse Logs" tab
2. Review detection events
3. Mark logs as reviewed
4. Track patterns over time

## Database Schema

### UserSuspensions Table
```sql
CREATE TABLE [UserSuspensions] (
    [Id] int PRIMARY KEY IDENTITY,
    [UserId] nvarchar(450) NOT NULL,
    [Reason] nvarchar(max) NOT NULL,
    [Details] nvarchar(max),
    [DurationWeeks] int NOT NULL,
    [SuspendedAt] datetime2 NOT NULL,
    [SuspendedUntil] datetime2 NOT NULL,
    [SuspendedById] nvarchar(450) NOT NULL,
    [IsActive] bit NOT NULL,
    [IsAIDetected] bit NOT NULL,
    [RevokedAt] datetime2,
    [RevokedById] nvarchar(450),
    [RevocationReason] nvarchar(max),
    FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers]([Id]),
    FOREIGN KEY ([SuspendedById]) REFERENCES [AspNetUsers]([Id]),
    FOREIGN KEY ([RevokedById]) REFERENCES [AspNetUsers]([Id])
);
```

### UserAbuseLogs Table
```sql
CREATE TABLE [UserAbuseLogs] (
    [Id] int PRIMARY KEY IDENTITY,
    [UserId] nvarchar(450) NOT NULL,
    [ActionType] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [Severity] int NOT NULL,
    [AbuseScore] float NOT NULL,
    [DetectedAt] datetime2 NOT NULL,
    [Metadata] nvarchar(max),
    [IsReviewed] bit NOT NULL,
    [ReviewedAt] datetime2,
    [ReviewedById] nvarchar(450),
    [ReviewNotes] nvarchar(max),
    FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers]([Id]),
    FOREIGN KEY ([ReviewedById]) REFERENCES [AspNetUsers]([Id])
);
```

## Testing the System

### Test Scenario 1: Excessive Purchases
1. Create 21 token purchases within 1 hour for a test user
2. Run abuse detection: `GET /api/admin/usermoderation/analyze/{userId}`
3. Verify abuse score includes 15 points for excessive purchases
4. Check if user appears in flagged users list

### Test Scenario 2: Marketplace Spam
1. Create 11 marketplace listings within 1 hour
2. Run analysis
3. Verify 20-point penalty for spam listings
4. Confirm "High" risk level

### Test Scenario 3: Suspension Workflow
1. Suspend user for 2 weeks via API or UI
2. Verify suspension is active
3. Check `suspendedUntil` date is correct
4. Attempt user login (should be blocked if middleware exists)
5. Revoke suspension early
6. Verify suspension is no longer active

### Test Scenario 4: Historical Abuse
1. Create multiple abuse logs over 30 days
2. Run analysis
3. Verify historical abuse score contribution
4. Check cumulative score increases over time

## Configuration

### Adjusting Detection Thresholds
Edit `Services/AbuseDetectionService.cs`:

```csharp
// Example: Lower excessive purchase threshold
if (recentPurchases > 15) // Changed from 20
{
    score += 15;
    reasons.Add("15 pts: Excessive purchases (>15 in 24h)");
}
```

### Modifying Suspension Duration Mapping
```csharp
private int CalculateSuspensionDuration(double abuseScore)
{
    if (abuseScore >= 95) return 10; // Extreme
    if (abuseScore >= 85) return 9;  // Critical
    if (abuseScore >= 75) return 7;  // Critical
    // ... adjust as needed
}
```

### Changing Flagging Threshold
```csharp
public async Task<List<AbuseDetectionResult>> GetFlaggedUsers()
{
    var threshold = 25; // Change this value
    // ...
}
```

## Best Practices

### For Administrators
1. **Regular Monitoring**: Check flagged users daily
2. **Verify Before Action**: Always analyze user before suspending
3. **Document Reasons**: Provide clear suspension reasons
4. **Fair Duration**: Use AI suggestions as guidelines, not absolutes
5. **Review Appeals**: Consider revocation requests promptly
6. **Track Patterns**: Review abuse logs for systemic issues

### For Developers
1. **Test Detection Rules**: Ensure thresholds are reasonable
2. **Monitor False Positives**: Track innocent users getting flagged
3. **Log Everything**: Comprehensive logging for audit trails
4. **Optimize Queries**: Abuse detection queries should be efficient
5. **Handle Edge Cases**: Consider timezone issues, data migration
6. **Document Changes**: Update this guide when modifying rules

## Troubleshooting

### Issue: No users being flagged despite abuse
**Solution**: 
- Check detection thresholds in `AbuseDetectionService.cs`
- Verify database has sufficient data for analysis
- Run manual analysis on suspected user: `GET /analyze/{userId}`

### Issue: False positives
**Solution**:
- Review detection rules that triggered false positive
- Adjust thresholds to be more lenient
- Add whitelist logic for legitimate power users

### Issue: Suspension not blocking user
**Solution**:
- Implement middleware to check suspension status on each request
- Add `[ServiceFilter(typeof(SuspensionCheckFilter))]` to controllers
- Verify `IsActive` flag is being checked correctly

### Issue: Performance degradation
**Solution**:
- Add indexes on frequently queried fields:
  ```sql
  CREATE INDEX IX_UserAbuseLogs_UserId_DetectedAt ON UserAbuseLogs(UserId, DetectedAt);
  CREATE INDEX IX_UserSuspensions_UserId_IsActive ON UserSuspensions(UserId, IsActive);
  ```
- Cache abuse detection results for 5-10 minutes
- Optimize date range queries with proper indexes

## Future Enhancements

1. **Machine Learning Integration**
   - Train ML model on historical abuse data
   - Implement anomaly detection algorithms
   - Use clustering for behavior pattern analysis

2. **Real-time Alerts**
   - Email notifications for high-risk detections
   - SMS alerts for critical abuse scores (>75)
   - Dashboard notifications for admins

3. **Appeal System**
   - Student-facing appeal submission form
   - Admin review queue for appeals
   - Automated response templates

4. **Graduated Penalties**
   - Warning system before suspension
   - Temporary feature restrictions
   - Progressive suspension durations

5. **IP Blocking**
   - Track IP addresses in abuse logs
   - Block repeat offenders by IP
   - VPN/proxy detection

6. **Behavioral Insights**
   - Dashboard with abuse trends
   - User risk score visualization
   - Predictive analytics for prevention

## Migration History

- **20260204152444_AddUserModerationSystem**
  - Created `UserSuspensions` table
  - Created `UserAbuseLogs` table
  - Added foreign key relationships
  - Created indexes for performance

## Support

For questions or issues:
1. Check this documentation first
2. Review API responses for error details
3. Check application logs in `Logs/` directory
4. Consult development team

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial release
- 9 detection rules implemented
- Admin UI with 3-tab interface
- Suspension duration: 1-10 weeks
- RESTful API with 7 endpoints
- Database schema with 2 new tables

---

**Last Updated**: January 15, 2024  
**Author**: HDMS Development Team  
**Version**: 1.0.0
