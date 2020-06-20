import { Action, actionDeserializers } from "../action";
import Konva from "konva";
import { stage, getCursorPosition, actionLayer, select, selectionAddresses, clearSelection } from "../stage";
import { getByAddress } from "../address";

export interface Selectable {
    selectableInterface: true;
    selected(v?: boolean): boolean;
}

actionDeserializers.push(function(data: any): Action|null {
    if (data['typeMarker'] !== 'SelectAction') return null;
    const s: Spec = data['spec']; 
    let z = new SelectAction();
    z.newSelection = s.newSelection;
    z.prevSelection = s.prevSelection;
    z.apply();
    return z;
  });

interface Spec {
    prevSelection: string[];
    newSelection: string[];
}

export class SelectAction implements Action {
    actionType = "SelectAction";
    rect: Konva.Rect;
    prevSelection: string[];
    newSelection: string[] = [];
    constructor() {
        this.prevSelection = selectionAddresses();
        
        let pos = getCursorPosition();
        this.rect = new Konva.Rect({
            x: pos.x,
            y: pos.y,
            fill: 'rgba(0,0,255,0.5)',
        });
        actionLayer()?.add(this.rect);
    }
    apply(): void {
        clearSelection();
        this.newSelection.map(x => getByAddress(x)).forEach(x => select(x as Selectable));
    }
    undo(): void {
        clearSelection();
        this.prevSelection.map(x => getByAddress(x)).forEach(x => select(x as any as Selectable));
    }
    mousemove(event: Konva.KonvaEventObject<MouseEvent>): boolean {
        let pos = getCursorPosition();
        this.rect.width(pos.x - this.rect.x());
        this.rect.height(pos.y - this.rect.y());
        let action = this;
        var shapes = stage()?.find('.selectable');
        if (shapes == null) return true;
        var selected = shapes.toArray().filter((shape) => {
            return Konva.Util.haveIntersection(action.rect.getClientRect(null), shape.getClientRect())
        });
        this.newSelection = [];
        for (const s of selected) {            
            const a = s.attrs['address'];
            this.newSelection.push(a);
            const x = getByAddress(a);
            console.log(a, x);
        }
        this.apply();        
        return false;
    }
    mousedown(event: Konva.KonvaEventObject<MouseEvent>): boolean {
        return false;
    }
    mouseup(event: Konva.KonvaEventObject<MouseEvent>): boolean {
        let pos = getCursorPosition();
        this.rect.width(pos.x - this.rect.x());
        this.rect.height(pos.y - this.rect.y());
        
        this.rect.remove();
        return true;
    }
    cancel(): void {
        this.rect.remove();
    }
    serialize(): any {
        let z: Spec = {
prevSelection : this.prevSelection,
newSelection: this.newSelection,
        };
      return {
            'typeMarker': 'SelectAction',
            'spec': z,
          };
    }
}