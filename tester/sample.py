#!/usr/bin/env python3

import sys
import os
import serial
import time

class Ctrl:
    def __init__(self, port):
        self.ser = serial.Serial(port, 115200, timeout=1)

    def readLine(self):
        return self.ser.readline().decode('utf-8').replace('\r', '').replace('\n','')

    def send(self, s):
        self.ser.write(bytes(s + '\n', 'utf-8'))
        return ctrl.readLine()

    def signal(self, a, b):
        self.send('s{}{}'.format(a, b))

    def releaseBus(self):
        self.send('x')

    def releaseSignal(self):
        self.send('z')

    def setBus(self, x):
        self.send('w{}'.format(x))
    
    def setBusAndClock(self, x):
        self.send('W{}'.format(x))

    def readBus(self):
        return int(self.send('r'))

    def clock(self):
        self.send('c100')


if len(sys.argv) < 3:
    print("Provide a command and port")
    sys.exit(1)

ctrl = Ctrl(sys.argv[2])

# skip init lines
while True:
    s = ctrl.readLine()
    if s != "":
        break
    pass

ctrl.releaseBus()
ctrl.releaseSignal()

def test():
    # write speed
    start = time.time()
    v = 2095
    for i in range(v):
        ctrl.setBus(i)
    end = time.time()
    print(end - start)
    print(v / (end - start), "Hz")
    print((end - start) / v, "s per cycle")

ctrl.signal(0, 1)
ctrl.signal(1, 1)
ctrl.signal(2, 1)
ctrl.signal(3, 1)
ctrl.signal(4, 1)

input("all signals 1")

ctrl.signal(0, 0)
ctrl.signal(1, 0)
ctrl.signal(2, 0)
ctrl.signal(3, 0)
ctrl.signal(4, 0)

input("all signals 0")


ctrl.signal(0, 2)
ctrl.signal(1, 2)
ctrl.signal(2, 2)
ctrl.signal(3, 2)
ctrl.signal(4, 2)

input("all signals disconnected")

while (1):
    ctrl.signal(0, 1)
    x = ctrl.readBus()
    print("> ", x)
    for i in range(int(x)):
        ctrl.clock()
    time.sleep(3)
