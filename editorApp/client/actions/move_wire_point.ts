import { Action, actionDeserializers } from '../action';
import Konva from 'konva';
import { getPhysicalCursorPosition, actionLayer, defaultLayer, selectionAddresses } from '../stage';
import { Wire, WirePoint, WireSpec, WirePointSpec, removeRedundantPoints, addHelperPoints } from '../components/wire';
import { getByAddress, getTypedByAddress, newAddress } from '../address';
import assertExists from 'ts-assert-exists';


actionDeserializers.push(function (data: any): Action | null {
  if (data['typeMarker'] !== 'MoveWirePointAction') return null;
  const s: spec = data['spec'];
  let z = new MoveWirePointAction(s.points.map(a => getByAddress(a)), s.from);
  z.selection = s.selection;
  z.to = s.to;
  return z;
});


interface spec {
  points: string[];
  from: [number, number];
  to: [number, number];
  states: SingleWireMove[];
  selection: string[];
}

interface SingleWireMove {
  address: string;
  originalSpec: WireSpec;
  affectedPointsIds: string[];  // TODO: or set?
  auxWire?: Wire;
};

function moveSingleWire(dx: number, dy: number, s: SingleWireMove): WireSpec {
  const w = assertExists(s.auxWire);
  const z: WireSpec = {
    id: "",
    points: [],
    orthogonal: s.originalSpec.orthogonal,
  };
  w.points.forEach(p => p.remove());
  const affected: boolean[] = [];
  const nextVertical: boolean[] = [];
  const nextHorizontal: boolean[] = [];
  for (const p of s.originalSpec.points) {
    const a = s.affectedPointsIds.indexOf(assertExists(p.id)) != -1;
    if (p.helper && !a) continue;
    affected.push(a);
    z.points.push({
      helper: p.helper,
      x: p.x,
      y: p.y,
      id: p.id,
    });
  }
  for (let i = 0; i < z.points.length; i++) {
    if (i + 1 < z.points.length) {
      nextVertical.push(z.points[i].x == z.points[i + 1].x);
      nextHorizontal.push(z.points[i].y == z.points[i + 1].y);
    }
    if (affected[i]) {
      z.points[i].x += dx;
      z.points[i].y += dy;
    }
  }
  if (z.orthogonal) {
    for (let i = 0; i < z.points.length; i++) {
      const p = z.points[i];
      if (!affected[i] || p.helper) continue;
      if (i > 0 && !affected[i - 1]) {
        if (nextVertical[i - 1]) {
          z.points[i - 1].x = p.x;
        }
        if (nextHorizontal[i - 1]) {
          z.points[i - 1].y = p.y;
        }
      }
      if (i + 1 < z.points.length) {
        if (nextVertical[i]) {
          z.points[i + 1].x = p.x;
        } 
        if (nextHorizontal[i]) {
          z.points[i + 1].y = p.y;
        }
      }
    }
  }
  for (const p of z.points) {
    p.helper = false;
  }
  removeRedundantPoints(z);
  addHelperPoints(z);
  return z;
}

export class MoveWirePointAction implements Action {
  actionType = "MoveWirePointAction";
  states: SingleWireMove[] = [];
  affectedPointsAddresses: string[];
  from: [number, number];
  to: [number, number];
  selection: string[];
  constructor(points: WirePoint[], origin?: [number, number]) {
    this.selection = selectionAddresses();
    this.affectedPointsAddresses = points.map(p => p.address());
    const uniqAdresses = Array.from(new Set<string>(points.map(p => p.parent()?.address()!)));
    for (const a of uniqAdresses) {
      const w = getByAddress(a) as Wire;
      const s: SingleWireMove = {
        address: w.address(),
        originalSpec: w.spec(),
        affectedPointsIds: [],
        auxWire: new Wire(""),  // TODO: make id optional if object is not going to be materialized and maybe make id parameter of "materialize".
      };
      for (const p of points) {
        if (p.parent() == w) {
          s.affectedPointsIds.push(p.id());
        }
      }
      this.states.push(s);
      s.auxWire?.spec(w.spec());
      w.hide();
      s.auxWire?.show(actionLayer());
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
      selection: this.selection,
    };
    return {
      'typeMarker': 'MoveWirePointAction',
      'spec': z,
    }
  }
  apply(): void {
    const dx = this.to[0] - this.from[0];  // TODO: make vector2d
    const dy = this.to[1] - this.from[1];
    for (const s of this.states) {
      const w = getByAddress(s.address) as Wire;
      let x = moveSingleWire(dx, dy, s);
      w.spec(x);
      w.show(defaultLayer());
      s.auxWire?.hide();
    }
  }
  undo(): void {
    for (const w of this.states) {
      (getByAddress(w.address) as Wire).spec(w.originalSpec);
    }
    selectionAddresses(this.selection);
  }
  mousemove(event: Konva.KonvaEventObject<MouseEvent>): boolean {
    this.to = getPhysicalCursorPosition();
    const dx = this.to[0] - this.from[0];  // TODO: make vector2d
    const dy = this.to[1] - this.from[1];
    for (const s of this.states) {
      const sp = moveSingleWire(dx, dy, s);
      console.log('aux spec', sp);
      s.auxWire?.spec(sp);
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