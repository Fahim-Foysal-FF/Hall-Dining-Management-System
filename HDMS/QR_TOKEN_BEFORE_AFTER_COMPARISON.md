# QR Token Scanning - Before vs After

## BEFORE FIX ❌

```
┌─────────────────────────────────────────────────────────────┐
│ PURCHASE QR BUNDLE                                          │
└─────────────────────────────────────────────────────────────┘

Student buys 2 tokens → Backend creates:

┌──────────────────────┐      ┌──────────────────────┐
│   QRTokenGroup       │      │   MealToken #1       │
├──────────────────────┤      ├──────────────────────┤
│ Id: 5                │◄─────│ Id: 101              │
│ QRCode: 550e8400-... │      │ TokenUid: abc12345-..│
│ TotalTokens: 2       │      │ Status: Purchased    │
│ RemainingTokens: 2   │      └──────────────────────┘
│ RedeemedTokens: 0    │
└──────────────────────┘      ┌──────────────────────┐
                              │   MealToken #2       │
                              ├──────────────────────┤
                              │ Id: 102              │
                              │ TokenUid: def67890-..│
                              │ Status: Purchased    │
                              └──────────────────────┘

QR Code Encodes: 550e8400-...
           ↓ Email sent with GUID


┌─────────────────────────────────────────────────────────────┐
│ SCAN & REDEEM                                               │
└─────────────────────────────────────────────────────────────┘

Admin Scan: "550e8400-..."
           ↓
Frontend sends: { TokenUid: "550e8400-..." }
           ↓
Backend Query: 
  SELECT * FROM MealTokens 
  WHERE TokenUid = '550e8400-...'
           ↓
❌ NOT FOUND!
   (Looking for TokenUid, but got QRGroupCode)
           ↓
Error: "Token not found"
```

## AFTER FIX ✅

```
┌─────────────────────────────────────────────────────────────┐
│ PURCHASE QR BUNDLE (Same as before)                         │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐      ┌──────────────────────┐
│   QRTokenGroup       │      │   MealToken #1       │
├──────────────────────┤      ├──────────────────────┤
│ Id: 5                │◄─────│ Id: 101              │
│ QRCode: 550e8400-... │      │ TokenUid: abc12345-..│
│ TotalTokens: 2       │      │ Status: Purchased    │
│ RemainingTokens: 2   │      │ QRTokenGroupId: 5    │
│ RedeemedTokens: 0    │      └──────────────────────┘
└──────────────────────┘      
                              ┌──────────────────────┐
                              │   MealToken #2       │
                              ├──────────────────────┤
                              │ Id: 102              │
                              │ TokenUid: def67890-..│
                              │ Status: Purchased    │
                              │ QRTokenGroupId: 5    │
                              └──────────────────────┘

QR Code Encodes: 550e8400-...
           ↓ Email sent with GUID


┌─────────────────────────────────────────────────────────────┐
│ SCAN & REDEEM                                               │
└─────────────────────────────────────────────────────────────┘

Admin Scan: "550e8400-..."
           ↓
Frontend sends: { QRGroupCode: "550e8400-..." }
           ↓
Backend Query #1:
  SELECT * FROM QRTokenGroups 
  WHERE QRCode = '550e8400-...'
           ↓
✅ FOUND! QRTokenGroup (Id=5)
           ↓
Backend Query #2:
  SELECT TOP 1 * FROM MealTokens 
  WHERE QRTokenGroupId = 5 
    AND Status != 'Redeemed'
           ↓
✅ FOUND! MealToken (Id=102)
           ↓
Update MealToken:
  - Status = Redeemed
  - RedeemedAt = NOW()
  ↓
Update QRTokenGroup:
  - RemainingTokens = 1
  - RedeemedTokens = 1
           ↓
✅ Success: "Token redeemed!"
Display: "1 token remaining in bundle"
Servo: Opens gate
```

## Key Changes

| Aspect | Before | After |
|--------|--------|-------|
| **QR Encodes** | QRCode GUID | Same (QRCode GUID) |
| **Frontend Sends** | `TokenUid: GUID` | `QRGroupCode: GUID` |
| **Backend Lookup** | MealToken.TokenUid | QRTokenGroup.QRCode |
| **Then Finds** | Direct token | Group, then first unredeemed token from group |
| **Result** | ❌ Not found | ✅ Success! |

## Payload Comparison

### Before (Wrong)
```json
{
  "TokenUid": "550e8400-e29b-41d4-a716-446655440000"
}
```
❌ This is the QR Group code, not a TokenUid!

### After (Correct)
```json
{
  "QRGroupCode": "550e8400-e29b-41d4-a716-446655440000"
}
```
✅ Correctly identifies it as a group code!

## Multi-Scan Behavior

### First Scan
```
QRTokenGroup
├─ RemainingTokens: 2
└─ RedeemedTokens: 0

Scan QR...
↓
MealToken #1 → Redeemed
↓
QRTokenGroup
├─ RemainingTokens: 1 ✓ Decremented
└─ RedeemedTokens: 1 ✓ Incremented
```

### Second Scan (5 seconds later)
```
QRTokenGroup
├─ RemainingTokens: 1
└─ RedeemedTokens: 1

Scan QR again...
↓
MealToken #2 → Redeemed
↓
QRTokenGroup
├─ RemainingTokens: 0 ✓ All used!
├─ RedeemedTokens: 2 ✓ Complete
└─ Status: Completed ✓ Mark as done
```

## Error Handling

### Invalid/Expired QR Code
```
QRGroupCode: "invalid-guid-format"
           ↓
SELECT * FROM QRTokenGroups 
WHERE QRCode = 'invalid-guid-format'
           ↓
❌ NOT FOUND
           ↓
Response: "QR code not found. Invalid or expired QR code."
```

### All Tokens Already Redeemed
```
QRTokenGroup.RemainingTokens = 0
           ↓
SELECT TOP 1 * FROM MealTokens 
WHERE QRTokenGroupId = 5 
  AND Status != 'Redeemed'
           ↓
❌ NO RESULTS (All redeemed)
           ↓
Response: "All tokens in this QR code have already been redeemed."
```

## Technical Details

### What Changed in Backend

**RedeemRequest.cs:**
```csharp
// Before
public Guid? TokenUid { get; set; }

// After
public Guid? TokenUid { get; set; }
public Guid? QRGroupCode { get; set; }  // ← NEW
```

**TokensController.cs RedeemToken():**
```csharp
// Before
else if (req.TokenUid.HasValue)
{
    token = await _context.MealTokens
        .FirstOrDefaultAsync(t => t.TokenUid == req.TokenUid.Value);
    // ❌ Always looking for TokenUid
}

// After
else if (req.QRGroupCode.HasValue)
{
    // ✅ NEW: Look for QRTokenGroup first
    var qrGroup = await _context.QRTokenGroups
        .FirstOrDefaultAsync(qr => qr.QRCode == req.QRGroupCode.Value);
    
    // ✅ Get first unredeemed token from group
    token = await _context.MealTokens
        .FirstOrDefaultAsync(t => t.QRTokenGroupId == qrGroup.Id 
            && t.Status != TokenStatus.Redeemed);
}
```

### What Changed in Frontend

**AdminScan.jsx processTokenFromQR():**
```javascript
// Before
if (isValidGUID) {
  payload.TokenUid = formatted;  // ❌ Wrong assumption
}

// After
if (isValidGUID) {
  payload.QRGroupCode = formatted;  // ✅ Correct for bundles
  // Fallback to TokenUid if needed
}
```

## Backwards Compatibility

✅ **All existing token types still work:**
- Single tokens with TokenId (integer) → Still works
- Single tokens with TokenUid (GUID) → Still works as fallback
- QR bundles with QRGroupCode (GUID) → Now works!

