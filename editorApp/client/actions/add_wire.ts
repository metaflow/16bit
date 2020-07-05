import Konva from 'konva';
import { Wire, removeRedundantPoints, addHelperPoints } from '../components/wire';
import { Action, actionDeserializers } from '../action';
import { toScreen, actionLayer, defaultLayer, getPhysicalCursorPosition, pointAsNumber, gridAlignment, alignPoint, scale, point, Point } from '../stage';
import { newAddress } from '../address';

const marker = 'AddWireAction';

interface AddWireActionSpec {
    typeMarker: typeof marker;
    points: Point[];
};

export class AddWireAction implements Action {
    wire: Wire | null = null;
    line: Konva.Line;
    startMarker: Konva.Circle;
    endMarker: Konva.Circle;
    points: Point[] = [];

    constructor(spec?: AddWireActionSpec) {
        this.line = new Konva.Line({
            points: [],
            stroke: 'red',
            strokeWidth: 3,
            lineCap: 'round',
            lineJoin: 'round',
        });
        this.startMarker = new Konva.Circle({
            radius: scale(),
            fill: 'red',
        });
        this.endMarker = new Konva.Circle({
            radius: scale(),
            fill: 'red',
        })
        if (spec != null) {
            this.points = spec.points;
            if (spec.points.length > 0) {
                this.startMarker.position(toScreen(spec.points[0]));
                this.endMarker.position(toScreen(spec.points[spec.points.length - 1]));
            }
            this.updateLayout();
        }
        actionLayer()?.add(this.line);
        actionLayer()?.add(this.startMarker);
        actionLayer()?.add(this.endMarker);
    }
    mouseup(event: Konva.KonvaEventObject<MouseEvent>): boolean {
        return false;
    }
    apply() {
        let s = removeRedundantPoints(this.points.map(p => ({
            helper: false,
            super: { xy: p },
        })));
        s = addHelperPoints(s);
        this.wire = new Wire({
            super: { id: newAddress(), xy: point(0, 0) },
            points: s,
        });
        this.wire.updateLayout();
        this.wire.materialized(true);
        this.wire.show(defaultLayer());
        this.removeHelpers();        
    }
    removeHelpers() {
        this.line.remove();
        this.startMarker.remove();
        this.endMarker.remove();
    }
    undo() {
        if (this.wire == null) return;
        this.wire.materialized(false);
        this.wire.hide();
    }

    mousemove(event: Konva.KonvaEventObject<MouseEvent>): boolean {
        this.endMarker.position(toScreen(this.orthogonalCursor()));
        if (this.points.length == 0) {
            this.startMarker.position(toScreen(this.orthogonalCursor()));
            return false;
        }
        this.updateLayout();
        return false;
    }
    updateLayout() {
        const pp: number[] = [];
        for (const xy of this.points) {
            pp.push(...pointAsNumber(toScreen(xy)));
        }
        const xy = this.orthogonalCursor();
        pp.push(...pointAsNumber(toScreen(xy)));
        this.line.points(pp);
    }
    orthogonalCursor() {
        const xy = alignPoint(getPhysicalCursorPosition(), gridAlignment());
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
        this.removeHelpers();
    }
    serialize(): AddWireActionSpec {
        return {
            typeMarker: marker,
            points: this.points,
        };
    }
}

actionDeserializers.push(function (data: any): Action | null {
    if (data['typeMarker'] != marker) return null;
    return new AddWireAction(data);
});