# Admin Manual Block System Guide

## Overview
Admins can now manually block/unblock users directly without waiting for AI detection. This provides immediate action against problematic accounts.

## New Endpoints

### 1. POST /api/admin/usermoderation/block
**Manually block a user** (permanent or temporary)

**Request:**
```json
{
  "userId": "user-id-here",
  "reason": "Abusive behavior",
  "details": "Optional detailed notes about why user was blocked",
  "isPermanent": false,
  "durationWeeks": 2
}
```

**Parameters:**
- `userId` (required): User ID to block
- `reason` (required): Reason for blocking
- `details` (optional): Additional details
- `isPermanent` (optional): Set to `true` for permanent block (default: false)
- `durationWeeks` (optional): Block duration in weeks (1-10). Ignored if isPermanent=true (default: 1)

**Response:**
```json
{
  "message": "User John Doe blocked for 2 week(s)",
  "block": {
    "id": 123,
    "userId": "user-id",
    "userName": "John Doe",
    "reason": "Abusive behavior",
    "details": "Optional notes",
    "blockType": "Temporary",
    "durationWeeks": 2,
    "suspendedAt": "2026-02-04T10:30:00Z",
    "suspendedUntil": "2026-02-18T10:30:00Z",
    "blockedBy": "admin-id"
  }
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:5045/api/admin/usermoderation/block \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "userId": "user-123",
    "reason": "Multiple complaints for harassment",
    "details": "Reported by 3 students, verbal abuse in comments",
    "isPermanent": false,
    "durationWeeks": 4
  }'
```

---

### 2. POST /api/admin/usermoderation/unblock/{userId}
**Manually unblock a user** (revoke block before expiry)

**Request:**
```json
{
  "reason": "Appeal approved - behavior corrected"
}
```

**Parameters:**
- `userId` (URL parameter, required): User ID to unblock
- `reason` (optional): Reason for unblocking

**Response:**
```json
{
  "message": "User John Doe unblocked",
  "unblock": {
    "id": 123,
    "userId": "user-id",
    "userName": "John Doe",
    "revokedAt": "2026-02-10T14:45:00Z",
    "revocationReason": "Appeal approved - behavior corrected",
    "unblockedBy": "admin-id"
  }
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:5045/api/admin/usermoderation/unblock/user-123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "reason": "User submitted appeal and demonstrated good behavior"
  }'
```

---

## Block Types

### Temporary Block
- Duration: 1-10 weeks
- User can use the platform again after expiry
- Auto-lifts on expiry date

### Permanent Block
- Duration: 10 years (effectively permanent)
- Prevents user from using the platform indefinitely
- Admin must manually unblock if needed

---

## How It Works

### When a user is blocked:
1. ✅ New `UserSuspension` record is created with block details
2. ✅ Block is marked as Active
3. ✅ Any unreviewed abuse logs are marked as "Reviewed" with block reason
4. ✅ Abuse detection log is created with "MANUAL_BLOCK" action type
5. ✅ Admin ID is recorded as who performed the block

### When checking if user is suspended:
- Endpoint: `GET /api/admin/usermoderation/check-suspension/{userId}`
- Returns: Whether user is currently suspended + remaining days

### When unblocking:
1. ✅ Suspension is marked as Inactive
2. ✅ Revocation timestamp and reason are recorded
3. ✅ Admin ID is recorded as who revoked the block
4. ✅ User can immediately use the platform again

---

## Integration with Existing Systems

### Relates to these models:
- `UserSuspension.cs` - Stores block records
- `UserAbuseLog.cs` - Logs the action in abuse tracking
- `AbuseDetectionService.cs` - Logs the action in database

### Works with:
- ✅ AI-detected blocks (same suspension system)
- ✅ Abuse logging and tracking
- ✅ Unblock/revoke functionality
- ✅ Suspension status checking

---

## Admin Dashboard Integration (Frontend)

To add UI buttons in the admin panel:

```jsx
// Block button
<button onClick={() => blockUser(userId, 'Reason', false, 2)}>
  Block User
</button>

// Unblock button
<button onClick={() => unblockUser(userId, 'Reason for unblock')}>
  Unblock User
</button>
```

---

## Security Notes

✅ All endpoints require `[Authorize(Roles = "Admin")]`
✅ Admin ID is automatically recorded from JWT claims
✅ Block/unblock actions are logged in abuse tracking system
✅ Cannot block user twice (validation prevents duplicate active blocks)

