import Konva from 'konva';
import hotkeys from 'hotkeys-js';
import { appActions } from './action';
import { stage, defaultLayer, actionLayer, gridAlignment } from './stage';
import { newAddress } from './address';
import { SelectAction } from './actions/select_action';
import { ic74x245 } from './components/74x245';
import { PlaceComponentAction } from './actions/add_ic_action';
import { AddOrthogonalWireAction } from './actions/add_orthogonal_wire';

(window as any).add245 = function () {
  console.log('add 245');
  appActions.current(new PlaceComponentAction(new ic74x245({ id: newAddress(), x: 0, y: 0})));
};

(window as any).clearActionsHistory = function () {
  localStorage.setItem('actions_history', JSON.stringify([]));
};

(window as any).addOrthogonal = function() {
  appActions.current(new AddOrthogonalWireAction());
};

(window as any).toolSelect = function() {
  appActions.current(new SelectAction());
};


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
    actionLayer()?.batchDraw();
    defaultLayer()?.batchDraw();
    return;
  }
});

stage()?.on('mousedown', function (e) {
  if (appActions.onMouseDown(e)) {
    defaultLayer()?.batchDraw();
    actionLayer()?.batchDraw();
    return;
  }
});

stage()?.on('mouseup', function (e) {
  if (appActions.onMouseUp(e)) {
    defaultLayer()?.batchDraw();
    actionLayer()?.batchDraw();
    return;
  }
});

hotkeys('esc', function (e) {
  e.preventDefault();
  appActions.cancelCurrent();
  defaultLayer()?.batchDraw();
  actionLayer()?.batchDraw();
});

hotkeys('ctrl+z', function (e) {
  e.preventDefault();
  appActions.undo();
  defaultLayer()?.batchDraw();
  actionLayer()?.batchDraw();
});

hotkeys('ctrl+shift+z', function (e) {
  e.preventDefault();
  appActions.redo();
  defaultLayer()?.batchDraw();
  actionLayer()?.batchDraw();
});

gridAlignment(5); // TODO: make grid algnment change an action.
appActions.load();
defaultLayer()?.batchDraw();
actionLayer()?.batchDraw();

