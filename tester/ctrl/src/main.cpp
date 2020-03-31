#include <Arduino.h>

/* Controller/debugger. Controls "bus driver" to operate the bus.
Supported ops:
- write to the bus "w<decimal>", e.g. "w446".
- write to the bus and clock "W<decimal>".
- read bus "r", responds with decimal value.
- disconnect from bus "x"
- set signal "s<pin><value>", pin=0..4, value = 0 / 1 - active low/high.
- read signal "g<pin". That also puts pin in "passive mode".
- disconnect all signals "z"
- send clock signal "c<half width ms>". E.g. "c50". Waits for a whole cycle.
Each command responds with a line.
 */


const int           CLK = 52;
const int           SIGNALS_SIZE = 6;
const int           SIGNALS[SIGNALS_SIZE] = {50, 48, 46, 44, 42, 40};
const unsigned long serial_speed = 57600;
const int BUS_SIZE = 16;
const int BUS[] = {53, 51, 49, 47, 45, 43, 41, 39, 37, 35, 33, 31, 29, 27, 25, 23};

void releaseBus() {
  for (int i = 0; i < BUS_SIZE; i++) pinMode(BUS[i], INPUT);
}

void releaseSignals() {
  for (int i = 0; i < SIGNALS_SIZE; i++) pinMode(SIGNALS[i], INPUT);
}

void signal(uint8_t i, uint8_t v) {
  pinMode(SIGNALS[i], OUTPUT);
  digitalWrite(SIGNALS[i], v);
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

void clock(int w) {
  digitalWrite(CLK, HIGH);
  digitalWrite(LED_BUILTIN, HIGH);
  delay(w);
  digitalWrite(CLK, LOW);
  digitalWrite(LED_BUILTIN, LOW);
}

char last_op = '?';

void processSerial() {
  if (!Serial.available()) return;
  String s = Serial.readStringUntil('\n');
  if (s.length() == 0) return;
  char op = s[0];
  switch (op) {
    case 'w': {
      // Write to the bus.
      if (last_op != op) {
        for (int i = 0; i < BUS_SIZE; i++) pinMode(BUS[i], OUTPUT);
      }
      uint16_t val = s.substring(1).toInt();
      for (long i = 0; i < BUS_SIZE; i++) {
        digitalWrite(BUS[i], (val & (long(1) << i)) != 0);
      }
      // Serial.println(op);
      break;
    }
    case 'x':
      if (last_op != op) releaseBus();
      Serial.println(op);
      break;
    case 'r': {
      // Read bus.
      for (int i = 0; i < BUS_SIZE; i++) pinMode(BUS[i], INPUT);
      uint16_t val = 0;
      for (int i = 0; i < BUS_SIZE; i++) { val += long(digitalRead(BUS[i])) << i; }
      Serial.println(String(val));
      break;
    }
    case 's': {
      int i = s[1] - '0';
      int v = s[2] - '0';
      signal(i, v);
      // Serial.println(op);
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
      // Serial.println(op);
      break;
  }
  last_op = op;
}

void setup() {
  Serial.begin(serial_speed);
  releaseBus();
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(CLK, OUTPUT);
  releaseSignals();
  releaseBus();
  // Set signals high as OE is usually inverted.
  for (int i = 0; i < SIGNALS_SIZE; i++) signal(i, 1);
  Serial.println("Initialized");
}

void loop() {
  processSerial();
}