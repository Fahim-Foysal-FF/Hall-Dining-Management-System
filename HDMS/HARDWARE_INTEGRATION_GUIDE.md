# Hardware Integration Setup Guide

## Overview
This guide helps you integrate the ESP32 servo gate and conveyor belt system with your HDMS dining management system.

### System Flow
1. **Student scans token** at `/admin/scan` page
2. **Backend validates** the token via REST API
3. **Frontend receives** success response
4. **ESP32 servo gate opens** for 5 seconds (meal access)
5. **Conveyor belt** continuously monitors IR sensor for bowls and stops when detected

---

## Part 1: ESP32 Hardware Setup

### Components Needed
- **ESP32 DevKit** (any variant like ESP32-S3, ESP32-C3, etc.)
- **Servo Motor** (e.g., SG90, MG995)
- **DC Motor** (for conveyor belt)
- **Motor Driver** (e.g., L298N, TB6612FNG)
- **IR Obstacle Sensor** (digital output module)
- **5V Power Supply** (for servo)
- **12V Power Supply** (for motor, if needed)
- **WiFi Router** (same network as your PC)

### Wiring Diagram

```
ESP32 Pins:
  GPIO 5   → Servo Signal (through 220Ω resistor)
  GPIO 4   → IR Sensor Data Output
  GPIO 16  → Motor Driver IN1
  GPIO 17  → Motor Driver IN2
  GND      → Common Ground (servo, motor driver, IR sensor)
  5V       → Servo Power (through voltage regulator if needed)

Motor Driver (L298N example):
  IN1 (GPIO 16) → Motor forward control
  IN2 (GPIO 17) → Motor backward control
  OUT1/OUT2     → Motor connection
  GND           → Common ground with ESP32
  +12V          → Motor power supply

Servo:
  Signal (GPIO 5) → Through 220Ω resistor for protection
  Power (5V)      → From regulated 5V
  GND             → Common ground

IR Sensor:
  Data (GPIO 4)   → IR sensor output
  Power (5V)      → 5V rail
  GND             → Common ground
```

### Pin Configuration

If your wiring differs from the defaults, modify these pins in the ESP32 sketch:

```cpp
const int SERVO_PIN = 5;    // Change if using different pin
const int IR_PIN    = 4;    // Change if using different pin
const int MOTOR_IN1 = 16;   // Change if using different pin
const int MOTOR_IN2 = 17;   // Change if using different pin
```

---

## Part 2: ESP32 Code Upload

### Step 1: Install Arduino IDE
1. Download [Arduino IDE](https://www.arduino.cc/en/software)
2. Install it on your computer

### Step 2: Add ESP32 Board Support
1. Open Arduino IDE
2. Go to **File → Preferences**
3. In "Additional Boards Manager URLs", add:
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**
5. Search for "esp32" and install **"esp32 by Espressif Systems"**

### Step 3: Install Required Libraries
1. Go to **Sketch → Include Library → Manage Libraries**
2. Search and install:
   - **ESP32Servo** (by Kevin Harrington)
   - Any other required libraries

### Step 4: Configure WiFi in the Sketch
Find these lines in the provided ESP32 code:

```cpp
const char* ssid     = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";
```

Replace with your WiFi credentials.

### Step 5: Select Board and Port
1. **Tools → Board → ESP32 Dev Module** (or your specific variant)
2. **Tools → Port → COM3** (or whichever COM port your ESP32 is on)

### Step 6: Upload Code
1. Paste the complete ESP32 code from the setup instructions
2. Click **Upload** button
3. Wait for upload to complete
4. Open **Serial Monitor** (Tools → Serial Monitor, 115200 baud)

### Step 7: Note the IP Address
The Serial Monitor will display:
```
Connecting to YOUR_SSID...
WiFi connected
ESP32 IP address: 192.168.1.50
HTTP server started
```

**Save this IP address** - you'll need it in the next step.

---

## Part 3: Frontend Configuration

### Update ESP32 IP Address

The IP address found in the Serial Monitor needs to be configured in your React app.

#### Option A: Environment Variable (Recommended)
1. Create or edit `hdms-client/.env.local`:
   ```
   VITE_ESP32_URL=http://192.168.1.50
   ```
   
2. Restart your React dev server:
   ```bash
   npm run dev
   ```

#### Option B: Direct Configuration (Quick Testing)
Edit [hdms-client/src/config/espConfig.js](../hdms-client/src/config/espConfig.js):

```javascript
const ESP32_CONFIG = {
  baseUrl: "http://192.168.1.50",  // ← Change this to your ESP32 IP
  // ... rest of config
};
```

---

## Part 4: Testing

### Test 1: Check ESP32 Connection
Open your browser and visit:
```
http://192.168.1.50/status
```

You should see: `servo_closed`

If this fails:
- ✓ Check ESP32 is powered on
- ✓ Verify WiFi connection (check Serial Monitor)
- ✓ Ensure PC and ESP32 are on the same network
- ✓ Try pinging the ESP32: `ping 192.168.1.50`

### Test 2: Manual Servo Test
Open browser and visit:
```
http://192.168.1.50/open-gate
```

You should see the servo motor move to 90° (open position) for 5 seconds, then return to 0° (closed).

### Test 3: Token Scan Integration
1. Go to your HDMS admin page: `http://localhost:5174/admin/scan`
2. Scan a valid token QR code
3. **Expected result:**
   - Token marked as redeemed ✓
   - Servo gate opens automatically ✓
   - Conveyor belt logic runs independently ✓

---

## Part 5: Understanding the System

### Servo Gate Logic
```cpp
// When token is valid:
1. Receive HTTP GET /open-gate from your web server
2. Move servo to 90° (open position)
3. Wait 5 seconds
4. Return servo to 0° (closed position)
5. Return HTTP 200 response
```

**Timing:** Non-blocking (system stays responsive to IR sensor)

### Conveyor Belt Logic
```cpp
// Runs continuously in loop():
if (IR sensor detects bowl) {
  STOP motor
} else {
  RUN motor forward
}
```

**IR Sensor:** 
- Most modules: LOW = object detected
- If your sensor is inverted, change:
  ```cpp
  // In isBowlPresent() function:
  return (val == HIGH);  // opposite logic
  ```

---

## Part 6: Troubleshooting

| Issue | Solution |
|-------|----------|
| ESP32 won't connect to WiFi | Check SSID/password spelling. Ensure 2.4GHz WiFi (not 5GHz) |
| `/status` shows error in browser | Check firewall isn't blocking ESP32. Verify IP address. |
| Servo doesn't move on token scan | Check servo signal pin wiring. Verify power supply. Test with `/open-gate` directly |
| Conveyor belt doesn't stop at bowl | Check IR sensor wiring and polarity. Test IR sensor separately |
| CORS errors in browser console | ESP32 code includes CORS headers. Ensure ESP32 is online |

---

## Part 7: Fine-tuning

### Adjust Servo Angles
If your gate needs different angles:
```cpp
const int SERVO_CLOSED_ANGLE = 0;      // Closed position
const int SERVO_OPEN_ANGLE   = 90;     // Open position (adjust as needed)
```

### Adjust Servo Duration
If 5 seconds is too short/long:
```cpp
const unsigned long SERVO_OPEN_DURATION = 5000; // milliseconds (5000 = 5 seconds)
```

### Adjust Motor Direction
If conveyor rotates backwards:
```cpp
// In conveyorOn(), swap the GPIO values:
void conveyorOn() {
  digitalWrite(MOTOR_IN1, LOW);   // was HIGH
  digitalWrite(MOTOR_IN2, HIGH);  // was LOW
}
```

---

## Part 8: Production Deployment

When deploying to production:

1. **Security:** Use a static IP or DHCP reservation for the ESP32
2. **Fallback:** If ESP32 is unreachable, token still redeems (gate just won't open)
3. **Monitoring:** Log servo triggers in your backend for audit trail
4. **Power:** Use reliable 5V PSU for ESP32 and servo (not USB power)
5. **Network:** Place ESP32 on same subnet as your admin station

---

## Quick Reference

| Component | Pin | Function |
|-----------|-----|----------|
| Servo | GPIO 5 | Gate control (0° = closed, 90° = open) |
| IR Sensor | GPIO 4 | Bowl detection (LOW = detected) |
| Motor IN1 | GPIO 16 | Forward control |
| Motor IN2 | GPIO 17 | Backward control |

---

## Support

For issues, check:
1. [ESP32 Servo Library Docs](https://github.com/jkb-git/ESP32Servo)
2. ESP32 Serial Monitor output
3. Browser DevTools Console (F12) for frontend errors
4. Backend logs for token validation errors

