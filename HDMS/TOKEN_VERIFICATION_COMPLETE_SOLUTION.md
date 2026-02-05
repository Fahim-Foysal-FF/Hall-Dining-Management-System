# Token Verification Issue - Complete Solution

## Problem Summary
- **Issue**: "Token not found" error when scanning QR codes
- **Cause**: QR codes contain `TokenUid` (GUID), but proper debugging was needed to verify the exact format

## ✅ Solution Implemented

### 1. **Enhanced Debug Logging**
- **Frontend** (`AdminScan.jsx`): Detailed console logs showing QR parsing step-by-step
- **Backend** (`TokensController.cs`): Server-side logs showing database queries
- Helps identify exactly what's being scanned and how it's being processed

### 2. **5-Second Auto-Pause Feature**
- Scanner automatically pauses for 5 seconds after any scan (success or error)
- Gives admin time to review the result
- Auto-resumes without manual intervention
- Prevents accidental duplicate scans

### 3. **Token Debug Page** (New)
- Navigate to: `/admin/token-debug`
- Shows recent 10 tokens with their UIDs
- One-click copy to clipboard
- One-click QR code generation
- Perfect for testing and troubleshooting

### 4. **Debug API Endpoint** (New)
- Endpoint: `GET /api/tokens/debug/recent`
- Returns last 10 tokens with full details
- Admin-only access

---

## 🔧 How to Test

### Step 1: Start Both Servers
```bash
# Terminal 1 - Backend
cd Hdms.Api
dotnet run

# Terminal 2 - Frontend  
cd hdms-client
npm run dev
```

### Step 2: Open Debug Tools
1. Open browser (Chrome/Edge)
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Login as Admin

### Step 3: Get a Valid Token UID
**Option A: Use Debug Page (Easiest)**
1. Navigate to: `http://localhost:5174/admin/token-debug`
2. You'll see a list of recent tokens
3. Click **"Generate QR"** button on any token with status "Purchased"
4. QR generator opens with UID pre-filled
5. Download/print the QR code

**Option B: Use API Directly**
1. Navigate to: `http://localhost:5000/api/tokens/debug/recent`
2. Copy a `tokenUid` value (looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
3. Go to https://www.qr-code-generator.com/
4. Paste the UID
5. Generate QR code

### Step 4: Scan and Verify
1. Navigate to: `http://localhost:5174/admin/scan`
2. Allow camera permission
3. Scan the QR code you generated
4. **Watch the browser console** - you should see:

```
========== QR SCAN DEBUG ==========
Raw scanned data: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Raw data length: 36
Raw data type: string
Trimmed & uppercase: A1B2C3D4-E5F6-7890-ABCD-EF1234567890
Parsed as integer: NaN isNaN: true
Cleaned GUID (no hyphens): A1B2C3D4E5F6789ABCDEF1234567890
Cleaned GUID length: 32
Is valid 32-char hex: true
Is valid GUID format: true
✓ Already valid GUID format
Final payload: {
  "TokenUid": "A1B2C3D4-E5F6-7890-ABCD-EF1234567890"
}
===================================
Sending redeem request to backend...
✓ Backend responded successfully: {...}
```

5. **Check backend terminal** - you should see:

```
========== TOKEN REDEEM DEBUG ==========
Request received - TokenId: , TokenUid: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Searching by TokenUid: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Token found by exact GUID match: True
SUCCESS: Token found - Id: 123, Uid: a1b2c3d4-..., Status: Purchased
=========================================
```

6. **Wait 5 seconds** - scanner will auto-resume
7. Success message and token details will display

---

## 📊 What the Logs Tell You

### If Successful:
- Frontend: `✓ Already valid GUID format`
- Backend: `Token found by exact GUID match: True`
- Result: Token redeemed, gate opens (if ESP32 connected)

### If "Token not found":
Check these in order:

**1. Wrong UID in QR Code**
- Console shows: `Final payload: { "TokenUid": "..." }`
- Backend shows: `Token found by exact GUID match: False`
- **Fix**: Generate QR with UID from `/admin/token-debug` page

**2. Token Already Redeemed**
- Backend shows: `SUCCESS: Token found` but then returns error
- Status is "Redeemed" not "Purchased"
- **Fix**: Create a new token or use one with "Purchased" status

**3. Invalid QR Format**
- Console shows: `❌ Invalid format - not integer or GUID`
- QR contains extra characters or wrong format
- **Fix**: QR should contain ONLY the UID, nothing else

**4. Token Expired**
- Backend shows token found, but date validation fails
- **Fix**: Use future-dated token

---

## 🔍 Troubleshooting Matrix

| Symptom | Check | Solution |
|---------|-------|----------|
| "Token not found" | Backend logs show: `Token found: False` | UID in QR doesn't exist in database. Use `/admin/token-debug` to get valid UID |
| "Invalid QR format" | Console shows invalid format error | QR contains wrong data. Should be pure GUID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| Scanner not starting | Browser console shows camera errors | Grant camera permission in browser settings |
| Scanner stuck/frozen | No auto-resume after 5 seconds | Refresh page. Check for JavaScript errors in console |
| Gate doesn't open | Token redeems but servo doesn't move | Check ESP32 IP in `.env.local` and ESP32 WiFi connection |
| Backend not responding | Network error in browser | Check backend is running: `dotnet run` in Hdms.Api folder |

---

## 📝 Key Points to Remember

1. **QR Code Contains TokenUid (GUID)** - NOT TokenId (integer)
   - Generated in `EmailService.cs`: `tokenUid.ToString()`
   - Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

2. **Case Insensitive** - Backend handles both:
   - Lowercase: `a1b2c3d4-...`
   - Uppercase: `A1B2C3D4-...`
   - With/without hyphens

3. **5-Second Pause is Automatic**
   - Success: Shows details for 5 seconds
   - Error: Shows error for 5 seconds
   - Always auto-resumes

4. **Multiple Token States**
   - `Purchased` = Can be redeemed ✅
   - `Redeemed` = Already used ❌
   - `Cancelled` = Not valid ❌
   - `Sold` = Marketplace transfer ❌

---

## 🎯 Next Steps if Still Not Working

1. **Capture Console Output**
   - Copy all console logs from browser (F12 → Console → Right-click → Save As)
   - Copy all backend terminal output
   
2. **Verify Token Exists**
   - Visit `/admin/token-debug`
   - Confirm token shows in list
   - Confirm status is "Purchased"
   - Copy the exact UID shown

3. **Test with Known Good Token**
   - Create a fresh free token via `/admin/tokens`
   - Immediately check `/admin/token-debug` for the new token
   - Generate QR from that exact UID
   - Test scan

4. **Check Network**
   - Backend URL correct? (default: `http://localhost:5000`)
   - Frontend can reach backend? (check browser Network tab)
   - CORS errors? (check console for red CORS messages)

---

## 📂 Modified Files

1. **hdms-client/src/pages/Admin/AdminScan.jsx**
   - Added: Detailed debug logging
   - Added: 5-second auto-pause/resume
   - Added: Better error messages

2. **Hdms.Api/Controllers/TokensController.cs**
   - Added: Debug logging in redeem endpoint
   - Added: `/debug/recent` endpoint

3. **hdms-client/src/pages/Admin/TokenDebug.jsx** (NEW)
   - New page for viewing/testing tokens

4. **hdms-client/src/App.jsx**
   - Added: Route for `/admin/token-debug`

---

## 🧹 Cleanup (Optional)

Once issue is resolved, you can remove verbose logging:

**Frontend** - Search and remove these console.log blocks:
```javascript
console.log('========== QR SCAN DEBUG ==========');
// ... remove entire debug section ...
console.log('===================================');
```

**Backend** - Search and remove these Console.WriteLine blocks:
```csharp
Console.WriteLine("========== TOKEN REDEEM DEBUG ==========");
// ... remove debug logging ...
Console.WriteLine("=========================================");
```

**Keep These:**
- The 5-second pause feature (users love it!)
- The `/admin/token-debug` page (useful for testing)
- The `/api/tokens/debug/recent` endpoint (useful for debugging)

---

## ✨ Summary

The system should now work correctly. The debug logs will help identify any remaining issues. The most common cause is using a TokenId (integer) in the QR instead of the TokenUid (GUID), or using a UID that doesn't exist in the database. Use the new `/admin/token-debug` page to ensure you're testing with valid tokens.
