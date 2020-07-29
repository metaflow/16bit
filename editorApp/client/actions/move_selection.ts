import { IntegratedCircuitSchematic } from "../components/IC_schematic";
import { Action, actionDeserializers } from "../action";
import { KonvaEventObject } from "konva/types/Node";
import { actionLayer, defaultLayer, PhysicalPoint, PlainPoint } from "../stage";
import { getTypedByAddress, all } from "../address";
import assertExists from "ts-assert-exists";
import { deserializeComponent, Component } from "../components/component";
import { WirePoint } from "../components/wire";
import { selectionByType, selection } from "../components/selectable_component";
import { Contact } from "../components/contact";

const marker = 'MoveSelectionAction';

actionDeserializers.push(function (data: any): Action | null {
  if (data['typeMarker'] !== marker) return null;
  const s: MoveSelectionActionSpec = data;
  let z = new MoveSelectionAction(new PhysicalPoint(s.from));
  z.to = new  PhysicalPoint(s.to);
  return z;
});

interface MoveSelectionActionSpec {
  typeMarker: 'MoveSelectionAction';
  from: PlainPoint;
  to: PlainPoint;
}

export class MoveSelectionAction implements Action {
    from: PhysicalPoint;
    to: PhysicalPoint;
    constructor(from?: PhysicalPoint) {
        console.log('move selection', selection());
        if (from == undefined) from = PhysicalPoint.cursor();
        this.from = from;
        this.to = from;
        const points = selectionByType(WirePoint);
        console.log('points', points);
        const ics = selectionByType(IntegratedCircuitSchematic);
        console.log('schematics', ics);
        const cc = ics.flatMap((c: Component) => c.descendants(Contact));
        console.log('contacts', cc);
        const attached = all(WirePoint).filter((p: WirePoint) => {
            return cc.some((c: Contact) => {
                return c.absolutePosition().distance(p.absolutePosition()) < 0.1; // TODO: constant or function call;
            });
        });
        points.push(...(attached.filter((p: WirePoint) => points.indexOf(p) == -1)));
        console.log('all points', points);

    }
    apply(): void {
        const d = this.to.clone().sub(this.from);
    }
    undo(): void {
    }
    mousemove(event: KonvaEventObject<MouseEvent>): boolean {
        this.to = PhysicalPoint.cursor();
        const d = this.to.clone().sub(this.from);
        return false;
    }
    mousedown(event: KonvaEventObject<MouseEvent>): boolean {
        return false;
    }
    mouseup(event: KonvaEventObject<MouseEvent>): boolean {
        this.to = PhysicalPoint.cursor();
        return true;
    }
    cancel(): void {
    }
    serialize() {
        const z: MoveSelectionActionSpec = {
            typeMarker: marker,
            from: this.from.plain(),
            to: this.to.plain(),
        };        
        return z;
    }
}