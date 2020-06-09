import Konva from 'konva';
import { magnification } from './stage';
import { appActions } from './action';
import { AddContactWireAction } from './add_wire_action';
import { Addressable } from './address';

export class Contact implements Addressable {
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
    _id: string = "";
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
    addressParent(): Addressable | null {
        return this.parent;
    }
    addressChild(id: string): Addressable | null | undefined {
        return null;
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
    id(newID?: string): string {
        if (newID !== undefined) this._id = newID;
        return this._id;
    }
}

export class Breadboard implements Addressable {
    readonly p_width = 170.5;
    readonly p_height = 63.1;
    readonly p_contact = 2.54;
    readonly p_gap = 3 * this.p_contact;
    x: number;
    y: number;
    contacts = new Map<string, Contact>();
    rect: Konva.Rect;
    _id: string = "";
    constructor(layer: Konva.Layer, x: number, y: number) {
        this.x = x;
        this.y = y;
        let left = (this.p_width - this.p_contact * 62) / 2;
        let top = (this.p_height - 19 * this.p_contact) / 2;
        const letters = "yz  abcde  fghij  kl";
        for (let i = 0; i < 63; i++) {
            for (let j = 0; j < 20; j++) {
                if (j == 2 || j == 3 || j == 9 || j == 10 || j == 16 || j == 17) continue;
                if ((j == 0 || j == 1 || j == 18 || j == 19) &&
                    (i == 0 || ((i - 1) % 6 == 0) || i == 62)) continue;
                const c = new Contact(this, left + i * this.p_contact, top + j * this.p_contact);
                c.id(letters[j] + (i + 1));
                c.setupEvents(layer);
                this.contacts.set(c.id(), c);
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
    addressParent(): Addressable | null {
        return null;
    }
    addressChild(id: string): Addressable | null | undefined {
        return this.contacts.get(id);
    }
    id(newID?: string): string {
        if (newID !== undefined) this._id = newID;
        return this._id;
    }
    add(layer: Konva.Layer) {
        layer.add(this.rect);
        this.contacts.forEach(c => c.add(layer));
    }
}