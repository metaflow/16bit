import Konva from 'konva';
import { Contact } from './contact';
import { scale, toScreen } from '../stage';
import { Addressable, address, newAddress, addAddressRoot } from '../address';
import { Selectable } from '../actions/select_action';
import { Component } from './component';

export class WireEnd extends Component implements Selectable {
    selectableInterface: true = true;
    _contact: Contact;
    selectionRect: Konva.Rect;
    _selected: boolean = false;
    constructor(id: string, parent: Component, c: Contact) {
        super(id, parent);
        this._contact = c;
        this.selectionRect = new Konva.Rect({
            dash: [1, 1],
            stroke: 'black',
            name: 'selectable',
        });
        this.updateLayout();
        this.shapes.add(this.selectionRect);
    }
    updateLayout() {
        super.updateLayout();
        const w = 3;
        let xy = toScreen(this.contact().x()-w/2, this.contact().y()-w/2);
        this.selectionRect.x(xy[0]);
        this.selectionRect.y(xy[1]);
        this.selectionRect.width(w * scale());
        this.selectionRect.height(w * scale());
        this.selectionRect.attrs['address'] = address(this);
        this.selectionRect.stroke(this.selected() ? 'red' : 'black');
    }
    selected(v?: boolean): boolean {
        if (v !== undefined) {
            this._selected = v;
            this.updateLayout();
        }
        return this._selected;
    }
    contact(contact?: Contact): Contact {
        if (contact !== undefined) {
            this._contact = contact;
            this.updateLayout();
        }
        return this._contact;
    }
}

const wireWidth = 0.5;

export class ContactWire extends Component {
    line: Konva.Line;
    ends: WireEnd[] = [];
    constructor(id: string, c1: Contact, c2: Contact) {        
        super(id);
        this.ends.push(new WireEnd("0", this, c1));
        this.ends.push(new WireEnd("1", this, c2));
        this.addChild(this.ends[0]);
        this.addChild(this.ends[1]);
        this.line = new Konva.Line({
            points: [],
            stroke: 'blue',
            strokeWidth: 1,
            lineCap: 'round',
            lineJoin: 'round',
        });        
        this.updateLayout();
        this.shapes.add(this.line);
        addAddressRoot(this);
    }
    updateLayout() {
        super.updateLayout();
        const [x0, y0] = toScreen(this.ends[0].contact().x(), this.ends[0].contact().y());
        const [x1, y1] = toScreen(this.ends[1].contact().x(), this.ends[1].contact().y());
        this.line.points([x0, y0, x1, y1]);
        this.line.strokeWidth(wireWidth * scale());
        this.line.stroke(this.mainColor());
        this.ends[0].updateLayout();
        this.ends[1].updateLayout();
    }
    end(i: number, c?: Contact): WireEnd {
        if (c !== undefined) {
            this.ends[i].contact(c);
            this.updateLayout();
        }
        return this.ends[i];
    }
    remove() {
        
    }
}