import Konva from 'konva';
import { AddContactWireAction } from './actions/add_wire_action';
import { PlaceComponentAction } from './actions/add_ic_action';
import { fullState, StageState } from './stage';

export const actionDeserializers: {(data: any): (Action|null)}[] = [];

export interface Action {
    actionType: string;
    apply(): void;
    undo(): void;
    mousemove(event: Konva.KonvaEventObject<MouseEvent>): boolean;
    mousedown(event: Konva.KonvaEventObject<MouseEvent>): boolean;
    mouseup(event: Konva.KonvaEventObject<MouseEvent>): boolean;
    cancel(): void;
    serialize(): any;
}

interface serializedAction {
    type: string;
    data: any;
}

const debugActions = true;

export class Actions {
    private _current: Action | null = null;
    private readonly history: Action[] = [];
    private readonly forwardHistory: Action[] = [];
    stateHistory: StageState[] = [];
    constructor() {
        this.stateHistory.push(fullState());
    }
    current(a?: Action | null): Action | null {
        if (a !== undefined) this._current = a;
        return this._current;
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
        a.apply();
        if (debugActions) {
            let sa = this.stateHistory[this.stateHistory.length - 1];
            let sb = fullState();        
            this.stateHistory.push(sb);           
            console.log('full state', JSON.stringify(sb));
            a.undo();
            let sc = fullState();
            a.apply();
            let sd = fullState();
            if (JSON.stringify(sa) != JSON.stringify(sc)) {
                console.error('undo of ', a, 'changes state');
                console.log('initial');
                console.log(sa);
                console.log('undo');
                console.log(sc);
            }
            if (JSON.stringify(sb) != JSON.stringify(sd)) {
                console.error('undo -> redo of ', a, 'changes state');
                console.log(sb);
                console.log('undo / redo');
                console.log(sd);
            }
        }        
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
        let h: any[] = [];
        for (const a of this.history) {
            const s = a.serialize();
            if (s == null) continue;
            h.push(s);
        }
        localStorage.setItem('actions_history', JSON.stringify(h));
    }
    load() {
        let s = localStorage.getItem("actions_history");
        if (s === null) return;
        let h = JSON.parse(s);
        for (const data of h) {
            let a: Action|null = null;
            for (const d of actionDeserializers) {
                a = d(data);
                if (a !== null) break;
            }
            if (a == null) {
                console.error(`Cannot apply deserialized action "${data}"`);
                break;
            }
            this.history.push(a);
        }
    }
}

export let appActions = new Actions();