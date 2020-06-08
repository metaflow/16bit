import Konva from 'konva';

export interface Action {
    apply(): void;
    undo(): void;
    mousemove(event:  Konva.KonvaEventObject<MouseEvent>): boolean;
    mousedown(event:  Konva.KonvaEventObject<MouseEvent>): boolean;
    cancel(): void;
}

export class Actions {
    private currentAction: Action|null = null;
    private readonly history: Action[] = [];
    private readonly forwardHistory: Action[] = [];

    current(a?: Action|null): Action|null {
        if (a !== undefined) this.currentAction = a;        
        return this.currentAction;
    }
    onMouseDown(event:  Konva.KonvaEventObject<MouseEvent>): boolean {
        if (this.current() == null) return false;
        console.log('mouse down: there is an active action');
        // event.cancelBubble = true;
        if (this.current()?.mousedown(event)) this.commit();
        return true;
    }
    onMouseMove(event:  Konva.KonvaEventObject<MouseEvent>): boolean {
        if (this.current() == null) return false;
        // event.cancelBubble = true;
        // console.log('mouse move: there is an active action');
        if (this.current()?.mousemove(event)) this.commit();
        return true;
    }
    commit() {
        const a = this.current();
        if (a == null) return;
        this.history.push(a);
        this.forwardHistory.splice(0, this.forwardHistory.length);
        this.current(null);
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
}

export let appActions = new Actions();