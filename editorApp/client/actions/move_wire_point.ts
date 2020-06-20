import { Action, actionDeserializers } from '../action';
import Konva from 'konva';
import { stage, closesetContact, toPhysical, getPhysicalCursorPosition } from '../stage';
import { ContactWire, WirePoint } from '../components/wire';
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
}


export class MoveWirePointAction implements Action {
  actionType = "MoveWirePointAction";
  original: WirePointState[] = [];
  from: [number, number];
  to: [number, number];
  points: WirePoint[];
  constructor(points: WirePoint[], origin?: [number, number]) {
    for (const p of points) this.original.push(new WirePointState(p));
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
      p.x(this.original[i].x + dx); 
      p.y(this.original[i].y + dy);
      p.wire().updateLayout();
    }    
  }
  apply(): void {
    this.updatePositions();
    for (const p of this.points) p._helper = false;
    for (const p of this.points) {
      p.wire().updateIntermediatePoints();
      p.wire().updateLayout();
    }    
  }
  undo(): void {
    for (let i = 0; i < this.points.length; i++) {
      let p = this.points[i];
      p.x(this.original[i].x); 
      p.y(this.original[i].y);
      p.wire().updateIntermediatePoints();
      p.wire().updateLayout();
    }
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