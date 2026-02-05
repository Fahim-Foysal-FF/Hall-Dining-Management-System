# Admin Manual Block Feature - Complete Guide

## ✅ What's New
The Admin Panel now includes a **Manual Block** option to manually block/unblock users without waiting for AI detection.

## 📍 Where to Find It

**In Admin Panel → User Moderation:**
- Look for the **⛔ Manual Block** tab (4th tab)
- Also available in the Suspensions tab as an "Unblock" button

---

## 🎯 How to Use

### Method 1: Using Manual Block Tab

1. **Go to:** Admin Panel → User Moderation → ⛔ Manual Block
2. **Click:** "➕ Block User Manually" button
3. **Enter Details:**
   - **User ID or Email** - The user to block (required)
   - **Reason** - Why you're blocking them (required)
   - **Details** - Additional notes (optional)
   - **Permanent Block** - Toggle for permanent vs. temporary
   - **Duration** - If temporary, select 1-10 weeks

4. **Click:** "⛔ Block User" button

### Method 2: From Suspensions Tab

1. **Find** the suspended user in the "Suspensions" tab
2. **Click:** "⛔ Unblock" button to unblock them
3. **Enter reason** when prompted

---

## 🔐 Block Types

### Temporary Block (Default)
- Duration: 1-10 weeks
- User automatically regains access after expiry
- Can be manually unblocked earlier if needed

### Permanent Block
- Duration: 10 years (effectively permanent)
- User cannot access the platform
- Can only be unblocked by admin manual intervention

---

## 📊 Block Features

### What Happens When You Block a User:
✅ User gets an active suspension record  
✅ User cannot use the platform  
✅ Block reason is logged  
✅ Admin ID is recorded  
✅ Any unreviewed abuse logs are marked as reviewed  
✅ Action is added to abuse logs for audit trail  

### What Happens When You Unblock:
✅ Block is deactivated immediately  
✅ User can use the platform again  
✅ Unblock reason is recorded  
✅ Admin ID is recorded  
✅ Action is logged in audit trail  

---

## 🔍 Status Display

In the Suspensions table, each block shows:
- **Status Badge:** "Active", "Revoked", or "Expired"
- **Type Badge:** "🤖 AI" for AI-detected or "Manual" for admin blocks
- **Action Buttons:** 
  - "✅ Revoke" - Early revocation (for suspension)
  - "⛔ Unblock" - Unblock the user

---

## 💡 Use Cases

**Block a user for:**
- Harassment or abusive behavior
- Spam or inappropriate content
- Violation of platform rules
- Temporary suspension pending appeal
- Account compromise/security issues
- Testing or demonstration purposes

---

## 🔒 Security & Audit Trail

✅ **Authorization:** Only admins can block/unblock users  
✅ **Audit Logging:** All blocks logged with timestamp and admin ID  
✅ **Reason Tracking:** Every block must have a documented reason  
✅ **Reversible:** All blocks can be unblocked by admin  
✅ **Integration:** Works with existing suspension system  

---

## 🛠️ Technical Implementation

### Backend Endpoints:
- `POST /api/admin/usermoderation/block`
- `POST /api/admin/usermoderation/unblock/{userId}`

### Frontend Components:
- [UserModeration.jsx](UserModeration.jsx) - Main admin panel UI
- [userModerationApi.js](src/api/userModerationApi.js) - API calls

### Database:
- `UserSuspension` table - Stores block records
- `UserAbuseLog` table - Tracks audit history

---

## ⚠️ Important Notes

1. **Required Fields:** User ID/Email and Reason are mandatory
2. **Duration:** Temporary blocks are 1-10 weeks only
3. **Immediate Effect:** Blocks take effect immediately
4. **Unblocking:** Can unblock anytime, even permanent blocks
5. **Logging:** Every action is logged for audit purposes

---

## 🎓 Examples

### Example 1: Temporary Block for Harassment
```
User ID: student-123
Reason: Harassment of other students
Details: Multiple complaints about verbal abuse in comments
Permanent: No
Duration: 4 weeks
```

### Example 2: Permanent Block for Rule Violation
```
User ID: john.doe@email.com
Reason: Severe platform violations
Details: Repeated spamming, advertising, rule violations
Permanent: Yes
```

### Example 3: Unblocking
```
User: student-123 (currently blocked)
Click: ⛔ Unblock button
Reason: Appeal approved - user promised good behavior
```

---

## 📞 Support

If you need to:
- **Block a user:** Go to Admin → User Moderation → ⛔ Manual Block
- **View suspensions:** Check the 🔒 Suspensions tab
- **Check audit logs:** Review the 📊 Abuse Logs tab
- **See AI-detected users:** Check the 🚩 Flagged Users tab

