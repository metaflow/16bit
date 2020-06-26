import Konva from 'konva';
import { Breadboard } from './components/breadboard';
import { Contact } from './components/contact';
import { address, Addressable, roots } from './address';
import { Selectable } from './actions/select_action';
import { Component } from './components/component';

let _stage: Konva.Stage | null = null;

function alignToGrid(x: number, y: number) {
    const g = 20;
    x = Math.round(x / g) * g;
    y = Math.round(y / g) * g;
    return [x, y];
}

export function stage(s?: Konva.Stage): Konva.Stage | null {
    if (s !== undefined) _stage = s;
    return _stage;
}

export function getCursorPosition(): Konva.Vector2d {
    let pos = stage()?.getPointerPosition();
    if (pos == null) pos = {x: 0, y: 0};
    return pos;
}

export function getPhysicalCursorPosition(): [number, number] {
    const xy = getCursorPosition();
    return toPhysical(xy.x, xy.y);
}

export function scale(): number {
    return 4;
}

export function toScreen(x: number, y: number): [number, number] {
    return [x * scale(), y * scale()]
}

export function toPhysical(x: number, y: number): [number, number] {
    return [x / scale(), y / scale()];
}

const contacts = new Map<string, Contact>();
export function addContact(c: Contact) {
    contacts.set(c.address(), c);
}

export function removeContact(c: Contact) {
    contacts.delete(c.address());
}

export function distance(c: [number, number, number, number]): number {
    const dx = c[0] - c[2];
    const dy = c[1] - c[3];
    return Math.sqrt(dx * dx + dy * dy);
}

export function closesetContact(xy?: [number, number]): Contact | null {
    if (xy === undefined) {
        const pos = getCursorPosition();
        xy = toPhysical(pos.x, pos.y);        
    }
    let z: Contact | null = null;
    let dz = 0;
    contacts.forEach(c => {
        const d = distance([c!.x(), c!.y(), xy![0], xy![1]]);
        if (z == null || d < dz) {
            z = c;
            dz = d;
        }
    });
    return z;
}

let _defaultLayer: Konva.Layer|null;
export function defaultLayer(layer?: Konva.Layer): Konva.Layer|null {
    if (layer !== undefined) {
        _defaultLayer = layer;
        layer.setAttr('name', 'default');
    }
    return _defaultLayer;
}

let _actionLayer: Konva.Layer|null;
export function actionLayer(layer?: Konva.Layer): Konva.Layer|null {    
    if (layer !== undefined) {
        _actionLayer = layer;
        layer.setAttr('name', 'action');
    }
    return _actionLayer;
}

export function layerByName(name: string): Konva.Layer | null {
    if (name === 'action') return actionLayer();
    return defaultLayer();
}

let _selection: Selectable[] = [];
export function selection(): Selectable[] {
    return _selection;
}

export function selectionAddresses(): string[] {
    return _selection
    .filter(a => (a instanceof Component))
    .map(a => address((a as any) as Addressable))
    .sort();
}

export function clearSelection() {
    for (const s of _selection) select(s, false);
}

export function select(x: any, v?: boolean) {
    if (v === undefined) v = true;
    (x as Selectable).selected(v);
    if (v) {
        _selection.push(x);
    } else {
        _selection = _selection.filter(y => y != x);
    }
}

export interface StageState {
    components: any[];
    selection: string[];
}

export function fullState(): StageState {
     let z: StageState = {
        components: [],
        selection: selectionAddresses(),
     }
     roots.forEach((v, k) => {
         z.components.push((v as Component).serialize());
     })
     return z;
}