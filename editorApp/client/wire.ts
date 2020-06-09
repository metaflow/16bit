import Konva from 'konva';
import { Contact } from './breadboard';
import { magnification, toScreen } from './stage';
import { Addressable, address, newAddress } from './address';
import { Selectable } from './select_action';

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

export class WireEnd implements Addressable, Selectable {
    _id = "";
    wire: ContactWire;
    contact: Contact;
    selectionRect: Konva.Rect;
    _selected: boolean = false;
    constructor(wire: ContactWire, c: Contact) {
        this.wire = wire;
        this.contact = c;
        this.selectionRect = new Konva.Rect({
            dash: [1, 1],
            stroke: 'black',
            name: 'selectable',
        });
        this.update();
    }
    selectableInterface: true = true;
    id(newID?: string): string {
        if (newID !== undefined) {
            this._id = newID;
            this.update();
        }
        return this._id;
    }
    addressParent(): Addressable | null {
        return this.wire;
    }
    addressChild(id: string): Addressable | null | undefined {
        return null;
    }
    update() {
        const w = 3;
        let xy = toScreen(this.contact.x()-w/2, this.contact.y()-w/2);
        this.selectionRect.x(xy[0]);
        this.selectionRect.y(xy[1]);
        this.selectionRect.width(w * magnification());
        this.selectionRect.height(w * magnification());
        this.selectionRect.attrs['address'] = address(this);
        this.selectionRect.stroke(this.selected() ? 'red' : 'black');
    }
    add(layer: Konva.Layer) {
        layer.add(this.selectionRect);
    }
    remove() {
        this.selectionRect.remove();
    }
    selected(v?: boolean): boolean {
        if (v !== undefined) {
            this._selected = true;
            this.update();
        }
        return this._selected;
    }
}

export class ContactWire implements Addressable {
    line: Konva.Line;
    ends: WireEnd[] = [];
    _id = "";
    constructor(c1: Contact, c2: Contact) {
        this.ends.push(new WireEnd(this, c1));
        this.ends[0].id("0");
        this.ends.push(new WireEnd(this, c2));        
        this.ends[1].id("1");
        this.line = new Konva.Line({
            points: [],
            stroke: 'blue',
            strokeWidth: 1,
            lineCap: 'round',
            lineJoin: 'round',
        });
        this.update();
    }
    id(newID?: string): string {
        if (newID !== undefined) {
            this._id = newID;
            this.update();
        }
        return this._id;
    }
    addressParent(): Addressable | null {
        return null;
    }
    addressChild(id: string): Addressable | null | undefined {
        let x = parseInt(id);
        if (x < 0 || x > 1) return null;
        return this.end(x);
    }

    add(layer: Konva.Layer) {
        layer.add(this.line);
        for (const s of this.ends) s.add(layer);
    }

    remove() {
        this.line.remove();
        for (const s of this.ends) s.remove();
    }

    update() {
        const [x0, y0] = toScreen(this.ends[0].contact.x(), this.ends[0].contact.y());
        const [x1, y1] = toScreen(this.ends[1].contact.x(), this.ends[1].contact.y());
        this.line.points([x0, y0, x1, y1]);
        this.line.strokeWidth(1 * magnification());
        this.ends[0].update();
        this.ends[1].update();
    }

    end(i: number, c?: Contact): WireEnd {
        if (c !== undefined) {
            this.ends[i].contact = c; // TODO: setter
            this.update();
        }
        return this.ends[i];
    }
}