import { IntegratedCircuitSchematic } from "../components/IC_schematic";
import { Action, actionDeserializers } from "../action";
import { KonvaEventObject } from "konva/types/Node";
import { Point, getPhysicalCursorPosition, actionLayer, pointSub, alignPoint, gridAlignment, point, defaultLayer } from "../stage";
import { getTypedByAddress } from "../address";
import assertExists from "ts-assert-exists";
import { deserializeComponent, Component } from "../components/component";

const marker = 'MoveIcSchematicAction';

actionDeserializers.push(function (data: any): Action | null {
  if (data['typeMarker'] !== marker) return null;
  const s: MoveIcSchematicActionSpec = data;
  let z = new MoveIcSchematicAction(assertExists(getTypedByAddress(IntegratedCircuitSchematic, s.ic_address)), s.from);
  z.to = s.to;
  return z;
});


interface MoveIcSchematicActionSpec {
  typeMarker: 'MoveIcSchematicAction';
  from: Point;
  to: Point;
  ic_address: string;
}

export class MoveIcSchematicAction implements Action {
    from: Point;
    to: Point;
    originalPosition: Point;
    ic: IntegratedCircuitSchematic;
    actionIc: Component;
    constructor(s: IntegratedCircuitSchematic, from?: Point) {
        console.log('move ic', s);
        if (from == undefined) from = getPhysicalCursorPosition();
        this.from = from;
        this.to = from;
        this.ic = s;
        this.originalPosition = this.ic.xy();
        this.actionIc = assertExists(deserializeComponent(s.spec()));
        this.actionIc.mainColor('blue');
        this.ic.hide();
        this.actionIc.show(actionLayer());
    }
    apply(): void {
        const d = pointSub(this.to, this.from);
        this.ic.xy(alignPoint(point(this.originalPosition.x + d.x,
            this.originalPosition.y + d.y), gridAlignment())); // TODO: point sum.
        this.ic.updateLayout();
        this.ic.show(defaultLayer());
        this.actionIc.hide();
    }
    undo(): void {
        this.ic.xy(this.originalPosition);
        this.ic.updateLayout();
    }
    mousemove(event: KonvaEventObject<MouseEvent>): boolean {
        this.to = getPhysicalCursorPosition();
        const d = pointSub(this.to, this.from); // TODO: make it easier to access point operations.
        let xy = point(this.originalPosition.x, this.originalPosition.y);
        xy.x += d.x;
        xy.y += d.y;
        xy = alignPoint(xy, gridAlignment());
        this.actionIc.xy(xy);
        this.actionIc.updateLayout();
        return false;
    }
    mousedown(event: KonvaEventObject<MouseEvent>): boolean {
return false;
    }
    mouseup(event: KonvaEventObject<MouseEvent>): boolean {
        this.to = getPhysicalCursorPosition();
        return true;
    }
    cancel(): void {
        this.ic.show(defaultLayer());
        this.actionIc.hide();
    }
    serialize() {
        return {

        } as MoveIcSchematicActionSpec;
    }
}