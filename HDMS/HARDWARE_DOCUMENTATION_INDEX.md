# Hardware Integration - Documentation Index

## 🎯 Start Here: Choose Your Path

### ⏱️ I have 5 minutes (Quick Start)
→ Read: **[HARDWARE_QUICK_REFERENCE.md](HARDWARE_QUICK_REFERENCE.md)**
- 5-step setup guide
- Common issues & fixes
- Fast reference table

### ⏱️ I have 30 minutes (Complete Setup)
→ Read in order:
1. [HARDWARE_QUICK_REFERENCE.md](HARDWARE_QUICK_REFERENCE.md) - Overview
2. [HARDWARE_WIRING_GUIDE.md](HARDWARE_WIRING_GUIDE.md) - Connections
3. [HARDWARE_INTEGRATION_GUIDE.md](HARDWARE_INTEGRATION_GUIDE.md) - Full setup

### ⏱️ I have 1+ hour (Thorough)
→ Read everything in this order:
1. [HARDWARE_INTEGRATION_SUMMARY.md](HARDWARE_INTEGRATION_SUMMARY.md) - Overview
2. [HARDWARE_WIRING_GUIDE.md](HARDWARE_WIRING_GUIDE.md) - Wiring
3. [HARDWARE_INTEGRATION_GUIDE.md](HARDWARE_INTEGRATION_GUIDE.md) - Setup
4. [HARDWARE_TESTING_GUIDE.md](HARDWARE_TESTING_GUIDE.md) - Testing
5. [HARDWARE_QUICK_REFERENCE.md](HARDWARE_QUICK_REFERENCE.md) - Reference

### 🆘 Something's Not Working (Troubleshooting)
→ Check:
- [HARDWARE_QUICK_REFERENCE.md - Support Checklist](HARDWARE_QUICK_REFERENCE.md#-support-checklist)
- [HARDWARE_WIRING_GUIDE.md - Common Issues](HARDWARE_WIRING_GUIDE.md#common-wiring-issues--fixes)
- [HARDWARE_INTEGRATION_GUIDE.md - Troubleshooting](HARDWARE_INTEGRATION_GUIDE.md#part-6-troubleshooting)
- [HARDWARE_TESTING_GUIDE.md - Debug Commands](HARDWARE_TESTING_GUIDE.md#debug-commands)

---

## 📚 Documentation by Purpose

### For Understanding the System
| Document | Purpose | Time |
|----------|---------|------|
| [HARDWARE_INTEGRATION_SUMMARY.md](HARDWARE_INTEGRATION_SUMMARY.md) | System overview, architecture | 5 min |
| [ESP32_SERVO_CONVEYOR.ino](ESP32_SERVO_CONVEYOR.ino) | Well-commented source code | 10 min |

### For Hardware Setup
| Document | Purpose | Time |
|----------|---------|------|
| [HARDWARE_WIRING_GUIDE.md](HARDWARE_WIRING_GUIDE.md) | Pin connections, wiring | 15 min |
| [HARDWARE_INTEGRATION_GUIDE.md](HARDWARE_INTEGRATION_GUIDE.md) | Complete step-by-step setup | 30 min |
| [HARDWARE_QUICK_REFERENCE.md](HARDWARE_QUICK_REFERENCE.md) | Quick pin/parameter reference | 2 min |

### For Testing & Verification
| Document | Purpose | Time |
|----------|---------|------|
| [HARDWARE_TESTING_GUIDE.md](HARDWARE_TESTING_GUIDE.md) | 7-phase comprehensive testing | 45 min |
| [HARDWARE_QUICK_REFERENCE.md](HARDWARE_QUICK_REFERENCE.md) | Quick test checklist | 10 min |

### For Frontend Integration
| Document | Purpose | Time |
|----------|---------|------|
| [hdms-client/src/config/espConfig.js](hdms-client/src/config/espConfig.js) | Frontend config & API calls | - |
| [hdms-client/src/pages/Admin/AdminScan.jsx](hdms-client/src/pages/Admin/AdminScan.jsx) | Modified token scan component | - |

### For Arduino Code
| Document | Purpose | Time |
|----------|---------|------|
| [ESP32_SERVO_CONVEYOR.ino](ESP32_SERVO_CONVEYOR.ino) | Complete Arduino sketch | 20 min |

---

## 🚀 Quick Navigation

### Setup Process
```
1. Get Hardware Components
   ↓
2. Read HARDWARE_WIRING_GUIDE.md
   ↓
3. Wire Components Together
   ↓
4. Read HARDWARE_INTEGRATION_GUIDE.md (Part 2-4)
   ↓
5. Upload ESP32 Code
   ↓
6. Configure Frontend (.env.local)
   ↓
7. Follow HARDWARE_TESTING_GUIDE.md
   ↓
✅ System Ready!
```

### Troubleshooting Process
```
Problem Occurs
   ↓
Check HARDWARE_QUICK_REFERENCE.md (Support Checklist)
   ↓
No? → Check specific guide in HARDWARE_WIRING_GUIDE.md
   ↓
Still stuck? → Run phase tests in HARDWARE_TESTING_GUIDE.md
   ↓
Debug using Serial Monitor (HARDWARE_TESTING_GUIDE.md Phase 1.3)
   ↓
✅ Issue Resolved!
```

---

## 📋 File Summary

### Hardware (Firmware)
- **[ESP32_SERVO_CONVEYOR.ino](ESP32_SERVO_CONVEYOR.ino)** (330 lines)
  - Complete Arduino sketch for ESP32
  - HTTP server endpoints
  - Servo + conveyor + IR logic
  - Heavily commented
  - **Action:** Upload to ESP32 via Arduino IDE

### Frontend (Web)
- **[hdms-client/src/config/espConfig.js](hdms-client/src/config/espConfig.js)** (NEW)
  - ESP32 HTTP client configuration
  - `triggerServoGate()` function
  - Environment variable support
  - **Action:** Created automatically

- **[hdms-client/src/pages/Admin/AdminScan.jsx](hdms-client/src/pages/Admin/AdminScan.jsx)** (MODIFIED)
  - Token scanning component
  - Now calls servo trigger on success
  - Non-blocking implementation
  - **Action:** Verify integration on `/admin/scan`

### Documentation
- **[HARDWARE_INTEGRATION_SUMMARY.md](HARDWARE_INTEGRATION_SUMMARY.md)** (HIGH-LEVEL)
  - System overview
  - Architecture diagram
  - Quick setup (5 steps)
  - Next steps

- **[HARDWARE_WIRING_GUIDE.md](HARDWARE_WIRING_GUIDE.md)** (DETAILED)
  - Complete wiring diagrams
  - Pin-by-pin connections
  - Component specifications
  - Common issues & fixes

- **[HARDWARE_INTEGRATION_GUIDE.md](HARDWARE_INTEGRATION_GUIDE.md)** (COMPREHENSIVE)
  - 8-part setup guide
  - WiFi configuration
  - Detailed troubleshooting
  - Production checklist

- **[HARDWARE_TESTING_GUIDE.md](HARDWARE_TESTING_GUIDE.md)** (VALIDATION)
  - 7-phase testing process
  - Expected outputs for each test
  - Stress testing
  - Performance metrics

- **[HARDWARE_QUICK_REFERENCE.md](HARDWARE_QUICK_REFERENCE.md)** (CHEAT SHEET)
  - 5-step quick start
  - Pin mapping table
  - Common issues in table
  - HTTP endpoints reference

---

## 🎓 Learning Path

### Beginner (Never done ESP32 before)
1. Start: [HARDWARE_INTEGRATION_SUMMARY.md](HARDWARE_INTEGRATION_SUMMARY.md)
2. Learn Wiring: [HARDWARE_WIRING_GUIDE.md](HARDWARE_WIRING_GUIDE.md)
3. Follow Setup: [HARDWARE_INTEGRATION_GUIDE.md](HARDWARE_INTEGRATION_GUIDE.md)
4. Test Each Phase: [HARDWARE_TESTING_GUIDE.md](HARDWARE_TESTING_GUIDE.md)

### Intermediate (Some embedded experience)
1. Quick Overview: [HARDWARE_QUICK_REFERENCE.md](HARDWARE_QUICK_REFERENCE.md)
2. Wiring Check: [HARDWARE_WIRING_GUIDE.md](HARDWARE_WIRING_GUIDE.md)
3. Skip to: [HARDWARE_INTEGRATION_GUIDE.md](HARDWARE_INTEGRATION_GUIDE.md) Part 2 (Code Upload)
4. Quick Test: [HARDWARE_QUICK_REFERENCE.md](HARDWARE_QUICK_REFERENCE.md) (Testing Sequence)

### Advanced (Familiar with Arduino/ESP32)
1. Scan: [HARDWARE_QUICK_REFERENCE.md](HARDWARE_QUICK_REFERENCE.md)
2. Read: [ESP32_SERVO_CONVEYOR.ino](ESP32_SERVO_CONVEYOR.ino)
3. Upload and test
4. Reference: [HARDWARE_WIRING_GUIDE.md](HARDWARE_WIRING_GUIDE.md) as needed

---

## ✅ Verification Checklist

### By Milestone

**After Reading Overview:**
- [ ] Understand system architecture
- [ ] Know what servo does (opens gate for 5 sec)
- [ ] Know what conveyor does (stops at bowl)
- [ ] Know how frontend integrates (HTTP call)

**After Wiring:**
- [ ] All components connected correctly
- [ ] Power supplies verified with multimeter
- [ ] All GND connections verified
- [ ] No visible wire damage or loose connections

**After Code Upload:**
- [ ] ESP32 code compiles
- [ ] Code uploads without errors
- [ ] Serial Monitor shows startup messages
- [ ] IP address noted and accessible

**After Frontend Config:**
- [ ] `.env.local` file created
- [ ] ESP32 IP in `.env.local` is correct
- [ ] React dev server restarted
- [ ] Browser can reach `/admin/scan`

**After Testing:**
- [ ] Phase 1 (Arduino) - Code verified
- [ ] Phase 2 (Hardware) - Power verified
- [ ] Phase 3 (Network) - HTTP working
- [ ] Phase 4 (Frontend) - Integration tested
- [ ] Phase 5 (Full Integration) - Servo opens on scan
- [ ] Phase 6 (Conveyor) - Belt works
- [ ] Phase 7 (Stress) - Multiple scans work

---

## 🔗 Related Files in Project

### Frontend Components
```
hdms-client/
├── src/
│   ├── config/
│   │   └── espConfig.js ← ESP32 HTTP client (NEW)
│   ├── pages/
│   │   └── Admin/
│   │       └── AdminScan.jsx ← Modified for servo trigger
│   └── api/
│       └── axiosClient.js (unchanged)
└── .env.local ← Create this with ESP32 URL
```

### Backend Components
```
Hdms.Api/
├── Controllers/
│   └── TokensController.cs (unchanged)
└── Program.cs (unchanged)
```

---

## 🌐 HTTP Endpoints Reference

### ESP32 Endpoints
| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/open-gate` | GET | Open servo for 5 sec | `Gate opened for 5 seconds` |
| `/status` | GET | Check gate status | `servo_open` or `servo_closed` |
| `/health` | GET | System health check | JSON with uptime |

### Frontend Integration
| Event | Endpoint | Trigger |
|-------|----------|---------|
| Token Valid | `GET /open-gate` | After backend validates token |
| Automatic | Async, non-blocking | Won't interfere with token scan |

---

## 🛠️ Configuration Points

### ESP32 Code
**File:** [ESP32_SERVO_CONVEYOR.ino](ESP32_SERVO_CONVEYOR.ino)

| Parameter | Line | Adjustable |
|-----------|------|-----------|
| WiFi SSID | ~7 | ✏️ Yes |
| WiFi Password | ~8 | ✏️ Yes |
| Servo Pin | ~13 | ✏️ Yes (GPIO 5) |
| IR Sensor Pin | ~14 | ✏️ Yes (GPIO 4) |
| Motor IN1 Pin | ~15 | ✏️ Yes (GPIO 16) |
| Motor IN2 Pin | ~16 | ✏️ Yes (GPIO 17) |
| Servo Open Angle | ~22 | ✏️ Yes (90°) |
| Servo Close Angle | ~21 | ✏️ Yes (0°) |
| Gate Duration | ~23 | ✏️ Yes (5000ms) |

### Frontend Config
**File:** `hdms-client/.env.local` (CREATE THIS)

```env
VITE_ESP32_URL=http://192.168.1.50
              ↑ Replace with your ESP32 IP
```

---

## 🎯 Common Tasks

### How to change servo angle?
See: [HARDWARE_INTEGRATION_GUIDE.md - Part 7](HARDWARE_INTEGRATION_GUIDE.md#part-7-fine-tuning)

### How to adjust gate duration?
See: [HARDWARE_INTEGRATION_GUIDE.md - Part 7](HARDWARE_INTEGRATION_GUIDE.md#part-7-fine-tuning)

### How to reverse motor direction?
See: [HARDWARE_WIRING_GUIDE.md - Motor Direction](HARDWARE_WIRING_GUIDE.md#issue-motor-spins-backward-or-wrong-direction)

### How to invert IR sensor logic?
See: [HARDWARE_INTEGRATION_GUIDE.md - Part 7](HARDWARE_INTEGRATION_GUIDE.md#part-7-fine-tuning)

### How to test without hardware?
See: [HARDWARE_QUICK_REFERENCE.md - Test Sequence](HARDWARE_QUICK_REFERENCE.md#️-test-1-hardware-only)

### How to debug servo issues?
See: [HARDWARE_TESTING_GUIDE.md - Phase 2.2](HARDWARE_TESTING_GUIDE.md#-test-22-servo-mechanical-test)

---

## 📞 Support Resources

### For Code Issues
- Check [ESP32_SERVO_CONVEYOR.ino](ESP32_SERVO_CONVEYOR.ino) comments
- Review [HARDWARE_TESTING_GUIDE.md - Phase 1.3](HARDWARE_TESTING_GUIDE.md#-test-13-serial-monitor-shows-startup)

### For Wiring Issues
- Reference [HARDWARE_WIRING_GUIDE.md](HARDWARE_WIRING_GUIDE.md)
- Troubleshoot: [HARDWARE_WIRING_GUIDE.md - Common Issues](HARDWARE_WIRING_GUIDE.md#common-wiring-issues--fixes)

### For Integration Issues
- Check [hdms-client/src/config/espConfig.js](hdms-client/src/config/espConfig.js)
- Test: [HARDWARE_TESTING_GUIDE.md - Phase 4](HARDWARE_TESTING_GUIDE.md#test-phase-4-react-frontend-integration)

### For Test Failures
- Follow [HARDWARE_TESTING_GUIDE.md](HARDWARE_TESTING_GUIDE.md)
- Check [HARDWARE_QUICK_REFERENCE.md - Support Checklist](HARDWARE_QUICK_REFERENCE.md#-support-checklist)

---

## 📊 Project Statistics

- **Code Files:** 1 (Arduino) + 2 (Frontend modified/created)
- **Documentation Pages:** 6
- **Total Words:** ~20,000
- **Total Lines of Code:** ~500 (Arduino sketch)
- **HTTP Endpoints:** 3 (on ESP32)
- **GPIO Pins Used:** 4 (GPIO 5, 4, 16, 17)
- **Power Supplies Needed:** 2 (5V and 12V)
- **Components Required:** 4 (Servo, IR Sensor, Motor, Motor Driver)

---

## 🎉 Success Criteria

Your system is **ready** when:

- ✅ ESP32 boots and shows IP address
- ✅ Browser can reach `http://<IP>/status`
- ✅ Manually triggering `/open-gate` opens servo
- ✅ React dev server has correct `.env.local`
- ✅ Token scan successfully redeems (backend OK)
- ✅ Servo opens automatically on valid token
- ✅ No console errors in browser DevTools
- ✅ Conveyor belt independently runs/stops
- ✅ Multiple rapid scans work without conflicts

---

## 🚀 Next Action

**Choose your path above and start with the appropriate document!**

**Most common:** Start with [HARDWARE_QUICK_REFERENCE.md](HARDWARE_QUICK_REFERENCE.md) (5 min read)

---

**Last Updated:** January 16, 2026  
**System Status:** ✅ Ready for Implementation

