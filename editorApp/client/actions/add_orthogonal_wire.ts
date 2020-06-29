import Konva from 'konva';
import { Wire, WirePoint } from '../components/wire';
import { Action, actionDeserializers } from '../action';
import { closesetContact, toScreen, actionLayer, defaultLayer, getPhysicalCursorPosition } from '../stage';
import { Contact } from '../components/contact';
import { getByAddress, removeAddressRoot, newAddress } from '../address';

export class AddOrthogonalWireAction implements Action {
    actionType = "AddOrthogonalWireAction";
    wire: Wire | null = null;
    line: Konva.Line;
    points: Konva.Vector2d[] = [];

    constructor() {
        this.line = new Konva.Line({
            points: [],
            stroke: 'red',
            strokeWidth: 3,
            lineCap: 'round',
            lineJoin: 'round',
        });
        actionLayer()?.add(this.line);
    }
    mouseup(event: Konva.KonvaEventObject<MouseEvent>): boolean {
        return false;
    }
    apply() {
        const a = newAddress();
        this.wire = new Wire(a);
        const w = this.wire;
        w.orthogonal(true);
        this.points.forEach(p => {
            w.points.push(w.addChild(new WirePoint(
                {
                    id: newAddress(w),
                    helper: false,
                    x: p.x,
                    y: p.y,
                })));
        });
        this.wire.updateLayout();
        this.wire.materialized(true);
        this.wire.show(defaultLayer());
        this.line.remove();
    }

    undo() {
        if (this.wire == null) return;
        this.wire.materialized(false);
        this.wire.hide();
    }

    mousemove(event: Konva.KonvaEventObject<MouseEvent>): boolean {
        if (this.points.length == 0) return false;
        const pp: number[] = [];
        for (const x of this.points) {
            pp.push(...toScreen(x.x, x.y));
        }
        const xy = this.orthogonalCursor();
        pp.push(...toScreen(xy[0], xy[1]));
        this.line.points(pp);
        return false;
    }

    orthogonalCursor() {
        const xy = getPhysicalCursorPosition(); // TODO: return vector2d
        if (this.points.length == 0) return xy;
        const last = this.points[this.points.length - 1];
        const dx = Math.abs(xy[0] - last.x);
        const dy = Math.abs(xy[1] - last.y);
        if (dx < dy) {
            xy[0] = last.x;
        } else {
            xy[1] = last.y;
        }
        return xy;
    }

    mousedown(event: Konva.KonvaEventObject<MouseEvent>): boolean {
        if (event.evt.button != 0) return true;
        const xy = this.orthogonalCursor();
        console.log(event);
        this.points.push({ x: xy[0], y: xy[1] });
        return false;
    }

    cancel(): void {
    }
    serialize(): any {
        return {
            'typeMarker': this.actionType,
            'spec': {
                'points': this.points,
            }
        }
    }
}

actionDeserializers.push(function (data: any): Action | null {
    if (data['typeMarker'] != 'AddOrthogonalWireAction') return null;
    const spec = data['spec'];
    const z = new AddOrthogonalWireAction();
    z.points = spec.points;
    return z;
});