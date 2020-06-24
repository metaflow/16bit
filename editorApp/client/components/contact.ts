import { Addressable, newAddress } from "../address";
import Konva from "konva";
import { appActions } from "../action";
import { AddContactWireAction } from "../actions/add_wire_action";
import { scale, addContact } from "../stage";
import { Component } from "./component";

const radius = 0.8;

export class Contact extends Component {
    circle: Konva.Circle;
    constructor(id: string, x: number, y: number) {
        super(id);
        this.x(x);
        this.y(y);
        this.circle = new Konva.Circle({
            radius: 1,
        });
        this.shapes.add(this.circle);
        this.setupEvents();
        this.updateLayout();
    }
    materialized(b?:boolean): boolean {
        const p = this._materialized;
        const z = super.materialized(b);
        if (p != z) {
            if (z)  {
                addContact(this);
            } else {
                // TODO: remove contact.
            }
        }        
        return z;
    }
    setupEvents() {
        const c = this;
        this.circle.on('mousedown', function (e) {
            console.log('mousedown on contact');
            e.cancelBubble = true;
            if (appActions.onMouseDown(e)) return;
            appActions.current(new AddContactWireAction(c));
        });
    }
    updateLayout(): void {
        super.updateLayout();
        this.circle.fill(this.mainColor());
        this.circle.x(this.x() * scale());
        this.circle.y(this.y() * scale());
        this.circle.radius(radius * scale());
    }
}