import { Addressable, address, addAddressRoot, removeAddressRoot } from "../address";
import Konva from "konva";
import { Selectable } from "../actions/select_action";
import { stage, select } from "../stage";

export const componentDeserializers: { (data: any): (Component | null) }[] = [];

export abstract class Component implements Addressable {
    _id = '';
    _parent: Component | null = null;
    _y = 0;
    _x = 0;
    children = new Map<string, Component>();
    shapes = new Konva.Group();
    _mainColor = 'black';
    typeMarker: string = 'Component';
    _materialized = false; // If this component really "exists" and accessabe from the address root.
    constructor(id: string) {
        this._id = id;

    }
    materialized(b?: boolean): boolean {
        if (b === undefined) return this._materialized;
        if (this._materialized == b) return b;
        this._materialized = b;
        if (b && this._parent == null) addAddressRoot(this);
        this.children.forEach(c => c.materialized(b));
        if (!b) {
            if (this._parent == null) {
                removeAddressRoot(this.id());
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
        if (this.children.has(c.id())) {
            throw new Error(`child with id "${c.id()}" already present`);
        }
        c.parent(this);
        this.children.set(c.id(), c);
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
    id(): string {
        return this._id;
    }
    x(newX?: number): number {
        if (newX !== undefined) {
            this._x = newX;
        }
        if (this._parent != null) return this._parent.x() + this._x;
        return this._x;
    }
    y(newY?: number): number {
        if (newY !== undefined) {
            this._y = newY;
        }
        if (this._parent != null) return this._parent.y() + this._y;
        return this._y;
    }
    show(layer: Konva.Layer | null) {
        this.shapes.moveTo(layer);
        this.children.forEach(c => c.show(layer));
    }
    hide() {
        this.shapes.remove();
    }
    remove() {
        this.hide();
        this.children.forEach(v => v.remove());
        this.materialized(false);
        this.parent(null);
    }
    removeChild(x: Component) {
        this.children.delete(x.id());
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
    serialize(): any {
        return {}
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