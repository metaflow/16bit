import { Action, actionDeserializers } from '../action';
import Konva from 'konva';
import { stage, closesetContact, toPhysical, getPhysicalCursorPosition, selectionAddresses, select } from '../stage';
import { ContactWire, WirePoint, WireSpec, WirePointSpec } from '../components/wire';
import { Contact } from '../components/contact';
import { address, getByAddress } from '../address';


actionDeserializers.push(function(data: any): Action|null {
  if (data['typeMarker'] !== 'MoveWirePointAction') return null;
  const s: spec = data['spec']; 
  let z = new MoveWirePointAction(s.points.map(a => getByAddress(a)), s.from);
  z.to = s.to;
  z.apply();
  return z;
});

class WirePointState {
  x: number;
  y: number;
  contact: Contact | null;
  point: WirePoint;
  constructor(p: WirePoint) {
    this.point = p;
    this.x = p.x();
    this.y = p.y();
    this.contact = p.contact();
  }
  restore() {
    this.point.x(this.x);
    this.point.y(this.y);
    this.point.contact(this.contact);
    this.point.updateLayout();
  }
}

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
  points: WirePoint[];
  constructor(points: WirePoint[], origin?: [number, number]) {    
    this.original = points.map(p => p.spec());
    // TODO: make .address a method of Component.
    this.wires = Array.from(new Set<string>(points.map(p => address(p.wire()))))
    for (const w of this.wires) {
      this.oldWireStates.set(w, (getByAddress(w) as ContactWire).spec());
    }
    if (origin === undefined) origin = getPhysicalCursorPosition();
    this.from = origin;
    this.to = origin;
    this.points = points;
  }
  serialize(): any { 
    const z: spec = {
      points: this.points.map(p => address(p)),
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
    for (let i = 0; i < this.points.length; i++) {
      let p = this.points[i];
      p.x(this.original[i].x! + dx); 
      p.y(this.original[i].y! + dy);      
    }    
    for (const w of this.wires) {
      (getByAddress(w) as ContactWire).updateLayout();
    }
  }
  apply(): void {
    this.updatePositions();
    for (const p of this.points) p._helper = false;
    for (const p of this.points) {
      p.wire().updateIntermediatePoints();
      p.wire().updateLayout();
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
    return false;
  }
  mousedown(event: Konva.KonvaEventObject<MouseEvent>): boolean {
    return false;
  }
  mouseup(event: Konva.KonvaEventObject<MouseEvent>): boolean {
    this.to = getPhysicalCursorPosition();
    this.apply();
    return true;
  }
  cancel(): void {
    this.undo();
  }
}