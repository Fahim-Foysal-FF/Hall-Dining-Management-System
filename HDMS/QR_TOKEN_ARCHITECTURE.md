# QR Token Group Feature - Visual Architecture Guide

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     HDMS System Architecture                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐           ┌──────────────────────┐    │
│  │   Frontend (React)   │           │  Backend (.NET)      │    │
│  │                      │           │                      │    │
│  │ ┌────────────────┐   │           │ ┌──────────────────┐ │    │
│  │ │ BuyToken Page  │   │──API──────→ │OrdersController  │ │    │
│  │ │ - Single Token │   │           │ │ - buy-token      │ │    │
│  │ │ - QR Bundle    │   │           │ │ - buy-qr-tokens  │ │    │
│  │ └────────────────┘   │           │ └──────────────────┘ │    │
│  │                      │           │                      │    │
│  │ ┌────────────────┐   │           │ ┌──────────────────┐ │    │
│  │ │ AdminScan Page │   │──API──────→ │TokensController  │ │    │
│  │ │ - Show QR Info │   │           │ │ - redeem (upd)   │ │    │
│  │ │ - Remaining    │   │           │ │ - scan (upd)     │ │    │
│  │ └────────────────┘   │           │ └──────────────────┘ │    │
│  │                      │           │                      │    │
│  │ ┌────────────────┐   │           │                      │    │
│  │ │ MyTokens Page  │   │           │                      │    │
│  │ │ - QR Group Col │   │           │                      │    │
│  │ │ - Remaining    │   │           │                      │    │
│  │ └────────────────┘   │           │                      │    │
│  │                      │           │                      │    │
│  └──────────────────────┘           └──────────────────────┘    │
│                                                 │                │
│                                    ┌────────────▼────────────┐  │
│                                    │   Database (SQL)        │  │
│                                    │                         │  │
│                                    │  MealTokens             │  │
│                                    │  ├─ Id                  │  │
│                                    │  ├─ TokenUid            │  │
│                                    │  ├─ QRTokenGroupId (NEW)│  │
│                                    │  └─ ...                 │  │
│                                    │                         │  │
│                                    │  QRTokenGroups (NEW)    │  │
│                                    │  ├─ Id                  │  │
│                                    │  ├─ QRCode              │  │
│                                    │  ├─ TotalTokens         │  │
│                                    │  ├─ RemainingTokens     │  │
│                                    │  ├─ RedeemedTokens      │  │
│                                    │  └─ Status              │  │
│                                    │                         │  │
│                                    └─────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Model Relationships

```
┌─────────────────────┐
│  ApplicationUser    │
│  ┌───────────────┐  │
│  │ Id            │  │
│  │ FullName      │  │
│  │ WalletBalance │  │
│  └───────────────┘  │
└──────────┬──────────┘
           │
      ┌────┴────┬────────────────┐
      │          │                │
      ▼          ▼                ▼
┌──────────┐ ┌──────────────┐ ┌──────────────┐
│MealToken │ │ TokenOrder   │ │QRTokenGroup  │ (NEW)
├──────────┤ ├──────────────┤ ├──────────────┤
│ Id       │ │ Id           │ │ Id           │
│ TokenUid │ │ StudentId(FK)│ │ QRCode(GUID) │
│ Date     │ │ TotalAmount  │ │ StudentId(FK)│
│ MealType │ │ PaymentStatus│ │ TotalTokens  │
│ Price    │ │              │ │ RemainingTokens
│ Status   │ │              │ │ RedeemedTokens
│ QRToken  │ │              │ │ MealDate     │
│ GroupId  │ │              │ │ MealType     │
│  (FK)─┐  │ │              │ │ Status       │
└────────┘ └──────────────┘ └──────────────┘
         │                   │
         └───────────────────┘
              (links)
```

## Purchase Flow Diagram

```
SINGLE TOKEN PURCHASE
═══════════════════════════════════════════════════════════════

Student              Frontend              API                Database
   │                   │                   │                    │
   │──Select Lunch─────→│                   │                    │
   │                    │                   │                    │
   │                    │──POST /orders/buy-token─────→          │
   │                    │                   │                    │
   │                    │                   │──Create MealToken──→
   │                    │                   │                    │
   │←───Success Msg─────│←─────Response─────│←──Return Id────────│
   │                    │                   │                    │
   │  (Get 1 QR code)   │                   │                    │


QR BUNDLE PURCHASE (NEW)
═══════════════════════════════════════════════════════════════

Student              Frontend              API                Database
   │                   │                   │                    │
   │─Select "Buy in    │                   │                    │
   │  QR Bundle"       │                   │                    │
   │  (Quantity: 3)────→│                   │                    │
   │                    │                   │                    │
   │                    │──POST /orders/buy-qr-tokens───────────→│
   │                    │                   │                    │
   │                    │                   │──Create QRTokenGroup
   │                    │                   │  (Id, QRCode,      │
   │                    │                   │   TotalTokens=3,   │
   │                    │                   │   RemainingTokens=3)
   │                    │                   │  ├────────────────→│
   │                    │                   │  │                 │
   │                    │                   │  Create 3 MealTokens
   │                    │                   │  (all linked to    │
   │                    │                   │   QRTokenGroupId)  │
   │                    │                   │  └────────────────→│
   │                    │                   │                    │
   │←────Success Msg────│←──Response────────│←──Return QRCode───│
   │ "3 tokens in       │ (includes QRCode)  │                    │
   │  1 QR code!"       │                    │                    │
   │                    │                    │                    │
   │  (Get 1 QR code for 3 tokens)          │                    │
```

## Redemption Flow Diagram

```
SINGLE TOKEN REDEMPTION (Same as before)
═════════════════════════════════════════════════════════════════

Admin               Frontend              API                Database
   │                   │                   │                    │
   │──Scan QR Code─────→│                   │                    │
   │                    │                   │                    │
   │                    │──POST /tokens/redeem───────────────────→
   │                    │                   │                    │
   │                    │                   │  Update MealToken
   │                    │                   │  Status=Redeemed   │
   │                    │                   │  ├────────────────→
   │                    │                   │  │                 │
   │                    │                   │  (No QRTokenGroup) │
   │                    │                   │                    │
   │←─Display Details───│←──Response────────│←──Return Info──────│
   │ (Token info only)   │                   │                    │


QR BUNDLE REDEMPTION (NEW - Multiple scans, one per token)
═════════════════════════════════════════════════════════════════

SCAN 1: 3 tokens remaining
─────────────────────────

Admin               Frontend              API                Database
   │                   │                   │                    │
   │──Scan Same QR─────→│                   │                    │
   │  (has 3 tokens)    │                   │                    │
   │                    │──POST /tokens/redeem───────────────────→
   │                    │                   │                    │
   │                    │                   │  Update MealToken
   │                    │                   │  Status=Redeemed   │
   │                    │                   │  └────────────────→│
   │                    │                   │  │                 │
   │                    │                   │  Update QRTokenGroup
   │                    │                   │  RemainingTokens: 3→2
   │                    │                   │  RedeemedTokens: 0→1
   │                    │                   │  ├────────────────→│
   │                    │                   │                    │
   │←─Display Details───│←──Response────────│←──Return QRInfo────│
   │ "QR Group #5"      │                   │ (Remaining: 2/3)   │
   │ "2 tokens left"    │                   │                    │


SCAN 2: 2 tokens remaining
──────────────────────────

Admin               Frontend              API                Database
   │                   │                   │                    │
   │──Scan Same QR─────→│                   │                    │
   │  (now has 2)       │                   │                    │
   │                    │                   │                    │
   │                    │──POST /tokens/redeem───────────────────→
   │                    │                   │                    │
   │                    │                   │  Update next token
   │                    │                   │  Status=Redeemed   │
   │                    │                   │  └────────────────→│
   │                    │                   │  │                 │
   │                    │                   │  Update QRTokenGroup
   │                    │                   │  RemainingTokens: 2→1
   │                    │                   │  RedeemedTokens: 1→2
   │                    │                   │  ├────────────────→│
   │                    │                   │                    │
   │←─Display Details───│←──Response────────│←──Return QRInfo────│
   │ "QR Group #5"      │                   │ (Remaining: 1/3)   │
   │ "1 token left"     │                   │                    │


SCAN 3: 1 token remaining (LAST)
────────────────────────────────

Admin               Frontend              API                Database
   │                   │                   │                    │
   │──Scan Same QR─────→│                   │                    │
   │  (final token)     │                   │                    │
   │                    │                   │                    │
   │                    │──POST /tokens/redeem───────────────────→
   │                    │                   │                    │
   │                    │                   │  Update last token
   │                    │                   │  Status=Redeemed   │
   │                    │                   │  └────────────────→│
   │                    │                   │  │                 │
   │                    │                   │  Update QRTokenGroup
   │                    │                   │  RemainingTokens: 1→0
   │                    │                   │  RedeemedTokens: 2→3
   │                    │                   │  Status: Active→Completed ✓
   │                    │                   │  ├────────────────→│
   │                    │                   │                    │
   │←─Display Details───│←──Response────────│←──Return QRInfo────│
   │ "QR Group #5"      │                   │ (Remaining: 0/3)   │
   │ "COMPLETED ✓"      │                   │ Status: Completed  │
   │ (Green badge)      │                   │                    │
```

## State Diagram - QRTokenGroup Status

```
┌──────────────┐
│   Created    │
└──────┬───────┘
       │
       ▼
┌──────────────────┐         All tokens        ┌───────────────┐
│ ACTIVE           │────redeemed one by one──→ │ COMPLETED ✓   │
│ (Remaining > 0)  │                           │ (Remaining=0) │
└────┬───────────────────────────────┬─────────┘
     │                               │
     │ (Cancellation)                │ (Date Expires)
     │                               │
     ▼                               ▼
┌──────────────┐            ┌───────────────┐
│ CANCELLED    │            │ EXPIRED       │
│ (Manual)     │            │ (Auto)        │
└──────────────┘            └───────────────┘
```

## API Endpoint Hierarchy

```
/api/orders/
├── buy-token (POST)
│   └── Single token purchase
│       Request: { date, slot, preference }
│       Response: { TokenId, TokenUid, ... }
│
├── buy-qr-tokens (POST) ← NEW
│   └── QR bundle purchase (1-4 tokens)
│       Request: { date, slot, quantity, preference }
│       Response: { QRGroupId, QRCode, TotalTokens, RemainingTokens, ... }
│
└── wallet (GET)
    └── Wallet balance & transactions

/api/tokens/
├── my (GET)
│   └── Student's tokens
│
├── redeem (POST) ← UPDATED
│   └── Redeem single token
│       Request: { TokenUid or TokenId }
│       Response: { Token, Student, Meal, QRGroup (optional) }
│
├── scan (GET) ← UPDATED
│   └── Get token details for scanning
│       Query: ?uid={guid}
│       Response: { Token, Student, Meal, QRGroup (optional) }
│
└── debug/...
    └── Debug endpoints
```

## Feature Comparison Matrix

```
┌──────────────────────┬──────────────────┬──────────────────┐
│ Feature              │ Single Token     │ QR Bundle (NEW)  │
├──────────────────────┼──────────────────┼──────────────────┤
│ Tokens per Purchase  │ 1                │ 1-4              │
│ QR Codes             │ 1 per token      │ 1 for all        │
│ Redemptions          │ 1 (final)        │ Multiple         │
│ Same-day Scan        │ No               │ Yes (repeatable) │
│ Price Calc           │ Unit price       │ Unit × Quantity  │
│ Remaining Display    │ N/A              │ Count in group   │
│ Group Status         │ N/A              │ Tracked          │
│ Completion           │ 1 scan           │ Incremental      │
│ Database Records     │ 1 Token record   │ 1 Group + N Tokens
└──────────────────────┴──────────────────┴──────────────────┘
```

## UI Component Update Map

```
Frontend Pages with Changes:

BuyToken.jsx
├── State Updates
│   ├── lunchQuantity (1-4)
│   ├── dinnerQuantity (1-4)
│   └── buyingQR (boolean)
├── UI Sections
│   ├── "Buy Single Token" (existing)
│   └── "Buy in QR Code Bundle" (NEW)
│       ├── Quantity input
│       ├── Cost calculator
│       └── Submit button
└── New Function
    └── handleBuyQR()

AdminScan.jsx
├── State
│   └── qrGroupInfo (extracted from details)
├── New UI Section
│   ├── "QR Code Group Information" (green icon)
│   ├── QR Group ID display
│   ├── Remaining count (green badge)
│   ├── Total/Redeemed counts
│   └── Status display
└── Conditional Rendering
    └── Shows only when qrGroup exists

MyTokens.jsx
├── Table Update
│   └── New Column: "QR Group"
│       ├── "QR Group #ID" (green badge)
│       ├── "X/Y remaining" (sub-text)
│       └── "Single Token" (for non-grouped)
└── ColSpan Update
    └── Changed from 8 to 9 columns
```

---

## Integration Points

```
┌─────────────────────────────────────────┐
│ Email Service Integration               │
├─────────────────────────────────────────┤
│ SendTokenQrEmailAsync(                  │
│   email, name, tokenId,                 │
│   date, slot, price,                    │
│   qrCodeGuid, ← GUID sent to email      │
│   preference                            │
│ )                                       │
└─────────────────────────────────────────┘
```

---

This architecture maintains backward compatibility while adding powerful new QR grouping capabilities!
