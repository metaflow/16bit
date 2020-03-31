#!/usr/bin/env python3

import sys
import os
import uuid
import math
import shutil
from tabulate import tabulate
import xml.dom.minidom
import xml.etree.ElementTree

PIN = 0.1 * 25.4  # distance between two close pins 0.1 inches.


def dist(x1, y1, x2, y2):
    return round(((x1 - x2) ** 2 + (y1 - y2) ** 2) ** 0.5 / 9.0 * PIN)


if len(sys.argv) < 2:
    print("provide a .fz file")
    exit(1)
print(sys.argv[1])
fz = sys.argv[1]

root = xml.etree.ElementTree.parse(fz).getroot()

properties = {
    '#418dd9': {'color': 'blue'},
    '#cc1414': {'color': 'red'},
    '#fff800': {'color': 'yellow', 'overIC': True, 'overWire': True},
    '#ef6100': {'color': 'orange'},
    '#25cc35': {'color': 'green', 'overIC': True},
    '#ffffff': {'color': 'white', 'level': 2},
    '#404040': {'color': 'black'},
    '#33ffc5': {'color': 'cyan', 'level': 1},
    '#fa50e6': {'color': 'pink', 'level': 4},
}
points = {}
edges = {}
for e in root.findall('instances/instance[@moduleIdRef="WireModuleID"]'):
    v = e.find('views/breadboardView')
    if v is None:
        continue
    g = v.find('geometry')
    x = float(g.get('x'))
    y = float(g.get('y'))
    x1 = float(g.get('x1')) + x
    y1 = float(g.get('y1')) + y
    x2 = float(g.get('x2')) + x
    y2 = float(g.get('y2')) + y
    z = round(float(g.get('z')))
    ex = v.find('wireExtras')
    color = ex.get('color')
    name = e.find('title').text
    p1 = '{},{},{}'.format(round(x1), round(y1), color)
    p2 = '{},{},{}'.format(round(x2), round(y2), color)
    if not p1 in points:
        points[p1] = {'edges': [], 'x': x1, 'y': y1, 'color': color}
    points[p1]['edges'].append(name)
    if not p2 in points:
        points[p2] = {'edges': [], 'x': x2, 'y': y2, 'color': color}
    points[p2]['edges'].append(name)
    pins = [a.get('connectorId') for a in v.findall('connectors/connector/connects/connect')]
    pins = [x.replace('pin', '') for x in pins if x.startswith('pin')]
    edges[name] = {'pins': pins, 'color': color, 'points': [p1, p2]}

visited = {}
wires = []
# Got through all point keys and find first that has single edge from it but is not visited yet.
for k in points.keys():
    if k in visited:
        continue
    if len(points[k]['edges']) != 1:
        continue
    path = []
    pins = []
    prev_e = ''
    color = points[k]['color']
    while k:
        t = None
        visited[k] = True
        p = points[k]
        path.append((p['x'], p['y']))  # TODO
        for e in p['edges']:
            if e == prev_e:
                continue
            prev_e = e
            pins += edges[e]['pins']
            for a in edges[e]['points']:
                if a != k:
                    t = a
                    break
            break
        k = t
    props = {}
    if color in properties:
        props = properties[color]
        color = props['color']
    pins = [(int(x[:-1]), x[-1]) for x in pins]
    wires.append({
        'props': props,
        'path': path,
        'color': color,
        'pins': sorted(pins),
    })
print('{} orange wires dropped'.format(len([w for w in wires if (w['color'] == 'orange')])))
wires = [w for w in wires if (w['color'] != 'orange')]
for w in wires:
    c = w['color']
    p = w['props']
    d = 0
    desc = ''
    for i in range(0, len(w['path']) - 1):
        if i > 0:
            desc += ' + '
        s = dist(w['path'][i][0], w['path'][i][1], w['path'][i + 1][0], w['path'][i + 1][1])
        desc += '{}'.format(s)
        d += s
    d += 8 * 2
    desc += ' + 8x2 pins'
    if 'overIC' in p:
        desc += ' + 2 IC'
        d += 2
    if 'overWire' in p:
        d += 1
        desc += ' + 1 over wire'
    if 'level' in p:
        s = p['level'] * 2 + 3
        desc += ' + {}x2 lvl{}'.format(s, p['level'])
        d += s * 2
    if len(w['path']) > 2:
        s = round(PIN * (len(w['path']) - 2) / 3)
        d -= s
        desc += ' -{} bend'.format(s)
    w['cut'] = d
    w['comment'] = desc

wires = sorted(wires, key=lambda w: (w['color'], w['pins']))
tbl = []
for w in wires:
    tbl.append([
        w['cut'],
        w['cut'] - 16,
        w['color'],
        ''.join([str(x) for x in w['pins'][0]]),
        ''.join([str(x) for x in w['pins'][1]]),
        w['comment']])

print(tabulate(tbl))
