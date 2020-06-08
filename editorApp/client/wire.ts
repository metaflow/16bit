import Konva from 'konva';

export class Wire {
    ends: Konva.Circle[];
    line: Konva.Line;
  
    constructor(x1: number, y1: number, x2: number, y2: number) {
      this.ends = [];
      this.ends.push(new Konva.Circle({
        x: x1,
        y: y1,
        radius: 4,
        fill: 'green'
      }));
      this.ends.push(new Konva.Circle({
        x: x2,
        y: y2,
        radius: 4,
        fill: 'red'
      }));
      this.line = new Konva.Line({
        points: [x1, y1, x2, y2],
        stroke: 'blue',
        strokeWidth: 3,
        lineCap: 'round',
        lineJoin: 'round',
      });
    }
  
    add(layer: Konva.Layer) {
      layer.add(this.line);
      for (const c of this.ends) layer.add(c);
    }
  
    remove(layer: Konva.Layer) {
      this.line.remove();
      for (const c of this.ends) c.remove();
    }
  
    end(i: number, x?: number, y?: number): [number, number] {
      if (x == null) {
        x = this.ends[i].x();            
      }
      if (y == null) {
        y = this.ends[i].y();
      }
      this.ends[i].x(x);
      this.ends[i].y(y);
      const pp = this.line.points();
      pp[i*2] = x;
      pp[i*2 + 1] = y;
      this.line.points(pp);
      return [x, y];
    }
  }