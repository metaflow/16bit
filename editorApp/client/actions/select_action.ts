import { Action, actionDeserializers } from "../action";
import Konva from "konva";
import { stage, actionLayer, select, selectionAddresses, clearSelection, ScreenPoint } from "../stage";
import { getByAddress } from "../address";

const marker = 'SelectAction';

export interface Selectable {
    selectableInterface: true;
    selected(v?: boolean): boolean;
}

actionDeserializers.push(function (data: any): Action | null {
    if (data['typeMarker'] !== marker) return null;
    const s: Spec = data['spec'];
    let z = new SelectAction();
    z.newSelection = s.newSelection;
    z.prevSelection = s.prevSelection;
    return z;
});

interface Spec {
    prevSelection: string[];
    newSelection: string[];
}

export class SelectAction implements Action {
    rect: Konva.Rect | null = null;
    prevSelection: string[];
    newSelection: string[] = [];
    constructor() {
        this.prevSelection = selectionAddresses();
    }
    apply(): void {
        clearSelection();
        this.newSelection.map(x => getByAddress(x)).forEach(x => select(x));
    }
    undo(): void {
        clearSelection();
        this.prevSelection.map(x => getByAddress(x)).forEach(x => select(x));
    }
    mousemove(event: Konva.KonvaEventObject<MouseEvent>): boolean {
        if (this.rect == null) return false;
        let pos = ScreenPoint.cursor();
        this.rect.width(pos.x - this.rect.x());
        this.rect.height(pos.y - this.rect.y());
        const r = this.rect.getClientRect(null);
        var shapes = stage()?.find('.selectable');
        if (shapes == null) return true;
        var selected = shapes.toArray().filter((shape) => {
            return Konva.Util.haveIntersection(r, shape.getClientRect());
        });
        this.newSelection = [];
        for (const s of selected) {
            const a = s.attrs['address'];
            this.newSelection.push(a);
            const x = getByAddress(a);
        }
        this.apply();
        return false;
    }
    mousedown(event: Konva.KonvaEventObject<MouseEvent>): boolean {
        let pos = ScreenPoint.cursor();
        this.rect = new Konva.Rect({
            x: pos.x,
            y: pos.y,
            fill: 'rgba(0,0,255,0.5)',
        });
        actionLayer()?.add(this.rect);
        return false;
    }
    mouseup(event: Konva.KonvaEventObject<MouseEvent>): boolean {
        if (this.rect == null) return false;
        let pos = ScreenPoint.cursor();
        this.rect.width(pos.x - this.rect.x());
        this.rect.height(pos.y - this.rect.y());
        this.rect.remove();
        return true;
    }
    cancel(): void {
        this.rect?.remove();
    }
    serialize(): any {
        let z: Spec = {
            prevSelection: this.prevSelection,
            newSelection: this.newSelection,
        };
        return {
            'typeMarker': marker,
            'spec': z,
        };
    }
}