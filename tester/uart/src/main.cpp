#include <Arduino.h>

const int ADDR0 = 51;
const int ADDR1 = 52;
const int ADDR2 = 53;
const int D0 = 50;
const int D1 = 49;
const int D2 = 48;
const int D3 = 47;
const int D4 = 46;
const int D5 = 45;
const int D6 = 44;
const int D7 = 43;

const int CSA = 42;
const int CSB = 41;

const int IOR = 40;
const int IOW = 39;

const int RESET = 38;

const int INTA = 37;
const int INTB = 36;

const int RXRDYA = 35;
const int RXRDYB = 34;
const int TXRDYA = 33;
const int TXRDYB = 32;

const int ADDR[] = {ADDR0, ADDR1, ADDR2};
const int DATA[] = {D0, D1, D2, D3, D4, D5, D6, D7};

int read(int a) {
  int t = a;
  for (int i = 0; i < 3; i++) {
    digitalWrite(ADDR[i], t % 2);
    t /= 2;
  }
  // delay(10);
  digitalWrite(IOR, LOW);
  int d = 0;
  for (int i = 0; i < 8; i++) {
    d *= 2;
    d += digitalRead(DATA[7 - i]);
  }
  digitalWrite(IOR, HIGH);
  // delay(10);
  return d;
}

void write(int a, int d) {
  a = a & 0x0f;
  for (int i = 0; i < 8; i++) pinMode(DATA[i], OUTPUT);
  int t = a;
  for (int i = 0; i < 3; i++) {
    digitalWrite(ADDR[i], t % 2);
    t /= 2;
  }    
  for (int i = 0; i < 8; i++) {
    digitalWrite(DATA[i], d % 2);
    d /= 2;
  }
  // delay(1);
  digitalWrite(IOW, LOW);
  // delay(10);
  digitalWrite(IOW, HIGH);
  // delay(10);
  for (int i = 0; i < 8; i++) pinMode(DATA[i], INPUT);
}

String tos(int d, int bits) {
  String bin(d, BIN);
  while (int(bin.length()) < bits) bin = '0' + bin;
  String hex(d, HEX);
  while (int(hex.length()) * 4 < bits) hex = '0' + hex;
  String dec(d);
  String m(1 << bits);
  while (dec.length() < m.length()) dec = '0' + dec;
  return String("0b") + bin + " 0x" + hex + ' ' + dec;
}

int prev_lsr = 0;

int readState(bool rx) {
  int h = 0;
  // for (int a = 0; a < 4; a++) Serial.print(tos(a, 8) + " | ");
  // Serial.println();
  h ^= digitalRead(INTA) * 4 + digitalRead(RXRDYA) * 2 + digitalRead(TXRDYA);
  Serial.println(String("INT, RX, TX: ") + String(digitalRead(INTA)) + ' ' +
                 digitalRead(RXRDYA) + ' ' + digitalRead(TXRDYA));
  while (rx && digitalRead(INTA)) {
    Serial.println(String("RHR: ") + tos(read(0), 8));
  }
  for (int a = 0; a < 8; a++) {
    int t = read(a);
    Serial.print(tos(t, 8) + " | ");
    h ^= t;
    if ((a + 1) % 4 == 0) Serial.println();
  }
  Serial.println();
  int lsr = read(5);
  if (lsr != prev_lsr) {
    String names[] = {
        "RX available",    "Overrun Error", "Parity Err RX", "Framing Err RX",
        "Break condition", "TX hold empty", "TX empty",      "Err"};
    int t = lsr;
    int p = prev_lsr;
    for (int i = 0; i < 8; i++) {
      Serial.print(names[i] + ": " + (t % 2));
      if (t % 2 != p % 2) Serial.print(" <- updated");
      t /= 2;
      p /= 2;
      Serial.println();
    }
    prev_lsr = lsr;
  }
  // Serial.println(String("INTA  : ") + digitalRead(INTA));
  // Serial.println(String("RXRDYA: ") + digitalRead(RXRDYA));
  // Serial.println(String("TXRDYA: ") + digitalRead(TXRDYA));
  h ^= Serial3.available();
  Serial.println(String("Avail : ") + String(Serial3.available()));
  while (Serial3.available()) {
    Serial.println(tos(Serial3.read(), 8));
  }
  return h;
}

const int MODE0 = 0;
const int MODE1 = 0x10;
const int MODE2 = 0x20;
const int MODE3 = 0x30;
const int MODE4 = 0x40;
const int MODE5 = 0x50;

const int REG_RHR = 0;
const int REG_THR = 0;
const int REG_DLL = 0 | MODE1;
const int REG_DLH = 1 | MODE1;
const int REG_IER = 1 | MODE5;
const int REG_EFR = 2 | MODE3;
const int REG_FCR = 2 | MODE5;
const int REG_LCR = 3;
const int REG_MCR = 4 | MODE5;
const int REG_TCR = 6 | MODE4;
const int REG_TLR = 7 | MODE4;
const int REG_LSR = 5;

void setupRegisteresOld() {
  digitalWrite(RESET, HIGH);
  delay(10);
  digitalWrite(RESET, LOW);
  int lcr = read(REG_LCR);
  // int t = readRegister(REG_LCR);
  // a) set Divisor latch.
  // For 2 MHz crystal and 2400 baud divisor is ~52 (2000_000 / 2400 / 16)
  write(REG_LCR, 0x80);
  write(0, 52);  // LSB
  write(1, 0);   // MSB

  // b) set Xoff1, Xon1.
  write(REG_LCR, 0xBF);
  write(6, 0x13);
  write(7, 0x14);
  write(4, 0x11);
  write(5, 0x12);
  // d) set software flow control to use Xon1, Xoff1. LCR = BF (from prev step)
  write(REG_EFR, 0b00001010);
  // e, f) Set flow control threshold and FIFO thresholds contorol.
  write(REG_LCR, 0xBF);
  int efr = read(REG_EFR);
  write(REG_EFR, 0x10 | efr);
  write(REG_LCR, 0);
  int mcr = read(REG_MCR);
  write(REG_MCR, 0x40 | mcr);
  // Stop at 0xA * 4 = 40 and resume at 0x2 * 4 = 8.
  write(REG_TCR, 0x2a);
  write(REG_TLR, 0x84);  // Use 32 and 16 as interrupt levels.
  write(REG_LCR, 0xBF);
  write(REG_EFR, efr);
  write(REG_LCR, lcr);
  write(REG_MCR, mcr);

  // Set LCR to 8 bit words, no parity, 1 stop bit, no break control.
  write(REG_LCR, 0b00000011);
  // Set interrupts
  write(REG_IER, 0b00000001);  // RHR.
  write(REG_MCR, 0b00001000);
}

void writeReg(int, int);
 
int readReg(int a) {
   int mode = a & 0xf0;
  a = a & 0x0f;
  switch (mode) {
    case MODE0: {
      return read(a);
    }
    case MODE1: {
      int lcr = readReg(REG_LCR);
      writeReg(REG_LCR, 0x80);
      int x  = read(a);
      writeReg(REG_LCR, lcr);
      return x;
    }
    case MODE2: {
      int lcr = readReg(REG_LCR);
      writeReg(REG_LCR, 0b10000000);
      int x  = read(a);
      writeReg(REG_LCR, lcr);
      return x;
    }
    case MODE3: {
      int lcr = readReg(REG_LCR);
      writeReg(REG_LCR, 0xBF);
      int x  = read(a);
      writeReg(REG_LCR, lcr);
      return x;
    }
    case MODE4: {
      int efr = readReg(REG_EFR);
      writeReg(REG_EFR, (1 << 4) | efr);
      int mcr = readReg(REG_MCR);
      writeReg(REG_MCR, (1 << 6) | mcr);
      int x  = read(a);
      writeReg(REG_MCR, mcr);
      writeReg(REG_EFR, efr);
      return x;
    }
    case MODE5: {      
      return read(a);
    }
  }
  Serial.println(tos(mode, 8) + "unknown mode in readReg");
}

void writeReg(int a, int d) {
  int mode = a & 0xf0;
  a = a & 0x0f;
  switch (mode) {
    case MODE0: {
      write(a, d);
      return;
    }
    case MODE1: {
      int lcr = readReg(REG_LCR);
      writeReg(REG_LCR, 0x80);
      write(a, d);
      writeReg(REG_LCR, lcr);
      return;
    }
    case MODE2: {
      int lcr = readReg(REG_LCR);
      writeReg(REG_LCR, 0x80);
      write(a, d);
      writeReg(REG_LCR, lcr);
      return;
    }
    case MODE3: {
      int lcr = readReg(REG_LCR);
      writeReg(REG_LCR, 0xBF);
      write(a, d);
      writeReg(REG_LCR, lcr);
      return;
    }
    case MODE4: {
      int efr = readReg(REG_EFR);
      writeReg(REG_EFR, (1 << 4) | efr);
      int mcr = readReg(REG_MCR);
      writeReg(REG_MCR, (1 << 6) | mcr);
      write(a, d);
      writeReg(REG_MCR, mcr);
      writeReg(REG_EFR, efr);
      return;
    }
    case MODE5: {
      int efr = readReg(REG_EFR);
      writeReg(REG_EFR, (1 << 4) | efr);
      write(a, d);
      writeReg(REG_EFR, efr);
      return;
    }
  }
  Serial.println(tos(mode, 8) + "unknown mode in writeReg");
}

void setupRegisters() {
  digitalWrite(RESET, HIGH);
  // delay(10);
  digitalWrite(RESET, LOW);
  // delay(10);
  writeReg(REG_FCR, 0b00000001);
  writeReg(REG_LCR, 0b00000011); // 8-N-1
  writeReg(REG_MCR, 0b00001000); // IRQx in active state
  writeReg(REG_IER, 0b00000001); // RHR interrupt.
  writeReg(REG_EFR, 0b00000000); // No software flow control.
  writeReg(REG_DLL, 52);
  writeReg(REG_DLH, 0);
}

void setup() {
  Serial.begin(9600);
  Serial3.begin(2400);
  pinMode(IOR, OUTPUT);
  digitalWrite(IOR, HIGH);
  pinMode(IOW, OUTPUT);
  digitalWrite(IOW, HIGH);
  pinMode(RESET, OUTPUT);
  pinMode(CSA, OUTPUT);
  digitalWrite(CSA, LOW);
  pinMode(CSB, OUTPUT);
  digitalWrite(CSB, HIGH);
  for (int i = 0; i < 3; i++) pinMode(ADDR[i], OUTPUT);
  for (int i = 0; i < 8; i++) pinMode(DATA[i], INPUT);
  pinMode(INTA, INPUT);
  pinMode(INTB, INPUT);

  pinMode(RXRDYA, INPUT);
  pinMode(RXRDYB, INPUT);
  pinMode(TXRDYA, INPUT);
  pinMode(TXRDYB, INPUT);

  Serial.println("pin config complete");
  // Reset.
  // setupRegistersOld();
  setupRegisters();

  Serial.println("register config complete");
  // readState(false);
}

int o = int('a');
int state = 0;

void send() {
  Serial.println(String("-> ") + tos(o, 8) + " #" + (o - 'a'));
  Serial3.write(o);
  o++;
  // delay(10);
}

void loop() {
  while (1) {
    for (int i = 0; i < 100; i++) send();
    int t = readState(true);
    int p = t;
    while (1) {
      int x = readState(true);
      if (x == t) break;
      t = x;
    }
    Serial.println(String("state hash ") + p);
    Serial.println(String("<- ") + tos(o, 8) + " #" + (o - 'a'));
    write(0, o);
    o++;
    Serial.println(String("<- ") + tos(o, 8) + " #" + (o - 'a'));
    write(0, o);
    o++;
    readState(true);
    readState(true);
    if (p != state) {
      state = p;
      break;
    }
  }

  while (Serial.available() == 0) delay(100);
  while (Serial.available()) Serial.read();
}