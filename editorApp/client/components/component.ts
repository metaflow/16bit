import { Addressable } from "../address";
import Konva from "konva";

export const componentDeserializers: {(data: any): (Component|null)}[] = [];

export abstract class Component implements Addressable {
    _id = '';
    _parent: Component | null = null;
    _y = 0;
    _x = 0;
    children = new Map<string, Component>();
    shapes = new Konva.Group();
    _mainColor = 'black';
    typeMarker: string = 'Component';
    constructor(id: string, parent?: Component) {
        this._id = id;
        if (parent !== undefined) {
            this.parent(parent);
            parent.addChild(this);
        }
    }
    parent(p?: Component): Component|null {
        if (p !== undefined) this._parent = p;
        return this._parent;
    }
    addChild(c: Component) {
        this.shapes.add(c.shapes);
        if (this.children.has(c.id())) {
            throw new Error(`child with id "${c.id()}" already present`);
        }
        this.children.set(c.id(), c);
    }
    addressParent(): Addressable | null {
        return this.parent();
    }
    addressChild(id: string): Addressable | null | undefined {
        return this.children.get(id);
    }
    id(): string {
        return this._id;
    }
    x(newX?: number) : number {
        if (newX !== undefined) {
            this._x = newX;
        }
        if (this._parent != null) return this._parent.x() + this._x;
        return this._x;
    }
    y(newY?: number) : number {
        if (newY !== undefined) {
            this._y = newY;
        }
        if (this._parent != null) return this._parent.y() + this._y;
        return this._y;
    }
    add(layer: Konva.Layer|null) {
        this.shapes.moveTo(layer);
        this.children.forEach(c => c.add(layer));
    }
    remove() {
        this.shapes.remove();
        this.children.forEach(v => v.remove());
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

export function deserializeComponent(data: any): (Component|null) {
    for (const d of componentDeserializers) {
        let c = d(data);
        if (c !== null) return c;
    }
    console.error('no deserializer accepted', data);
    return null;
}