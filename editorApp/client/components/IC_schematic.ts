import { Component } from "./component";
import Konva from "konva";
import { toScreen, scale } from "../stage";
import { Layer } from "konva/types/Layer";
import { addAddressRoot } from "../address";
import { Contact } from "./contact";

const gap = 1;
const width = 20;
const contact_height = 5;
const contact_label_width = 3;
const pin_length = 3;
const label_font_size = 2.5;

export class IntegratedCircuitSchematic extends Component {
    rect: Konva.Rect;
    name: Konva.Text;
    left_pins: string[] = [];
    left_labels: Konva.Text[] = [];
    right_pins: string[] = [];
    right_labels: Konva.Text[] = [];
    contacts: Contact[] = [];
    pin_lines: Konva.Line[] = [];
    constructor(spec: { id: string, left_pins: string[], right_pins: string[], x: number, y: number, layer: Konva.Layer, label: string }) {
        super(spec.id);
        this.left_pins = spec.left_pins;
        this.right_pins = spec.right_pins;
        addAddressRoot(this);
        this.x(spec.x);
        this.y(spec.y);
        this.rect = new Konva.Rect({
            stroke: 'black',
            strokeWidth: 1,
        });
        this.shapes.add(this.rect);
        for (let i = 0; i < this.left_pins.length; i++) {
            const s = this.left_pins[i];
            const t = new Konva.Text({ text: s, fill: 'black', align: 'left' });
            this.left_labels.push(t);
            this.shapes.add(t);
            const c = new Contact(s, this, spec.layer, - pin_length, (i + 0.5) * contact_height + gap);
            this.contacts.push(c);
            this.pin_lines.push(new Konva.Line({ points: [0, 0, 0, 0], stroke: 'black' }));
            this.shapes.add(this.pin_lines[i]);
        }
        for (let i = 0; i < this.right_pins.length; i++) {
            const s = this.right_pins[i];
            const t = new Konva.Text({ text: s, fill: 'black', align: 'right' });
            this.right_labels.push(t);
            this.shapes.add(t);
            const c = new Contact(s, this, spec.layer, width + pin_length, (i + 0.5) * contact_height + gap);            
            this.contacts.push(c);
            this.pin_lines.push(new Konva.Line({ points: [0, 0, 0, 0], stroke: 'black' }));
        }
        for (const c of this.contacts) {
            this.addChild(c);
        }
        for (const x of this.pin_lines) this.shapes.add(x);
        this.name = new Konva.Text({ text: spec.label, align: 'center', wrap: 'none' });
        this.shapes.add(this.name);
        this.update();
    }

    update() {
        let [x, y] = toScreen(this.x(), this.y());
        this.rect.x(x);
        this.rect.y(y);
        this.rect.height((Math.max(this.left_pins.length, this.right_pins.length) * contact_height + gap * 2) * scale());
        this.rect.width(width * scale());
        for (const a of this.left_labels) {
            a.fontSize(label_font_size * scale());
            a.fontFamily('Monospace');
            a.align('center');
            a.width(contact_height * scale());
            a.height(5 * scale())
        }
        for (let i = 0; i < this.left_pins.length; i++) {
            this.left_labels[i].width(contact_label_width * scale());
            this.left_labels[i].x(x + gap * scale());
            this.left_labels[i].y(y + (gap + (i + 0.5) * contact_height - 0.5 * label_font_size) * scale());
            const c = this.contacts[i];
            this.pin_lines[i].points([c.x() * scale(), c.y() * scale(), this.rect.x(), c.y() * scale()]);
        }
        for (let i = 0; i < this.right_pins.length; i++) {
            this.right_labels[i].width(contact_label_width * scale())
            this.right_labels[i].x(x + (width - gap - contact_label_width) * scale());
            this.right_labels[i].y(y + (gap + (i + 0.5) * contact_height - 0.5 * label_font_size) * scale());
            const j = i + this.left_pins.length;
            const c = this.contacts[j];
            this.pin_lines[j].points([c.x() * scale(), c.y() * scale(), this.rect.x() + this.rect.width(), c.y() * scale()]);
        }
        this.name.x(x - pin_length * scale());
        this.name.y(y - (label_font_size * 2) * scale());
        this.name.width(this.rect.width() + 2 * pin_length * scale());
        this.name.fontSize(label_font_size * scale());
    }
}