import Konva from 'konva';

// first we need to create a stage
var stage = new Konva.Stage({
    container: 'container',   // id of container <div>
    width: 500,
    height: 500
  });
  
  // then create layer
  var layer = new Konva.Layer();
  
  // create our shape
  var circle = new Konva.Circle({
    x: stage.width() / 2,
    y: stage.height() / 2,
    radius: 70,
    fill: 'blue',
    stroke: 'black',
    strokeWidth: 4
  });
  
  // add the shape to the layer
  layer.add(circle);
  
  // add the layer to the stage
  stage.add(layer);

  var drawing_line = false;
  let line: Konva.Line | null = null;

  function alignToGrid(x: number, y: number) {
    const g = 20;
    x = Math.round(x / g) * g;
    y = Math.round(y / g) * g;
    return [x, y];
  }

  stage.on('mousemove', function() {    
    if (line == null) return;
    const mousePos = stage.getPointerPosition();
    if (mousePos == null) return;
    var pp = line.points();
    console.log('mousemove', mousePos, pp);
    const [x, y] = alignToGrid(mousePos.x, mousePos.y);
    line.points([pp[0], pp[1], x, y]);
    layer.draw();
  });

  stage.on('mousedown', function() {
    if (line == null) {
      console.log('add line');
      var mousePos = stage.getPointerPosition();
      if (mousePos == null) return;
      line = new Konva.Line({
        points: alignToGrid(mousePos.x, mousePos.y),
        stroke: 'red',
        strokeWidth: 1,
        lineCap: 'round',
        lineJoin: 'round',
      });
      layer.add(line);
   } else {
     line = null;
   }
  });
  
  layer.draw();