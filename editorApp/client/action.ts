import Konva from 'konva';
import { AddContactWireAction } from './add_wire_action';

export interface Action {
    actionType: string;
    apply(): void;
    undo(): void;
    mousemove(event: Konva.KonvaEventObject<MouseEvent>): boolean;
    mousedown(event: Konva.KonvaEventObject<MouseEvent>): boolean;
    mouseup(event: Konva.KonvaEventObject<MouseEvent>): boolean;
    cancel(): void;
    serialize(): string;
}

export class Actions {
    private currentAction: Action | null = null;
    private readonly history: Action[] = [];
    private readonly forwardHistory: Action[] = [];

    current(a?: Action | null): Action | null {
        if (a !== undefined) this.currentAction = a;
        return this.currentAction;
    }
    onMouseDown(event: Konva.KonvaEventObject<MouseEvent>): boolean {
        if (this.current() == null) return false;
        if (this.current()?.mousedown(event)) this.commit();
        return true;
    }
    onMouseUp(event: Konva.KonvaEventObject<MouseEvent>) {
        if (this.current() == null) return false;
        if (this.current()?.mouseup(event)) this.commit();
        return true;
    }
    onMouseMove(event: Konva.KonvaEventObject<MouseEvent>): boolean {
        if (this.current() == null) return false;
        if (this.current()?.mousemove(event)) this.commit();
        return true;
    }

    commit() {
        const a = this.current();
        if (a == null) return;
        this.history.push(a);
        this.forwardHistory.splice(0, this.forwardHistory.length);
        this.current(null);
        this.save();
    }
    undo() {
        let a = this.history.pop();
        if (a == null) return;
        a.undo();
        this.forwardHistory.push(a);
    }
    redo() {
        let action = this.forwardHistory.pop();
        if (action == null) return;
        action.apply();
        this.history.push(action);
    }
    cancelCurrent() {
        const a = this.current();
        if (a != null) a.cancel();
        this.current(null);
    }
    save() {
        let h: string[] = [];
        for (const a of this.history) {
            h.push(a.actionType + " " + a.serialize());
        }
        localStorage.setItem('actions_history', JSON.stringify(h));
    }
    load(layer: Konva.Layer) {
        let s = localStorage.getItem("actions_history");
        if (s === null) return;
        let h = JSON.parse(s);
        for (const s of h) {
            if(typeof s !== 'string'){
                continue;
            }
            let [a, b] = s.split(' ', 2);
            let action: Action | null = null;
            if (a === 'AddContactWireAction') {
                action = AddContactWireAction.applySerialised(layer, b); 
            }
            if (action === null) {
                console.error(`Cannot apply deserialized action "${s}"`);
                break;
            }
            this.history.push(action);
        }
    }
}

export let appActions = new Actions();