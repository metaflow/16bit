import Konva from 'konva';

let _stage: Konva.Stage|null = null;

export function stage(s?: Konva.Stage): Konva.Stage|null {
    if (s !== undefined) _stage = s;
    return _stage;
}