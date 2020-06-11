import Konva from 'konva';
import hotkeys from 'hotkeys-js';
import { appActions } from './action';
import { stage } from './stage';
import { Breadboard } from './components/breadboard';
import { addAddressRoot } from './address';
import { SelectAction } from './actions/select_action';
import { IntegratedCircuit } from './components/integrated_circuit';

// first we need to create a stage
stage(new Konva.Stage({
  container: 'container',   // id of container <div>
  width: 1000,
  height: 1000
}));

// then create layer
var layer = new Konva.Layer();
stage()?.add(layer);
// Background color.
layer.add(new Konva.Rect({
  x: 0, y: 0, width: 1000, height: 1000, fill: '#FAFAFA',
}))

stage()?.on('mousemove', function (e: Konva.KonvaEventObject<MouseEvent>) {
  if (appActions.onMouseMove(e)) layer.draw();
});

stage()?.on('mousedown', function (e) {
  if (appActions.onMouseDown(e)) {
    layer.draw();
    return;
  }
  appActions.current(new SelectAction(layer));
});

stage()?.on('mouseup', function (e) {
  if (appActions.onMouseUp(e)) {
    layer.draw();
    return;
  }
});

hotkeys('esc', function (e) {
  console.log('esc');
  e.preventDefault();
  appActions.cancelCurrent();
  layer.draw();
});

hotkeys('ctrl+z', function (e) {
  console.log('ctrl+z');
  e.preventDefault();
  appActions.undo();
  layer.draw();
});

hotkeys('ctrl+shift+z', function (e) {
  console.log('ctrl+shift+z');
  e.preventDefault();
  appActions.redo();
  layer.draw();
});

let bb = new Breadboard('bb1', layer, 10, 10);
bb.add(layer);
addAddressRoot(bb);

let ic = new IntegratedCircuit({
  id: "ic",
  x: 5,
  y: 100,
  layer,
  pins: ['a', 'b', 'c', 'd', 'e', 'f', 'a', 'b', 'c', 'd', 'e', 'f'],
  label: '74AHTC155',
})

appActions.load(layer);

layer.draw();