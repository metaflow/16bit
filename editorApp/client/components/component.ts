import { Addressable } from "../address";
import Konva from "konva";

export class Component implements Addressable {
    _id = '';
    _parent: Component | null = null;
    _y = 0;
    _x = 0;
    children = new Map<string, Component>();
    shapes = new Konva.Group();
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
        if (newX !== undefined) this._x = newX;
        return this._x;
    }
    y(newY?: number) : number {
        if (newY !== undefined) this._y = newY;
        return this._y;
    }
    add(layer: Konva.Layer) {
        layer.add(this.shapes);
        this.children.forEach(c => c.add(layer));
    }
    remove() {
        this.shapes.remove();
        this.children.forEach(v => v.remove());
    }
}