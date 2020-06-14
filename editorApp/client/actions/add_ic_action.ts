import { Action, actionDeserializers } from "../action";
import { KonvaEventObject } from "konva/types/Node";
import Konva from "konva";
import { Component, deserializeComponent } from "../components/component";
import { getCursorPosition, getPhysicalCursorPosition, actionLayer, defaultLayer } from "../stage";
import { addAddressRoot, removeAddressRoot } from "../address";

export class PlaceComponentAction implements Action {
    actionType: string = 'PlaceComponentAction';
    x: number = 0;
    y: number = 0;
    component: Component;
    constructor(component: Component) {
        this.component = component;
        this.component.mainColor('red');
        this.component.updateLayout();
        this.component.add(actionLayer());
    }
    apply(): void {
        this.component.x(this.x);
        this.component.y(this.y);
        this.component.mainColor('black');
        this.component.updateLayout();
        this.component.add(defaultLayer());
        addAddressRoot(this.component);
    }
    undo(): void {
        this.component.remove();
        removeAddressRoot(this.component.id());
    }
    mousemove(event: KonvaEventObject<MouseEvent>): boolean {        
        [this.x, this.y] = getPhysicalCursorPosition();
        this.component.x(this.x);
        this.component.y(this.y);
        this.component.updateLayout();
        return false;
    }
    mousedown(event: KonvaEventObject<MouseEvent>): boolean {
        this.apply();
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
            'spec': this.component.serialize(),
        }
    }
}

actionDeserializers.push(function(data: any): Action|null {
    if (data['typeMarker'] !== 'PlaceComponentAction') return null;
    let c = deserializeComponent(data['spec']);
    if (c == null) return null;
    let z = new PlaceComponentAction(c);
    z.x = z.component.x();
    z.y = z.component.y();
    z.apply();
    return z;
});