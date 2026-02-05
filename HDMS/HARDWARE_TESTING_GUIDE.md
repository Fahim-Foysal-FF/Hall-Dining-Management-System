# Hardware Integration Testing Guide

## Overview
This guide walks you through testing each component of the servo gate and conveyor belt system.

---

## Test Phase 1: Arduino Setup Verification

### ✅ Test 1.1: Code Compiles
1. Open [ESP32_SERVO_CONVEYOR.ino](ESP32_SERVO_CONVEYOR.ino) in Arduino IDE
2. Click **Sketch → Verify/Compile** (Ctrl+R)
3. **Expected:** "Compilation complete." message

**Troubleshooting:**
```
Error: unknown type name 'Servo'
→ Install ESP32Servo library (Tools → Manage Libraries)

Error: 'WiFi' does not name a type
→ Select correct board (Tools → Board → ESP32 Dev Module)

Error: 'SerializeJson' not found
→ Install ArduinoJson library (optional - remove if unused)
```

### ✅ Test 1.2: Code Uploads Successfully
1. Connect ESP32 via USB
2. Select **Tools → Port → COM3** (or your port)
3. Click **Upload** button
4. **Expected:** "Leaving... Hard resetting via RTS pin..." message

**Troubleshooting:**
```
Error: Failed to upload (timeout)
→ Try different USB cable / USB port / USB hub
→ Restart Arduino IDE
→ Restart ESP32 (disconnect/reconnect USB)
→ Check CH340 driver is installed (for some ESP32 boards)

Error: No COM ports available
→ Connect ESP32 via USB
→ Check Device Manager for USB device
→ Install CH340 driver if needed
```

### ✅ Test 1.3: Serial Monitor Shows Startup
1. Open **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. **Expected output:**
```
========================================
HDMS Dining Hall - ESP32 Control
========================================
[GPIO] Motor pins configured
[Servo] Gate servo configured and closed
  - Pin: GPIO5
  - Closed angle: 0°
  - Open angle: 90°
[WiFi] Connecting to 'YOUR_SSID'...
[WiFi] ✓ Connected!
[WiFi] IP Address: 192.168.1.50
[WiFi] Signal Strength: -45 dBm
[HTTP] Server started on port 80
  GET  /open-gate  - Open gate for 5 seconds
  GET  /status     - Get gate status
  GET  /health     - Health check

========================================
System Ready!
========================================
```

**What to do:**
- **Note the IP address** from this output (e.g., `192.168.1.50`)
- Keep Serial Monitor open for debugging

**Troubleshooting:**
```
Output shows: [WiFi] Failed to connect
→ Check SSID/password in code (case-sensitive!)
→ Ensure 2.4GHz WiFi (not 5GHz)
→ Move ESP32 closer to router
→ Restart ESP32

No output at all
→ Check baud rate is 115200
→ Check USB cable is connected
→ Try different USB port
→ Restart Arduino IDE
```

---

## Test Phase 2: Hardware Physical Tests

### ✅ Test 2.1: Power Verification
**Equipment needed:** Multimeter or power supply

1. **Servo power:**
   - Measure between servo GND and +5V lines
   - **Expected:** ~5V DC
   - If not: Check power supply and wiring

2. **Motor power:**
   - Measure between motor GND and motor power
   - **Expected:** ~12V DC (or your configured voltage)
   - If not: Check motor power supply

3. **ESP32 LED:**
   - Look for LED blinking on ESP32 board
   - **Expected:** LED blinks or stays on
   - If not: Check USB power or board issue

### ✅ Test 2.2: Servo Mechanical Test
**No code needed - just check mechanical operation**

1. Power on ESP32
2. Gently try to move servo arm by hand
3. **Expected:** Some resistance (motor holding position)
4. **If loose or very stiff:** May indicate servo issue

### ✅ Test 2.3: Motor Connection Test
1. Disconnect motor from driver (safely)
2. Apply 12V directly to motor pins
3. **Expected:** Motor shaft rotates
4. **If not:**
   - Check motor power connections
   - Motor may be defective

### ✅ Test 2.4: IR Sensor Output Test
Using a multimeter or oscilloscope:

1. Power on ESP32
2. Set multimeter to DC voltage
3. Connect to IR sensor OUT pin and GND
4. **Expected reading:**
   - No object: ~5V (HIGH)
   - Object nearby: ~0V (LOW)
   - Or opposite (depends on module)

**If readings are inverted:**
```cpp
// In code, change isBowlPresent():
return (val == HIGH);  // Instead of LOW
```

---

## Test Phase 3: Network & HTTP Tests

### ✅ Test 3.1: Ping ESP32
**Open Command Prompt/PowerShell:**

```bash
ping 192.168.1.50
```

**Expected output:**
```
Reply from 192.168.1.50: bytes=32 time=5ms TTL=64
```

**Troubleshooting:**
```
Request timed out / No reply
→ Check IP address matches Serial Monitor
→ Ensure PC and ESP32 on same WiFi
→ Check firewall settings
→ Try rebooting WiFi router
```

### ✅ Test 3.2: Check HTTP Server
Open browser and visit:

```
http://192.168.1.50/status
```

**Expected:**
- Page loads
- Shows text: `servo_closed`

**Troubleshooting:**
```
Connection refused / ERR_CONNECTION_REFUSED
→ ESP32 may not be online
→ Check IP address in URL
→ Check Serial Monitor for errors
→ Restart ESP32

Page shows random characters
→ Wrong baud rate in Serial Monitor
→ Doesn't affect HTTP - continue testing
```

### ✅ Test 3.3: Test Servo Trigger via Browser
Open browser and visit:

```
http://192.168.1.50/open-gate
```

**Expected:**
1. Browser shows: `Gate opened for 5 seconds`
2. Servo arm moves to 90° immediately
3. Servo returns to 0° after 5 seconds
4. Serial Monitor shows: `[Servo] Gate opened to 90°` and later `[Servo] Gate closed after 5 seconds`

**Troubleshooting:**
```
Servo doesn't move
→ Check servo signal wire on GPIO5
→ Check servo 5V power and GND
→ Try direct power to servo (5V)
→ Servo may be defective

Browser shows error instead of success
→ Check URL is exactly: http://192.168.1.50/open-gate
→ Check IP address
→ Try http://192.168.1.50/status first
```

### ✅ Test 3.4: Test Health Check Endpoint
```
http://192.168.1.50/health
```

**Expected:** JSON response
```json
{"status":"ok","servo_open":false,"uptime_ms":12345}
```

---

## Test Phase 4: React Frontend Integration

### ✅ Test 4.1: Check Configuration
1. Open `hdms-client/.env.local`
2. Verify it contains:
   ```
   VITE_ESP32_URL=http://192.168.1.50
   ```
3. **Replace IP with your ESP32 IP**

### ✅ Test 4.2: Restart React Dev Server
```bash
cd hdms-client
npm run dev
```

**Expected:**
```
  VITE v4.x.x  ready in 123 ms

  ➜  Local:   http://localhost:5174/
  ➜  press h to show help
```

### ✅ Test 4.3: Test Direct HTTP Call from Console
1. Go to `http://localhost:5174/admin/scan` in browser
2. Open DevTools (F12)
3. Go to **Console** tab
4. Run this command:
```javascript
fetch('http://192.168.1.50/open-gate', {method: 'GET'})
  .then(r => r.text())
  .then(t => console.log('Response:', t))
  .catch(e => console.error('Error:', e));
```

**Expected:**
- Console shows: `Response: Gate opened for 5 seconds`
- Servo moves to 90° for 5 seconds

**Troubleshooting:**
```
CORS error in console
→ This is normal if ESP32 is on different domain
→ ESP32 code includes CORS headers to allow this
→ Try test from different origin

Access denied / blocked
→ Check firewall isn't blocking port 80
→ Check IP address
```

---

## Test Phase 5: Full Integration Test

### ✅ Test 5.1: Prepare Test Token
1. Go to your backend admin panel
2. Create a test token (if not already done)
3. **Note the Token ID**

### ✅ Test 5.2: Generate QR Code
1. Use online QR generator: `https://www.qr-code-generator.com/`
2. Enter your Token ID (e.g., `12345`)
3. Download/print the QR code

### ✅ Test 5.3: Test Full Scan-to-Gate Flow
1. Go to `http://localhost:5174/admin/scan`
2. Grant camera permission when prompted
3. **Scan your test token QR code**
4. **Expected sequence:**
   ```
   a) QR code scans
   b) Message shows "Processing..."
   c) Backend validates token
   d) Message shows "✅ Token redeemed successfully!"
   e) Servo gate opens (moves to 90°) automatically
   f) After 5 seconds, servo closes (returns to 0°)
   g) Console shows: "[UI] Servo gate opened for meal access"
   ```

**Troubleshooting:**
```
Token scans but servo doesn't open
→ Check ESP32 IP in .env.local
→ Check React dev server restarted after env change
→ Check Serial Monitor shows gate opening command
→ Check Console (F12) for any errors

Servo opens but doesn't close after 5 sec
→ Check Serial Monitor in Arduino IDE
→ May indicate timing issue - check Arduino code

QR code won't scan
→ Check lighting
→ Check QR code resolution
→ Try with printed QR code instead of screen

Token shows error instead of success
→ Check token ID is correct
→ Check backend API is running
→ Check browser DevTools Network tab for API errors
```

---

## Test Phase 6: Conveyor Belt Tests

### ✅ Test 6.1: Motor Runs Without IR
1. Disconnect IR sensor (temporarily)
2. Watch Serial Monitor or observe motor
3. **Expected:** Motor runs continuously

**Troubleshooting:**
```
Motor doesn't run
→ Check motor GPIO wiring (16, 17)
→ Check motor power supply
→ Check motor direction in code
→ Test motor directly with power supply
```

### ✅ Test 6.2: Motor Stops with IR Detection
1. Reconnect IR sensor
2. Hold object near IR sensor (simulates bowl)
3. Watch Serial Monitor
4. **Expected:** Motor stops when object detected

**Troubleshooting:**
```
Motor doesn't respond to IR
→ Check IR sensor wiring (GPIO 4)
→ Enable debug output in code
→ Test IR sensor response with multimeter
→ Check if sensor logic is inverted
```

### ✅ Test 6.3: IR Sensor Works in Loop
1. Repeatedly move object near sensor
2. Watch motor stop/start
3. **Expected:** Smooth on/off response

**Optional: Add Debug Output**
Uncomment these lines in ESP32 code to see sensor readings:
```cpp
// In isBowlPresent():
Serial.printf("[IR] Sensor value: %d (%s)\n", val, detected ? "Bowl present" : "No bowl");

// In conveyorOn/Off():
Serial.println("[Motor] ON/OFF");
```

---

## Test Phase 7: Stress & Edge Cases

### ✅ Test 7.1: Multiple Rapid Scans
1. Scan tokens in quick succession
2. **Expected:** Each scan triggers servo independently, no conflicts

### ✅ Test 7.2: ESP32 Offline Test
1. Unplug ESP32 WiFi or power
2. Try scanning token
3. **Expected:** Token still redeems, but servo doesn't open (error in console, no blocking)

### ✅ Test 7.3: Long WiFi Delay
1. Move ESP32 away from router (weak signal)
2. Scan token
3. **Expected:** May take longer, but still works (timeout after 5 sec)

### ✅ Test 7.4: Concurrent Requests
1. Open multiple browser tabs
2. Manually trigger `/open-gate` in each tab simultaneously
3. **Expected:** Servo handles all requests, last one wins

---

## Test Completion Checklist

- [ ] Serial Monitor shows startup messages
- [ ] ESP32 IP address noted and accessible
- [ ] Ping to ESP32 succeeds
- [ ] `/status` endpoint responds
- [ ] `/open-gate` triggers servo movement
- [ ] Servo moves to 90° and returns to 0° after 5 sec
- [ ] Motor runs when no object detected
- [ ] Motor stops when IR detects bowl
- [ ] React dev server running
- [ ] `.env.local` has correct ESP32 IP
- [ ] Console can trigger servo via fetch()
- [ ] Scanning token opens servo automatically
- [ ] No CORS errors in browser console
- [ ] All quick reference tests pass

---

## Performance Metrics

### Expected Response Times
| Operation | Expected Time |
|-----------|-----------------|
| `/open-gate` HTTP request | <100ms |
| Servo movement to 90° | ~300ms |
| Browser fetch() call | <200ms |
| Token scan to servo open | <1 sec |

### System Behavior
| Scenario | Expected |
|----------|----------|
| Servo open duration | Exactly 5 seconds |
| Motor response to IR | <50ms |
| Concurrent HTTP requests | All handled |
| ESP32 unreachable | Token redeems, no gate |

---

## Debug Commands

### Quick Test in Arduino Serial Monitor
Just paste these at debug time (if you add serial input handling):

```cpp
// In loop(), add:
if (Serial.available()) {
  char c = Serial.read();
  if (c == 'o') openGateFor5s();  // 'o' to open
  if (c == 'm') conveyorOn();     // 'm' to run motor
  if (c == 's') conveyorOff();    // 's' to stop motor
}
```

Then type characters in Serial Monitor to test.

---

## Getting Help

If a test fails:
1. Check the **Troubleshooting** section in that test
2. Verify wiring matches the pinout diagram
3. Check Serial Monitor for error messages
4. Try the test in [HARDWARE_INTEGRATION_GUIDE.md](HARDWARE_INTEGRATION_GUIDE.md)
5. Review the complete [ESP32_SERVO_CONVEYOR.ino](ESP32_SERVO_CONVEYOR.ino) code

