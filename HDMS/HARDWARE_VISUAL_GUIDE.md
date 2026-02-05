# Hardware Integration - Visual Overview

## System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                          STUDENT SCANS TOKEN                       │
│                                                                    │
│                      hdms-client (React)                          │
│                   http://localhost:5174                           │
│                                                                    │
│    ┌──────────────────────────────────────────────────────┐      │
│    │         /admin/scan (QR Code Scanner)               │      │
│    │                                                      │      │
│    │    1. Camera reads QR → Token ID extracted         │      │
│    │    2. Send to backend: /tokens/redeem              │      │
│    └──────────────────────────────────────────────────────┘      │
│                            │                                      │
│                            ▼                                      │
│    ┌──────────────────────────────────────────────────────┐      │
│    │         Hdms.Api (ASP.NET Core Backend)             │      │
│    │       https://your-api-domain.com                   │      │
│    │                                                      │      │
│    │    1. TokensController validates token             │      │
│    │    2. Check status (Active, Not Used, etc.)        │      │
│    │    3. Mark as REDEEMED                             │      │
│    │    4. Return success (200 OK)                       │      │
│    └──────────────────────────────────────────────────────┘      │
│                            │                                      │
│                            ▼                                      │
│    ┌──────────────────────────────────────────────────────┐      │
│    │      Frontend Receives Success Response             │      │
│    │                                                      │      │
│    │    triggerServoGate() is called ← NEW!             │      │
│    │    Async HTTP GET to ESP32                         │      │
│    │    No blocking - scan continues                     │      │
│    └──────────────────────────────────────────────────────┘      │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                ┌────────────▼────────────┐
                │                         │
                │   WiFi/Network          │
                │   (Same local WiFi)     │
                │                         │
                └────────────┬────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│                      ESP32 DevKit                                 │
│                  (192.168.1.50 ← IP Address)                     │
│                                                                    │
│   HTTP Server Port 80 Running:                                   │
│   Listening for: GET /open-gate                                  │
│                                                                    │
│   ┌─────────────────────────────────────────────────────┐        │
│   │           Servo Gate Control Logic                  │        │
│   │                                                     │        │
│   │  If /open-gate request received:                   │        │
│   │    1. Move servo to 90° (open position)           │        │
│   │    2. Record time = now                            │        │
│   │    3. Continue to step 4                           │        │
│   │                                                     │        │
│   │  Every loop iteration (non-blocking):              │        │
│   │    4. Check if 5 seconds have passed              │        │
│   │    5. If yes → Move servo to 0° (close)           │        │
│   │    6. Continue running...                          │        │
│   │                                                     │        │
│   └─────────────────────────────────────────────────────┘        │
│                            │                                     │
│                            ▼                                     │
│            ┌──────────────────────────────┐                     │
│            │    GPIO 5 → Servo Signal    │                     │
│            │    (220Ω resistor)          │                     │
│            └──────────────────────────────┘                     │
│                            │                                     │
│                            ▼                                     │
│            ┌──────────────────────────────┐                     │
│            │      Servo Motor (SG90)      │                     │
│            │   5V Power + GND Connected   │                     │
│            │                              │                     │
│            │   ┌─────────────────────┐   │                     │
│            │   │ ► ARM AT 90°        │   │ ← GATE OPENS       │
│            │   │   (5 seconds)       │   │                     │
│            │   │                     │   │                     │
│            │   │ Then returns to 0°  │   │                     │
│            │   └─────────────────────┘   │                     │
│            └──────────────────────────────┘                     │
│                                                                    │
│   ┌─────────────────────────────────────────────────────┐        │
│   │         Conveyor Belt Control Logic                │        │
│   │         (Runs independently/continuously)          │        │
│   │                                                     │        │
│   │  Every loop iteration:                             │        │
│   │    1. Read IR sensor on GPIO 4                    │        │
│   │    2. If bowl detected (LOW):                     │        │
│   │       → Turn motor OFF (GPIO 16, 17 = LOW)       │        │
│   │    3. If no bowl (HIGH):                          │        │
│   │       → Turn motor ON (GPIO 16=HIGH, 17=LOW)      │        │
│   │                                                     │        │
│   └─────────────────────────────────────────────────────┘        │
│                            │                                     │
│            ┌───────────────┼───────────────┐                    │
│            │               │               │                    │
│            ▼               ▼               ▼                    │
│    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│    │   IR Sensor  │ │ Motor Driver │ │ DC Motor    │          │
│    │  (GPIO 4)    │ │   (L298N)    │ │  (12V)      │          │
│    │              │ │              │ │             │          │
│    │ Detects bowl │ │GPIO16/GPIO17 │ │Drives belt  │          │
│    │ IN ~2-30cm   │ │  → IN1/IN2   │ │ rotation    │          │
│    └──────────────┘ └──────────────┘ └──────────────┘          │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                    Physical Hardware Setup                         │
│                                                                    │
│  SERVO GATE              IR SENSOR           CONVEYOR BELT       │
│  ┌─────────┐            ┌────────┐          ┌──────────┐        │
│  │   ARM   │            │ LENS   │          │ ROTATING │        │
│  │ ◄───────│────0°      │ [●]    │          │ BELT     │        │
│  │   ────► 90°          │        │          │          │        │
│  │   5 sec │            │(detect)│    OR    │ ╺━╸╺━╸╺━╸│        │
│  │ GATE    │            │ bowl   │          │ (moving) │        │
│  │         │            │nearby) │          │   STOPS  │        │
│  └─────────┘            └────────┘          │ at bowl  │        │
│    ▲                       ▲                │          │        │
│    │ Servo moves          │ IR detects     │ Motor    │        │
│    │ when token valid     │ reflecting     │ control  │        │
│    │                       │ light          │ signal   │        │
│    │                       │                └──────────┘        │
│    └───────────────────────┴─────────────────────────────┐       │
│                                                          │       │
│  All connected to ESP32 via GPIO pins                   │       │
│  All powered from 5V supply (servo) + 12V (motor)       │       │
│  All share common GND connection                         │       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Signal Flow Diagram

```
                           TIMELINE
                                        
 t=0 sec
 │  Student scans token
 │  └─→ Token detected by scanner
 │
 │  Frontend processes
 │  └─→ QR code decoded
 │      └─→ Token ID extracted
 │
 │  Send to backend
 │  └─→ HTTP POST /tokens/redeem
 │
 t=0.1 sec
 │  Backend validates
 │  └─→ Check token status
 │      └─→ Verify not already used
 │          └─→ Mark as REDEEMED
 │
 │  Backend returns 200 OK
 │  └─→ Frontend receives success
 │
 t=0.2 sec
 │  Frontend calls ESP32
 │  └─→ HTTP GET /open-gate
 │      └─→ Request sent across WiFi
 │          └─→ ESP32 receives command
 │
 │  ✨ SERVO STARTS MOVING ✨
 │  └─→ Gate moves to 90° (OPEN)
 │      └─→ Student can access meal
 │
 t=0.3 - 5 sec
 │  Gate stays OPEN
 │  │
 │  ├─→ Conveyor belt still running independently
 │  │   (detects bowls with IR sensor)
 │  │
 │  └─→ Student proceeds to meal station
 │
 t=5.1 sec
 │  ✨ SERVO CLOSES ✨
 │  └─→ Gate moves to 0° (CLOSED)
 │      └─→ Access denied for next student until new token
 │
 t=5.2+ sec
 │  System ready for next scan
 │  └─→ All devices reset
 │      └─→ Waiting for next token scan
 │
```

---

## Data Flow Diagram

```
┌─────────────┐
│   Browser   │          QR Scanner
│   Camera    │────────────────────→ Detects QR code
└─────────────┘                      ↓
                                  Parses ID
                                     ↓
                          ┌──────────────────────┐
                          │  Token ID Extracted  │
                          │  (e.g., "12345")    │
                          └──────────────────────┘
                                     ↓
                          ┌──────────────────────┐
                          │  POST /tokens/redeem │
                          │  Backend API Call    │
                          └──────────────────────┘
                                     ↓
                          ┌──────────────────────┐
                          │  Backend Validation  │
                          │  - Check status     │
                          │  - Check used       │
                          │  - Update DB        │
                          └──────────────────────┘
                                     ↓
                          ┌──────────────────────┐
                          │  HTTP 200 OK         │
                          │  Success Response    │
                          └──────────────────────┘
                                     ↓
                          ┌──────────────────────┐
                          │  Frontend Receives   │
                          │  Success Status      │
                          └──────────────────────┘
                                     ↓
                          ┌──────────────────────┐
                          │  triggerServoGate()  │
                          │  Called (async)      │
                          └──────────────────────┘
                                     ↓
                          ┌──────────────────────┐
                          │  Fetch API calls     │
                          │  GET /open-gate      │
                          │  (to ESP32)          │
                          └──────────────────────┘
                                     ↓
                          ┌──────────────────────┐
                          │  WiFi Network        │
                          │  Local LAN           │
                          └──────────────────────┘
                                     ↓
                          ┌──────────────────────┐
                          │  ESP32 Receives      │
                          │  HTTP GET Request    │
                          │  /open-gate endpoint │
                          └──────────────────────┘
                                     ↓
                          ┌──────────────────────┐
                          │  Servo Logic         │
                          │  - Write 90 angle   │
                          │  - Set timer        │
                          └──────────────────────┘
                                     ↓
                          ┌──────────────────────┐
                          │  GPIO 5 Output       │
                          │  PWM Signal Sent     │
                          │  to Servo            │
                          └──────────────────────┘
                                     ↓
                          ┌──────────────────────┐
                          │  Servo Motor         │
                          │  - Moves to 90°     │
                          │  - Gate Opens        │
                          │  - Student enters   │
                          └──────────────────────┘
                                     ↓
                          ┌──────────────────────┐
                          │  (5 seconds later)   │
                          │  Timer expires       │
                          │  - Write 0 angle    │
                          │  - Servo closes     │
                          │  - Gate Locked       │
                          └──────────────────────┘

              Meanwhile (Independent):
              
              ┌──────────────────────────────┐
              │  Conveyor Belt Logic         │
              │  (Running continuously)      │
              │                              │
              │  Loop every 10ms:            │
              │  1. Read GPIO 4 (IR)         │
              │  2. Check bowl present?      │
              │  3. Control GPIO 16/17       │
              │  4. Motor on/off             │
              │                              │
              │  Independent from servo!    │
              └──────────────────────────────┘
```

---

## Network Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your WiFi Network (2.4GHz)          │
│                    192.168.1.0/24                      │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │                 WiFi Router                       │ │
│  │              (192.168.1.1)                       │ │
│  └────┬────────────────────────────────────────────┬─┘ │
│       │                                            │    │
│       │                                            │    │
│  ┌────▼────────────────┐                  ┌──────▼───┐ │
│  │  Your Computer      │                  │  ESP32   │ │
│  │  (Running React)    │                  │ (Gpio    │ │
│  │  localhost:5174     │  ◄─────────────► │  5,4,... │ │
│  │  192.168.1.X        │   HTTP Request   │ 192.168. │ │
│  │                     │   GET /open-gate │ 1.50)    │ │
│  │  Frontend calls:    │                  │          │ │
│  │  triggerServoGate() │                  │ HTTP     │ │
│  │                     │                  │ Server   │ │
│  └─────────────────────┘                  │ :80      │ │
│                                            └──────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
        │
        │ USB or other connection (for serial monitor)
        │
        └─→ Arduino IDE (for programming ESP32)
```

---

## State Machine Diagrams

### Servo State Machine
```
┌──────────────┐
│   CLOSED     │ Initial state (angle=0°)
│   (angle=0°) │
└──────┬───────┘
       │
       │ HTTP GET /open-gate received
       ▼
┌──────────────────┐
│    OPENING       │ Moving to 90°
│  (transition)    │
└──────┬───────────┘
       │ Servo reaches 90°
       ▼
┌──────────────────┐
│    OPEN          │ Gate fully open
│  (angle=90°)     │ Holding position
│  [Timer: 5sec]   │
└──────┬───────────┘
       │ 5 seconds elapsed
       ▼
┌──────────────────┐
│    CLOSING       │ Moving to 0°
│  (transition)    │
└──────┬───────────┘
       │ Servo reaches 0°
       ▼
┌──────────────────┐
│    CLOSED        │ Ready for next request
│  (angle=0°)      │ Back to start
└──────────────────┘
```

### Conveyor State Machine
```
┌──────────────────────┐
│  MOTOR_ON            │ Belt rotating
│  (IN1=HIGH,          │ No bowl detected
│   IN2=LOW)           │ (IR=HIGH)
└──────┬───────────────┘
       │ IR detects object (LOW)
       ▼
┌──────────────────────┐
│  MOTOR_OFF           │ Belt stopped
│  (IN1=LOW,           │ Bowl present
│   IN2=LOW)           │ (IR=LOW)
└──────┬───────────────┘
       │ Bowl removed (IR goes HIGH)
       └─→ Back to MOTOR_ON
       
This cycles continuously!
```

---

## Performance Timeline

```
Event Timeline for Single Token Scan:

t=0ms     │ Student presents token to scanner
t=50ms    │ QR code detected and decoded
t=100ms   │ Frontend sends /tokens/redeem to backend
t=150ms   │ Backend receives request, validates token
t=200ms   │ Backend marks token as REDEEMED
t=250ms   │ Backend sends 200 OK response
t=300ms   │ Frontend receives success response
t=310ms   │ triggerServoGate() is called
t=320ms   │ Fetch API initiates HTTP GET
t=350ms   │ WiFi sends request to ESP32
t=380ms   │ ESP32 receives /open-gate request
t=390ms   │ ESP32 servo command issued
t=400ms   │ Servo signal (PWM) starts
t=500ms   │ Servo reaches 90° (gate fully open)
t=5500ms  │ 5 seconds elapsed
t=5510ms  │ Servo returns to 0°
t=5600ms  │ Servo reaches 0° (gate fully closed)

Total time from scan to gate open: ~500ms
Gate open duration: ~5000ms (exactly)
System ready for next scan: ~5600ms

During entire 5.6 second window, conveyor belt
continues to run and monitor IR sensor independently!
```

---

## Component Interaction Map

```
                    ┌─────────────────┐
                    │  BACKEND API    │
                    │  /tokens/redeem │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  FRONTEND       │
                    │  React Component│
                    │  AdminScan.jsx  │
                    └────────┬────────┘
                             │
                    ┌────────▼──────────────┐
                    │  espConfig.js         │
                    │  triggerServoGate()   │
                    │  Fetch API call       │
                    └────────┬──────────────┘
                             │
                    ┌────────▼──────────────┐
                    │  WiFi Network         │
                    │  HTTP GET request     │
                    └────────┬──────────────┘
                             │
         ┌───────────────────▼───────────────────┐
         │         ESP32 HTTP Server             │
         │         Port 80                       │
         │                                       │
         │ /open-gate endpoint → ServoLogic     │
         │ /status endpoint   → StatusCheck     │
         │ /health endpoint   → HealthCheck     │
         │                                       │
         │ WebServer.handleClient() ◄─ Loops    │
         └────────┬─────────────────────────────┘
                  │
        ┌─────────┴─────────┬─────────┐
        │                   │         │
        ▼                   ▼         ▼
    ┌────────────┐   ┌──────────┐  ┌──────────┐
    │ Servo Gate │   │ IR Sensor│  │Motor Drive│
    │ (GPIO 5)   │   │(GPIO 4)  │  │(16,17)   │
    └────────────┘   └──────────┘  └──────────┘
```

---

## Timing Diagram

```
SERVO BEHAVIOR:

5V ┤     ┌─ Servo Signal ─┐
   │     │ (PWM @ 50Hz)  │
0V ┤─────┴────────────────┴──────────────────

ANGLE:

90° ┤           ╱════════════╲
    │          ╱              ╲
45° ┤         ╱                ╲
    │        ╱                  ╲
0°  ┤───────────────────────────────────────

    0      500ms      5000ms    5500ms
    │        │          │         │
    └────────┴──────────┴────────┘
    Gate     Move to  Hold for  Return
    request  90°      5 sec     to 0°


IR SENSOR & MOTOR BEHAVIOR:

IR ┤ ╱ ╲  ╱ ╲  ╱ ╲  ╱ ╲   (High=No bowl, Low=Bowl)
   │╱   ╲╱   ╲╱   ╲╱   ╲
   └─────────────────────────

MOTOR┤  ┌─┐  ┌─┐  ┌──┐   (High=ON, Low=OFF)
     │  │ │  │ │  │  │
     ├──┘ └──┘ └──┘  └───
     │
(Continuous monitoring, independent from servo!)
```

---

## Success Indicators

```
✅ SERVO WORKING:
   - Visual: Arm moves to 90° when /open-gate called
   - Audible: Slight servo buzz/hum during movement
   - Timing: Closes exactly after 5 seconds
   - Responsive: Moves on next request

✅ IR SENSOR WORKING:
   - Output: Changes between 5V and 0V
   - Response: <50ms to object detection
   - Accuracy: Consistently detects at 2-30cm

✅ MOTOR WORKING:
   - Rotation: Smooth continuous rotation
   - Response: Stops immediately on IR detection
   - Current: Draws expected current under load
   - Reversal: Starts again when object removed

✅ ESP32 WORKING:
   - Serial: Shows startup messages at 115200 baud
   - Network: IP address appears in output
   - HTTP: /status endpoint accessible
   - Logic: Servo and conveyor run simultaneously

✅ FRONTEND INTEGRATION:
   - Config: ESP32 IP in .env.local
   - Import: espConfig.js imports successfully
   - Compile: React dev server shows no errors
   - Execution: Console shows servo trigger logs

✅ FULL SYSTEM:
   - Scan: Token scans successfully
   - Backend: Token validates and redeems
   - Servo: Opens automatically on success
   - Timing: Gate opens for exactly 5 seconds
   - Independent: Conveyor works during servo operation
```

---

This visual guide complements the technical documentation.
For detailed setup, see: **[HARDWARE_INTEGRATION_GUIDE.md](HARDWARE_INTEGRATION_GUIDE.md)**

