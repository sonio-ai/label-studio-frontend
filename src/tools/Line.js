import { types } from 'mobx-state-tree';

import BaseTool, { DEFAULT_DIMENSIONS } from './Base';
import ToolMixin from '../mixins/Tool';
import { LineDrawingTool } from '../mixins/DrawingTool';
import { NodeViews } from '../components/Node/Node';
import { FF_DEV_3793, isFF } from '../utils/feature-flags';

const _BaseNPointTool = types
  .model('BaseNTool', {
    group: 'segmentation',
    smart: true,
    shortcut: 'L',
  })
  .views((self) => {
    const Super = {
      createRegionOptions: self.createRegionOptions,
      isIncorrectControl: self.isIncorrectControl,
      isIncorrectLabel: self.isIncorrectLabel,
    };

    return {
      get getActivePolygon() {
        const poly = self.currentArea;

        if (poly && poly.closed) return null;
        if (poly === undefined) return null;
        if (poly && poly.type !== 'lineregion') return null;

        return poly;
      },

      get tagTypes() {
        return {
          stateTypes: [],
          controlTagTypes: ['line'],
        };
      },
      get defaultDimensions() {
        return DEFAULT_DIMENSIONS.line;
      },
      createRegionOptions({ x, y }) {
        return Super.createRegionOptions({
          x,
          y,
          height: isFF(FF_DEV_3793) ? self.obj.canvasToInternalY(1) : 1,
          width: isFF(FF_DEV_3793) ? self.obj.canvasToInternalX(1) : 1,
          x2: 0,
          y2: 0,
        });
      },
      isIncorrectControl() {
        return Super.isIncorrectControl() && self.current() === null;
      },
      isIncorrectLabel() {
        return !self.current() && Super.isIncorrectLabel();
      },
      canStart() {
        return self.current() === null && !self.annotation.isReadOnly();
      },
      current() {
        return self.getActivePolygon;
      },
    };
  })
  .actions((self) => ({
    beforeCommitDrawing() {
      return true;
    },
  }));

const _Tool = types
  .model('LineTool', {
    shortcut: 'L',
  })
  .views((self) => ({
    get viewTooltip() {
      return 'Line';
    },
    get iconComponent() {
      return self.dynamic ? NodeViews.LineRegionModel.altIcon : NodeViews.LineRegionModel.icon;
    },
  }));

const Line = types.compose(_Tool.name, ToolMixin, BaseTool, LineDrawingTool, _BaseNPointTool, _Tool);

export { Line };
