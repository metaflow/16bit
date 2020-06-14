import { Action } from "../action";
import { KonvaEventObject } from "konva/types/Node";
import Konva from "konva";
import { Component } from "../components/component";
import { getCursorPosition, getPhysicalCursorPosition, actionLayer, defaultLayer } from "../stage";

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
    }
    undo(): void {
        this.component.remove();
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
    serialize(): string {
        console.error("not implemented");
        return "";
    }
}