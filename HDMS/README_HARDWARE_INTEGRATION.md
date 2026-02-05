# HDMS Hardware Integration - Complete Setup

## 🎯 What You Now Have

Your HDMS dining hall management system now includes **automated hardware control**:

### ✨ Features Implemented

1. **Servo Gate (Automatic Access Control)**
   - Opens 90° when valid token is scanned
   - Stays open for exactly 5 seconds
   - Automatically closes (no manual intervention needed)
   - Non-blocking (doesn't interfere with other operations)

2. **Conveyor Belt with Bowl Detection**
   - Continuously rotates when no bowl present
   - **Automatically stops** when IR sensor detects a bowl
   - Resumes rotation immediately when bowl removed
   - Runs independently from servo timing

3. **Web Integration**
   - Seamless integration with existing React frontend
   - Token scan → Automatic gate opening (no extra steps)
   - Works with current authentication system
   - Zero impact on existing backend API

---

## 📦 Files Delivered

### Hardware (Arduino Firmware)
- **[ESP32_SERVO_CONVEYOR.ino](ESP32_SERVO_CONVEYOR.ino)** - Complete Arduino sketch
  - HTTP server endpoints
  - Servo gate logic (5-second timer)
  - Conveyor motor + IR sensor logic
  - Well-commented for customization
  - Ready to upload to ESP32

### Frontend (React Components)
- **[hdms-client/src/config/espConfig.js](hdms-client/src/config/espConfig.js)** - NEW
  - ESP32 HTTP client library
  - `triggerServoGate()` function
  - Environment variable support
  - Error handling

- **[hdms-client/src/pages/Admin/AdminScan.jsx](hdms-client/src/pages/Admin/AdminScan.jsx)** - MODIFIED
  - Enhanced to call servo trigger on token success
  - Non-blocking async implementation
  - Original scan functionality preserved

### Documentation (7 Guides)
1. **[HARDWARE_DOCUMENTATION_INDEX.md](HARDWARE_DOCUMENTATION_INDEX.md)** ← START HERE
   - Navigation guide for all documentation
   - Choose your learning path (5 min / 30 min / 1+ hour)

2. **[HARDWARE_QUICK_REFERENCE.md](HARDWARE_QUICK_REFERENCE.md)**
   - 5-step quick start
   - Pin mapping table
   - Common issues & fixes
   - HTTP endpoints reference

3. **[HARDWARE_WIRING_GUIDE.md](HARDWARE_WIRING_GUIDE.md)**
   - Complete wiring diagrams
   - Pin-by-pin connections
   - Component specifications
   - Troubleshooting by component

4. **[HARDWARE_INTEGRATION_GUIDE.md](HARDWARE_INTEGRATION_GUIDE.md)**
   - 8-part comprehensive setup guide
   - Arduino IDE installation
   - WiFi configuration
   - Frontend integration
   - Fine-tuning parameters
   - Production checklist

5. **[HARDWARE_TESTING_GUIDE.md](HARDWARE_TESTING_GUIDE.md)**
   - 7-phase testing process
   - Expected outputs for each test
   - Stress testing scenarios
   - Performance metrics
   - Debug commands

6. **[HARDWARE_INTEGRATION_SUMMARY.md](HARDWARE_INTEGRATION_SUMMARY.md)**
   - System overview
   - Architecture diagrams
   - Quick setup checklist
   - Next steps

7. **[HARDWARE_VISUAL_GUIDE.md](HARDWARE_VISUAL_GUIDE.md)**
   - ASCII diagrams
   - Signal flow illustrations
   - State machines
   - Timing diagrams

---

## 🚀 Quick Start (Choose Your Path)

### 🏃 5-Minute Quickstart
```
1. Read: HARDWARE_QUICK_REFERENCE.md
2. Wire components per pin diagram
3. Upload ESP32_SERVO_CONVEYOR.ino
4. Create hdms-client/.env.local with ESP32 IP
5. Scan a token - servo opens! ✅
```

### 🚶 30-Minute Setup
1. Read: HARDWARE_QUICK_REFERENCE.md (2 min)
2. Read: HARDWARE_WIRING_GUIDE.md (10 min)
3. Wire & Upload: HARDWARE_INTEGRATION_GUIDE.md Part 1-4 (15 min)
4. Test: Scan token at /admin/scan (3 min)

### 🧑‍🎓 1+ Hour Complete Learning
1. Start: HARDWARE_INTEGRATION_SUMMARY.md (10 min)
2. Wire: HARDWARE_WIRING_GUIDE.md (20 min)
3. Setup: HARDWARE_INTEGRATION_GUIDE.md (30 min)
4. Test: HARDWARE_TESTING_GUIDE.md (30 min)
5. Reference: Keep HARDWARE_QUICK_REFERENCE.md handy

**→ Start with: [HARDWARE_DOCUMENTATION_INDEX.md](HARDWARE_DOCUMENTATION_INDEX.md)**

---

## 📋 Components Required

### Electronics
- **ESP32 DevKit** (any variant)
- **Servo Motor** (SG90 or similar, 5V)
- **DC Motor** (for conveyor, typically 12V)
- **Motor Driver** (L298N or TB6612FNG)
- **IR Obstacle Sensor** (digital output module)

### Power Supplies
- **5V Supply** (≥1A) - for ESP32, servo, IR sensor
- **12V Supply** (≥2A) - for motor (may vary by motor)

### Cables & Components
- **USB Cable** - for ESP32 programming
- **Resistor** - 220Ω (for servo signal protection)
- **Capacitor** - 100µF (optional, for servo stability)
- **Wires** - for all connections
- **Breadboard or PCB** - for assembly

---

## 🔌 Pinout Reference

| Function | ESP32 Pin | Component |
|----------|-----------|-----------|
| Servo Signal | GPIO 5 | Servo → 220Ω resistor |
| IR Sensor | GPIO 4 | IR sensor output |
| Motor Forward | GPIO 16 | Motor driver IN1 |
| Motor Backward | GPIO 17 | Motor driver IN2 |
| GND | GND | All devices |
| 5V | 5V (USB) | ESP32 power |

**All easily customizable in the code if needed!**

---

## ⚙️ Configuration

### 1. WiFi (ESP32 Code)
Edit **ESP32_SERVO_CONVEYOR.ino** lines 7-8:
```cpp
const char* ssid     = "YOUR_SSID";        // ← Your WiFi name
const char* password = "YOUR_PASSWORD";     // ← Your WiFi password
```

### 2. Frontend IP (React)
Create **hdms-client/.env.local**:
```env
VITE_ESP32_URL=http://192.168.1.50
              ↑ Replace with your ESP32 IP
```

### 3. Servo Parameters (Optional)
Edit **ESP32_SERVO_CONVEYOR.ino** lines 21-24:
```cpp
const int SERVO_CLOSED_ANGLE = 0;           // Closed position
const int SERVO_OPEN_ANGLE   = 90;          // Open position
const unsigned long SERVO_OPEN_DURATION = 5000;  // Duration (5000ms = 5 sec)
```

---

## ✅ Verification Checklist

### Before Hardware Setup
- [ ] All components purchased
- [ ] Arduino IDE installed
- [ ] ESP32 board support added
- [ ] ESP32Servo library installed
- [ ] All documentation reviewed

### After Wiring
- [ ] Servo connected: 5V + GND + GPIO 5
- [ ] IR sensor connected: 5V + GND + GPIO 4
- [ ] Motor driver connected: GPIO 16, 17 + 12V + GND
- [ ] All GND connections common
- [ ] No visible damage to components

### After Code Upload
- [ ] Code compiles in Arduino IDE
- [ ] Upload completes without errors
- [ ] Serial Monitor shows startup messages
- [ ] ESP32 IP address noted (e.g., 192.168.1.50)

### After Frontend Config
- [ ] hdms-client/.env.local created
- [ ] VITE_ESP32_URL set correctly
- [ ] React dev server restarted
- [ ] No compilation errors in React

### After System Test
- [ ] ESP32 responds to ping
- [ ] Browser can access /status endpoint
- [ ] Manually triggering /open-gate opens servo
- [ ] Token scan triggers servo automatically
- [ ] Conveyor belt starts/stops with IR detection

---

## 📊 System Status

| Component | Status | Notes |
|-----------|--------|-------|
| ESP32 Code | ✅ Ready | File: ESP32_SERVO_CONVEYOR.ino |
| Frontend Integration | ✅ Ready | espConfig.js + AdminScan.jsx modified |
| Documentation | ✅ Complete | 7 comprehensive guides |
| Wiring Guide | ✅ Complete | Pin diagrams included |
| Testing Guide | ✅ Complete | 7-phase testing process |

---

## 🔗 Integration Points

### With Existing System
1. **Token Scan** (`/admin/scan`)
   - Existing: QR code → Backend validation
   - **New:** On success → Servo opens automatically
   - Zero changes to backend API

2. **Token Redemption** (`/tokens/redeem`)
   - Existing: Validates and marks as redeemed
   - **New:** Frontend triggers gate on 200 OK response
   - No backend changes needed

3. **Database**
   - Existing: Token status tracked
   - **No changes:** Hardware is independent

---

## 🛡️ Safety & Production Notes

### Security
- ✓ ESP32 and web server on same local network only
- ✓ No external internet exposure needed
- ✓ CORS headers properly configured
- ✓ Token validation still happens on backend

### Reliability
- ✓ If ESP32 offline, token still redeems (no blocking)
- ✓ Servo has fixed 5-second timeout (no infinite loop)
- ✓ Motor only responds to IR sensor (safe default: stopped)
- ✓ All operations non-blocking (responsive system)

### Power
- ✓ 5V supply separate from 12V supply
- ✓ ESP32 never receives 12V (protection)
- ✓ Common GND required for all devices
- ✓ Capacitors recommended for stability

---

## 🆘 Support Resources

### Quick Help
- **5-minute setup:** [HARDWARE_QUICK_REFERENCE.md](HARDWARE_QUICK_REFERENCE.md)
- **Common issues:** [HARDWARE_WIRING_GUIDE.md - Troubleshooting](HARDWARE_WIRING_GUIDE.md#common-wiring-issues--fixes)
- **Testing problems:** [HARDWARE_TESTING_GUIDE.md](HARDWARE_TESTING_GUIDE.md)

### Detailed Help
- **Complete guide:** [HARDWARE_INTEGRATION_GUIDE.md](HARDWARE_INTEGRATION_GUIDE.md)
- **Navigation:** [HARDWARE_DOCUMENTATION_INDEX.md](HARDWARE_DOCUMENTATION_INDEX.md)
- **Visual aid:** [HARDWARE_VISUAL_GUIDE.md](HARDWARE_VISUAL_GUIDE.md)

### Code Help
- **Arduino sketch:** [ESP32_SERVO_CONVEYOR.ino](ESP32_SERVO_CONVEYOR.ino) (fully commented)
- **Frontend config:** [hdms-client/src/config/espConfig.js](hdms-client/src/config/espConfig.js)
- **Integration:** [hdms-client/src/pages/Admin/AdminScan.jsx](hdms-client/src/pages/Admin/AdminScan.jsx)

---

## 🎯 Next Steps

### Immediate (Today)
1. Review [HARDWARE_DOCUMENTATION_INDEX.md](HARDWARE_DOCUMENTATION_INDEX.md)
2. Choose your setup path (5/30/60 minutes)
3. Read the appropriate guide(s)

### Short Term (This Week)
1. Order components if not already purchased
2. Set up Arduino IDE
3. Wire components
4. Upload ESP32 code
5. Configure and test

### Medium Term (This Month)
1. Integrate with meal distribution system
2. Train staff on operation
3. Monitor for any issues
4. Fine-tune servo angles if needed

### Long Term (Ongoing)
1. Log all transactions for audit
2. Monitor system uptime
3. Replace parts as needed
4. Consider adding logging to backend

---

## 📞 Technical Support Checklist

If something doesn't work:

1. **Serial Monitor Check**
   - [ ] Set baud rate to 115200
   - [ ] Look for startup messages
   - [ ] Verify WiFi connected and IP shown
   - [ ] Check for error messages

2. **Network Check**
   - [ ] Ping ESP32: `ping 192.168.1.50`
   - [ ] Check PC and ESP32 on same WiFi
   - [ ] Check WiFi 2.4GHz (not 5GHz)

3. **Hardware Check**
   - [ ] All wires connected firmly
   - [ ] Multimeter: 5V rail shows ~5V
   - [ ] Multimeter: 12V rail shows ~12V
   - [ ] All GND points connected

4. **Code Check**
   - [ ] Arduino compiles without errors
   - [ ] WiFi SSID/password correct
   - [ ] .env.local has correct ESP32 IP
   - [ ] React dev server restarted

5. **Integration Check**
   - [ ] Browser can reach /status endpoint
   - [ ] Console shows no errors (F12)
   - [ ] Token backend validation working
   - [ ] Servo responds to /open-gate

6. **Full System Check**
   - [ ] Follow 7-phase testing in [HARDWARE_TESTING_GUIDE.md](HARDWARE_TESTING_GUIDE.md)
   - [ ] Test each component separately
   - [ ] Test components together
   - [ ] Test with actual token scan

---

## 📈 Performance Expectations

### Response Times
| Operation | Expected |
|-----------|----------|
| QR code scan to decode | 50-100ms |
| Backend validation | 50-150ms |
| Frontend to ESP32 call | 20-100ms |
| Total time to servo movement | 300-500ms |
| Servo movement to 90° | 300-500ms |
| Gate stays open | Exactly 5000ms |
| Servo close to 0° | 300-500ms |

### Concurrent Operations
- **Multiple tokens:** Process simultaneously ✓
- **Servo + conveyor:** Run independently ✓
- **IR + motor:** Respond within 50ms ✓
- **HTTP requests:** Handle concurrent requests ✓

---

## 🎓 Learning Resources

### ESP32 Documentation
- [Espressif ESP32 Official](https://docs.espressif.com/projects/esp-idf/en/latest/)
- [Arduino IDE for ESP32](https://github.com/espressif/arduino-esp32)

### Servo Motor Documentation
- [SG90 Servo Datasheet](https://www.electronicoscaldas.com/datasheet/SG90_Tower-Pro.pdf)
- [PWM Control Basics](https://en.wikipedia.org/wiki/Pulse-width_modulation)

### Motor Driver Documentation
- [L298N Module Guide](https://www.handsontec.com/dataspecs/L298N_Motor_Driver.pdf)
- [DC Motor Control](https://learn.adafruit.com/adafruit-dc-and-stepper-motor-driver-for-raspberry-pi)

### WiFi & HTTP
- [HTTP Protocol Basics](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

## 📝 License & Attribution

These files are provided as part of the HDMS dining hall management system integration.

- Hardware code (ESP32): Provided with full source
- Frontend integration: Integrated into existing React app
- Documentation: Comprehensive guides for setup and maintenance

All code is ready for production use with appropriate testing.

---

## 🎉 You're Ready!

Your HDMS system now has:

✅ Automatic servo gate control  
✅ Conveyor belt with bowl detection  
✅ Web-based token scanning integration  
✅ Non-blocking concurrent operations  
✅ Complete setup and testing documentation  

**Start here:** [HARDWARE_DOCUMENTATION_INDEX.md](HARDWARE_DOCUMENTATION_INDEX.md)

**Questions?** Refer to the appropriate guide above or follow the troubleshooting decision tree in the documentation.

---

**System Ready for Implementation** ✨  
January 16, 2026

