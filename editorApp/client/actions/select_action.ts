import { Action } from "../action";
import Konva from "konva";
import { stage, getCursorPosition } from "../stage";
import { getByAddress } from "../address";

export interface Selectable {
    selectableInterface: true;
    selected(v?: boolean): boolean;
}

export class SelectAction implements Action {
    actionType = "SelectAction";
    rect: Konva.Rect;
    constructor(layer: Konva.Layer) {
        let pos = getCursorPosition();
        this.rect = new Konva.Rect({
            x: pos.x,
            y: pos.y,
            fill: 'rgba(0,0,255,0.5)',
        });
        layer.add(this.rect);
    }
    apply(): void {
        throw new Error("Method not implemented.");
    }
    undo(): void {
        throw new Error("Method not implemented.");
    }
    mousemove(event: Konva.KonvaEventObject<MouseEvent>): boolean {
        let pos = getCursorPosition(); // TODO: use this instead of stage method.
        this.rect.width(pos.x - this.rect.x());
        this.rect.height(pos.y - this.rect.y());
        return false;
    }
    mousedown(event: Konva.KonvaEventObject<MouseEvent>): boolean {
        throw new Error("Method not implemented.");
    }
    mouseup(event: Konva.KonvaEventObject<MouseEvent>): boolean {
        let pos = getCursorPosition();
        this.rect.width(pos.x - this.rect.x());
        this.rect.height(pos.y - this.rect.y());
        let action = this;
        var shapes = stage()?.find('.selectable');
        if (shapes == null) return true;
        var selected = shapes.toArray().filter((shape) => {
            return Konva.Util.haveIntersection(action.rect.getClientRect(null), shape.getClientRect())
        });
        for (const s of selected) {
            const a = s.attrs['address'];
            const x = getByAddress(a);
            console.log(a, x);
            if (x.selectableInterface) {
                (x as Selectable).selected(true);
            }
        }
        this.rect.remove();
        return true;
    }
    cancel(): void {
        this.rect.remove();
    }
    serialize(): string {
        return "";
    }
}