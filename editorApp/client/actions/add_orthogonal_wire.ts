import Konva from 'konva';
import { Wire, WirePoint, removeRedundantPoints, addHelperPoints } from '../components/wire';
import { Action, actionDeserializers } from '../action';
import { closesetContact, toScreen, actionLayer, defaultLayer, getPhysicalCursorPosition, pointAsNumber, gridAlignment } from '../stage';
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
        const s = w.spec();
        s.points = this.points.map(p => ({
            helper: false,
            x: p.x,
            y: p.y,
        }));
        removeRedundantPoints(s);
        addHelperPoints(s);
        this.wire.spec(s);
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
        for (const xy of this.points) {
            pp.push(...pointAsNumber(toScreen(xy)));
        }
        const xy = this.orthogonalCursor();
        pp.push(...pointAsNumber(toScreen(xy)));
        this.line.points(pp);
        return false;
    }

    orthogonalCursor() {
        const xy = getPhysicalCursorPosition(gridAlignment());
        if (this.points.length == 0) return xy;
        const last = this.points[this.points.length - 1];
        const dx = Math.abs(xy.x - last.x);
        const dy = Math.abs(xy.y - last.y);
        if (dx < dy) {
            xy.x = last.x;
        } else {
            xy.y = last.y;
        }
        return xy;
    }

    mousedown(event: Konva.KonvaEventObject<MouseEvent>): boolean {
        if (event.evt.button != 0) return true;
        const xy = this.orthogonalCursor();
        console.log(event);
        this.points.push(xy);
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