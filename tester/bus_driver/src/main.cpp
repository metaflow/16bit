#include <Arduino.h>

// const int CLK = 13;
// const int BTN = 2;
const int BUS_SIZE = 16;
const int BUS[] = {4,  5,      6,      7,      8,      9,      10,
                   11, 12, 13, PIN_A0, PIN_A1, PIN_A2, PIN_A3, PIN_A4, PIN_A5};

void setup() {
  Serial.begin(38400);
  // pinMode(CLK, OUTPUT);
  // pinMode(BTN, INPUT_PULLUP);
  for (int i = 0; i < BUS_SIZE; i++) { pinMode(BUS[i], OUTPUT); }
}

int prev_btn = 0;
int output = 0;
int pressed_cycles = 0;

void set_bus() {
  if (output < BUS_SIZE) {
    for (int i = 0; i < BUS_SIZE; i++) { digitalWrite(BUS[i], i == output); }
  } else {
    for (int i = 0; i < BUS_SIZE; i++) { digitalWrite(BUS[i], rand() % 2); }
  }
  output = (output + 1) % (BUS_SIZE * 2);
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

void loop() {
  // uint8_t command[256];
  if (!Serial.available()) {
    delay(1);
    return;
  }
  String s = Serial.readStringUntil('\n');
  if (s.length() == 0) return;
  char op = s[0];
  if (op == 'w') {
    uint16_t val = s.substring(1).toInt();
    for (int i = 0; i < BUS_SIZE; i++) pinMode(BUS[i], OUTPUT);
    for (int i = 0; i < BUS_SIZE; i++) {
      digitalWrite(BUS[i], (val & (1 << i)) != 0);
    }
  }
  if (op == 'x') {
    for (int i = 0; i < BUS_SIZE; i++) pinMode(BUS[i], INPUT);
  }
  if (op == 'r') {
    for (int i = 0; i < BUS_SIZE; i++) pinMode(BUS[i], INPUT);
    uint16_t val = 0;
    for (int i = 0; i < BUS_SIZE; i++) {
      val += (digitalRead(BUS[i])) << i;
    }
    Serial.println(String(val));
  }
}