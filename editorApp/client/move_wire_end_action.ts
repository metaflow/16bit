import {Action} from './action';
import {Wire} from './wire';
import Konva from 'konva';
import {stage} from './stage';

export class MoveWireEndAction implements Action {
    wire: Wire;
    endIndex: number;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    constructor(wire: Wire, endIndex: number) {
      this.wire = wire;
      this.endIndex = endIndex;
      [this.x0, this.y0] = this.wire.end(endIndex);
      [this.x1, this.y1] = [this.x0, this.y0];
    }
    apply(): void {
      this.wire.end(this.endIndex, this.x1, this.y1);
    }
    undo(): void {
      console.log('undo move wire end');
      this.wire.end(this.endIndex, this.x0, this.y0);
    }
    mousemove(event:  Konva.KonvaEventObject<MouseEvent>): boolean {
      const mousePos = stage()?.getPointerPosition();
      if (mousePos == null) return false;
      [this.x1, this.y1] = [mousePos.x, mousePos.y]; 
      this.apply();
      return false;
    }
    mousedown(event:  Konva.KonvaEventObject<MouseEvent>): boolean {
      return true;
    }
    cancel(): void {
      this.undo();
    }
  }