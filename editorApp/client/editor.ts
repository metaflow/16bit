import Konva from 'konva';
import hotkeys from 'hotkeys-js';
import { appActions } from './action';
import { stage, defaultLayer, actionLayer } from './stage';
import { Breadboard } from './components/breadboard';
import { addAddressRoot, newAddress } from './address';
import { SelectAction } from './actions/select_action';
import { IntegratedCircuit } from './components/integrated_circuit';
import { IntegratedCircuitSchematic } from './components/IC_schematic';
import { ic74x245 } from './components/74x245';
import { PlaceComponentAction } from './actions/add_ic_action';
import { Contact } from './components/contact';

// first we need to create a stage
stage(new Konva.Stage({
  container: 'container',   // id of container <div>
  width: 1000,
  height: 1000
}));

// then create layer
stage()?.add(defaultLayer(new Konva.Layer()));
stage()?.add(actionLayer(new Konva.Layer()));
// Background color.
defaultLayer()?.add(new Konva.Rect({
  x: 0, y: 0, width: 1000, height: 1000, fill: '#FAFAFA',
}))

stage()?.on('mousemove', function (e: Konva.KonvaEventObject<MouseEvent>) {
  if (appActions.onMouseMove(e)) {
    // TODO: do this draws in component?
    actionLayer()?.batchDraw();
    return;
  }
});

stage()?.on('mousedown', function (e) {
  if (appActions.onMouseDown(e)) {
    defaultLayer()?.batchDraw();
    actionLayer()?.batchDraw();
    return;
  }
  appActions.current(new SelectAction());
});

stage()?.on('mouseup', function (e) {
  if (appActions.onMouseUp(e)) {
    defaultLayer()?.batchDraw();
    actionLayer()?.batchDraw();
    return;
  }
});

hotkeys('esc', function (e) {
  console.log('esc');
  e.preventDefault();
  appActions.cancelCurrent();
  defaultLayer()?.batchDraw();
  actionLayer()?.batchDraw();
});

hotkeys('ctrl+z', function (e) {
  console.log('ctrl+z');
  e.preventDefault();
  appActions.undo();
  defaultLayer()?.batchDraw();
  actionLayer()?.batchDraw();
});

hotkeys('ctrl+shift+z', function (e) {
  console.log('ctrl+shift+z');
  e.preventDefault();
  appActions.redo();
  defaultLayer()?.batchDraw();
  actionLayer()?.batchDraw();
});

let bb = new Breadboard('bb1', 10, 10);
bb.add(defaultLayer());
addAddressRoot(bb);

let ic = new IntegratedCircuit({
  id: "ic",
  x: 5,
  y: 100,
  layer: defaultLayer(),
  pins: ['a', 'b', 'c', 'd', 'e', 'f', 'a', 'b', 'c', 'd', 'e', 'f'],
  label: '74AHTC155',
});
ic.add(defaultLayer());
addAddressRoot(ic);

let ic2 = new ic74x245({ id: "ic2", x: 50, y: 100 });
ic2.add(defaultLayer());
addAddressRoot(ic2);

appActions.load();
defaultLayer()?.batchDraw();
actionLayer()?.batchDraw();

(window as any).add245 = function () {
  console.log('add 245');
  appActions.current(new PlaceComponentAction(new ic74x245({ id: newAddress(), x: 0, y: 0})));
}