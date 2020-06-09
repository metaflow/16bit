import Konva from 'konva';
import { Contact } from './breadboard';
import { magnification, toScreen } from './stage';

export class Wire {
    ends: Konva.Circle[];
    line: Konva.Line;

    constructor(x1: number, y1: number, x2: number, y2: number) {
        this.ends = [];
        this.ends.push(new Konva.Circle({
            x: x1,
            y: y1,
            radius: 4,
            fill: 'green'
        }));
        this.ends.push(new Konva.Circle({
            x: x2,
            y: y2,
            radius: 4,
            fill: 'red'
        }));
        this.line = new Konva.Line({
            points: [x1, y1, x2, y2],
            stroke: 'red',
            strokeWidth: 3,
            lineCap: 'round',
            lineJoin: 'round',
        });
    }

    add(layer: Konva.Layer) {
        layer.add(this.line);
        for (const c of this.ends) layer.add(c);
    }

    remove(layer: Konva.Layer) {
        this.line.remove();
        for (const c of this.ends) c.remove();
    }

    end(i: number, x?: number, y?: number): [number, number] {
        if (x == null) {
            x = this.ends[i].x();
        }
        if (y == null) {
            y = this.ends[i].y();
        }
        this.ends[i].x(x);
        this.ends[i].y(y);
        const pp = this.line.points();
        pp[i * 2] = x;
        pp[i * 2 + 1] = y;
        this.line.points(pp);
        return [x, y];
    }
}

export class ContactWire {
    line: Konva.Line;
    selections: Konva.Rect[] = [];
    contacts: Contact[] = [];

    constructor(c1: Contact, c2: Contact) {
        this.contacts.push(c1);
        this.contacts.push(c2);
        this.line = new Konva.Line({
            points: [],
            stroke: 'blue',
            strokeWidth: 1,
            lineCap: 'round',
            lineJoin: 'round',
        });
        for (let i = 0; i < 2; i++) {
            this.selections.push(new Konva.Rect({
                dash: [1, 1],
                stroke: 'black',
            }));
        }
        this.update();
    }

    add(layer: Konva.Layer) {
        layer.add(this.line);
        for (const s of this.selections) layer.add(s);
    }

    remove() {
        this.line.remove();
        for (const s of this.selections) s.remove();
    }

    update() {
        this.line.points([
            this.contacts[0].x() * magnification(),
            this.contacts[0].y() * magnification(),
            this.contacts[1].x() * magnification(),
            this.contacts[1].y() * magnification()]);
        this.line.strokeWidth(1 * magnification());
        for (let i = 0; i < 2; i++) {
            const w = 3;
            let xy = toScreen(this.contacts[i].x()-w/2, this.contacts[i].y()-w/2);
            this.selections[i].x(xy[0]);
            this.selections[i].y(xy[1]);
            this.selections[i].width(w * magnification());
            this.selections[i].height(w * magnification());
        }
    }

    end(i: number, c?: Contact): Contact {
        if (c !== undefined) {
            this.contacts[i] = c;
            this.update();
        }
        return this.contacts[i];
    }
}