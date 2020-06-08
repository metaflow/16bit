import Konva from 'konva';
import { Wire } from './wire';
import { Action, appActions } from './action';
import {MoveWireEndAction} from './move_wire_end_action';
import {stage} from './stage';

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