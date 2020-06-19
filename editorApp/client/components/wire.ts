import Konva from 'konva';
import { Contact } from './contact';
import { scale, toScreen, getPhysicalCursorPosition } from '../stage';
import { Addressable, address, newAddress, addAddressRoot } from '../address';
import { Selectable } from '../actions/select_action';
import { Component } from './component';
import { appActions } from '../action';
import { MoveWirePointAction } from '../actions/move_wire_point';

interface WirePointSpec {
    id: string;
    x?: number;
    y?: number;
    contact?: Contact;
    wire: ContactWire;
}

const wirePointSize = 3;

export class WirePoint extends Component implements Selectable {
    addNeighbours() {
        const pp: WirePoint[] = [];
        const n = this._wire.points.length;
        for (let i = 0; i < n; i++) {
            const p = this._wire.points[i];
            if (p.id() !== this.id() || i == 0 || i == n - 1) {
                pp.push(p);
                continue;
            }
            pp.push(new WirePoint({
                id: newAddress(this._wire),
                wire: this._wire,
                x: (p.x() + this._wire.points[i - 1].x()) / 2,
                y: (p.y() + this._wire.points[i - 1].y()) / 2,
            }));
            pp.push(p);
            pp.push(new WirePoint({
                id: newAddress(this._wire),
                wire: this._wire,
                x: (p.x() + this._wire.points[i + 1].x()) / 2,
                y: (p.y() + this._wire.points[i + 1].y()) / 2,
            }));
        }
        this._wire.points = pp;
    }
    selectableInterface: true = true;
    _contact: Contact | null = null;
    selectionRect: Konva.Rect;
    _selected: boolean = false;
    _wire: ContactWire;
    constructor(spec: WirePointSpec) {
        super(spec.id, spec.wire);
        this._wire = spec.wire;
        if (spec.contact !== undefined) this._contact = spec.contact;
        if (spec.x !== undefined) this.x(spec.x);
        if (spec.y !== undefined) this.y(spec.y);
        this.selectionRect = new Konva.Rect({
            dash: [1, 1],
            stroke: 'black',
            name: 'selectable',
        });
        const point = this;
        this.selectionRect.on('mousedown', function (e) {
            console.log('click on wire point');
            e.cancelBubble = true;
            appActions.current(new MoveWirePointAction([point], getPhysicalCursorPosition()));
            // TODO: convert to action.
            // if (!point.selected()) {
            //     point.selected(true);
            //     point.updateLayout();
            //     point.selectionRect.getLayer()?.batchDraw();
            //     return;
            // }
        });
        this.selectionRect.attrs['address'] = address(this);
        this.shapes.add(this.selectionRect);
        this.updateLayout();
    }
    updateLayout() {
        super.updateLayout();
        if (this._contact != null) {
            this.x(this._contact.x());
            this.y(this._contact.y());
        }
        let xy = toScreen(this.x() - wirePointSize / 2, this.y() - wirePointSize / 2);
        this.selectionRect.x(xy[0]);
        this.selectionRect.y(xy[1]);
        this.selectionRect.width(wirePointSize * scale());
        this.selectionRect.height(wirePointSize * scale());
        this.selectionRect.stroke(this.selected() ? 'red' : 'black');
    }
    selected(v?: boolean): boolean {
        if (v !== undefined) {
            this._selected = v;
            this.updateLayout();
        }
        return this._selected;
    }
    contact(contact?: Contact | null): Contact | null {
        if (contact !== undefined) {
            this._contact = contact;
            this.updateLayout();
        }
        return this._contact;
    }
    wire(): ContactWire {
        return this._wire;
    }
}

const wireWidth = 0.5;

export class ContactWire extends Component {
    line: Konva.Line;
    points: WirePoint[] = [];
    constructor(id: string, c1: Contact, c2: Contact) {
        super(id);
        this.points.push(new WirePoint({ id: newAddress(this), wire: this, contact: c1 }));        
        this.points.push(new WirePoint({
            id: newAddress(this),
            wire: this,
            x: (c1.x() + c2.x()) / 2,
            y: (c1.y() + c2.y()) / 2,
        }));
        this.points.push(new WirePoint({ id: newAddress(this), wire: this, contact: c2 }));
        this.line = new Konva.Line({
            points: [],
            stroke: 'blue',
            strokeWidth: 1,
            lineCap: 'round',
            lineJoin: 'round',
        });        
        this.shapes.add(this.line);
        this.updateLayout();
    }
    updateLayout() {
        super.updateLayout();
        const pp: number[] = [];
        for (const p of this.points) {
            const [x, y] = toScreen(p.x(), p.y());
            pp.push(x, y);
        }
        this.line.points(pp);
        this.line.strokeWidth(wireWidth * scale());
        this.line.stroke(this.mainColor());
    }
    end(i: number, c?: Contact): WirePoint {
        if (c !== undefined) {
            this.points[i].contact(c);
            this.updateLayout();
        }
        return this.points[i];
    }
}