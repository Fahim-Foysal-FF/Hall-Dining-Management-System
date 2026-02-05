# Hardware Wiring Guide

## Complete Wiring Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        ESP32 DevKit                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │  GND  VIN  [USB]  EN   GP36  GP39  GP34  GP35  GP32    │   │
│  │                                                           │   │
│  │  GPIO5 ──────────────────────────────────────────────── │   │  → Servo Pin
│  │  GPIO4 ──────────────────────────────────────────────── │   │  → IR Sensor
│  │  GPIO16 ─────────────────────────────────────────────── │   │  → Motor IN1
│  │  GPIO17 ─────────────────────────────────────────────── │   │  → Motor IN2
│  │                                                           │   │
│  │  3V3  GND  GPIO22 GPIO21 GPIO19 GPIO18 GPIO5 GPIO17   │   │
│  │                                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
        │            │             │           │
        │            │             │           │
        ▼            ▼             ▼           ▼

    ┌─────────┐  ┌──────────┐  ┌────────┐  ┌─────────┐
    │  Servo  │  │    IR    │  │ Motor  │  │ Motor   │
    │  Motor  │  │ Obstacle │  │ Driver │  │ Power   │
    │ (SG90)  │  │ Sensor   │  │(L298N) │  │(12V DC) │
    └─────────┘  └──────────┘  └────────┘  └─────────┘
        │            │             │  │         │
        │            │             │  │         │
      5V GND       5V GND GND     +12V GND    GND
    Signal                OUT      IN1 IN2         
```

---

## Detailed Component Connections

### Component 1: Servo Motor (SG90 or similar)

**Three wires:**
```
┌─────────────────────────────────────────┐
│           Servo Motor                   │
│                                         │
│  ◯─ Red     (Power)  → ESP32 5V        │
│  ◯─ Brown   (GND)    → ESP32 GND       │
│  ◯─ Orange (Signal)  → GPIO5           │
│                                         │
└─────────────────────────────────────────┘
```

**Wiring steps:**
1. **Power (Red wire):** Connect to 5V rail
   - Best from regulated 5V supply (not USB if possible)
   - Add 100µF capacitor near servo for stability

2. **Ground (Brown wire):** Connect to ESP32 GND
   - Must be same GND as ESP32
   - Multiple GND pins available on ESP32

3. **Signal (Orange wire):** Connect to GPIO5 through 220Ω resistor
   - The resistor protects GPIO pin from servo spikes
   - Wiring: GPIO5 → [220Ω resistor] → Servo signal
   - Alternative: 330Ω or 470Ω resistor also works

**Important:** 
- ✓ Servo must have dedicated 5V power (not powered from GPIO)
- ✓ All devices must share common GND
- ✓ Signal wire should be separate from power wires (avoid EMI)

---

### Component 2: IR Obstacle Sensor

**Four wires (typical):**
```
┌─────────────────────────────────────────┐
│      IR Obstacle Sensor Module          │
│                                         │
│  ◯─ VCC  (Power)  → ESP32 5V           │
│  ◯─ GND  (Ground) → ESP32 GND          │
│  ◯─ OUT  (Output) → GPIO4              │
│  ◯─ NC   (No Connection) → Leave empty │
│                                         │
└─────────────────────────────────────────┘
```

**Wiring steps:**
1. **VCC (Power):** Connect to 5V rail
   - Share same 5V as servo if possible

2. **GND (Ground):** Connect to ESP32 GND
   - Same GND point as servo and ESP32

3. **OUT (Signal):** Connect directly to GPIO4
   - No resistor needed (just signal)
   - This is a digital output (HIGH/LOW)

4. **NC:** Leave unconnected

**Important:**
- ✓ Can be powered from 3.3V or 5V (check module spec)
- ✓ Output should be 5V logic or 3.3V (depends on module)
- ✓ Most common modules work at 5V

**Testing your IR sensor:**
```
1. Power on ESP32
2. Run this in Arduino Serial Monitor:
   
   void setup() { Serial.begin(115200); pinMode(4, INPUT); }
   void loop() { 
     Serial.print("IR: "); 
     Serial.println(digitalRead(4) ? "HIGH" : "LOW"); 
     delay(100); 
   }

3. Expected: Show HIGH (no object) or LOW (object detected)
```

---

### Component 3: DC Motor with Driver (L298N)

**Motor Driver Module (L298N) connections:**

```
┌───────────────────────────────────────┐
│         L298N Motor Driver            │
│                                       │
│  Input Side:                          │
│  ◯─ IN1   → GPIO16                   │
│  ◯─ IN2   → GPIO17                   │
│  ◯─ IN3   → (not used)               │
│  ◯─ IN4   → (not used)               │
│                                       │
│  Power Side:                          │
│  ◯─ +12V  → Motor power supply (+)   │
│  ◯─ GND   → Common GND               │
│  ◯─ GND   → Common GND               │
│                                       │
│  Output Side:                         │
│  ◯─ OUT1  → Motor wire 1             │
│  ◯─ OUT2  → Motor wire 2             │
│  ◯─ OUT3  → (leave empty)            │
│  ◯─ OUT4  → (leave empty)            │
│                                       │
└───────────────────────────────────────┘
```

**Wiring steps:**

1. **ESP32 Control Pins:**
   - GPIO16 → L298N IN1 (forward control)
   - GPIO17 → L298N IN2 (backward control)

2. **Power Connections:**
   - L298N +12V → 12V Power Supply (+)
   - L298N GND → Common GND (shared with ESP32)

3. **Motor Connections:**
   - L298N OUT1 & OUT2 → Motor wires
   - If motor spins backward, swap OUT1 and OUT2

4. **ESP32 Power:**
   - Keep ESP32 powered by USB (separate 5V)
   - DO NOT power ESP32 from 12V supply

**Motor Control Logic:**
```cpp
// Forward (belt rotates)
digitalWrite(16, HIGH);  // IN1 = HIGH
digitalWrite(17, LOW);   // IN2 = LOW

// Stop/Brake
digitalWrite(16, LOW);   // IN1 = LOW
digitalWrite(17, LOW);   // IN2 = LOW

// Backward (if needed)
digitalWrite(16, LOW);   // IN1 = LOW
digitalWrite(17, HIGH);  // IN2 = HIGH
```

**Important:**
- ✓ L298N GND MUST be connected to ESP32 GND
- ✓ Motor has separate 12V supply (not ESP32)
- ✓ Motor wires can be swapped if direction is wrong
- ✓ Keep motor power away from control lines

---

### Component 4: Power Supplies

**Two separate supplies needed:**

```
┌──────────────────────────────────────────┐
│         Power Distribution               │
│                                          │
│  5V Supply (USB or regulated)            │
│  ├─→ ESP32 (USB port)                   │
│  ├─→ Servo Motor (5V + GND)             │
│  └─→ IR Sensor (5V + GND)               │
│                                          │
│  12V Supply (for motor)                  │
│  ├─→ L298N +12V pin                     │
│  ├─→ L298N GND → Common GND             │
│  └─→ Motor (through L298N)              │
│                                          │
│  Common GND (all devices)                │
│  ├─→ ESP32 GND                          │
│  ├─→ Servo GND                          │
│  ├─→ IR Sensor GND                      │
│  ├─→ L298N GND                          │
│  └─→ 12V Supply GND                     │
│                                          │
└──────────────────────────────────────────┘
```

**Critical:** All GND points must be connected together!

---

## Complete Wiring Checklist

### Servo Motor
- [ ] Red wire → 5V rail (with capacitor if needed)
- [ ] Brown wire → ESP32 GND
- [ ] Orange wire → GPIO5 (through 220Ω resistor)

### IR Sensor
- [ ] VCC → 5V rail
- [ ] GND → ESP32 GND
- [ ] OUT → GPIO4
- [ ] NC → Leave empty

### Motor Driver (L298N)
- [ ] IN1 → GPIO16
- [ ] IN2 → GPIO17
- [ ] +12V → Motor power supply (+)
- [ ] GND pins → Common GND (multiple points)
- [ ] OUT1, OUT2 → Motor wires

### Power Distribution
- [ ] ESP32 5V (USB) separate from motor 12V
- [ ] Common GND connects all devices
- [ ] 5V supply capacity: ≥1A (for servo + sensor)
- [ ] 12V supply capacity: Depends on motor (usually 2A+)

### Cable Management
- [ ] Power wires (5V, 12V) kept away from signal wires
- [ ] Signal wires short and direct
- [ ] No long loops that could pick up EMI
- [ ] Servo signal has resistor protection
- [ ] All connections tight and secure

---

## Common Wiring Issues & Fixes

### Issue: Servo Jitters or Doesn't Move

**Causes:**
- No power to servo (red wire disconnected)
- Bad 5V supply (voltage too low)
- Signal wire not connected (orange wire)
- Ground not common

**Fix:**
1. Check 5V voltage with multimeter (should be ≥4.8V)
2. Verify orange wire on GPIO5
3. Ensure brown wire connected to GND
4. Check resistor (220Ω) in signal line
5. Try different 5V supply if available

---

### Issue: Motor Doesn't Spin or Spins Slowly

**Causes:**
- No power to motor (12V disconnected)
- Wrong IN1/IN2 pins
- Bad motor supply voltage
- Motor driver damaged

**Fix:**
1. Check 12V voltage with multimeter (should be ≥12V)
2. Verify GPIO16/17 connections to IN1/IN2
3. Test motor directly with 12V power
4. Try different L298N if available

---

### Issue: IR Sensor Always Detects Object (or never does)

**Causes:**
- Wrong sensor wiring
- Sensor logic inverted
- Bad connections
- Sensor module defective

**Fix:**
1. Check OUT wire on GPIO4
2. Check power (5V) and GND
3. Test with multimeter: OUT pin voltage with/without object
4. If inverted, change code: `return (val == HIGH);`
5. Try different sensor module

---

### Issue: Servo opens but conveyor keeps running

**Causes:**
- Separate loops running independently (by design!)
- IR sensor not responding
- Motor driver not responding

**Fix:**
1. Verify this is correct behavior (conveyor should be independent)
2. Test IR sensor response in Serial Monitor
3. Manually set GPIO16/17 HIGH/LOW with code to test motor
4. Check motor power is connected

---

### Issue: Strange Behavior (jerky, delayed, or random)

**Causes:**
- EMI (electromagnetic interference) from motor
- Bad wiring connections
- Voltage drops under load
- Conflicting timings

**Fix:**
1. Keep power wires and signal wires separate
2. Add 100µF capacitors near servo and motor driver
3. Use shorter, direct wiring
4. Ensure all connections are tight
5. Add ferrite rings around motor wires if still noisy

---

## Breadboard Layout Example

If using breadboard (for testing):

```
┌────────────────────────────────────────────────────────┐
│                   Breadboard Layout                    │
│                                                        │
│  ESP32      5V Rail    GND Rail     Motor Driver       │
│  Pin 5  ──→ [220Ω] ──→ Servo Sig   +12V ─────────┐  │
│  Pin 4  ────────────→ IR OUT         GND          │  │
│  Pin 16 ────────────→ IN1            IN1 ← Pin16  │  │
│  Pin 17 ────────────→ IN2            IN2 ← Pin17  │  │
│  5V     ────────────→ Rail ─────────→ 5V (optional)  │
│  GND    ────────────→ Rail ─────────→ GND        │  │
│                       │               │           │  │
│                       │               │          12V ─┤
│                       │               │          GND ─┤
│                       │               └─→ OUT1   Motor│
│                       │                  OUT2        │
│                       │                              │
│  Servo:             IR Sensor:                       │
│  5V ←──────────────→ VCC                            │
│  GND ←──────────────→ GND                            │
│  Sig ←──────────────→ (from GPIO4)                   │
│                     OUT                              │
│                                                      │
└────────────────────────────────────────────────────────┘
```

---

## Final Verification

**Before powering on:**

1. **Visually check all connections:**
   - Servo: 3 wires connected (5V, GND, GPIO5)
   - IR: 3-4 wires connected (5V, GND, GPIO4, optional NC)
   - Motor: L298N has IN1/IN2 and power connected

2. **Multimeter checks (power off first):**
   - 5V rail: Continuity to power supply (+)
   - GND rail: Continuity between all GND points
   - 12V rail: Continuity to power supply (+)
   - No continuity between 5V and 12V rails

3. **Power on sequence:**
   - Connect 5V supply (USB to ESP32)
   - ESP32 LED should light up
   - Observe servo and IR sensor
   - Connect 12V supply only if servo works

4. **Initial test:**
   - Check Serial Monitor for startup messages
   - Manually trigger `/open-gate` endpoint
   - Observe servo movement
   - Verify motor direction

---

## If Something Fails

**Use this decision tree:**

```
Device won't power on?
├─ Check USB/power cable
├─ Try different USB port
├─ Check power supply voltage
└─ Try different ESP32

Servo doesn't respond?
├─ Check power (5V) with multimeter
├─ Check signal wire on GPIO5
├─ Verify resistor (220Ω) installed
└─ Try direct servo power test

Motor doesn't spin?
├─ Check 12V power with multimeter
├─ Check IN1/IN2 pin connections
├─ Verify motor power supply
└─ Test L298N with known good motor

IR sensor not detecting?
├─ Check power (5V) with multimeter
├─ Check OUT wire on GPIO4
├─ Verify sensor orientation
└─ Check sensor logic (HIGH vs LOW)

Everything connected but ESP32 reboots?
├─ Servo causing voltage drop → Add capacitor
├─ Motor causing EMI → Separate wiring
├─ Bad USB power → Use external 5V supply
└─ Firmware issue → Re-upload sketch
```

---

## Safety Reminders

⚠️ **Important:**
1. Never connect 12V to ESP32 (will damage it!)
2. Always use common GND for all devices
3. Keep power wires away from signal wires
4. Don't touch servo when powered (sharp movement)
5. Use proper power supplies rated for current draw
6. Disconnect power before changing wiring

---

## Next Steps

1. **Gather components** and check against this guide
2. **Wire everything** following the connections above
3. **Double-check** all connections (especially GND!)
4. **Power on** ESP32 first (5V only)
5. **Upload code** from [ESP32_SERVO_CONVEYOR.ino](ESP32_SERVO_CONVEYOR.ino)
6. **Test** each component (servo, IR, motor)
7. **Follow** [HARDWARE_TESTING_GUIDE.md](HARDWARE_TESTING_GUIDE.md)

