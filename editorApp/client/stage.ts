import Konva from 'konva';
import { Contact, Breadboard } from './breadboard';

let _stage: Konva.Stage|null = null;
let breadboards: Breadboard[] = [];

export function stage(s?: Konva.Stage): Konva.Stage|null {
    if (s !== undefined) _stage = s;
    return _stage;
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

export function addBreadboard(b: Breadboard) {
    breadboards.push(b);
}

export function distance(c: [number, number, number, number]): number {
    const dx = c[0] - c[2];
    const dy = c[1] - c[3];
    return Math.sqrt(dx * dx + dy * dy);
}

export function closesetContact(xy: [number, number]): Contact|null {
    let z: Contact|null = null;
    let dz = 0;
    for (const b of breadboards) {
        for (const c of b.contacts) {
            const d = distance([c!.x(), c!.y(), xy[0], xy[1]]);
            if (z == null || d < dz) {
                z = c;
                dz = d;
            }
        }
    }
    return z;
}