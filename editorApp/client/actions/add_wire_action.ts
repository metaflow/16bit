import Konva from 'konva';
import { ContactWire } from '../components/wire';
import { Action, actionDeserializers } from '../action';
import { stage, toPhysical, closesetContact, toScreen, actionLayer, defaultLayer } from '../stage';
import { Contact } from '../components/contact';
import { address, getByAddress, addAddressRoot, removeAddressRoot, newAddress } from '../address';

export class AddContactWireAction implements Action {
    actionType = "AddContactWireAction";
    wire: ContactWire | null = null;
    line: Konva.Line;
    c1: Contact;
    c2: Contact | null = null;

    constructor(contact: Contact) {
        this.c1 = contact;
        const xy = toScreen(contact.x(), contact.y());
        this.line = new Konva.Line({
            points: [xy[0], xy[1], xy[0], xy[1]],
            stroke: 'red',
            strokeWidth: 3,
            lineCap: 'round',
            lineJoin: 'round',
        });
        actionLayer()?.add(this.line);
    }
    mouseup(event: import("konva/types/Node").KonvaEventObject<MouseEvent>): boolean {
        return false;
    }
    apply() {
        if (this.wire == null) return;
        this.wire.add(defaultLayer());
    }

    undo() {
        if (this.wire == null) return;
        this.wire.remove();
    }

    mousemove(event: Konva.KonvaEventObject<MouseEvent>): boolean {
        let c2 = closesetContact();
        if (c2 == null) return false;
        const xy = toScreen(c2.x(), c2.y());
        const pp = this.line.points();
        pp[2] = xy[0];
        pp[3] = xy[1];
        this.line.points(pp);
        return false;
    }

    complete(c2: Contact) {
        this.c2 = c2;
        this.wire = new ContactWire(newAddress(), this.c1, c2);
        this.wire.add(defaultLayer());
        this.line.remove();
        addAddressRoot(this.wire);
    }

    mousedown(event: Konva.KonvaEventObject<MouseEvent>): boolean {
        let c2 = closesetContact();
        if (c2 == null) return false;
        this.complete(c2);
        return true;
    }

    cancel(): void {
        if (this.wire == null) return;
        this.wire.remove();
        removeAddressRoot(this.wire.id());
    }
    serialize(): any {
        return {
            'typeMarker': 'AddContactWireAction',
            'spec': {
                'contact_1': address(this.c1),
                'contact_2': address(this.c2),
                'wire_id': this.wire?.id(),
            }
        }
    }
}

actionDeserializers.push(function (data: any): Action | null {
    if (data['typeMarker'] != 'AddContactWireAction') return null;
    const spec = data['spec'];
    let c1 = getByAddress(spec['contact_1']);
    if (c1 == null) return null;
    if (!(c1 instanceof Contact)) throw new Error(`${spec['contact_1']} is not a contact`);
    let c2 = getByAddress(spec['contact_2']);
    if (c2 == null) return null;
    if (!(c2 instanceof Contact)) throw new Error(`${spec['contact_1']} is not a contact`);
    const z = new AddContactWireAction(c1);
    z.complete(c2);
    return z;
});