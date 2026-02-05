# QR Code Token Group Feature - Implementation Guide

## Overview

This document describes the new **QR Code Token Group** feature that has been implemented in the HDMS (Hostel Dining Management System). This feature allows users to purchase 1-4 meal tokens in a single QR code, where each token can be individually redeemed by scanning the QR code and selecting a quantity.

## Feature Description

### What Changed

Previously, users could only purchase one token at a time, and each token had its own unique QR code. With this new feature:

- **Users can now purchase 1-4 tokens in a single QR code** (QR Token Group)
- **All tokens are bundled under one QR code identifier**
- **When redeeming, users scan once and select how many tokens to redeem** (1-4)
- **Each scan decreases the remaining token count** in that QR group
- **User can continue scanning the same QR until all tokens are used**

### Example Flow

1. Student buys 3 lunch tokens for 2025-02-10 in one QR code
2. Gets one QR code with a single QR scan code
3. On meal day, admin scans the QR
4. System shows: "3 tokens remaining in this QR"
5. First redemption: uses 1 token (2 remaining)
6. Second time: admin scans same QR, uses 1 token (1 remaining)
7. Third time: admin scans same QR, uses final 1 token (0 remaining, group completed)

## Database Changes

### New Model: QRTokenGroup

Location: `Hdms.Api/Models/QRTokenGroup.cs`

```csharp
public class QRTokenGroup
{
    public int Id { get; set; }
    public Guid QRCode { get; set; }              // Unique QR identifier
    public string StudentId { get; set; }         // Student who owns this
    public int TotalTokens { get; set; }          // 1-4
    public int RemainingTokens { get; set; }      // Decrements with each redemption
    public int RedeemedTokens { get; set; }       // Counter
    public DateTime MealDate { get; set; }
    public MealType MealType { get; set; }        // Lunch/Dinner
    public decimal PricePerToken { get; set; }
    public string? MealPreference { get; set; }
    public int WeeklyMenuId { get; set; }
    public int? TokenOrderId { get; set; }
    public QRTokenGroupStatus Status { get; set; } // Active/Completed/Cancelled/Expired
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public ICollection<MealToken> MealTokens { get; set; }
}

public enum QRTokenGroupStatus
{
    Active = 0,
    Completed = 1,
    Cancelled = 2,
    Expired = 3
}
```

### Updated Model: MealToken

Added reference to QR Token Group:

```csharp
public int? QRTokenGroupId { get; set; }
public QRTokenGroup? QRTokenGroup { get; set; }
```

### Database Context

Updated `HdmsDbContext.cs`:
- Added `DbSet<QRTokenGroup>`
- Added relationships between MealToken and QRTokenGroup
- Configured decimal precision for PricePerToken

## API Changes

### New Endpoint: POST /api/orders/buy-qr-tokens

**Purpose**: Purchase multiple tokens (1-4) in one QR code

**Request Body**:
```json
{
  "date": "2025-02-10",
  "slot": "LUNCH",
  "quantity": 3,
  "preference": "Vegetarian"
}
```

**Response**:
```json
{
  "qrGroupId": 5,
  "qrCode": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2025-02-10",
  "slot": "LUNCH",
  "totalTokens": 3,
  "pricePerToken": 150.00,
  "totalPrice": 450.00,
  "mealPreference": "Vegetarian",
  "mealItems": "Rice, Curry, Vegetables",
  "message": "Successfully purchased 3 token(s) in one QR code!"
}
```

**Validations**:
- Quantity must be 1-4
- Daily token limit (4 total) is enforced
- Monthly limit is enforced on total tokens purchased
- User must have sufficient wallet balance
- Purchase window validation applies

### Updated Endpoint: POST /api/tokens/redeem

Now handles QR Token Groups:

**Response includes QR Group info**:
```json
{
  "message": "Token redeemed successfully.",
  "token": { ... },
  "student": { ... },
  "meal": { ... },
  "qrGroup": {
    "qrGroupId": 5,
    "qrCode": "550e8400-e29b-41d4-a716-446655440000",
    "totalTokens": 3,
    "redeemedTokens": 1,
    "remainingTokens": 2,
    "status": "Active"
  }
}
```

**Behavior**:
- When a token from a QR group is redeemed:
  - `RemainingTokens` decreases by 1
  - `RedeemedTokens` increases by 1
  - If all tokens redeemed, status changes to "Completed"

### Updated Endpoint: GET /api/tokens/scan

Now includes QR Group information in response when a token from a group is scanned.

## Frontend Changes

### Updated: BuyToken.jsx

**New UI Features**:
- Two purchase options per meal type:
  1. **Buy Single Token** - Original single token purchase
  2. **Buy in QR Code Bundle** - New option to buy 1-4 tokens

**Quantity Selector**:
- Number input (min: 1, max: 4)
- Live calculation of total cost
- Clear help text: "Get all tokens in one QR code. Scan once and select quantity at redemption!"

**Updated API Call**:
- Added `buyQRTokenGroup` function to `ordersApi.js`
- Supports quantity parameter
- Maintains backward compatibility with single token purchases

### Updated: AdminScan.jsx

**New Display**:
- Shows QR Group information when available
- Displays:
  - QR Group ID
  - QR Code value
  - Total Tokens in group
  - Redeemed count
  - **Remaining count** (highlighted with green badge if > 0)
  - Group status
- Green QR code icon in header
- Clear visual separation with divider

### Updated: MyTokens.jsx

**New Column: QR Group**:
- Shows "QR Group #ID" for tokens in a group
- Shows remaining/total tokens for that group
- Shows "Single Token" for individual tokens
- Uses green badge for QR group identification
- Responsive design maintains table usability

## DTOs

### QRTokenGroupDto.cs

Created comprehensive DTOs for QR token operations:

```csharp
public class QRTokenGroupDto { ... }        // QR group details
public class BuyQRTokenGroupRequest { ... }  // Purchase request (in BuyTokenRequest)
public class RedeemQRTokenResponse { ... }   // Redemption response
public class TokenScanDetailsDto { ... }     // Scanning details
public class StudentInfoDto { ... }          // Student info sub-object
public class MealInfoDto { ... }             // Meal info sub-object
```

## Update to Existing DTO

### BuyTokenRequest.cs

Added `Quantity` property:
```csharp
public int Quantity { get; set; } = 1; // 1-4 tokens (only for QR purchase)
```

## Business Logic

### Purchase Workflow

1. User selects quantity (1-4)
2. System validates:
   - Quantity is valid
   - Daily limit not exceeded (existing tokens + new quantity ≤ 4)
   - Monthly limit not exceeded
   - User has sufficient wallet balance
3. Creates QR Token Group with unique GUID
4. Creates individual MealToken records linked to the group
5. Deducts total cost from wallet
6. Sends QR code email to user
7. Returns QR group details

### Redemption Workflow

1. Admin scans QR code
2. System identifies token from the QR group
3. Validates token status and redemption window
4. Updates token status to Redeemed
5. Decrements RemainingTokens in QR group
6. Increments RedeemedTokens in QR group
7. If RemainingTokens = 0, marks group as Completed
8. Returns response including group status
9. Frontend displays remaining tokens

### Backward Compatibility

- Old single-token purchase still works
- Tokens without QRTokenGroupId are treated as single tokens
- AdminScan shows QR group info only when available
- MyTokens shows "Single Token" for non-grouped tokens

## Testing Checklist

### Backend Testing

- [ ] QRTokenGroup model created successfully
- [ ] Database migration runs without errors
- [ ] MealToken properly references QRTokenGroup
- [ ] POST /api/orders/buy-qr-tokens validates quantity (1-4)
- [ ] POST /api/orders/buy-qr-tokens validates daily limit
- [ ] POST /api/orders/buy-qr-tokens validates monthly limit
- [ ] POST /api/orders/buy-qr-tokens validates wallet balance
- [ ] Individual MealTokens are created for each token in group
- [ ] POST /api/tokens/redeem decrements RemainingTokens
- [ ] POST /api/tokens/redeem marks group as Completed when all tokens used
- [ ] GET /api/tokens/scan returns QR group info
- [ ] Email service receives QR code GUID

### Frontend Testing

- [ ] BuyToken.jsx loads correctly
- [ ] Quantity selector works (1-4 range)
- [ ] Total cost updates when quantity changes
- [ ] "Buy in QR Code Bundle" button calls correct API
- [ ] Success message displays after QR purchase
- [ ] AdminScan displays QR group info
- [ ] MyTokens shows QR group column
- [ ] MyTokens displays correct remaining/total tokens
- [ ] Mobile responsiveness maintained

### Integration Testing

- [ ] End-to-end: Purchase 3 tokens → See in MyTokens → Scan and redeem
- [ ] Verify QR group status transitions (Active → Completed)
- [ ] Verify wallet transactions recorded correctly
- [ ] Verify email includes QR code GUID (new format)
- [ ] Test with multiple QR groups for same meal date
- [ ] Test redemption of mixed single and grouped tokens

## Future Enhancements

1. **QR Code Image Generation**: Generate actual QR code images for email/download
2. **Batch Redemption UI**: Allow entering quantity at scan time
3. **QR Group History**: Show purchase history of groups
4. **Partial Redemption**: Allow marking tokens as partially used
5. **Group Sharing**: (Optional) Allow sharing QR code with friends
6. **Analytics**: Track QR group usage patterns

## File Structure Summary

### Backend Files Modified

```
Hdms.Api/
├── Models/
│   ├── QRTokenGroup.cs              (NEW)
│   └── MealToken.cs                 (MODIFIED)
├── DTOs/Tokens/
│   └── QRTokenGroupDto.cs           (NEW)
├── DTOs/Orders/
│   └── BuyTokenRequest.cs           (MODIFIED)
├── Controllers/
│   ├── OrdersController.cs          (MODIFIED - added buy-qr-tokens)
│   └── TokensController.cs          (MODIFIED - updated redeem & scan)
└── Data/
    └── HdmsDbContext.cs             (MODIFIED)
```

### Frontend Files Modified

```
hdms-client/src/
├── pages/Student/
│   ├── BuyToken.jsx                 (MODIFIED)
│   └── MyTokens.jsx                 (MODIFIED)
├── pages/Admin/
│   └── AdminScan.jsx                (MODIFIED)
└── api/
    └── ordersApi.js                 (MODIFIED - added buyQRTokenGroup)
```

## Notes for Developers

1. **Migration Required**: Run EF Core migrations to create QRTokenGroup table
2. **Email Service**: Ensure EmailService.SendTokenQrEmailAsync accepts Guid for QR code
3. **Backward Compatibility**: Old code using TokenId still works
4. **Validation**: All validations are server-side; frontend sends quantity
5. **Remaining Tokens**: Always check QR group status before displaying

## Deployment Instructions

1. Build backend solution
2. Run database migrations: `dotnet ef database update`
3. Update frontend dependencies
4. Rebuild frontend: `npm run build`
5. Test with sample data before production deployment
6. Monitor for any issues with QR code scanning

---

**Implementation Date**: February 4, 2026  
**Feature Status**: Complete and Ready for Testing
