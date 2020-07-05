import Konva from "konva";
import { appActions } from "../action";
import { scale, addContact, removeContact } from "../stage";
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
        let p = this._materialized;
        if (b !== undefined && p != b) {
            if (b)  {
                p = super.materialized(b);
                addContact(this);
            } else {
                removeContact(this);
                p = super.materialized(b);
            }
        }
        return p;
    }
    setupEvents() {
        const c = this;
        this.circle.on('mousedown', function (e) {
            console.log('mousedown on contact');
            e.cancelBubble = true;
            if (appActions.onMouseDown(e)) return;
            // TODO: appActions.current(new AddContactWireAction(c));
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