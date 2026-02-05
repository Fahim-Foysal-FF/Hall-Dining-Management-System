# CHANGELOG - QR Token Group Feature

## [2.0.0] - 2026-02-04

### 🎉 New Features

#### QR Code Token Group System
- **Single QR Code for Multiple Tokens**: Users can now purchase 1-4 tokens in one QR code (previous: 1 token = 1 QR code)
- **Multiple Redemptions from One QR**: Admin can scan the same QR multiple times to redeem tokens one by one
- **Remaining Token Tracking**: System displays how many tokens remain in a QR group after each redemption
- **Group Status Management**: Automatic status transitions (Active → Completed) when all tokens are redeemed

#### Backend Changes

**New API Endpoint**
- `POST /api/orders/buy-qr-tokens` - Purchase 1-4 tokens in one QR code
  - Accepts `quantity` parameter (1-4)
  - Validates daily and monthly limits
  - Creates individual tokens linked to group
  - Returns QR code GUID for email

**Enhanced Existing Endpoints**
- `POST /api/tokens/redeem` - Now updates QR group remaining count
  - Decrements `RemainingTokens`
  - Increments `RedeemedTokens`
  - Returns group status in response
  - Marks group as `Completed` when all tokens used

- `GET /api/tokens/scan` - Now includes QR group details
  - Shows total tokens in group
  - Shows remaining tokens
  - Shows redeemed count
  - Shows group status

**New Models & DTOs**
- `QRTokenGroup` entity with enum `QRTokenGroupStatus`
  - Tracks: TotalTokens, RemainingTokens, RedeemedTokens
  - Status values: Active, Completed, Cancelled, Expired
  
- `QRTokenGroupDto` for API responses
- `RedeemQRTokenResponse` for redemption feedback
- `TokenScanDetailsDto` with nested info objects

**Database Schema**
- New table: `QRTokenGroups` with relationships to Users, Tokens, WeeklyMenus
- Modified `MealTokens` table with new `QRTokenGroupId` foreign key
- Indexes for performance optimization

#### Frontend Changes

**BuyToken Page Enhancement**
- New UI section: "Buy in QR Code Bundle"
- Quantity selector (1-4 slider/input)
- Live cost calculation
- Side-by-side with "Buy Single Token" option
- Help text: "Get all tokens in one QR code. Scan once and use multiple times!"
- New function: `handleBuyQR()` for batch purchase

**AdminScan Page Enhancement**
- New section: "QR Code Group Information"
  - Shows QR Group ID
  - Displays QR Code GUID
  - Shows Total/Redeemed/Remaining counts
  - Remaining count highlighted with green badge when > 0
  - Shows group status (Active/Completed/Expired)
- Green QR code icon indicator
- Separated from other token details with divider

**MyTokens Page Enhancement**
- New column: "QR Group"
  - Shows "QR Group #5" for grouped tokens
  - Displays "2/3 remaining" sub-text
  - Shows "Single Token" for non-grouped tokens
  - Green badge styling
- Table colspan updated from 8 to 9

**API Client**
- New function: `buyQRTokenGroup(payload)` in `ordersApi.js`
- Calls new endpoint with quantity parameter

### 🔄 Changed

**Backward Compatibility**
- Existing single-token purchase (`/orders/buy-token`) still works
- Tokens without `QRTokenGroupId` treated as single tokens
- Old code unaffected by changes
- Both systems coexist seamlessly

**Request DTO Change**
- `BuyTokenRequest.cs` now includes optional `Quantity` property
  - Default: 1 (single token)
  - Used by: `/orders/buy-qr-tokens` endpoint only

**Response Enhancements**
- `/tokens/redeem` response now includes optional `qrGroup` object
- `/tokens/scan` response now includes optional `qrGroup` object
- Backward compatible: null when not part of a group

### 🛠️ Technical Changes

**Architecture**
- Separate `QRTokenGroup` entity maintains clean separation of concerns
- One-to-Many relationship: QRTokenGroup → MealTokens
- Status enum provides type-safe state management

**Performance**
- Unique index on `QRTokenGroups.QRCode` for O(1) lookups
- Index on `StudentId` for fast filtering
- Index on `Status` for group queries
- Index on `MealTokens.QRTokenGroupId` for token lookups

**Validation**
- Daily limit: 4 total tokens (single + grouped combined)
- Monthly limit: Applied to total purchase
- Quantity validation: Must be 1-4
- Wallet verification: Required before purchase
- Purchase window: Respected for both single and bundle

### 📊 Database Migration

**New Table Structure**
```
QRTokenGroups
- Id (PK)
- QRCode (Unique GUID)
- StudentId (FK)
- TotalTokens (1-4)
- RemainingTokens (decrements)
- RedeemedTokens (increments)
- MealDate
- MealType
- PricePerToken
- MealPreference
- TokenOrderId (optional FK)
- WeeklyMenuId (FK)
- Status (enum)
- CreatedAt, CompletedAt
```

**Modified Table**
```
MealTokens
- Added: QRTokenGroupId (optional FK)
```

### 📱 UI/UX Improvements

**Student Interface**
- Clear choice between single and bundle purchase
- Visible quantity selector with range 1-4
- Real-time cost calculation
- Success message shows tokens purchased as bundle
- QR group indicator in token list

**Admin Interface**
- QR group details prominently displayed
- Visual indicator (green badge) for remaining tokens
- Clear status information
- Helps identify multi-use QR codes

### ✅ Validation & Safety

All validations occur at both frontend and backend:

**Purchase Validation**
- Quantity is integer between 1-4
- Daily token count won't exceed 4
- Monthly limit respected
- Wallet has sufficient funds
- Meal plan exists for date
- Purchase window is open

**Redemption Validation**
- Token belongs to QR group
- Token status is Purchasable
- Meal date not in past
- Redemption time window open
- QR group status is Active

### 🐛 Bug Fixes

- Meal preference now properly handled for grouped tokens
- Week menu lookup works correctly for all tokens
- Wallet transactions recorded with correct reference
- Email service receives QR code GUID in new format

### 📚 Documentation

Created comprehensive documentation:
1. **QR_TOKEN_GROUP_FEATURE.md** - Technical specification
2. **QR_TOKEN_QUICK_START.md** - User guide
3. **QR_TOKEN_MIGRATION_GUIDE.md** - Database migration steps
4. **QR_TOKEN_IMPLEMENTATION_SUMMARY.md** - Implementation overview

### 🚀 Deployment Notes

**Pre-Deployment**
- Review database migration file
- Test migration in staging environment
- Backup production database

**Deployment Steps**
1. Deploy backend code
2. Run database migration
3. Deploy frontend code
4. Verify all endpoints responding
5. Test QR purchase flow

**Post-Deployment**
- Monitor token purchases for issues
- Watch error logs
- Verify email sends QR codes
- Confirm AdminScan displays groups correctly

### 🔮 Future Considerations

**Planned Enhancements**
- Generate actual QR code images (currently GUID)
- Batch quantity selection at redemption time
- QR group purchase history view
- Token sharing with permission control
- Advanced analytics on QR usage

**Potential Optimizations**
- Cache QR group lookups
- Batch redemption confirmations
- WebSocket updates for admin scan
- Mobile app QR scanning

### ⚠️ Known Limitations

1. **No Image Generation**: QR code sent as GUID, not actual image
2. **No Quantity at Redemption**: Admin scans, 1 token used (no quantity select)
3. **No Sharing**: QR code tied to purchasing student only
4. **No Partial Usage**: Tokens are all-or-nothing per scan

### 🔒 Security

All endpoints require authentication:
- JWT token validation on all protected routes
- Student can only purchase for own account
- Admin can view all tokens
- Server-side validation of all inputs
- GUID uniqueness prevents token spoofing

### 📈 Performance Impact

**Minimal Impact Expected**
- New table separate from existing data
- Efficient indexes minimize query impact
- Relationship loading optimized with Include()
- Response sizes slightly larger (but negligible)

### 🧪 Testing Recommendations

**Unit Tests**
- QRTokenGroup creation logic
- Remaining token calculation
- Status transition logic
- Validation functions

**Integration Tests**
- Complete purchase flow
- Multiple redemption scenario
- Daily/monthly limit enforcement
- Email notification

**User Acceptance Tests**
- Student purchase experience
- Admin redemption process
- MyTokens display accuracy
- Cross-browser compatibility

---

## Version History

| Version | Date | Status |
|---------|------|--------|
| 2.0.0 | 2026-02-04 | 🎉 Released |
| 1.0.0 | Earlier | Production |

---

**Upgrade Path**: Direct upgrade from v1.0.0 to v2.0.0 with database migration

**Rollback**: If needed, remove migration to revert changes
