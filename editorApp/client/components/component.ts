import { Addressable, address, addAddressRoot, removeAddressRoot } from "../address";
import Konva from "konva";
import { Selectable } from "../actions/select_action";
import { stage, select } from "../stage";

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
    constructor(id: string, parent?: Component|null) {
        this._id = id;
        this.parent(parent);
        if (this._parent != null) this._parent.addChild(this);
    }
    materialize() {
        if (this._parent == null) addAddressRoot(this);
        this.children.forEach(c => c.materialize());        
    }
    vanish() {
        this.children.forEach(c => c.vanish());
        if (this._parent == null) {
            removeAddressRoot(this.id());
        }
        this.shapes.remove();
        if ((this as any).selectableInterface) {
            // TODO: make select() accept 'any'.
            console.log('deselect', this);
            select((this as any as Selectable), false);
        }
    }
    parent(p?: Component|null): Component|null {
        if (p !== undefined) this._parent = p;
        return this._parent;
    }
    addChild(c: Component) {
        // this.shapes.add(c.shapes);
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
    address(): string {
        return address(this);
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
        this.children.forEach(v => v.remove());        

        if (this._parent != null) {
            this._parent.removeChild(this)
        }        
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

export function deserializeComponent(data: any): (Component|null) {
    for (const d of componentDeserializers) {
        let c = d(data);
        if (c !== null) return c;
    }
    console.error('no deserializer accepted', data);
    return null;
}