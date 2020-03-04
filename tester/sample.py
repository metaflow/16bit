#!/usr/bin/env python3

import sys
import os
import serial
import time

class Ctrl:
    def __init__(self, port):
        self.ser = serial.Serial(port, 57600, timeout=1)
        self.verbose = False

    def readLine(self):
        return self.ser.readline().decode('utf-8').replace('\r', '').replace('\n','')

    def send(self, s):
        self.ser.write(bytes(s + '\n', 'utf-8'))
        if self.verbose:
            print("<-", s)
        while True:
            o = ctrl.readLine()
            if o != "":
                break
        if self.verbose:
            print("->", o)
        return o

    def signal(self, a, b):
        self.send('s{}{}'.format(a, b))

    def readSignal(self, a):
        return self.send('g{}'.format(a))

    def releaseBus(self):
        self.send('x')

    def releaseSignals(self):
        self.send('z')

    def setBus(self, x):
        self.send('w{}'.format(x))
    
    def setBusAndClock(self, x):
        self.send('W{}'.format(x))

    def readBus(self):
        return int(self.send('r'))

    def clock(self):
        self.send('c1')


if len(sys.argv) < 3:
    print("Provide a command and port")
    sys.exit(1)

ctrl = Ctrl(sys.argv[2])
# ctrl.verbose = True
# wait for "initialized"
time.sleep(0.5)
while True:
    s = ctrl.readLine()
    if s != "":
        print("->", s)
        break
    pass

ctrl.releaseBus()
ctrl.releaseSignals()

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

def registerRw(x):
    noe = 0
    nw = 1
    ctrl.setBus(x)
    ctrl.signal(nw,0)
    # time.sleep(0.1)
    ctrl.clock()
    ctrl.signal(nw,1)
    ctrl.releaseBus()
    ctrl.signal(noe, 0)
    # time.sleep(0.1)
    b = ctrl.readBus()
    ctrl.signal(noe, 1)
    print("wrote {0:#06x} {0:#018b} got {1:#06x} {1:#018b} {2}".format(x, b, "OK" if x == b else "FAILED"))

def register():
    noe = 0
    nw = 1
    probe = 2
    print("oe=0 w=0")
    # ctrl.verbose = True
    ctrl.signal(noe, 1)
    ctrl.signal(nw, 1)
    m = (2 ** 16) - 1

    while(1):
        for i in range(0, 16):
            registerRw(2 ** i)
            # ctrl.setBus(2 ** i - 1)
            # ctrl.releaseBus()
        for i in range(0, 17):
            registerRw(2 ** i - 1)
        registerRw(0)
        input()

register()
# ctrl.signal(0, 1)
# ctrl.signal(1, 1)
# ctrl.signal(2, 1)
# ctrl.signal(3, 1)
# ctrl.signal(4, 1)

# input("all signals 1")

# ctrl.signal(0, 0)
# ctrl.signal(1, 0)
# ctrl.signal(2, 0)
# ctrl.signal(3, 0)
# ctrl.signal(4, 0)

# input("all signals 0")


# ctrl.signal(0, 2)
# ctrl.signal(1, 2)
# ctrl.signal(2, 2)
# ctrl.signal(3, 2)
# ctrl.signal(4, 2)

# input("all signals disconnected")

# while (1):
#     ctrl.signal(0, 1)
#     x = ctrl.readBus()
#     print("> ", x)
#     for i in range(int(x)):
#         ctrl.clock()
#     time.sleep(3)
