import { Addressable } from "../address";
import Konva from "konva";
import { appActions } from "../action";
import { AddContactWireAction } from "../actions/add_wire_action";
import { Breadboard } from "./breadboard";
import { scale, addContact } from "../stage";
import { Component } from "./component";

export class Contact extends Component {
    offX: number;
    offY: number;
    circle: Konva.Circle;
    constructor(id: string, parent: Component, layer: Konva.Layer, x: number, y: number) {
        super(id, parent);
        addContact(this);
        this.offX = x;
        this.offY = y;
        this.circle = new Konva.Circle({
            x: this.x() * scale(),
            y: this.y() * scale(),
            radius: 3,
            fill: 'black',
        });
        this.shapes.add(this.circle);
        this.setupEvents(layer);
    }
    x(): number {
        return this.parent()!.x() + this.offX;
    }
    y(): number {
        return this.parent()!.y() + this.offY;
    }
    setupEvents(layer: Konva.Layer) {
        const c = this;
        this.circle.on('mousedown', function (e) {
            console.log('mousedown on contact');
            e.cancelBubble = true;
            if (appActions.onMouseDown(e)) return;
            appActions.current(new AddContactWireAction(layer, c));
        });
    }
}