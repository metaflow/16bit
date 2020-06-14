import Konva from 'konva';
import { scale } from '../stage';
import { appActions } from '../action';
import { AddContactWireAction } from '../actions/add_wire_action';
import { Addressable, address } from '../address';
import { Contact } from './contact';
import { Component } from './component';

const p_width = 170.5;
const p_height = 63.1;
const p_contact = 2.54;
const p_gap = 3 * p_contact;

export class Breadboard extends Component {

    contacts = new Map<string, Contact>();
    rect: Konva.Rect;
    constructor(id: string, layer: Konva.Layer|null, x: number, y: number) {
        super(id);
        this.x(x);
        this.y(y);
        let left = (p_width - p_contact * 62) / 2;
        let top = (p_height - 19 * p_contact) / 2;
        const letters = "yz  abcde  fghij  kl";
        for (let i = 0; i < 63; i++) {
            for (let j = 0; j < 20; j++) {
                if (j == 2 || j == 3 || j == 9 || j == 10 || j == 16 || j == 17) continue;
                if ((j == 0 || j == 1 || j == 18 || j == 19) &&
                    (i == 0 || ((i - 1) % 6 == 0) || i == 62)) continue;
                const c = new Contact(letters[j] + (i + 1), layer, left + i * p_contact, top + j * p_contact, this);
                this.contacts.set(c.id(), c);
            }
        }
        this.rect = new Konva.Rect({            
            fill: '#EBEDE4',
            stroke: 'black',
            strokeWidth: 1,
        });
        this.shapes.add(this.rect);
        this.updateLayout();
    }
    updateLayout(): void {
        super.updateLayout();
        this.rect.x(this.x() * scale());
        this.rect.y(this.y() * scale());
        this.rect.height(p_height * scale());
        this.rect.width(p_width * scale());
    }
}