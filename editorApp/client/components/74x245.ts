import { IntegratedCircuitSchematic } from "./IC_schematic";
import { componentDeserializers } from "./component";

componentDeserializers.push(function (data: any): (IntegratedCircuitSchematic | null) {
    if (data['typeMarker'] !== 'ic74x245') {
        return null
    }
    return new ic74x245(data['spec'] as Spec);
});

interface Spec {
    id: string, x: number, y: number;
}

export class ic74x245 extends IntegratedCircuitSchematic {
    constructor(spec: Spec) {
        super({ 
            id: spec.id,
            x: spec.x,
            y: spec.y,
            left_pins: ["DIR", "OE", "", "A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"], 
            right_pins: ["", "", "",  "B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
            label: "74x245" })
    }
    serialize(): any {
        const z: Spec = {
            id: this.id(),
            x: this.x(),
            y: this.y(),
        };
        return {
            'typeMarker': 'ic74x245',
            'spec': z,
        }
    }
}