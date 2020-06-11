import Konva from 'konva';
import { Breadboard } from './components/breadboard';
import { Contact } from './components/contact';
import { address } from './address';

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

export function getCursorPosition() {
    let pos = stage()?.getPointerPosition();
    if (pos == null) throw new Error('Cannot get pointer position');
    return pos;
}

export function magnification(): number { // TODO: use toScreen()
    return 4;
}

export function toScreen(x: number, y: number): [number, number] {
    return [x * magnification(), y * magnification()]
}

export function toPhysical(x: number, y: number): [number, number] {
    return [x / magnification(), y / magnification()];
}

const contacts = new Map<string, Contact>();
export function addContact(c: Contact) {
    contacts.set(address(c), c);
}

// TODO: remove contact.

export function distance(c: [number, number, number, number]): number {
    const dx = c[0] - c[2];
    const dy = c[1] - c[3];
    return Math.sqrt(dx * dx + dy * dy);
}

export function closesetContact(xy: [number, number]): Contact | null {
    let z: Contact | null = null;
    let dz = 0;
    contacts.forEach(c => {
        const d = distance([c!.x(), c!.y(), xy[0], xy[1]]);
        if (z == null || d < dz) {
            z = c;
            dz = d;
        }
    });
    return z;
}