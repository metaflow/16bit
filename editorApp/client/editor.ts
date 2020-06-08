import Konva from 'konva';
import hotkeys from 'hotkeys-js';
import { Wire, ContactWire } from './wire';
import {appActions} from './action';
import {AddWireAction} from './add_wire_action';
import {stage, addBreadboard} from './stage';
import { Breadboard } from './breadboard';

// first we need to create a stage
stage(new Konva.Stage({
  container: 'container',   // id of container <div>
  width: 1000,
  height: 1000
}));

// then create layer
var layer = new Konva.Layer();
stage()?.add(layer);
layer.add(new Konva.Rect({
  x: 0, y: 0, width: 1000, height: 1000, fill: '#FAFAFA',
}))
layer.draw();

function alignToGrid(x: number, y: number) {
  const g = 20;
  x = Math.round(x / g) * g;
  y = Math.round(y / g) * g;
  return [x, y];
}

stage()?.on('mousemove', function (e: Konva.KonvaEventObject<MouseEvent>) {
  if (appActions.onMouseMove(e)) layer.draw();
});

stage()?.on('mousedown', function(e) {
  const mousePos = stage()?.getPointerPosition();
  if (mousePos == null) return false;
  if (appActions.onMouseDown(e)) {
    layer.draw();
 }
}); 

hotkeys('esc', function(e) {  
  console.log('esc');
  e.preventDefault();
  appActions.cancelCurrent();
  layer.draw();
});

hotkeys('ctrl+z', function(e) {
  console.log('ctrl+z');
  e.preventDefault();
  appActions.undo();  
  layer.draw();
});

hotkeys('ctrl+shift+z', function(e) {
  console.log('ctrl+shift+z');
  e.preventDefault();
  appActions.redo();
  layer.draw();
});

let bb = new Breadboard(layer, 10, 10);
bb.add(layer);
addBreadboard(bb);

layer.draw();