# Token Verification Debug Guide

## Changes Made

### 1. **Frontend Debug Logging** (`hdms-client\src\pages\Admin\AdminScan.jsx`)
Added comprehensive console logging to track:
- Raw QR code data
- Data parsing (integer vs GUID)
- GUID formatting
- Final payload sent to backend
- API responses and errors

### 2. **Backend Debug Logging** (`Hdms.Api\Controllers\TokensController.cs`)
Added detailed logging to show:
- Received TokenId or TokenUid
- Database search attempts
- Match results (exact and case-insensitive)
- Success/failure reasons

### 3. **5-Second Pause After Scan**
- Scanner now pauses for 5 seconds after successful scan
- Scanner also pauses for 5 seconds after error
- Allows time to review results before next scan
- Auto-resumes automatically

### 4. **Debug Endpoint** (`/api/tokens/debug/recent`)
New endpoint to list the 10 most recent tokens with their UIDs for verification.

---

## Testing Steps

### Step 1: Check Recent Tokens
1. Open your browser and login as Admin
2. Navigate to: `http://localhost:5000/api/tokens/debug/recent`
   (Or whatever your backend URL is)
3. You'll see a list like:
   ```json
   [
     {
       "id": 123,
       "tokenUid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
       "date": "2026-01-22",
       "mealType": "Lunch",
       "status": "Purchased",
       "createdAt": "2026-01-21T10:30:00"
     }
   ]
   ```
4. **Copy one of the `tokenUid` values** (the full GUID)

### Step 2: Generate QR Code with Correct UID
1. Go to: https://www.qr-code-generator.com/ (or any QR generator)
2. Paste the **TokenUid GUID** you copied (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
3. Generate and download/print the QR code

### Step 3: Test Scanning
1. Open browser console (F12)
2. Navigate to: `http://localhost:5174/admin/scan`
3. Allow camera permission
4. Scan the QR code you just generated
5. **Watch the console output** - you'll see detailed logs like:

   ```
   ========== QR SCAN DEBUG ==========
   Raw scanned data: a1b2c3d4-e5f6-7890-abcd-ef1234567890
   Raw data length: 36
   Raw data type: string
   Trimmed & uppercase: A1B2C3D4-E5F6-7890-ABCD-EF1234567890
   Parsed as integer: NaN isNaN: true
   Cleaned GUID (no hyphens): A1B2C3D4E5F6789...
   ✓ Already valid GUID format
   Final payload: {
     "TokenUid": "A1B2C3D4-E5F6-7890-ABCD-EF1234567890"
   }
   ===================================
   Sending redeem request to backend...
   ```

6. **Check backend console** (dotnet terminal) - you'll see:
   ```
   ========== TOKEN REDEEM DEBUG ==========
   Request received - TokenId: , TokenUid: a1b2c3d4-e5f6-7890-abcd-ef1234567890
   Searching by TokenUid: a1b2c3d4-e5f6-7890-abcd-ef1234567890
   Token found by exact GUID match: True
   SUCCESS: Token found - Id: 123, Uid: a1b2c3d4-..., Status: Purchased
   =========================================
   ```

7. **Wait 5 seconds** - scanner will auto-resume
8. **Scan again** - verify the 5-second pause is working

### Step 4: Test Different Formats
Try scanning QR codes with these formats to test parsing:

**Format 1: GUID with hyphens (standard)**
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Format 2: GUID without hyphens**
```
a1b2c3d4e5f6789...
```

**Format 3: Lowercase GUID**
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Format 4: Integer TokenId (if tokens created with older system)**
```
12345
```

---

## Common Issues & Solutions

### Issue 1: "Token not found"
**Console shows**: `ERROR: Token not found in database`

**Solutions**:
1. Verify the GUID in the QR matches a token in the database
2. Check `/api/tokens/debug/recent` to see actual UIDs
3. Make sure you're using TokenUid (GUID), not TokenId (integer)

### Issue 2: QR code format invalid
**Console shows**: `❌ Invalid format - not integer or GUID`

**Solutions**:
1. Verify QR contains only the GUID (no extra text)
2. Check for whitespace or special characters
3. Use standard GUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Issue 3: Token already redeemed
**Backend shows**: Token status is `Redeemed`

**Solutions**:
1. Create a new free token via Admin panel
2. Or reset token status in database (for testing)

### Issue 4: Scanner stuck/not resuming
**Solutions**:
1. Refresh the page
2. Check console for JavaScript errors
3. The 5-second timeout should auto-resume

---

## What QR Code Contains

**Current System**:
- QR code encodes: `TokenUid` (GUID)
- Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- This is generated in `EmailService.cs` line 23:
  ```csharp
  var qrCodeData = qrGenerator.CreateQrCode(tokenUid.ToString(), ...)
  ```

**Why GUID, not TokenId?**
- GUIDs are globally unique (can't be guessed)
- TokenIds are sequential integers (security risk)
- GUIDs work across multiple systems

---

## Next Steps

1. **Run both servers**:
   ```bash
   # Terminal 1: Backend
   cd Hdms.Api
   dotnet run

   # Terminal 2: Frontend
   cd hdms-client
   npm run dev
   ```

2. **Open browser console** (F12) before testing

3. **Follow testing steps above**

4. **Share console output** if issues persist:
   - Frontend console logs (browser F12)
   - Backend console logs (dotnet terminal)
   - Screenshot of error message

---

## Debug Checklist

- [ ] Backend server running (`dotnet run`)
- [ ] Frontend server running (`npm run dev`)
- [ ] Logged in as Admin
- [ ] Browser console open (F12)
- [ ] Camera permission granted
- [ ] QR code generated with correct TokenUid from database
- [ ] Console shows detailed debug logs
- [ ] Backend terminal shows redeem logs
- [ ] 5-second pause working after scan

---

## Files Modified

1. `hdms-client\src\pages\Admin\AdminScan.jsx` - Added debug logging + 5-second pause
2. `Hdms.Api\Controllers\TokensController.cs` - Added debug logging + debug endpoint
3. `TOKEN_VERIFICATION_DEBUG.md` - This guide

---

## Reverting Debug Logs (Optional)

Once issue is resolved, you can remove the verbose console logs:
- Search for `console.log('========== QR SCAN DEBUG ==========');` and remove logging blocks
- Search for `Console.WriteLine("========== TOKEN REDEEM DEBUG ==========");` and remove logging blocks
- Keep the 5-second pause functionality (users like it!)
