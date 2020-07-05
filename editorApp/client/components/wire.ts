import Konva from 'konva';
import { Contact } from './contact';
import { scale, toScreen, getPhysicalCursorPosition, selection, pointAsNumber, point } from '../stage';
import { newAddress, getTypedByAddress } from '../address';
import { Selectable } from '../actions/select_action';
import { Component } from './component';
import { appActions } from '../action';
import { MoveWirePointAction } from '../actions/move_wire_point';
import assertExists from 'ts-assert-exists';

export interface WirePointSpec {
    address?: string; // TODO: why we need an address?
    id?: string;
    x: number;
    y: number;
    contact?: string | null;
    helper: boolean;
}

const wirePointSize = 3;

/*
wire bending

points are:
- bend / helper (in the middle of straight fragment) / attached to something. That can be
modelled as "fixed" flag and "midpoint" (helper at the moment).
- wire has an "orthogonal" flag meaning that all bends must be 90 degrees
- editing of non-orthogonal wire is implemented and more or less straightforward as move of
  every point is independent
- moving points for orthogonal wire. First we move affected (selected) points and then look on
  adjusted points that were not affected:
  - bend -> middle: look through and if the next point is non-affected bend, then move this bend
    horizontally/vertically depending on wire direction between; if it is a fixed point - move
    middle point horizontally/vertically and consider it "affected";
  - middle -> any: add two bend points in between.

After moving all points in wire we should check wire self-intersections to remove "loops".
*/

export class WirePoint extends Component implements Selectable {
    selectableInterface: true = true;
    _contact: Contact | null = null;
    selectionRect: Konva.Rect;
    _selected: boolean = false;
    helper: boolean;
    constructor(spec: WirePointSpec) {
        super(assertExists(spec.id));
        if (spec.contact != null) this._contact = getTypedByAddress(Contact, spec.contact);
        if (spec.x !== undefined) this.x(spec.x);
        if (spec.y !== undefined) this.y(spec.y);
        this.helper = spec.helper;
        this.selectionRect = new Konva.Rect({
            dash: [1, 1],
            name: 'selectable',
        });
        const point = this;
        this.selectionRect.on('mousedown', function (e) {
            console.log('click on wire point');
            e.cancelBubble = true;
            if (point.selected()) {
                // TODO: make selection filter by type.
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
        let xy = toScreen(point(this.x() - wirePointSize / 2, this.y() - wirePointSize / 2));
        this.selectionRect.x(xy.x);
        this.selectionRect.y(xy.y);
        this.selectionRect.width(wirePointSize * scale());
        this.selectionRect.height(wirePointSize * scale());
        this.selectionRect.stroke(this._selected ? 'red' : (this.helper ? 'green' : 'black'));
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
    wire(): Wire {
        return this.parent() as Wire;
    }
    spec(): WirePointSpec {
        return {
            id: this.id(),
            address: this.materialized() ? this.address() : undefined,
            x: this.x(),
            y: this.y(),
            contact: this.contact()?.address(),
            helper: this.helper,
        }
    }
}

const wireWidth = 0.5;

export interface WireSpec {
    id: string;
    points: WirePointSpec[];
}

export class Wire extends Component {
    line: Konva.Line;
    points: WirePoint[] = [];
    constructor(id: string) {
        super(id);
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
            if (p.helper) continue;
            pp.push(...pointAsNumber(toScreen(p.xy())));
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
            // Create points in two passes: first with known IDs, then new ones.
            let pp = s.points.map(x => {
                if (x.id == undefined) return null;
                return o.addChild(new WirePoint(x));
            });
            for (let i = 0; i < s.points.length; i++) {
                const x = s.points[i];
                if (x.id !== undefined) continue;
                x.id = newAddress(o);
                pp[i] = o.addChild(new WirePoint(x));
            }
            o.points = [];
            pp.forEach(x => {
                if (x != null) o.points.push(x);
            });
            o.updateLayout();
        }
        return {
            id: o.id(),
            points: o.points.map(p => p.spec()),
        };
    }
}

export function removeRedundantPoints(s: WireSpec) {
    // Make sure that on every line there are 3 points.
    // Iteracte over points and add to line.
    // If only two points: add intermediate one.
    // If 4+ points: remove all but one intermediate.
    if (s.points.length < 2) return;
    // const specs = this.points.map(p => p.spec());
    // console.log('update intermediate points', specs);
    // this.points.forEach(p => p.remove());
    // this.points = [];
    let j = 1;
    const n = s.points.length;
    const keep = new Array<boolean>(n);
    // this.points.push(new WirePoint(specs[0]));
    keep[0] = true;
    let pi = s.points[0];
    while (j < n) {
        let pj = s.points[j];
        let k = j + 1;
        if (k < n) {
            const pk = s.points[k];
            const a1 = Math.atan2(pj.y - pi.y, pj.x - pi.x);
            const a2 = Math.atan2(pk.y - pi.y, pk.x - pi.x);
            if (Math.abs(a1 - a2) < 0.1) {
                j = k;
                continue;
            }
        }
        keep[j] = true;
        pi = pj;
        j++;
    }
    const pp = s.points;
    s.points = [];
    for (let k = 0; k < keep.length; k++) {
        if (keep[k]) {
            s.points.push(pp[k]);
        }
    }
}

export function addHelperPoints(s: WireSpec) {
    const pp: WirePointSpec[] = [];
    for (let k = 0; k < s.points.length; k++) {
        if (k > 0) {
            pp.push({
                x: (s.points[k - 1].x + s.points[k].x) / 2,
                y: (s.points[k - 1].y + s.points[k].y) / 2,
                helper: true,
            });
        }
        pp.push(s.points[k]);
    }
    s.points = pp;
}