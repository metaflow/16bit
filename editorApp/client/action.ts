import Konva from 'konva';
import { fullState, StageState } from './stage';
import {diffString} from 'json-diff';
import { json } from 'express';

export const actionDeserializers: { (data: any): (Action | null) }[] = [];

export function deserializeAction(data: any) : Action {
    for (const d of actionDeserializers) {
        const a = d(data);
        if (a !== null) return a;
    }
    console.error('cannot deserialize action', data);
    throw new Error('cannot deserialize action');
}

export interface Action {
    apply(): void;
    undo(): void;
    mousemove(event: Konva.KonvaEventObject<MouseEvent>): boolean;
    mousedown(event: Konva.KonvaEventObject<MouseEvent>): boolean;
    mouseup(event: Konva.KonvaEventObject<MouseEvent>): boolean;
    cancel(): void;
    serialize(): any;
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
        console.log('applying', a);
        this.history.push(a);
        this.forwardHistory.splice(0, this.forwardHistory.length);
        this.current(null);
        a.apply();
        console.log(fullState());
        if (debugActions) {
            let sa = this.stateHistory[this.stateHistory.length - 1];
            let sb = fullState();
            this.stateHistory.push(sb);            
            console.log('undo');
            a.undo();
            console.log(fullState());
            let sc = fullState();
            if (JSON.stringify(sa) != JSON.stringify(sc)) {
                console.error('undo changes state');
                console.log(diffString(sa, sc));
            }
            console.log('redo');
            a.apply();          
            console.log(fullState());  
            let sd = fullState();
            if (JSON.stringify(sb) != JSON.stringify(sd)) {
                console.error('redo changes state');
                console.log(diffString(sb, sd));
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
            const a = deserializeAction(data);
            a.apply();
            console.log('applying', a);
            this.history.push(a);
            if (debugActions) {
                this.stateHistory.push(fullState());
            }
        }
    }
}


export let appActions = new Actions();