#include <Arduino.h>
#include <SoftwareSerial.h>

SoftwareSerial port(3 /* rx */, 4 /* tx */);

const int CLK = 13;
const int BTN = 2;
const int BUS_SIZE = 16;
const int SIGNALS_SIZE = 3;
const int SIGNALS[SIGNALS_SIZE] = {5, 6, 7};
const unsigned long serial_speed = 38400;
char driver_state = '?';
int prev_btn = 0;
int cycle = 0;
int pressed_cycles = 0;

void driver(char s, uint16_t value) {
  if (driver_state == 'x' && s == 'x') return;
  driver_state = s;  
  port.println(String(s) + String(value));
   // To make sure that driver received and had a chance to react.
  if (s == 'x') delay(10);
}

void driver(char s) {
  driver(s, 0);
}

void releaseBus() {
  driver('x');
}

void releaseSignals() {
  for (int i = 0; i < SIGNALS_SIZE; i++) pinMode(SIGNALS[i], INPUT);
}

void setup() {
  Serial.begin(serial_speed);
  port.begin(serial_speed);
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

void writeBus(uint16_t x) {
  driver('w', x);
}

void signal(uint8_t i, uint8_t v) {
  pinMode(SIGNALS[i], OUTPUT);
  digitalWrite(SIGNALS[i], v);
}

void next() {
  uint16_t v = 0;
  if (cycle < BUS_SIZE) {
    releaseSignals();
    for (int i = 0; i < BUS_SIZE; i++) {
      v += (i == cycle) << i;
    }
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
  if (Serial.available()) {
    String s = Serial.readStringUntil('\n');
    s.replace("\r", "");
    if (s.length() == 0) return;
    char op = s[0];
    if (op == 'b') {
      uint16_t val = s.substring(1).toInt();
      writeBus(val);
    }
    if (op == 'r') {
      Serial.println(readBus());
    }
    if (op == 's') {
      int i = s[1] == '1';
      int v = s[2] == '1';
      signal(i, v);
    }
    if (op == 'z') {
      releaseBus();
    }
    if (op == 'x') {
      releaseSignals();
    }
    if (op == 'c') {
      clock(s.substring(1).toInt());
    }
  }
}

void processButton() {
  int btn = digitalRead(BTN);
  if (prev_btn != btn) {
    if (btn == LOW) {
      clock(100);
    }
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