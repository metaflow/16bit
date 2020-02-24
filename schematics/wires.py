#!/usr/bin/env python3

import sys
import os
import uuid
import math
import shutil
from tabulate import tabulate
import xml.dom.minidom
import xml.etree.ElementTree

def dist(x1, y1, x2, y2):
    return round(((x1 - x2) ** 2 + (y1 - y2) ** 2) ** 0.5 / 9.0 * (0.1 * 25.4))

if len(sys.argv) < 2:
    print("provide a .fzz file")
    exit(1)
print(sys.argv[1])
src = sys.argv[1]
dir = str(uuid.uuid4())
os.system('unzip {} -d {}'.format(src, dir))
ff = [os.path.join(dir, f) for f in os.listdir(dir) if os.path.isfile(os.path.join(dir, f)) and f.endswith(".fz")]
if len(ff) == 0:
    print('no fz files found')
    exit(1)
fz = ff[0]
print('processing', fz)

root = xml.etree.ElementTree.parse(fz).getroot()

properties = {
    '#418dd9': { 'color': 'blue' }, 
    '#cc1414': { 'color': 'red'  }, 
    '#fff800': { 'color': 'yellow', 'overIC': True, 'overWire': True }, 
    '#fff800': { 'color': 'yellow', 'overIC': True, 'overWire': True }, 
    '#ef6100': { 'color': 'orange'},
    '#25cc35': { 'color': 'green', 'overIC': True },
    '#ffffff': { 'color': 'white' },
    '#404040': { 'color': 'black' },
    '#33ffc5': { 'color': 'cyan', 'overWire': True }
}
wires = []
for e in root.findall('instances/instance[@moduleIdRef="WireModuleID"]'):
    # if e.getAttribute('moduleIdRef') != 'WireModuleID':
    #     continue
    # print(e)
    x = e.find('views/breadboardView')
    if x is None:
        continue
    g = x.find('geometry')
    x1 = float(g.get('x1'))
    y1 = float(g.get('y1'))
    x2 = float(g.get('x2'))
    y2 = float(g.get('y2'))
    e = x.find('wireExtras')
    color = e.get('color')
    p = {}
    if color in properties:
        p = properties[color]
        color = p['color']
    mils = float(e.get('mils'))
    pins = [a.get('connectorId').replace('pin', '') for a in x.findall('connectors/connector/connects/connect')]
    pins = [(int(x[:-1]), x[-1]) for x in pins]
    wire = {'length': dist(x1, y1, x2, y2), 'color': color, 'pins': sorted(pins), 'props': p}
    wires.append(wire)
    # print(dist(x1, y1, x2, y2), x1, x2, color, mils, pins)
print('{} orange wires are dropped', len([w for w in wires if (w['color'] == 'orange')]))
wires = [w for w in wires if (w['color'] != 'orange')]
for w in wires:
    c = w['color']
    p = w['props']
    d = w['length']
    desc = '{}mm '.format(d)
    d += 7 * 2
    desc += ' +14mm pins'
    if 'overIC' in p:
        desc += ' +2mm over IC'
        d += 2
    if 'overWire' in p:
        d += 1
        desc += ' +1mm over wire'
    w['cut'] = d
    w['comment'] = desc

wires = sorted(wires, key=lambda w: (w['color'], w['pins']))
tbl = []
for w in wires:
    tbl.append([w['cut'], w['color'], w['pins'][0], w['pins'][1], w['comment']])
    # print(w['cut'], w['color'], w['pins'][0], w['pins'][1], w['comment'])

print(tabulate(tbl))

shutil.rmtree(dir, ignore_errors=False, onerror=None)