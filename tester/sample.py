#!/usr/bin/env python3

import sys
import os
import serial
import time

class Ctrl:
    def __init__(self, port):
        self.ser = serial.Serial(port, 38400, timeout=1)

    def readLine(self):
        return self.ser.readline().decode('utf-8').replace('\r', '').replace('\n','')


    def send(self, s):
        self.ser.write(bytes(s + '\n', 'utf-8'))

    def signal(self, a, b):
        self.send('s{}{}'.format(a, 1 if b else 0))

    def releaseBus(self):
        self.send('z')

    def releaseSignal(self):
        self.send('x')

    def setBus(self, x):
        self.send('b{}'.format(x))

    def readBus(self):
        self.send('r')
        return int(self.readLine())

    def clock(self):
        self.send('c100')


if len(sys.argv) < 3:
    print("Provide a command and port")
    sys.exit(1)

ctrl = Ctrl(sys.argv[2])
# port = sys.argv[2]
# action = sys.argv[1]
# skip init lines
print(ctrl.readLine())
print(ctrl.readLine())
ctrl.releaseBus()
ctrl.releaseSignal()
while (1):
    ctrl.signal(0, 1)
    x = ctrl.readBus()
    print("> ", x)
    for i in range(int(x)):
        ctrl.clock()
    time.sleep(3)
    

