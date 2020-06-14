import { Component } from "./component";
import Konva from "konva";
import { toScreen, scale } from "../stage";
import { Layer } from "konva/types/Layer";
import { addAddressRoot } from "../address";
import { Contact } from "./contact";

const gap = 1;
const height = 2.54 * 2;
const contact_width = 2.54;
const pin_length = 2.54 / 2;
const label_font_size = 2.5;
const arc_r = 1;

export class IntegratedCircuit extends Component {
    rect: Konva.Rect;
    labels: Konva.Text[] = [];
    name: Konva.Text;
    arc: Konva.Arc;

    pins: string[];
    contacts: Contact[] = [];
    constructor(spec: { id: string, pins: string[], x: number, y: number, layer: Konva.Layer|null, label: string }) {
        super(spec.id);
        this.pins = spec.pins;
        this.x(spec.x);
        this.y(spec.y);
        this.rect = new Konva.Rect({
            stroke: 'black',
            strokeWidth: 1,
        });
        this.shapes.add(this.rect);
        for (const s of this.pins) {
            const t = new Konva.Text({ text: s, fill: 'black' });
            this.labels.push(t);
            // spec.layer.add(t);
        }
        const w = Math.floor((this.pins.length + 1) / 2);
        for (let i = 0; i < w; i++) {
            this.contacts.push(new Contact(this.pins[i], (i + 0.5) * contact_width + gap, height + pin_length, this));
        }
        for (let i = w; i < this.pins.length; i++) {
            this.contacts.push(new Contact(this.pins[i], (this.pins.length - i - 1 + 0.5) * contact_width + gap, -pin_length, this));
        }
        for (const c of this.contacts) {
            this.addChild(c);
        }
        this.name = new Konva.Text({ text: spec.label, align: 'center' });
        this.shapes.add(this.name);
        this.arc = new Konva.Arc({ angle: 180, rotation: -90, innerRadius: 10, outerRadius: 10, stroke: 'black' });
        this.shapes.add(this.arc);
        this.updateLayout();
    }

    updateLayout() {
        super.updateLayout();
        let [x, y] = toScreen(this.x(), this.y());
        const w = Math.floor((this.pins.length + 1) / 2);
        console.log('w', w);
        this.rect.x(x);
        this.rect.y(y);
        this.rect.width((w * contact_width + gap * 2) * scale());
        this.rect.height(height * scale());
        for (const a of this.labels) {
            a.fontSize(label_font_size * scale());
            a.fontFamily('Monospace');
            a.align('center');
            a.width(contact_width * scale());
            a.height(5 * scale())
        }
        for (let i = 0; i < w; i++) {
            this.labels[i].x(x + (gap + (i) * contact_width) * scale());
            this.labels[i].y(y + (height - gap - label_font_size) * scale());
        }
        for (let i = w; i < this.pins.length; i++) {
            this.labels[i].x(x + (gap + (this.pins.length - i - 1) * contact_width) * scale());
            this.labels[i].y(y + gap * scale());
        }
        this.name.x(x);
        this.name.y(y + ((height - label_font_size) * 0.5) * scale());
        this.name.width(this.rect.width());
        this.name.fontSize(label_font_size * scale());
        this.arc.innerRadius(arc_r * scale());
        this.arc.outerRadius(arc_r * scale());
        this.arc.x(x);
        this.arc.y(y + height / 2 * scale());
    }
}