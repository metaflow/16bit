import Konva from 'konva';
import hotkeys from 'hotkeys-js';
import { Wire } from './wire';
import {appActions} from './action';
import {AddWireAction} from './add_wire_action';
import {stage} from './stage';

// first we need to create a stage
stage(new Konva.Stage({
  container: 'container',   // id of container <div>
  width: 500,
  height: 500
}));

// then create layer
var layer = new Konva.Layer();
stage()?.add(layer);

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
  console.log('stage', mousePos, 'event', e.evt);  
  if (appActions.current() == null) {
    appActions.current(new AddWireAction(layer));
  }
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