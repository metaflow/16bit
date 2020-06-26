import Konva from 'konva';
import { Contact } from './contact';
import { scale, toScreen, getPhysicalCursorPosition, selection } from '../stage';
import { address, newAddress, getTypedByAddress } from '../address';
import { Selectable } from '../actions/select_action';
import { Component } from './component';
import { appActions } from '../action';
import { MoveWirePointAction } from '../actions/move_wire_point';
import assertExists from 'ts-assert-exists';

export interface WirePointSpec {
    address?: string;
    id: string;
    x: number;
    y: number;
    contact?: string | null;
    helper: boolean;
}

const wirePointSize = 3;

export class WirePoint extends Component implements Selectable {
    selectableInterface: true = true;
    _contact: Contact | null = null;
    selectionRect: Konva.Rect;
    _selected: boolean = false;
    _helper: boolean;
    constructor(spec: WirePointSpec) {
        super(spec.id);
        if (spec.contact != null) this._contact = getTypedByAddress(Contact, spec.contact);
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
        this.shapes.add(this.selectionRect);
        this.updateLayout();
    }
    materialized(b?: boolean): boolean {        
        let z = super.materialized(b);  
        if (z) {
            this.selectionRect.attrs['address'] = this.address(); // TODO: make address() check that this component is accessible from the root.
        }
        return z;
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
        return this.parent() as ContactWire;
    }
    spec(): WirePointSpec {
        return {
            id: this.id(),
            address: this.materialized() ? this.address() : undefined,
            x: this.x(),
            y: this.y(),
            contact: this.contact()?.address(),
            helper: this._helper,
        }
    }
}

const wireWidth = 0.5;

export interface WireSpec {
    id: string;
    points: WirePointSpec[];
}

export class ContactWire extends Component {
    line: Konva.Line;
    points: WirePoint[] = [];
    constructor(id: string, c1: Contact, c2: Contact) {
        super(id);
        this.points.push(this.addChild(new WirePoint({ id: newAddress(this), contact: c1.address(), helper: false, x: 0, y: 0 })));
        this.points.push(this.addChild(new WirePoint({ id: newAddress(this), contact: c2.address(), helper: false, x: 0, y: 0 })));
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
        // this.points.forEach(p => p.remove());
        // this.points = [];
        let i = 0;
        let j = 1;
        const keep = new Array<boolean>(specs.length);
        console.log('keep', keep);
        // this.points.push(new WirePoint(specs[0]));
        keep[0] = true;
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
            keep[j] = true;
            i = j;
            j = k;
        }
        const pp = this.points;
        const keepPoints: WirePoint[] = [];
        this.points = [];
        for (let k = 0; k < keep.length; k++) {
            if (keep[k]) {
                keepPoints.push(pp[k]);
            } else {
                pp[k].remove();
            }
        }
        for (let k = 0; k < keepPoints.length; k++) {
            if (k > 0) {
                this.points.push(this.addChild(new WirePoint({
                    id: newAddress(this),
                    x: (keepPoints[k - 1].x() + keepPoints[k].x()) / 2,
                    y: (keepPoints[k - 1].y() + keepPoints[k].y()) / 2,
                    helper: true,
                })));
            }
            this.points.push(keepPoints[k]);
        }
        console.log('updated points intermediate points', this.points.map(p => p.spec()));
    }
    serialize(): any {
        return {
            'typeMarker': 'ContactWire',
            'spec': this.spec(),
        }
    }
    spec(s?: WireSpec): WireSpec {
        let o = this;
        if (s !== undefined) {
            o.points.forEach(p => p.remove());
            o.points = s.points.map(x => o.addChild(new WirePoint(x)));
            o.updateIntermediatePoints();
            o.updateLayout();
        }
        return {
            id: o.id(),
            points: o.points.map(p => p.spec()),
        };
    }
}