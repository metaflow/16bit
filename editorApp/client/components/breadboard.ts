import Konva from 'konva';
import { magnification } from '../stage';
import { appActions } from '../action';
import { AddContactWireAction } from '../actions/add_wire_action';
import { Addressable, address } from '../address';
import { Contact } from './contact';
import { Component } from './component';

export class Breadboard extends Component {
    readonly p_width = 170.5;
    readonly p_height = 63.1;
    readonly p_contact = 2.54;
    readonly p_gap = 3 * this.p_contact;
    contacts = new Map<string, Contact>();
    rect: Konva.Rect;
    constructor(id: string, layer: Konva.Layer, x: number, y: number) {
        super(id);
        this.x(x);
        this.y(y);
        let left = (this.p_width - this.p_contact * 62) / 2;
        let top = (this.p_height - 19 * this.p_contact) / 2;
        const letters = "yz  abcde  fghij  kl";
        for (let i = 0; i < 63; i++) {
            for (let j = 0; j < 20; j++) {
                if (j == 2 || j == 3 || j == 9 || j == 10 || j == 16 || j == 17) continue;
                if ((j == 0 || j == 1 || j == 18 || j == 19) &&
                    (i == 0 || ((i - 1) % 6 == 0) || i == 62)) continue;
                const c = new Contact(letters[j] + (i + 1), this, left + i * this.p_contact, top + j * this.p_contact);
                c.setupEvents(layer); // TODO: move to Contact contructor.
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
    // TODO: do that in ctor.
    add(layer: Konva.Layer) {        
        layer.add(this.rect);
        super.add(layer);
    }
}