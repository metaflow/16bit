#include <Arduino.h>
#include <SoftwareSerial.h>

/* Controller/debugger. Controls "bus driver" to operate the bus.
Supported ops:
- write to the bus "w<decimal>", e.g. "w446".
- write to the bus and clock "W<decimal>".
- read bus "r", responds with decimal value.
- disconnect from bus "x"
- set signal "s<pin><value>", pin=0..4, value = 0 / 1 - active low/high.
- get signal "g<pin". That also puts pin in "passive mode".
- disconnect all signals "z"
- send clock signal "c<half width ms>". E.g. "c50". Waits for a whole cycle.
Each command responds with a line.
 */

SoftwareSerial port(3 /* rx */, 4 /* tx */);

const int           CLK = 13;
const int           BTN = 2;
const int           BUS_SIZE = 16;
const int           SIGNALS_SIZE = 5;
const int           SIGNALS[SIGNALS_SIZE] = {5, 6, 7, 8, 9};
const unsigned long serial_speed = 57600;
char                driver_state = '?';
int                 prev_btn = 0;
int                 cycle = 0;
int                 pressed_cycles = 0;

void driver(char s, uint16_t value) {
  if (driver_state == 'x' && s == 'x') return;
  driver_state = s;
  port.println(String(s) + String(value));
  // To make sure that driver received and had a chance to react.
  if (s == 'x') delay(10);
}

void driver(char s) { driver(s, 0); }

void releaseBus() {
  driver('x');
  port.readStringUntil('\n');
}

void releaseSignals() {
  for (int i = 0; i < SIGNALS_SIZE; i++) pinMode(SIGNALS[i], INPUT);
}

void setup() {
  Serial.begin(serial_speed);
  port.begin(serial_speed);
  port.setTimeout(5000);
  port.listen();
  pinMode(CLK, OUTPUT);
  pinMode(BTN, INPUT_PULLUP);
  releaseSignals();
  releaseBus();
  Serial.println("Initialized");
}

String formatBinary(uint16_t x) {
  String s("0b");
  for (int i = 0; i < BUS_SIZE; i++) s += '0';
  int n = s.length();
  for (int i = 0; i < BUS_SIZE; i++) {
    if (x % 2) s[n - i - 1] = '1';
    x /= 2;
  }
  return s;
}

uint16_t readBus() {
  driver('r');
  return port.readStringUntil('\n').toInt();
}

void writeBus(uint16_t x) { driver('w', x); }

void signal(uint8_t i, uint8_t v) {
  if (v == 2) {
    pinMode(SIGNALS[i], INPUT);
  } else {
    pinMode(SIGNALS[i], OUTPUT);
    digitalWrite(SIGNALS[i], v);
  }
}

void next() {
  uint16_t v = 0;
  if (cycle < BUS_SIZE) {
    releaseSignals();
    for (int i = 0; i < BUS_SIZE; i++) { v += (i == cycle) << i; }
    writeBus(v);
    Serial.println(String("set bus=") + String(v) + " " + formatBinary(v));
  } else {
    releaseBus();
    signal(0, 1);
    delay(500);
    v = readBus();
    Serial.println(String("read bus=") + String(v) + " " + formatBinary(v));
  }
  // cycle = (cycle + 1) % (BUS_SIZE * 2);
  cycle++;
}

void clock(int w) {
  digitalWrite(CLK, HIGH);
  delay(w);
  digitalWrite(CLK, LOW);
  delay(w);
}

void processSerial() {
  if (!Serial.available()) return;
  String s = Serial.readStringUntil('\n');
  if (s.length() == 0) return;
  char op = s[0];
  switch (op) {
    case 'w':
      port.println(s);
      Serial.println(op);
      break;
    case 'W':
      port.println(s);
      clock(0);
      Serial.println(op);
      break;
    case 'r':
      port.println(s);
      Serial.println(port.readStringUntil('\n'));
      break;
    case 'x':
      port.println(s);
      Serial.println(port.readStringUntil('\n'));
      break;
    case 's': {
      int i = s[1] - '0';
      int v = s[2] - '0';
      signal(i, v);
      Serial.println(op);
      break;
    }
    case 'g': {
      int i = s[1] - '0';
      pinMode(SIGNALS[i], INPUT);
      Serial.println(String(digitalRead(SIGNALS[i])));
      break;
    }
    case 'z':
      releaseSignals();
      Serial.println(op);
      break;
    case 'c':
      clock(s.substring(1).toInt());
      Serial.println(op);
      break;
  }
}

void processButton() {
  int btn = digitalRead(BTN);
  if (prev_btn != btn) {
    if (btn == LOW) { clock(100); }
    prev_btn = btn;
  } else {
    if (btn == LOW) {
      pressed_cycles++;
      if (pressed_cycles > 10) {
        pressed_cycles = 10;
        clock(100);
        // next();
      } else {
        delay(100);
      }
    } else {
      pressed_cycles = 0;
    }
  }
}

void loop() {
  processSerial();
  processButton();
}