import { Component, componentDeserializers } from "./component";
import Konva from "konva";
import { toScreen, scale } from "../stage";
import { Contact } from "./contact";

componentDeserializers.push(function (data: any): (IntegratedCircuitSchematic | null) {
    if (data['typeMarker'] !== 'IntegratedCircuitSchematic') {
        return null
    }
    return new IntegratedCircuitSchematic(data['spec'] as Spec);
});

const gap = 1;
const width = 20;
const contact_height = 5;
const contact_label_width = 5;
const pin_length = 5;
const label_font_size = 3;

interface Spec {
    id: string;
    left_pins: string[];
    right_pins: string[];
    x: number;
    y: number;
    label: string
}

export class IntegratedCircuitSchematic extends Component {
    typeMarker = "IntegratedCircuitSchematic";
    rect: Konva.Rect;
    name: Konva.Text;
    left_pins: string[] = [];
    left_labels: Konva.Text[] = [];
    right_pins: string[] = [];
    right_labels: Konva.Text[] = [];
    contacts: Contact[] = [];
    pin_lines: Konva.Line[] = [];

    constructor(spec: Spec) {
        super(spec.id);
        this.left_pins = spec.left_pins;
        this.right_pins = spec.right_pins;
        this.x(spec.x);
        this.y(spec.y);
        this.rect = new Konva.Rect({
            stroke: 'black',
            strokeWidth: 1,
        });
        this.shapes.add(this.rect);
        for (let i = 0; i < this.left_pins.length; i++) {
            const s = this.left_pins[i];
            const t = new Konva.Text({ text: s, fill: 'black', align: 'left', fontFamily: 'Monospace' });
            this.left_labels.push(t);
            this.shapes.add(t);
            if (s === "") continue;
            const c = new Contact(s, - pin_length, (i + 0.5) * contact_height + gap);
            this.contacts.push(this.addChild(c));
            this.pin_lines.push(new Konva.Line({ points: [0, 0, 0, 0], stroke: 'black' }));
        }
        for (let i = 0; i < this.right_pins.length; i++) {
            const s = this.right_pins[i];
            const t = new Konva.Text({ text: s, fill: 'black', align: 'right', fontFamily: 'Monospace' });
            this.right_labels.push(t);
            this.shapes.add(t);
            if (s === "") continue;
            const c = new Contact(s, width + pin_length, (i + 0.5) * contact_height + gap);            
            this.contacts.push(this.addChild(c));
            this.pin_lines.push(new Konva.Line({ points: [0, 0, 0, 0], stroke: 'black' }));
        }
        for (const x of this.pin_lines) this.shapes.add(x);
        this.name = new Konva.Text({ text: spec.label, align: 'center', wrap: 'none' });
        this.shapes.add(this.name);
        this.updateLayout();
    }

    updateLayout() {
        super.updateLayout();
        let [x, y] = toScreen(this.x(), this.y());
        this.rect.x(x);
        this.rect.y(y);
        this.rect.height((Math.max(this.left_pins.length, this.right_pins.length) * contact_height + gap * 2) * scale());
        this.rect.width(width * scale());
        this.rect.stroke(this.mainColor());
        for (const a of this.left_labels) {
            a.fontSize(label_font_size * scale());
            a.width(contact_height * scale());
            a.fill(this.mainColor());
        }
        for (const a of this.right_labels) {
            a.fontSize(label_font_size * scale());
            a.width(contact_height * scale());
            a.fill(this.mainColor());
        }
        let j = 0;
        for (let i = 0; i < this.left_pins.length; i++) {
            this.left_labels[i].width(contact_label_width * scale());
            this.left_labels[i].x(x + gap * scale());
            this.left_labels[i].y(y + (gap + (i + 0.5) * contact_height - 0.5 * label_font_size) * scale());
            if (this.left_pins[i] === "") continue;
            const c = this.contacts[j];
            this.pin_lines[j].points([c.x() * scale(), c.y() * scale(), this.rect.x(), c.y() * scale()]);
            this.pin_lines[j].stroke(this.mainColor());
            j++;
        }
        for (let i = 0; i < this.right_pins.length; i++) {
            this.right_labels[i].width(contact_label_width * scale())
            this.right_labels[i].x(x + (width - gap - contact_label_width) * scale());
            this.right_labels[i].y(y + (gap + (i + 0.5) * contact_height - 0.5 * label_font_size) * scale());
            if (this.right_pins[i] === "") continue;
            const c = this.contacts[j];
            this.pin_lines[j].points([c.x() * scale(), c.y() * scale(), this.rect.x() + this.rect.width(), c.y() * scale()]);
            this.pin_lines[j].stroke(this.mainColor());
            j++;
        }
        this.name.x(x - pin_length * scale());
        this.name.y(y - (label_font_size * 2) * scale());
        this.name.width(this.rect.width() + 2 * pin_length * scale());
        this.name.fontSize(label_font_size * scale());
        this.name.fill(this.mainColor());
    }
    serialize(): any {
        let z: Spec = {
            id: this.id(),
            left_pins: this.left_pins,
            right_pins: this.right_pins,
            x: this.x(),
            y: this.y(),
            label: this.name.text(),
        }
        return {
            'typeMarker': 'IntegratedCircuitSchematic',
            'spec': z,
        }
    }
}