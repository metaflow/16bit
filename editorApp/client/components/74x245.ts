import { IntegratedCircuitSchematic } from "./IC_schematic";
import Konva from "konva";


export class ic74x245 extends IntegratedCircuitSchematic {
    constructor(id: string, x: number, y: number, layer: Konva.Layer|null) {
        super({ 
            id,
            left_pins: ["DIR", "OE", "", "A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"], 
            right_pins: ["", "", "",  "B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
            x, y, layer,
            label: "74x245" })
    }
}