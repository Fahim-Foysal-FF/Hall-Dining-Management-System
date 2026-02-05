# Servo Not Triggering - Diagnosis & Fix

## Problem
When a token is verified, the servo gate does not open.

## Root Cause
The **ESP32 IP address is not configured correctly** or the **ESP32 is not running**.

Currently configured IP: `10.221.0.50` (in `.env.local`)

## Solution

### Step 1: Upload ESP32 Code (If Not Done Yet)

1. Open `ESP32_SERVO_CONVEYOR.ino` in Arduino IDE
2. Edit lines 7-8:
```cpp
const char* ssid     = "YOUR_WIFI_SSID";      // Your WiFi name
const char* password = "YOUR_WIFI_PASSWORD";  // Your WiFi password
```
3. Plug in ESP32 via USB
4. Select Board: `Tools > Board > esp32 > ESP32 Dev Module`
5. Select Port: `Tools > Port > COM[X]` (e.g., COM3)
6. Click **Upload**
7. **Open Serial Monitor** (Tools > Serial Monitor, baud rate: 115200)
8. **Note the IP address** shown (e.g., `192.168.1.50`)

### Step 2: Update Frontend Configuration

Update `.env.local` with the **actual ESP32 IP** from Serial Monitor:

**File:** `hdms-client/.env.local`
```
VITE_ESP32_URL=http://192.168.1.50
```

Replace `192.168.1.50` with your ESP32's actual IP.

### Step 3: Restart React Dev Server

```bash
cd hdms-client
npm run dev
```

Wait for "VITE v5..." message to appear.

### Step 4: Test the Servo

#### Option A: Direct Test in Browser
1. Go to `http://192.168.1.50/open-gate` (replace IP)
2. Servo should open (arm moves to 90°) for 5 seconds
3. Then closes automatically

#### Option B: Token Scan Test
1. Go to `http://localhost:5174/admin/scan`
2. Scan/enter a token
3. On success, check browser console (F12 > Console)
4. Look for message: `[Hardware] ✓ Servo gate triggered successfully`

## Debugging Steps

If servo still doesn't trigger:

### Check 1: ESP32 is Running
```bash
ping 192.168.1.50
```
(Replace IP with your ESP32's IP)

**Expected:** Replies from the ESP32

**If fails:** ESP32 is offline or IP is wrong. Restart ESP32 and check Serial Monitor again.

### Check 2: Verify Backend Token Redemption Works
1. Scan token at `http://localhost:5174/admin/scan`
2. Check if message shows: `✅ Token redeemed successfully!`

**If NO:** Backend issue, not servo issue. Check backend logs.

**If YES:** Move to Check 3.

### Check 3: Verify Servo Configuration

Open browser Console (F12) after scanning token:

**Look for one of these:**
```
[Hardware] ✓ Servo gate triggered successfully
[Hardware] Servo gate trigger sent (direct, no-cors fallback)
[Hardware] Sent image beacon fallback
```

**If you see any of these:** Frontend is calling the servo correctly. ESP32 may have received the command but servo might not be moving due to:
- Servo not connected properly
- Wrong GPIO pin
- Power supply issue

**If you see timeout error:**
```
[Hardware] Servo gate request timeout - ESP32 may be unreachable
```

→ ESP32 IP is wrong or ESP32 is offline.

### Check 4: Test ESP32 Endpoints Directly

1. Open browser and visit: `http://192.168.1.50/status`
   **Expected response:**
   ```json
   {"status":"ok","servo_open":false,"uptime_ms":12345}
   ```

2. If this works, ESP32 is online. Then try: `http://192.168.1.50/open-gate`
   **Expected:** Servo moves for 5 seconds

3. If neither works: ESP32 needs to be restarted or code needs to be re-uploaded

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Timeout error when scanning | Update .env.local with correct ESP32 IP and restart React |
| `/status` endpoint times out | Check ESP32 is powered and connected to WiFi (check Serial Monitor) |
| `/status` works but servo doesn't move | Check servo wiring, power, and GPIO 5 pin configuration |
| React dev server fails to start | Check Node.js version, run `npm install` again |

## File Locations

| File | Purpose |
|------|---------|
| `ESP32_SERVO_CONVEYOR.ino` | Arduino sketch - upload to ESP32 |
| `hdms-client/.env.local` | Frontend configuration - set ESP32 IP here |
| `hdms-client/src/config/espConfig.js` | Servo trigger function (read-only) |
| `hdms-client/src/pages/Admin/AdminScan.jsx` | Token scan page that triggers servo |

## Next Steps

1. **If you have ESP32:** Follow Step 1-4 above
2. **If you don't have ESP32:** You need to purchase and setup hardware first. See [HARDWARE_SETUP_START_HERE.md](HARDWARE_SETUP_START_HERE.md)
3. **If ESP32 IP is correct but servo still doesn't move:** Check wiring. See [HARDWARE_INTEGRATION_GUIDE.md](HARDWARE_INTEGRATION_GUIDE.md)

---

**Questions?** Check the detailed guides:
- [HARDWARE_QUICK_REFERENCE.md](HARDWARE_QUICK_REFERENCE.md) - 5-minute setup
- [HARDWARE_TESTING_GUIDE.md](HARDWARE_TESTING_GUIDE.md) - Full testing phases
- [HARDWARE_INTEGRATION_GUIDE.md](HARDWARE_INTEGRATION_GUIDE.md) - Complete reference
