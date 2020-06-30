import { Action, actionDeserializers } from '../action';
import Konva from 'konva';
import { getPhysicalCursorPosition } from '../stage';
import { Wire, WirePoint, WireSpec, WirePointSpec } from '../components/wire';
import { getByAddress, getTypedByAddress } from '../address';
import assertExists from 'ts-assert-exists';


actionDeserializers.push(function (data: any): Action | null {
  if (data['typeMarker'] !== 'MoveWirePointAction') return null;
  const s: spec = data['spec'];
  let z = new MoveWirePointAction(s.points.map(a => getByAddress(a)), s.from);
  z.to = s.to;
  return z;
});


interface spec {
  points: string[];
  from: [number, number];
  to: [number, number];
  states: WireState[];
}

interface WireState {
  address: string;
  originalSpec: WireSpec;
  affectedPointsIds: string[];
};

function moveSingleWire(x: number, y : number, s: WireState): WireSpec {
return s.originalSpec;
}

export class MoveWirePointAction implements Action {
  actionType = "MoveWirePointAction";
  states: WireState[] = [];
  affectedPointsAddresses: string[];
  from: [number, number];
  to: [number, number];
  constructor(points: WirePoint[], origin?: [number, number]) {
    this.affectedPointsAddresses = points.map(p => p.address());
    const uniqAdresses = Array.from(new Set<string>(points.map(p => p.parent()?.address()!)));
    for (const a of uniqAdresses) {
      const w = getByAddress(a) as Wire;
      const s: WireState = {
        address: w.address(),
        originalSpec: w.spec(),
        affectedPointsIds: [],
      };
      for (const p of points) {
        if (p.parent() == w) {
          s.affectedPointsIds.push(p.id());
        }
      }
      this.states.push(s);
    }
    console.log('wire move states', this.states);
    if (origin === undefined) origin = getPhysicalCursorPosition();
    this.from = origin;
    this.to = origin;
  }
  serialize(): any {
    const z: spec = {
      points: this.affectedPointsAddresses,
      from: this.from,
      to: this.to,
      states: this.states,
    };
    return {
      'typeMarker': 'MoveWirePointAction',
      'spec': z,
    }
  }
  apply(): void {
    const dx = this.to[0] - this.from[0];
    const dy = this.to[1] - this.from[1];
    for (const w of this.states) {
      (getByAddress(w.address) as Wire).spec(moveSingleWire(dx, dy, w));
    }
  }
  undo(): void {
    for (const w of this.states) {
      (getByAddress(w.address) as Wire).spec(w.originalSpec);
    }
  }
  mousemove(event: Konva.KonvaEventObject<MouseEvent>): boolean {
    this.to = getPhysicalCursorPosition();
// TODO: update aux wires
    // for (const w of this.wires) {
      // (getByAddress(w) as Wire).updateLayout();
    // }
    return false;
  }
  mousedown(event: Konva.KonvaEventObject<MouseEvent>): boolean {
    return false;
  }
  mouseup(event: Konva.KonvaEventObject<MouseEvent>): boolean {
    this.to = getPhysicalCursorPosition();
    return true;
  }
  cancel(): void {
    this.undo();
  }
}