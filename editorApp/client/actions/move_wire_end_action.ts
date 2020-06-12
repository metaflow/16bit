import {Action} from '../action';
import Konva from 'konva';
import {stage, closesetContact, toPhysical} from '../stage';
import { ContactWire } from '../components/wire';
import { Contact } from '../components/contact';

export class MoveWireEndAction implements Action {
    actionType = "MoveWireEndAction";
    wire: ContactWire;
    endIndex: number;
    from: Contact;
    to: Contact|null = null;
    constructor(wire: ContactWire, endIndex: number) {
      this.wire = wire;
      this.endIndex = endIndex;
      this.from = this.wire.end(endIndex).contact();
    }
    serialize(): string {
        throw new Error("Method not implemented.");
    }
    deserialize(data: string): void {
        throw new Error("Method not implemented.");
    }
    apply(): void {
      if (this.to != null) this.wire.end(this.endIndex).contact(this.to);
    }
    undo(): void {
      this.wire.end(this.endIndex).contact(this.from);
    }
    mousemove(event:  Konva.KonvaEventObject<MouseEvent>): boolean {
      this.to = closesetContact();
      return false;
    }
    mousedown(event:  Konva.KonvaEventObject<MouseEvent>): boolean {
      return true;
    }
    mouseup(event: import("konva/types/Node").KonvaEventObject<MouseEvent>): boolean {
        return false;
    }
    cancel(): void {
      this.undo();
    }

  }