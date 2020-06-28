import { Action, actionDeserializers } from '../action';
import Konva from 'konva';
import { getPhysicalCursorPosition } from '../stage';
import { ContactWire, WirePoint, WireSpec, WirePointSpec } from '../components/wire';
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
  wires: string[];
  oldWireStates: Map<string, WireSpec>;
}

export class MoveWirePointAction implements Action {
  actionType = "MoveWirePointAction";
  oldWireStates = new Map<string, WireSpec>();
  newWireStates = new Map<string, WireSpec>();
  original: WirePointSpec[] = [];
  wires: string[];
  from: [number, number];
  to: [number, number];
  constructor(points: WirePoint[], origin?: [number, number]) {
    this.original = points.map(p => p.spec());
    this.wires = Array.from(new Set<string>(points.map(p => p.parent()?.address()!)))
    for (const w of this.wires) {
      this.oldWireStates.set(w, (getByAddress(w) as ContactWire).spec());
    }
    if (origin === undefined) origin = getPhysicalCursorPosition();
    this.from = origin;
    this.to = origin;
    // this.points = points;
  }
  serialize(): any {
    const z: spec = {
      points: this.original.map(p => p.address || ''),
      from: this.from,
      to: this.to,
      wires: this.wires,
      oldWireStates: this.oldWireStates,
    };
    return {
      'typeMarker': 'MoveWirePointAction',
      'spec': z,
    }
  }
  updatePositions() {
    const dx = this.to[0] - this.from[0];
    const dy = this.to[1] - this.from[1];
    for (const s of this.original) {
      let p = assertExists(getTypedByAddress(WirePoint, s.address));
      p.x(s.x + dx);
      p.y(s.y + dy);
    }
  }
  apply(): void {
    this.updatePositions();
    for (const s of this.original) {
      let p = assertExists(getTypedByAddress(WirePoint, s.address));
      p._helper = false;
    }
    for (const w of this.wires) {
      (getByAddress(w) as ContactWire).updateLayout();
    }
    for (const w of this.wires) {
      this.newWireStates.set(w, (getByAddress(w) as ContactWire).spec());
    }
  }
  undo(): void {
    this.oldWireStates.forEach((v, k) => {
      let w = (getByAddress(k) as ContactWire);
      w.spec(v);
    });
  }
  mousemove(event: Konva.KonvaEventObject<MouseEvent>): boolean {
    this.to = getPhysicalCursorPosition();
    this.updatePositions();
    for (const w of this.wires) {
      (getByAddress(w) as ContactWire).updateLayout();
    }
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