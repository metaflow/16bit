import Konva from 'konva';
import { Contact } from './contact';
import { scale, toScreen, getPhysicalCursorPosition, selection } from '../stage';
import { Addressable, address, newAddress, addAddressRoot } from '../address';
import { Selectable } from '../actions/select_action';
import { Component } from './component';
import { appActions } from '../action';
import { MoveWirePointAction } from '../actions/move_wire_point';

interface WirePointSpec {
    id: string;
    x?: number;
    y?: number;
    contact?: Contact|null;
    wire: ContactWire;
    helper: boolean;
}

const wirePointSize = 3;

export class WirePoint extends Component implements Selectable {    
    selectableInterface: true = true;
    _contact: Contact | null = null;
    selectionRect: Konva.Rect;
    _selected: boolean = false;
    _wire: ContactWire;
    _helper: boolean;
    constructor(spec: WirePointSpec) {
        super(spec.id, spec.wire);
        this._wire = spec.wire;
        if (spec.contact !== undefined) this._contact = spec.contact;
        if (spec.x !== undefined) this.x(spec.x);
        if (spec.y !== undefined) this.y(spec.y);
        this._helper = spec.helper;
        this.selectionRect = new Konva.Rect({
            dash: [1, 1],
            name: 'selectable',
        });
        const point = this;
        this.selectionRect.on('mousedown', function (e) {
            console.log('click on wire point');
            e.cancelBubble = true;
            if (point.selected()) {
                const points: WirePoint[] = selection().filter(x => x instanceof WirePoint).map(x => x as any as WirePoint);
                appActions.current(new MoveWirePointAction(points, getPhysicalCursorPosition()));
            } else {
                appActions.current(new MoveWirePointAction([point], getPhysicalCursorPosition()));
            }            
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
        this.selectionRect.stroke(this._selected ? 'red' : (this._helper ? 'green' : 'black'));
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
    spec(): WirePointSpec {
        return {
            id: this.id(),
            x: this.x(),
            y: this.y(),
            contact: this.contact(),
            wire: this.wire(),
            helper: this._helper,
        }
    }
}

const wireWidth = 0.5;

export class ContactWire extends Component {
    line: Konva.Line;
    points: WirePoint[] = [];
    constructor(id: string, c1: Contact, c2: Contact) {
        super(id);
        this.points.push(new WirePoint({ id: newAddress(this), wire: this, contact: c1, helper: false }));
        this.points.push(new WirePoint({ id: newAddress(this), wire: this, contact: c2, helper: false }));
        this.line = new Konva.Line({
            points: [],
            stroke: 'blue',
            strokeWidth: 1,
            lineCap: 'round',
            lineJoin: 'round',
        });        
        this.shapes.add(this.line);
        this.updateIntermediatePoints();
        this.updateLayout();
    }
    updateLayout() {
        super.updateLayout();
        const pp: number[] = [];
        for (const p of this.points) {
            if (p._helper) continue;
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
    updateIntermediatePoints() {
        // Make sure that on every line there are 3 points.
        // Iteracte over points and add to line.
        // If only two points: add intermediate one.
        // If 4+ points: remove all but one intermediate.
        
        const specs = this.points.map(p => p.spec());
        console.log('update intermediate points', specs);
        this.points.forEach(p => p.remove());
        this.points = [];
        let i = 0;
        let j = 1;
        this.points.push(new WirePoint(specs[0]));
        while (j < specs.length) {
            if (specs[j].helper) {
                j++; continue;
            }
            let xi = specs[i].x!;
            let yi = specs[i].y!;
            let xj = specs[j].x!;
            let yj = specs[j].y!;
            let k = j + 1;
            while (k < specs.length && specs[k].helper) k++;
            if (k < specs.length) {
                let xk = specs[k].x!;
                let yk = specs[k].y!;
                const a1 = Math.atan2(yj - yi, xj - xi);
                const a2 = Math.atan2(yk - yi, xk - xi);
                console.log(i, j, k, ' |', xi, yi, '|', xj, yj, '|', xk, yk, 'a1', a1, 'a2', a2, 'd', Math.abs(a1 - a2));
                if (Math.abs(a1 - a2) < 0.1) {
                    j = k;
                    continue;
                }
            }            
            this.points.push(new WirePoint({
                    id: newAddress(this),
                    wire: this,
                    x: (xi + xj) / 2,
                    y: (yi + yj) / 2,
                    helper: true,
                }));
            specs[j].id = newAddress(this);
            this.points.push(new WirePoint(specs[j]));
            i = j;
            j = k;
        }
        console.log('updated points intermediate points', this.points.map(p => p.spec()));
    }
}