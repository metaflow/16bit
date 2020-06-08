import Konva from 'konva';
import { Wire, ContactWire } from './wire';
import { Action, appActions } from './action';
import {MoveWireEndAction} from './move_wire_end_action';
import {stage, toPhysical, closesetContact, toScreen} from './stage';
import { Contact } from './breadboard';

export class AddWireAction implements Action {
    wire: Wire | null;
    layer: Konva.Layer;
    apply() {
        if (this.wire == null) return;
        this.wire.add(this.layer);
        this.setupEvents(); // TODO: move to wire
    }

    undo() {
        console.log('undo add wire');
        if (this.wire == null) return;
        this.wire.remove(this.layer);
    }

    setupEvents() {
        let wire = this.wire;
        if (wire == null) return;
        for (let i = 0; i < 2; i++) {
            let t = wire.ends[i];
            t.on('mousedown', function (e) {
                console.log('mousedown in circle');
                e.cancelBubble = true;
                if (appActions.onMouseDown(e)) return;
                console.log('moving end');                
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
            console.log('add first wire point');
            this.wire = new Wire(x, y, x, y);
            this.wire.add(this.layer);
            return false;
        }
        console.log('add second wire point');
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
}

export class AddContactWireAction implements Action {
    wire: ContactWire | null = null;
    layer: Konva.Layer;
    line: Konva.Line;
    c1: Contact;

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

    apply() {
        if (this.wire == null) return;
        this.wire.add(this.layer);
    }

    undo() {
        console.log('undo add contacts wire');
        if (this.wire == null) return;
        this.wire.remove(this.layer);
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

    mousedown(event:  Konva.KonvaEventObject<MouseEvent>): boolean {
        const pos = stage()?.getPointerPosition();
        if (pos == null) return false;
        let c2 = closesetContact(toPhysical(pos.x, pos.y));
        if (c2 == null) return false;
        this.wire = new ContactWire(this.c1, c2);
        this.wire.add(this.layer);
        this.line.remove();
        return true;
    }

    cancel(): void {
        if (this.wire == null) return;
        this.wire.remove(this.layer);
    }
}