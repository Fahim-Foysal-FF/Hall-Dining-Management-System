# Hardware Integration Summary

## What Was Set Up

Your HDMS dining management system now has **IoT hardware integration** for:

### 1. **Servo Gate Control** 🚪
- Triggers when a valid token is scanned
- Opens 90° for exactly 5 seconds
- Automatically closes after time expires
- Non-blocking (allows conveyor to work simultaneously)

### 2. **Conveyor Belt with Bowl Detection** 🔄
- Continuously rotates when no bowl detected
- **Stops automatically** when IR sensor detects a bowl
- Resumes rotation when bowl is removed
- Independent from servo timing

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your HDMS System                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  React Frontend (localhost:5174)                        │
│  └─→ /admin/scan                                        │
│      └─→ Scan QR code                                   │
│          └─→ Backend validates token                    │
│              └─→ SUCCESS → HTTP GET to ESP32            │
│                  └─→ /open-gate                         │
│                                                           │
│                                                           │
│  ESP32 (192.168.1.50) ← Configure with your IP          │
│  ├─→ Servo Gate                                         │
│  │   └─→ Opens 90° for 5 seconds                        │
│  │       └─→ Closes automatically                       │
│  │                                                       │
│  └─→ Conveyor Motor                                     │
│      ├─→ Reads IR Sensor                                │
│      ├─→ Bowl detected? → STOP motor                    │
│      └─→ No bowl? → RUN motor                           │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Files Created/Modified

### New Files
1. **[ESP32_SERVO_CONVEYOR.ino](ESP32_SERVO_CONVEYOR.ino)** - Arduino sketch for ESP32
2. **[hdms-client/src/config/espConfig.js](hdms-client/src/config/espConfig.js)** - Frontend ESP32 config
3. **[HARDWARE_INTEGRATION_GUIDE.md](HARDWARE_INTEGRATION_GUIDE.md)** - Detailed setup guide
4. **[HARDWARE_QUICK_REFERENCE.md](HARDWARE_QUICK_REFERENCE.md)** - Quick setup (5 steps)
5. **[HARDWARE_TESTING_GUIDE.md](HARDWARE_TESTING_GUIDE.md)** - Comprehensive testing

### Modified Files
- **[hdms-client/src/pages/Admin/AdminScan.jsx](hdms-client/src/pages/Admin/AdminScan.jsx)**
  - Added servo trigger call when token redeems successfully
  - Non-blocking (doesn't interfere with token scanning)

---

## Quick Setup (5 Minutes)

### 1️⃣ Upload ESP32 Code
```
1. Install Arduino IDE
2. Add ESP32 board support
3. Install ESP32Servo library
4. Edit WiFi SSID/password in ESP32_SERVO_CONVEYOR.ino
5. Upload sketch
6. Note the IP address from Serial Monitor
```

### 2️⃣ Configure Frontend
```
Create: hdms-client/.env.local
VITE_ESP32_URL=http://192.168.1.50
                           ↑ Use your ESP32 IP
```

### 3️⃣ Restart React
```bash
cd hdms-client
npm run dev
```

### 4️⃣ Test
```
1. Visit http://192.168.1.50/status in browser
2. Scan a token at /admin/scan
3. Watch servo open!
```

---

## How It Works

### Token Scan Flow
```
Student scans token
        ↓
Front-end sends to backend: /tokens/redeem
        ↓
Backend validates token
        ↓
✅ Valid? Send HTTP GET to ESP32: /open-gate
        ↓
ESP32 opens servo for 5 seconds
        ↓
Meal station opens! 🎉
```

### Servo Logic (Non-blocking)
```cpp
const unsigned long SERVO_OPEN_DURATION = 5000; // 5 seconds

while true {
  if (HTTP request received at /open-gate) {
    servo.write(90);      // Open immediately
    servoOpenTime = now;
  }
  
  if (servo is open AND 5 seconds passed) {
    servo.write(0);       // Close automatically
  }
  
  // Meanwhile, conveyor still running...
}
```

### Conveyor Logic (Continuous)
```cpp
while true {
  if (IR sensor detects bowl) {
    motorOff();    // Stop belt
  } else {
    motorOn();     // Keep rotating
  }
}
```

**Key:** Both run simultaneously, independent timing!

---

## Pin Configuration

| Component | Pin | Function |
|-----------|-----|----------|
| Servo | GPIO 5 | Gate control signal |
| IR Sensor | GPIO 4 | Bowl detection |
| Motor Forward | GPIO 16 | Conveyor forward control |
| Motor Backward | GPIO 17 | Conveyor backward control |

**All easily changeable in the ESP32 code if needed.**

---

## HTTP Endpoints

Your ESP32 provides three endpoints:

### `GET /open-gate`
Triggers the servo to open for 5 seconds
```
http://192.168.1.50/open-gate
→ Response: "Gate opened for 5 seconds" (200 OK)
```

### `GET /status`
Check current gate status
```
http://192.168.1.50/status
→ Response: "servo_open" or "servo_closed"
```

### `GET /health`
System health check
```
http://192.168.1.50/health
→ Response: JSON with uptime and status
```

---

## Testing Your Setup

### Phase 1: Hardware (Arduino IDE)
- [ ] Code compiles without errors
- [ ] Sketch uploads to ESP32
- [ ] Serial Monitor shows startup messages
- [ ] Note the IP address

### Phase 2: Network
- [ ] Ping ESP32 succeeds: `ping 192.168.1.50`
- [ ] Browser loads: `http://192.168.1.50/status`
- [ ] Servo moves: `http://192.168.1.50/open-gate`

### Phase 3: Integration
- [ ] React dev server running
- [ ] `.env.local` configured with ESP32 IP
- [ ] Scan token at `/admin/scan`
- [ ] **Servo opens automatically!** ✓

**Full testing guide:** [HARDWARE_TESTING_GUIDE.md](HARDWARE_TESTING_GUIDE.md)

---

## Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| ESP32 won't connect WiFi | Check SSID/password (case-sensitive), use 2.4GHz |
| Browser can't reach `/status` | Check IP address, ensure same WiFi network |
| Servo doesn't move | Check power (5V), signal wire (GPIO 5), wiring |
| Motor doesn't stop at bowl | Check IR sensor wiring, may need inverted logic |
| Token scans but servo doesn't open | Check `.env.local` has correct IP, restart React |

**Detailed troubleshooting:** [HARDWARE_INTEGRATION_GUIDE.md](HARDWARE_INTEGRATION_GUIDE.md#part-6-troubleshooting)

---

## Production Checklist

Before going live:

- [ ] Static IP or DHCP reservation for ESP32
- [ ] Reliable 5V power supply (not USB port)
- [ ] Test with multiple concurrent token scans
- [ ] Verify servo opens smoothly 100+ times
- [ ] Confirm IR sensor accuracy with test bowls
- [ ] Enable logging for token redemptions
- [ ] Place ESP32 on same network as admin workstations
- [ ] Test with slow WiFi (high latency)
- [ ] Ensure token still redeems if ESP32 offline

---

## Hardware Specifications

### ESP32 DevKit
- **Microcontroller:** Xtensa 32-bit LX6
- **WiFi:** 802.11 b/g/n (2.4 GHz)
- **GPIO Pins:** 38 (30 usable)
- **Power:** 5V USB or external
- **CPU Frequency:** 80/160 MHz

### Servo Motor (SG90 typical)
- **Voltage:** 4.8-6V (5V recommended)
- **Torque:** 1.6-2.2 kg·cm
- **Speed:** 0.1s/60° at 5V
- **Rotation:** 180° (0°-180°, we use 0°-90°)

### IR Obstacle Sensor
- **Voltage:** 5V DC
- **Output:** Digital (HIGH/LOW)
- **Range:** ~2-30cm (depends on module)
- **Detection:** Reflected infrared

### DC Motor (typical 12V)
- **Voltage:** 12V DC
- **Current:** Depends on load
- **Driver:** L298N or TB6612FNG recommended

---

## Troubleshooting Decision Tree

```
Servo doesn't open?
├─ Check power: Multimeter on 5V rail
├─ Check wiring: Pin 5 → Servo signal
├─ Check WiFi: Serial Monitor shows IP
├─ Check HTTP: Browser visits /status
└─ Check frontend: .env.local has correct IP

Motor doesn't stop at bowl?
├─ Check IR wiring: Pin 4 → Sensor out
├─ Check sensor: Multimeter shows 5V/0V
├─ Check logic: May need inverted (change HIGH to LOW)
└─ Check power: Motor powered correctly

Token scans but nothing happens?
├─ Check backend: Token actually redeems
├─ Check browser: Console for CORS errors
├─ Check IP: ESP32 IP correct in .env.local
├─ Check React: Dev server restarted
└─ Check network: Ping ESP32 works
```

---

## Support Resources

1. **Quick Setup:** [HARDWARE_QUICK_REFERENCE.md](HARDWARE_QUICK_REFERENCE.md) (5 minutes)
2. **Detailed Guide:** [HARDWARE_INTEGRATION_GUIDE.md](HARDWARE_INTEGRATION_GUIDE.md) (complete)
3. **Testing:** [HARDWARE_TESTING_GUIDE.md](HARDWARE_TESTING_GUIDE.md) (7 phases)
4. **Code:** [ESP32_SERVO_CONVEYOR.ino](ESP32_SERVO_CONVEYOR.ino) (well-commented)

---

## Next Steps

1. **Setup Hardware**
   - Wire servo, motor, IR sensor to ESP32
   - Follow pin configuration above

2. **Upload Code**
   - Paste [ESP32_SERVO_CONVEYOR.ino](ESP32_SERVO_CONVEYOR.ino) into Arduino IDE
   - Edit WiFi credentials
   - Upload and note IP address

3. **Configure Frontend**
   - Create `hdms-client/.env.local`
   - Add ESP32 IP: `VITE_ESP32_URL=http://192.168.1.50`
   - Restart React dev server

4. **Test**
   - Follow [HARDWARE_TESTING_GUIDE.md](HARDWARE_TESTING_GUIDE.md)
   - Verify each phase passes

5. **Go Live**
   - Run production deployment
   - Monitor logs for token redemptions
   - Test throughout operational hours

---

## System Ready! 🎉

Your HDMS dining system now has:
- ✅ Automatic servo gate opening on valid tokens
- ✅ Conveyor belt with bowl detection
- ✅ Full hardware integration with web frontend
- ✅ Non-blocking concurrent operation
- ✅ HTTP API for future extensions

**Start with:** [HARDWARE_QUICK_REFERENCE.md](HARDWARE_QUICK_REFERENCE.md) (5 steps)

