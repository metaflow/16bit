import Konva from 'konva';
import { Wire, ContactWire } from './wire';
import { Action, appActions } from './action';
import {MoveWireEndAction} from './move_wire_end_action';
import {stage, toPhysical, closesetContact, toScreen} from './stage';
import { Contact } from './breadboard';
import { address, getByAddress } from './address';

export class AddWireAction implements Action {
    actionType = "AddWireAction";
    wire: Wire | null;
    layer: Konva.Layer;
    apply() {
        if (this.wire == null) return;
        this.wire.add(this.layer);
        this.setupEvents(); // TODO: move to wire
    }

    undo() {        
        if (this.wire == null) return;
        this.wire.remove(this.layer);
    }

    setupEvents() {
        let wire = this.wire;
        if (wire == null) return;
        for (let i = 0; i < 2; i++) {
            let t = wire.ends[i];
            t.on('mousedown', function (e) {
                e.cancelBubble = true;
                if (appActions.onMouseDown(e)) return;
                appActions.current(new MoveWireEndAction(wire!, i));
            });
        }
    }

    mousemove(event:  Konva.KonvaEventObject<MouseEvent>): boolean {
        if (this.wire == null) {
            return false;
        }
        const pos = stage()?.getPointerPosition();
        if (pos == null) return false;
        const [x, y] = [pos.x, pos.y];
        this.wire?.end(1, x, y);
        return false;
    }

    mousedown(event:  Konva.KonvaEventObject<MouseEvent>): boolean {
        const pos = stage()?.getPointerPosition();
        if (pos == null) return false;
        const [x, y] = [pos.x, pos.y];
        if (this.wire == null) {
            this.wire = new Wire(x, y, x, y);
            this.wire.add(this.layer);
            return false;
        }
        this.wire.end(1, x, y);
        this.setupEvents();
        return true;
    }

    cancel(): void {
        if (this.wire == null) return;
        this.wire.remove(this.layer);
    }

    constructor(layer: Konva.Layer) {
        this.layer = layer;
        this.wire = null;
    }
    serialize(): string {
        throw new Error("Method not implemented.");
    }
    deserialize(data: string): void {
        throw new Error("Method not implemented.");
    }
}

export class AddContactWireAction implements Action {
    actionType = "AddContactWireAction";
    wire: ContactWire | null = null;
    layer: Konva.Layer;
    line: Konva.Line;
    c1: Contact;
    c2: Contact|null = null;

    constructor(layer: Konva.Layer, contact: Contact) {
        this.layer = layer;
        this.c1 = contact;
        const xy = toScreen(contact.x(), contact.y());
        this.line = new Konva.Line({
            points: [xy[0], xy[1], xy[0], xy[1]],
            stroke: 'red',
            strokeWidth: 3,
            lineCap: 'round',
            lineJoin: 'round',
        });
        this.layer.add(this.line);
    }
    serialize(): string {
        return JSON.stringify({
            'contact_1': address(this.c1),
            'contact_2': address(this.c2),
        })
    }
    deserialize(data: string): void {        
    }
    static applySerialised(layer: Konva.Layer, data: string): AddContactWireAction|null {
        const d = JSON.parse(data);
        let c1 = getByAddress(d['contact_1']); 
        if (c1 == null) return null;        
        if (!(c1 instanceof Contact)) throw new Error(`${d['contact_1']} is not a contact`);
        let c2 = getByAddress(d['contact_2']); 
        if (c2 == null) return null;
        if (!(c2 instanceof Contact)) throw new Error(`${d['contact_1']} is not a contact`);
        const z = new AddContactWireAction(layer, c1);
        z.complete(c2);
        return z;
    }

    apply() {
        if (this.wire == null) return;
        this.wire.add(this.layer);
    }

    undo() {
        if (this.wire == null) return;
        this.wire.remove();
    }

    mousemove(event:  Konva.KonvaEventObject<MouseEvent>): boolean {
        const pos = stage()?.getPointerPosition();
        if (pos == null) return false;
        const ph = toPhysical(pos.x, pos.y);
        let c2 = closesetContact(ph);
        if (c2 == null) return false;
        const xy = toScreen(c2.x(), c2.y());
        const pp = this.line.points();
        pp[2] = xy[0];
        pp[3] = xy[1];
        this.line.points(pp);
        return false;
    }

    private complete(c2: Contact) {
        this.c2 = c2;
        this.wire = new ContactWire(this.c1, c2);
        this.wire.add(this.layer);
        this.line.remove();        
    }

    mousedown(event:  Konva.KonvaEventObject<MouseEvent>): boolean {
        const pos = stage()?.getPointerPosition();
        if (pos == null) return false;
        let c2 = closesetContact(toPhysical(pos.x, pos.y));
        if (c2 == null) return false;
        this.complete(c2);
        return true;
    }

    cancel(): void {
        if (this.wire == null) return;
        this.wire.remove();
    }
}