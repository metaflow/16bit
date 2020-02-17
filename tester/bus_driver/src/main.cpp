#include <Arduino.h>

/* Bus controller: tri-state control overe 16 bit bus.
Interacts via serail port and supports commands (send as a line):
- write to bus "w<number>", e.g. "w15444".
- read bus "r", returns bus value in decimal format.
- disconnect from the bus, "x". Responds with newline.
 */

const int BUS_SIZE = 16;
const int BUS[] = {4,  5,  6,      7,      8,      9,      10,     11,
                   12, 3, PIN_A0, PIN_A1, PIN_A2, PIN_A3, PIN_A4, PIN_A5};

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < BUS_SIZE; i++) { pinMode(BUS[i], INPUT); }
}

int prev_btn = 0;
int output = 0;
int pressed_cycles = 0;

void setBus() {
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

char last_op = '?';

void loop() {
  if (!Serial.available()) return;
  String s = Serial.readStringUntil('\n');
  if (s.length() == 0) return;
  char op = s[0];
  switch (op) {
    case 'W':
    case 'w': {
      if (last_op != op) {
        for (int i = 0; i < BUS_SIZE; i++) pinMode(BUS[i], OUTPUT);
      }
      uint16_t val = s.substring(1).toInt();
      for (int i = 0; i < BUS_SIZE; i++) {
        digitalWrite(BUS[i], (val & (1 << i)) != 0);
      }
      break;
    }
    case 'x':
      if (last_op != op)
        for (int i = 0; i < BUS_SIZE; i++) pinMode(BUS[i], INPUT);
      Serial.println(op);
      break;
    case 'r': {
      for (int i = 0; i < BUS_SIZE; i++) pinMode(BUS[i], INPUT);
      uint16_t val = 0;
      for (int i = 0; i < BUS_SIZE; i++) { val += (digitalRead(BUS[i])) << i; }
      Serial.println(String(val));
      break;
    }
  }
  last_op = op;
}