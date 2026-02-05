# QR Token Group Feature - Quick Start Guide

## For Students (Frontend Users)

### How to Buy Tokens in a QR Code Bundle

1. Go to **"Buy Meal Token"** page
2. Select your meal date and preferences (Lunch/Dinner)
3. Choose one of two options:
   - **Buy Single Token** (existing): Get 1 token at a time
   - **Buy in QR Code Bundle** (NEW): Get 1-4 tokens in one QR code

4. For QR Code Bundle:
   - Select quantity: 1, 2, 3, or 4 tokens
   - Total price is calculated automatically
   - Click **"Buy X Token(s) in QR Code"**

5. You'll get a confirmation with:
   - One QR code for all tokens
   - The QR code GUID in the email
   - Total tokens purchased

### How to Redeem QR Bundle Tokens

1. Student brings the QR code on meal day
2. Admin scans the QR code
3. Admin sees: "3 tokens remaining in this QR" (example)
4. One meal is given (1 token consumed)
5. Remaining tokens: 2
6. Next day, student can scan the same QR again
7. Process repeats until all tokens are used

### Viewing Your Tokens

In **"My Tokens"** page:
- Look for the **"QR Group"** column
- Shows: "QR Group #5" with "2/3 remaining"
- "Single Token" = old individual token

## For Admins (Scanning & Redemption)

### Scanning QR Code Bundle

1. Use **Admin Scan** page
2. Scan the QR code
3. Token details appear with **NEW** section: **"QR Code Group Information"**
4. Shows:
   - QR Group ID
   - QR Code GUID
   - Total Tokens: 3
   - Redeemed: 1
   - **Remaining: 2** (green badge)
   - Status: Active/Completed

5. Click **"Verify & Redeem"** to redeem one token
6. System decrements remaining count
7. Next scan of same QR shows updated count

### Key Indicators

- **Green Badge**: Shows remaining tokens (good to go)
- **Gray Badge**: 0 remaining (group complete, no more to redeem)
- **"Status: Completed"**: All tokens from this QR have been used

## Technical Summary

| Feature | Single Token | QR Bundle |
|---------|--------------|-----------|
| Tokens per QR | 1 | 1-4 |
| Purchase at once | 1 | Multiple |
| QR Code | Individual | Shared |
| Redemption | One scan = done | Multiple scans allowed |
| Database | MealToken only | MealToken + QRTokenGroup |

## API Endpoints Quick Reference

### Purchase QR Bundle
```
POST /api/orders/buy-qr-tokens
{
  "date": "2025-02-10",
  "slot": "LUNCH",
  "quantity": 3,
  "preference": "Vegetarian"
}
```

### Redeem Token
```
POST /api/tokens/redeem
{
  "tokenUid": "550e8400-e29b-41d4-a716-446655440000"
}
Response includes qrGroup details
```

### Get Token Details
```
GET /api/tokens/scan?uid={guid}
Response includes qrGroup info
```

## Common Questions

**Q: What if I buy 3 tokens but only redeem 2?**  
A: The QR group status will still show "Active" with 1 remaining token. It stays valid until redeemed or meal date expires.

**Q: Can I share the QR code with my friend?**  
A: Currently no - the QR code is registered to your student account. Each person should purchase their own.

**Q: What happens if the meal date passes?**  
A: The QR group is marked as "Expired" and remaining tokens cannot be redeemed.

**Q: Do I need to do anything different on meal day?**  
A: No! Just bring the QR code (on phone or print). Admin scans it and gives you meals until tokens run out.

**Q: Can tokens be used partially?**  
A: Yes - each scan uses exactly 1 token. So if you buy 3 tokens, you can use 1 on day 1, 1 on day 2, 1 on day 3.

## Troubleshooting

**Issue**: "Limit reached: you can buy at most 4 tokens total"  
**Solution**: You can only buy up to 4 tokens per day/meal type. Wait until next day to buy more.

**Issue**: QR Code not scanning  
**Solution**: Check camera permissions on scanning device. Clear QR code printing. Try different angle.

**Issue**: Remaining tokens not updating  
**Solution**: Refresh the page. System updates after successful redemption.

**Issue**: "Insufficient wallet balance"  
**Solution**: Top up your wallet first. Each token costs the meal price × quantity.

---

For technical support, contact the admin team.
