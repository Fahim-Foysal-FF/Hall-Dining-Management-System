# Free Meal Tokens Distribution Feature

## Overview
Admins can now distribute free meal tokens to all current users for special occasions like Hall Day, March 26, Eid, or any other event.

## Features
✅ Send free tokens to all users at once
✅ Specify meal date and type (Breakfast/Lunch/Dinner)
✅ Add reason/event name for tracking
✅ Prevents duplicate tokens for same date/meal
✅ Shows token count and confirmation
✅ Free tokens are marked with price = 0

## How to Use

### For Admins:
1. Navigate to **Admin Panel → All Tokens**
2. Click **"Send Free Tokens"** button
3. Fill in the form:
   - **Meal Date**: Select the date for free tokens
   - **Meal Type**: Choose Breakfast, Lunch, or Dinner
   - **Reason/Event**: Enter event name (e.g., "Hall Day", "March 26", "Eid")
4. Click **"Send to All Users"**
5. System will create tokens for all users who don't already have one for that date/meal

### Backend Endpoint:
```
POST /api/admin/tokens/send-free
Content-Type: application/json

{
  "mealDate": "2026-01-16T00:00:00Z",
  "mealType": 0,  // 0=Breakfast, 1=Lunch, 2=Dinner
  "reason": "Hall Day"
}
```

Response:
```json
{
  "success": true,
  "message": "Successfully sent 250 free tokens to users",
  "tokensCreated": 250,
  "date": "2026-01-16",
  "mealType": "Breakfast",
  "reason": "Hall Day"
}
```

## Implementation Details

### Backend Changes:
- **File**: `Hdms.Api/Controllers/AdminTokensController.cs`
- **New Endpoint**: `POST /api/admin/tokens/send-free`
- **Logic**:
  - Fetches all active users
  - Checks if each user already has token for that date/meal
  - Creates MealToken with price=0 for users without token
  - Saves to database and logs action
  - Returns count of tokens created

### Frontend Changes:
- **File**: `hdms-client/src/pages/Admin/AdminTokens.jsx`
  - Added form state management for free tokens
  - Added form UI with date, meal type, and reason inputs
  - Added submit handler that calls API
  - Shows loading state and success/error messages
  - Auto-reloads token list after success

- **File**: `hdms-client/src/api/adminTokensApi.js`
  - Added `sendFreeTokens()` function

## Security
✅ Only **Admin role** can access this feature (authorization check on backend)
✅ Admin action is logged to console
✅ Duplicate prevention built-in

## Special Dates Examples
- **December 16** - Victory Day
- **March 26** - Independence Day
- **May 1** - Labor Day
- **Hall Day** - Monthly/semester celebration
- **Eid** - Religious festival
- **Pohela Boishakh** - Bengali New Year

## Future Enhancements
- View distribution history
- Export list of distributed tokens
- Bulk distribution scheduling
- Custom token pricing (free vs. discounted)
- SMS/Email notifications to users
