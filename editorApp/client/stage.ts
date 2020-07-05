import Konva from 'konva';
import { Breadboard } from './components/breadboard';
import { Contact } from './components/contact';
import { address, Addressable, roots, getByAddress } from './address';
import { Selectable } from './actions/select_action';
import { Component } from './components/component';

let _stage: Konva.Stage | null = null;
let _gridAlignment: number | null = null;
export type Point = Konva.Vector2d;

export function gridAlignment(v?: number | null): number | null {
    if (v !== undefined) _gridAlignment = v;
    return _gridAlignment;
}

export function stage(s?: Konva.Stage): Konva.Stage | null {
    if (s !== undefined) _stage = s;
    return _stage;
}

export function getCursorPosition(): Point {
    let pos = stage()?.getPointerPosition();
    if (pos == null) pos = { x: 0, y: 0 };
    return pos;
}

export function getPhysicalCursorPosition(): Point {
    const xy = getCursorPosition();
    return toPhysical(xy);
}

export function scale(): number {
    return 4;
}

export function toScreen(xy: Point): Point {
    return point(xy.x * scale(), xy.y * scale());
}

export function toPhysical(xy: Point): Point {
    let x = xy.x / scale();
    let y = xy.y / scale();    
    return point(x, y);
}

export function alignPoint(xy: Point, a: number|null): Point {
    if (a == null) return xy;
    return point( Math.round(xy.x / a) * a, Math.round(xy.y / a) * a);
}

export function point(x: number, y: number): Point {
    return { x, y };
}

export function pointAsNumber(xy: Point): [number, number] {
    return [xy.x, xy.y];
}

export function pointSub(a: Point, b: Point): Point {
    return point(a.x - b.x, a.y - b.y);
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

export function closesetContact(xy?: Point): Contact | null {
    if (xy === undefined) {
        const pos = getCursorPosition();
        xy = toPhysical(pos);
    }
    let z: Contact | null = null;
    let dz = 0;
    contacts.forEach(c => {
        const d = distance([c!.x(), c!.y(), xy!.x, xy!.y]);
        if (z == null || d < dz) {
            z = c;
            dz = d;
        }
    });
    return z;
}

let _defaultLayer: Konva.Layer | null;
export function defaultLayer(layer?: Konva.Layer): Konva.Layer | null {
    if (layer !== undefined) {
        _defaultLayer = layer;
        layer.setAttr('name', 'default');
    }
    return _defaultLayer;
}

let _actionLayer: Konva.Layer | null;
export function actionLayer(layer?: Konva.Layer): Konva.Layer | null {
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

export function selectionAddresses(s?: string[]): string[] {
    if (s !== undefined) {
        clearSelection();
        s.forEach(a => select(getByAddress(a)));
    }
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
        z.components.push((v as Component).spec());
    })
    return z;
}