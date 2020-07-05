import { Action, actionDeserializers } from '../action';
import Konva from 'konva';
import { getPhysicalCursorPosition, actionLayer, defaultLayer, selectionAddresses, Point, pointSub, alignPoint, gridAlignment, point } from '../stage';
import { Wire, WirePoint, WireSpec, WirePointSpec, removeRedundantPoints, addHelperPoints } from '../components/wire';
import { getByAddress, getTypedByAddress, newAddress, copy } from '../address';
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
  from: Point;
  to: Point;
  states: SingleWireMove[];
  selection: string[];
}

interface SingleWireMove {
  address: string;
  originalPoints: WirePointSpec[];
  affectedPointsIds: (string|undefined)[];  // TODO: or set?
  auxWire?: Wire;
};

function moveSingleWire(dxy: Point, s: SingleWireMove): WirePointSpec[] {
  const w = assertExists(s.auxWire);
  let z: WirePointSpec[] = [];
  w.points.forEach(p => p.remove());
  const affected: boolean[] = [];
  const nextVertical: boolean[] = [];
  const nextHorizontal: boolean[] = [];
  for (const p of s.originalPoints) {
    const a = s.affectedPointsIds.indexOf(assertExists(p.super.id)) != -1;
    if (p.helper && !a) continue;
    affected.push(a);
    z.push({
      helper: p.helper,
      super: copy(p.super),
    });
  }
  for (let i = 0; i < z.length; i++) {
    if (i + 1 < z.length) {
      nextVertical.push(z[i].super.xy.x == z[i + 1].super.xy.x);
      nextHorizontal.push(z[i].super.xy.y == z[i + 1].super.xy.y);
    }
    if (affected[i]) {
      z[i].super.xy = alignPoint(point(z[i].super.xy.x + dxy.x, z[i].super.xy.y + dxy.y), gridAlignment());
    }
  }
  for (let i = 0; i < z.length; i++) {
    const p = z[i];
    if (!affected[i] || p.helper) continue;
    if (i > 0 && !affected[i - 1]) {
      if (nextVertical[i - 1]) {
        z[i - 1].super.xy.x = p.super.xy.x;
      }
      if (nextHorizontal[i - 1]) {
        z[i - 1].super.xy.y = p.super.xy.y;
      }
    }
    if (i + 1 < z.length) {
      if (nextVertical[i]) {
        z[i + 1].super.xy.x = p.super.xy.x;
      }
      if (nextHorizontal[i]) {
        z[i + 1].super.xy.y = p.super.xy.y;
      }
    }
  }
  for (const p of z) {
    p.helper = false;
  }
  z = removeRedundantPoints(z);
  z = addHelperPoints(z);
  return z;
}

export class MoveWirePointAction implements Action {
  actionType = "MoveWirePointAction";
  states: SingleWireMove[] = [];
  affectedPointsAddresses: string[];
  from: Point;
  to: Point;
  selection: string[];
  constructor(points: WirePoint[], origin?: Point) {
    this.selection = selectionAddresses();
    this.affectedPointsAddresses = points.map(p => p.address());
    const uniqAdresses = Array.from(new Set<string>(points.map(p => p.parent()?.address()!)));
    for (const a of uniqAdresses) {
      const w = getByAddress(a) as Wire;
      const s: SingleWireMove = {
        address: w.address(),
        originalPoints: w.pointsSpec(),
        affectedPointsIds: [],
        auxWire: new Wire(),  // TODO: make id optional if object is not going to be materialized and maybe make id parameter of "materialize".
      };
      for (const p of points) {
        if (p.parent() == w) {
          s.affectedPointsIds.push(p.id());
        }
      }
      this.states.push(s);
      s.auxWire?.pointsSpec(w.pointsSpec());
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
    const dxy = pointSub(this.to, this.from);
    for (const s of this.states) {
      const w = getByAddress(s.address) as Wire;
      let x = moveSingleWire(dxy, s);
      w.pointsSpec(x);
      w.show(defaultLayer());
      s.auxWire?.hide();
    }
  }
  undo(): void {
    for (const w of this.states) {
      (getByAddress(w.address) as Wire).pointsSpec(w.originalPoints);
    }
    selectionAddresses(this.selection);
  }
  mousemove(event: Konva.KonvaEventObject<MouseEvent>): boolean {
    this.to = getPhysicalCursorPosition();
    const dxy = pointSub(this.to, this.from);
    for (const s of this.states) {
      const sp = moveSingleWire(dxy, s);
      console.log('aux spec', sp);
      s.auxWire?.pointsSpec(sp);
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