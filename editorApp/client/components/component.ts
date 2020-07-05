import { Addressable, address, addAddressRoot, removeAddressRoot, newAddress } from "../address";
import Konva from "konva";
import { Selectable } from "../actions/select_action";
import { stage, select, Point, point } from "../stage";
import assertExists from "ts-assert-exists";

export const componentDeserializers: { (data: any): (Component | null) }[] = [];

export interface ComponentSpec {
    xy: Point;
    id?: string;
}

export abstract class Component implements Addressable {
    // _id = '';
    _parent: Component | null = null;
    // _y = 0;
    // _x = 0;
    componentSpec: ComponentSpec;
    children = new Map<string, Component>();
    shapes = new Konva.Group();
    _mainColor = 'black';
    typeMarker: string = 'Component';
    _materialized = false; // If this component really "exists" and accessabe from the address root.
    constructor(spec?: ComponentSpec) {
        if (spec == undefined) {
            spec = { xy: point(0, 0) };
        }
        this.componentSpec = spec;
    }
    materialized(b?: boolean): boolean {
        if (b === undefined) return this._materialized;
        if (this._materialized == b) return b;
        this._materialized = b;
        if (b && this._parent == null) {
            if (this.id() == null) this.id(newAddress());
            addAddressRoot(this);
        }
        this.children.forEach(c => c.materialized(b));
        if (!b) {
            if (this._parent == null) {
                removeAddressRoot(assertExists(this.id()));
            }
            if ((this as any).selectableInterface) {
                select(this, false);
            }
        }
        return this._materialized;
    }
    parent(p?: Component | null): Component | null {
        if (p !== undefined) {
            const x = this._parent;
            if (x != null) {
                x.removeChild(this);
            }
            this._parent = p;
            if (p != null) {
                this.materialized(p.materialized());
            }
        }
        return this._parent;
    }
    addChild<T extends Component>(c: T): T {
        // this.shapes.add(c.shapes);
        const id = c.id();
        if (id == null) {
            throw new Error('child id is not set');            
        }
        if (this.children.has(id)) {
            throw new Error(`child with id "${c.id()}" already present`);
        }
        c.parent(this);
        this.children.set(id, c);
        c.mainColor(this.mainColor());
        c.show(this.shapes.getLayer() as Konva.Layer);
        c.materialized(this.materialized());
        return c;
    }
    addressParent(): Addressable | null {
        return this.parent();
    }
    addressChild(id: string): Addressable | null | undefined {
        return this.children.get(id);
    }
    address(): string {
        if (!this._materialized) {
            console.error(this, 'is not materialized');
        }
        return address(this);
    }
    id(v?: string): string | undefined {
        if (v != undefined) {
            this.componentSpec.id = v;
        }
        return this.componentSpec.id;
    }
    x(newX?: number): number {
        if (newX !== undefined) {
            this.componentSpec.xy.x = newX;
        }
        if (this._parent != null) return this._parent.x() + this.componentSpec.xy.x;
        return this.componentSpec.xy.x;
    }
    y(newY?: number): number {
        if (newY !== undefined) {
            this.componentSpec.xy.y = newY;
        }
        if (this._parent != null) return this._parent.y() + this.componentSpec.xy.y;
        return this.componentSpec.xy.y;
    }
    xy(v?: Point): Point {
        if (v != undefined) {
            this.x(v.x);
            this.y(v.y);
        }
        return point(this.x(), this.y());
    }
    show(layer: Konva.Layer | null) {
        this.shapes.moveTo(layer);
        this.children.forEach(c => c.show(layer));
    }
    hide() {
        this.shapes.remove();
        this.children.forEach(c => c.hide());
    }
    remove() {
        this.hide();
        this.children.forEach(v => v.remove());
        this.materialized(false);
        this.parent(null);
    }
    removeChild(x: Component) {
        const id = x.id();
        if (id == null) throw new Error('child id is not set');
        this.children.delete(id);
    }
    updateLayout() {
        this.children.forEach(c => c.updateLayout());
    }
    mainColor(color?: string): string {
        if (color !== undefined) {
            this._mainColor = color;
            this.children.forEach(c => c.mainColor(color));
        }
        return this._mainColor;
    }
    spec(): any {
        return this.componentSpec;
    }
}

export function deserializeComponent(data: any): (Component | null) {
    for (const d of componentDeserializers) {
        let c = d(data);
        if (c !== null) return c;
    }
    console.error('no deserializer accepted', data);
    return null;
}