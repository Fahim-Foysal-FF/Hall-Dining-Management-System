/*
 * HDMS Dining Hall - ESP32 Control System
 * 
 * Features:
 * 1. Servo gate: Opens 90° for 5s when token is valid (via HTTP GET /open-gate)
 * 2. Conveyor belt: Runs continuously, stops when bowl detected on IR sensor
 * 3. HTTP server: Receives gate trigger commands from web frontend
 * 4. Non-blocking: Servo timing doesn't block motor control
 * 
 * Upload this sketch to your ESP32 using Arduino IDE
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ESP32Servo.h>

// ========== WiFi Configuration ==========
const char* ssid     = "YOUR_SSID";        // ← Change to your WiFi name
const char* password = "YOUR_PASSWORD";    // ← Change to your WiFi password

// ========== Pin Configuration ==========
// Adjust these if you're using different pins
const int SERVO_PIN = 5;    // Servo signal pin
const int IR_PIN    = 4;    // IR sensor digital output
const int MOTOR_IN1 = 16;   // Motor driver input 1 (forward)
const int MOTOR_IN2 = 17;   // Motor driver input 2 (backward)

// ========== Servo Gate Parameters ==========
Servo gateServo;
const int SERVO_CLOSED_ANGLE = 0;      // Gate closed position
const int SERVO_OPEN_ANGLE   = 90;     // Gate open position
const unsigned long SERVO_OPEN_DURATION = 5000; // Open for 5 seconds (ms)

// State tracking
bool servoOpen = false;
unsigned long servoOpenTime = 0;

// ========== HTTP Server ==========
WebServer server(80);

// ========== Forward Declarations ==========
void openGateFor5s();
bool isBowlPresent();
void conveyorOn();
void conveyorOff();

// ========== SETUP ==========
void setup() {
  // Start serial communication for debugging
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n");
  Serial.println("========================================");
  Serial.println("HDMS Dining Hall - ESP32 Control");
  Serial.println("========================================");

  // ===== Configure GPIO pins =====
  pinMode(IR_PIN, INPUT);      // IR sensor input (usually INPUT or INPUT_PULLUP)
  pinMode(MOTOR_IN1, OUTPUT);  // Motor control pins
  pinMode(MOTOR_IN2, OUTPUT);

  // Initialize motor as off
  digitalWrite(MOTOR_IN1, LOW);
  digitalWrite(MOTOR_IN2, LOW);
  Serial.println("[GPIO] Motor pins configured");

  // ===== Configure Servo =====
  // setPeriodHertz(50) = standard servo frequency 50Hz
  // attach() = assign pin and pulse width range (500-2400 microseconds typical)
  gateServo.setPeriodHertz(50);
  gateServo.attach(SERVO_PIN, 500, 2400);
  gateServo.write(SERVO_CLOSED_ANGLE);
  
  Serial.println("[Servo] Gate servo configured and closed");
  Serial.printf("  - Pin: GPIO%d\n", SERVO_PIN);
  Serial.printf("  - Closed angle: %d°\n", SERVO_CLOSED_ANGLE);
  Serial.printf("  - Open angle: %d°\n", SERVO_OPEN_ANGLE);

  // ===== Connect to WiFi =====
  Serial.printf("\n[WiFi] Connecting to '%s'...\n", ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WiFi] ✓ Connected!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("[WiFi] ✗ Failed to connect. Check SSID/password.");
    Serial.println("[WiFi] System will continue running locally.");
  }

  // ===== Configure HTTP Routes =====
  
  // GET /open-gate - Trigger servo gate
  server.on("/open-gate", HTTP_GET, []() {
    Serial.println("[HTTP] POST /open-gate - Gate trigger received");
    openGateFor5s();
    
    // Send response with CORS headers for browser access
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    server.sendHeader("Content-Type", "text/plain");
    server.send(200, "text/plain", "Gate opened for 5 seconds");
  });

  // OPTIONS /open-gate - CORS preflight
  server.on("/open-gate", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(204);
  });

  // GET /status - System status check
  server.on("/status", HTTP_GET, []() {
    String status = servoOpen ? "servo_open" : "servo_closed";
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Content-Type", "text/plain");
    server.send(200, "text/plain", status);
  });

  // GET /health - Health check endpoint
  server.on("/health", HTTP_GET, []() {
    StaticJsonDocument<200> doc;
    doc["status"] = "ok";
    doc["servo_open"] = servoOpen;
    doc["uptime_ms"] = millis();
    
    String response;
    serializeJson(doc, response);
    
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
  });

  // Default route (debug)
  server.onNotFound([]() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(404, "text/plain", "Endpoint not found. Available: /open-gate, /status, /health");
  });

  // Start HTTP server on port 80
  server.begin();
  Serial.println("[HTTP] Server started on port 80");
  Serial.println("  GET  /open-gate  - Open gate for 5 seconds");
  Serial.println("  GET  /status     - Get gate status");
  Serial.println("  GET  /health     - Health check");

  Serial.println("\n========================================");
  Serial.println("System Ready!");
  Serial.println("========================================\n");
}

// ========== MAIN LOOP ==========
void loop() {
  // Handle incoming HTTP requests
  server.handleClient();

  // ===== Servo Timing (Non-blocking) =====
  // Check if gate has been open for 5 seconds and close it
  if (servoOpen && (millis() - servoOpenTime >= SERVO_OPEN_DURATION)) {
    gateServo.write(SERVO_CLOSED_ANGLE);
    servoOpen = false;
    Serial.println("[Servo] Gate closed after 5 seconds");
  }

  // ===== Conveyor Control with IR Sensor =====
  // Read IR sensor and control motor
  if (isBowlPresent()) {
    // Bowl detected on belt - STOP motor
    conveyorOff();
  } else {
    // No bowl detected - ROTATE belt
    conveyorOn();
  }

  // Small delay to prevent overwhelming the CPU
  // But not too long to miss quick events
  delay(10);
}

// ========== HELPER FUNCTIONS ==========

/**
 * Open the gate servo to 90 degrees
 * Will automatically close after SERVO_OPEN_DURATION (5 seconds)
 */
void openGateFor5s() {
  gateServo.write(SERVO_OPEN_ANGLE);
  servoOpen = true;
  servoOpenTime = millis();
  Serial.println("[Servo] Gate opened to 90°");
}

/**
 * Check if a bowl is present on the conveyor belt
 * Most IR obstacle sensors: LOW = object detected, HIGH = no object
 * 
 * If your sensor logic is inverted, change the return statement to:
 *   return (val == HIGH);
 */
bool isBowlPresent() {
  int val = digitalRead(IR_PIN);
  // LOW typically means object (bowl) detected on most IR modules
  bool detected = (val == LOW);
  
  // Uncomment below for debugging IR sensor
  // Serial.printf("[IR] Sensor value: %d (%s)\n", val, detected ? "Bowl present" : "No bowl");
  
  return detected;
}

/**
 * Start the conveyor belt motor
 * Rotates forward (positive direction)
 */
void conveyorOn() {
  // Set motor to rotate forward
  digitalWrite(MOTOR_IN1, HIGH);   // Forward control ON
  digitalWrite(MOTOR_IN2, LOW);    // Backward control OFF
  
  // Uncomment below for debugging motor
  // Serial.println("[Motor] ON - Belt rotating");
}

/**
 * Stop the conveyor belt motor
 */
void conveyorOff() {
  // Stop motor completely
  digitalWrite(MOTOR_IN1, LOW);    // Both pins LOW = motor brake/off
  digitalWrite(MOTOR_IN2, LOW);
  
  // Uncomment below for debugging motor
  // Serial.println("[Motor] OFF - Belt stopped");
}

/*
 * ========== OPTIONAL: Add PWM Speed Control ==========
 * If you want to control motor speed with PWM instead of just on/off,
 * use these functions instead and add PWM pins:
 * 
 * #include <analogWrite.h>
 * const int MOTOR_PWM = 14;  // PWM pin for speed control
 * 
 * void conveyorOn(uint8_t speed = 255) {
 *   digitalWrite(MOTOR_IN1, HIGH);
 *   digitalWrite(MOTOR_IN2, LOW);
 *   analogWrite(MOTOR_PWM, speed);  // 0-255: speed control
 * }
 * 
 * void conveyorOff() {
 *   digitalWrite(MOTOR_IN1, LOW);
 *   digitalWrite(MOTOR_IN2, LOW);
 *   analogWrite(MOTOR_PWM, 0);
 * }
 */
