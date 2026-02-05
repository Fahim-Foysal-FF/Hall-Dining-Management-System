# Hardware Integration - Quick Reference

## 🚀 Quick Start (5 Steps)

### Step 1: Arduino IDE Setup (1 min)
```
1. Install Arduino IDE
2. Add ESP32 board: Preferences → Additional Boards → 
   https://dl.espressif.com/dl/package_esp32_index.json
3. Boards Manager → Install ESP32
4. Libraries → Search "ESP32Servo" → Install
```

### Step 2: Configure WiFi (1 min)
Edit the ESP32 sketch, find these lines:
```cpp
const char* ssid     = "YOUR_SSID";      // ← Put your WiFi name
const char* password = "YOUR_PASSWORD";   // ← Put your WiFi password
```

### Step 3: Upload Code (2 min)
1. Copy [ESP32_SERVO_CONVEYOR.ino](ESP32_SERVO_CONVEYOR.ino) into Arduino IDE
2. Select Tools → Board → **ESP32 Dev Module**
3. Select Tools → Port → **COM3** (or your ESP32 port)
4. Click **Upload** button
5. Watch Serial Monitor (115200 baud) for startup messages
6. **Note the IP address** shown (e.g., `192.168.1.50`)

### Step 4: Configure Frontend (1 min)
Create file `hdms-client/.env.local`:
```
VITE_ESP32_URL=http://192.168.1.50
```
Replace `192.168.1.50` with your ESP32 IP from Step 3.

Restart React dev server:
```bash
cd hdms-client
npm run dev
```

### Step 5: Test (2 min)
1. Visit `http://192.168.1.50/status` in browser → Should see `servo_closed`
2. Visit `http://192.168.1.50/open-gate` → Servo should move for 5 seconds
3. Scan a token at `/admin/scan` → Servo should open automatically!

---

## 📍 Pin Wiring Reference

```
ESP32 Pin 5  ──[220Ω]──→ Servo Signal
ESP32 Pin 4  ──────────→ IR Sensor OUT
ESP32 Pin 16 ──────────→ Motor Driver IN1
ESP32 Pin 17 ──────────→ Motor Driver IN2
ESP32 GND    ──────────→ Common GND (servo, motor, IR)
ESP32 5V     ──────────→ Servo Power
```

### Pin Mapping (Changeable in Code)
| Function | Default Pin | File | Variable |
|----------|------------|------|----------|
| Servo Signal | GPIO 5 | ESP32_SERVO_CONVEYOR.ino | `SERVO_PIN` |
| IR Sensor | GPIO 4 | ESP32_SERVO_CONVEYOR.ino | `IR_PIN` |
| Motor Forward | GPIO 16 | ESP32_SERVO_CONVEYOR.ino | `MOTOR_IN1` |
| Motor Backward | GPIO 17 | ESP32_SERVO_CONVEYOR.ino | `MOTOR_IN2` |

---

## 🔧 Common Issues & Fixes

### "Failed to upload" / Port not found
**Fix:** Check USB cable, try different USB port, reinstall CH340 driver

### "WiFi connected" but no IP shown
**Fix:** 
- Check WiFi password (case-sensitive)
- Ensure 2.4GHz network (not 5GHz)
- Restart ESP32 (power cycle)

### `http://192.168.1.50/status` shows connection error
**Fix:**
- Verify IP address matches Serial Monitor output
- Check PC and ESP32 are on same WiFi
- Check firewall isn't blocking port 80
- Try ping: `ping 192.168.1.50`

### Servo doesn't move at all
**Fix:**
- Check servo signal wire connects to GPIO 5 (or your configured pin)
- Check servo has power (5V) and ground
- Try moving servo with basic test code first

### Conveyor motor doesn't stop on bowl
**Fix:**
- Check IR sensor wiring (OUT pin to GPIO 4)
- Test IR sensor separately with Serial Monitor
- If inverted logic, change line in code:
  ```cpp
  return (val == HIGH);  // if LOW doesn't work
  ```

---

## 🌐 HTTP Endpoints

### Open Gate
```
GET http://192.168.1.50/open-gate
```
**Response:** `Gate opened for 5 seconds` (200 OK)

### Check Status
```
GET http://192.168.1.50/status
```
**Response:** `servo_open` or `servo_closed`

### Health Check
```
GET http://192.168.1.50/health
```
**Response:** JSON with system status

---

## 🎛️ Adjustable Parameters

### Servo Angles
**File:** `ESP32_SERVO_CONVEYOR.ino`
```cpp
const int SERVO_CLOSED_ANGLE = 0;    // Change for different closed position
const int SERVO_OPEN_ANGLE   = 90;   // Change for different open position
```

### Servo Duration
```cpp
const unsigned long SERVO_OPEN_DURATION = 5000; // milliseconds (5000 = 5 sec)
```

### Motor Direction
If belt spins backwards, in `conveyorOn()` swap the GPIO values:
```cpp
digitalWrite(MOTOR_IN1, LOW);   // was HIGH
digitalWrite(MOTOR_IN2, HIGH);  // was LOW
```

### IR Sensor Logic (Inverted)
If bowl detection is opposite, in `isBowlPresent()` change:
```cpp
return (val == HIGH);  // Instead of LOW
```

---

## 🔐 Security Notes

### Production Checklist
- [ ] Static IP or DHCP reservation for ESP32
- [ ] Firewall allows access from admin station only (optional)
- [ ] Reliable 5V power supply (not USB)
- [ ] Backend logs token redemptions for audit
- [ ] Fallback: Token redeems even if ESP32 unreachable
- [ ] Network: ESP32 on same subnet as admin devices

---

## 🧪 Testing Sequence

### Test 1: Hardware Only
1. Upload sketch to ESP32
2. Check Serial Monitor for startup messages
3. Manually trigger servo: `http://IP/open-gate`
4. Test IR sensor with debug Serial output
5. Test motor rotation direction

### Test 2: Network
1. Ping ESP32: `ping 192.168.1.50`
2. Check status: `http://192.168.1.50/status` in browser
3. Verify CORS headers in browser DevTools (Network tab)

### Test 3: Full Integration
1. Ensure `.env.local` has correct IP
2. Restart React dev server
3. Scan valid token at `/admin/scan`
4. Watch Serial Monitor for log messages
5. Verify servo opens automatically

---

## 📊 LED Debugging (Optional)

Add this for visual feedback without Serial Monitor:

```cpp
const int LED_PIN = 2;  // Built-in LED on many ESP32s

void setup() {
  pinMode(LED_PIN, OUTPUT);
  // ... rest of setup
}

void openGateFor5s() {
  digitalWrite(LED_PIN, HIGH);  // Turn on LED
  gateServo.write(SERVO_OPEN_ANGLE);
  servoOpen = true;
  servoOpenTime = millis();
}

void loop() {
  // ... existing loop code ...
  
  if (servoOpen && (millis() - servoOpenTime >= SERVO_OPEN_DURATION)) {
    gateServo.write(SERVO_CLOSED_ANGLE);
    digitalWrite(LED_PIN, LOW);  // Turn off LED
    servoOpen = false;
  }
}
```

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| [ESP32_SERVO_CONVEYOR.ino](ESP32_SERVO_CONVEYOR.ino) | Arduino sketch for ESP32 |
| [HARDWARE_INTEGRATION_GUIDE.md](HARDWARE_INTEGRATION_GUIDE.md) | Detailed setup guide |
| [hdms-client/src/config/espConfig.js](hdms-client/src/config/espConfig.js) | Frontend ESP32 config |
| [hdms-client/src/pages/Admin/AdminScan.jsx](hdms-client/src/pages/Admin/AdminScan.jsx) | Token scan with servo trigger |

---

## 🆘 Support Checklist

- [ ] All wiring double-checked
- [ ] ESP32 powered on and LED blinking
- [ ] Serial Monitor shows startup messages
- [ ] WiFi SSID/password correct (no typos)
- [ ] Correct IP address in `.env.local`
- [ ] React dev server restarted after env change
- [ ] Browser can reach `/status` endpoint
- [ ] Token scan shows success message
- [ ] Servo visibly moves on token scan

**Still stuck?** Check the detailed [HARDWARE_INTEGRATION_GUIDE.md](HARDWARE_INTEGRATION_GUIDE.md)

