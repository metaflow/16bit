import { Action, actionDeserializers } from "../action";
import { KonvaEventObject } from "konva/types/Node";
import { Component, deserializeComponent } from "../components/component";
import { getPhysicalCursorPosition, actionLayer, defaultLayer, pointAsNumber, gridAlignment, Point, alignPoint } from "../stage";

actionDeserializers.push(function(data: any): Action|null {
    if (data['typeMarker'] !== 'PlaceComponentAction') return null;
    let c = deserializeComponent(data['spec']);
    if (c == null) return null;
    let z = new PlaceComponentAction(c);
    z.xy = z.component.xy();
    return z;
});

export class PlaceComponentAction implements Action {
    actionType: string = 'PlaceComponentAction';
    xy: Point = {x: 0, y: 0};
    component: Component;
    constructor(component: Component) {
        this.component = component;
        this.component.mainColor('red');
        this.component.updateLayout();
        this.component.show(actionLayer());
    }
    apply(): void {
        this.component.xy(this.xy);
        this.component.mainColor('black');
        this.component.updateLayout();
        this.component.show(defaultLayer());
        this.component.materialized(true);
    }
    undo(): void {
        this.component.materialized(false);
        this.component.hide();
    }
    mousemove(event: KonvaEventObject<MouseEvent>): boolean {        
        this.xy = alignPoint(getPhysicalCursorPosition(), gridAlignment());
        this.component.xy(this.xy);
        this.component.updateLayout();
        return false;
    }
    mousedown(event: KonvaEventObject<MouseEvent>): boolean {
        return true;
    }
    mouseup(event: KonvaEventObject<MouseEvent>): boolean {
        return false;
    }
    cancel(): void {
        this.undo();
    }
    serialize(): any {
        return  {
            'typeMarker': 'PlaceComponentAction',
            'spec': this.component.spec(),
        }
    }
}