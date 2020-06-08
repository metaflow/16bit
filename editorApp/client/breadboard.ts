import Konva from 'konva';
import { magnification } from './stage';
import { appActions } from './action';
import { AddContactWireAction } from './add_wire_action';

export class Contact {
    setupEvents(layer: Konva.Layer) {
        const c = this;
        this.circle.on('mousedown', function (e) {
            console.log('mousedown on contact');
            e.cancelBubble = true;
            if (appActions.onMouseDown(e)) return;
            appActions.current(new AddContactWireAction(layer, c));
        });
    }
    parent: Breadboard;
    offX: number;
    offY: number;
    circle: Konva.Circle;
    constructor(parent: Breadboard, x: number, y: number) {
        this.offX = x;
        this.offY = y;
        this.parent = parent;
        this.circle = new Konva.Circle({
            x: this.x() * magnification(),
            y: this.y() * magnification(),
            radius: 3,
            fill: 'black',
        });
    }
    add(layer: Konva.Layer) {
        layer.add(this.circle);
        layer.add(this.circle);
    }
    x(): number {
        return this.parent.x + this.offX;
    }
    y(): number {
        return this.parent.y + this.offY;
    }
}

export class Breadboard {
    readonly p_width = 170.5;
    readonly p_height = 63.1;
    readonly p_contact = 2.54;
    readonly p_gap = 3 * this.p_contact;
    x: number;
    y: number;
    contacts: Contact[] = [];
    rect: Konva.Rect;
    constructor(layer: Konva.Layer, x: number, y: number) {
        this.x = x;
        this.y = y;
        let left = (this.p_width - this.p_contact * 62) / 2;
        let top = (this.p_height - 19 * this.p_contact) / 2;
        for (let i = 0; i < 63; i++) {
            for (let j = 0; j < 20; j++) {
                if (j == 2 || j == 3 || j == 9 || j == 10 || j == 16 || j == 17) continue;
                if ((j == 0 || j == 1 || j == 18 || j == 19) &&
                    (i == 0 || ((i - 1) % 6 == 0) || i == 62)) continue;
                const c = new Contact(this, left + i * this.p_contact, top + j * this.p_contact);
                c.setupEvents(layer);
                this.contacts.push(c);
            }
        }
        this.rect = new Konva.Rect({
            x: x * magnification(),
            y: y * magnification(),
            height: this.p_height * magnification(),
            width: this.p_width * magnification(),
            fill: '#EBEDE4',
            stroke: 'black',
            strokeWidth: 1,
        })
    }

    add(layer: Konva.Layer) {
        layer.add(this.rect);
        for (const c of this.contacts) c.add(layer);
    }
}