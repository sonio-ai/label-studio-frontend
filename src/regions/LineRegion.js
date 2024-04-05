import { getRoot, isAlive, types } from 'mobx-state-tree';
import React, { useContext } from 'react';
import { Line, Rect } from 'react-konva';
import { ImageViewContext } from '../components/ImageView/ImageViewContext';
import { LabelOnRect } from '../components/ImageView/LabelOnRegion';
import Constants from '../core/Constants';
import { guidGenerator } from '../core/Helpers';
import Registry from '../core/Registry';
import { useRegionStyles } from '../hooks/useRegionColor';
import { AreaMixin } from '../mixins/AreaMixin';
import { KonvaRegionMixin } from '../mixins/KonvaRegion';
import NormalizationMixin from '../mixins/Normalization';
import RegionsMixin from '../mixins/Regions';
import { ImageModel } from '../tags/object/Image';
import { rotateBboxCoords } from '../utils/bboxCoords';
import { FF_DEV_3793, isFF } from '../utils/feature-flags';
import { createDragBoundFunc } from '../utils/image';
import { AliveRegion } from './AliveRegion';
import { EditableRegion } from './EditableRegion';
import { RegionWrapper } from './RegionWrapper';
import { RELATIVE_STAGE_HEIGHT, RELATIVE_STAGE_WIDTH } from '../components/ImageView/Image';

/**
 * Line object for Bounding Box
 *
 */
const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: 'lineregion',
    object: types.late(() => types.reference(ImageModel)),

    x: types.number,
    y: types.number,

    width: types.number,
    height: types.number,

    rotation: 0,
    rotationAtCreation: 0,

    x2: types.number,
    y2: types.number,
  })
  .volatile(() => ({
    startX: 0,
    startY: 0,

    // @todo not used
    scaleX: 1,
    scaleY: 1,

    opacity: 1,

    fill: true,
    fillColor: '#ff8800', // Constants.FILL_COLOR,
    fillOpacity: 0.2,

    strokeColor: Constants.STROKE_COLOR,
    strokeWidth: Constants.STROKE_WIDTH,

    _supportsTransform: true,
    // depends on region and object tag; they both should correctly handle the `hidden` flag
    hideable: true,

    editableFields: [
      { property: 'x', label: 'X' },
      { property: 'y', label: 'Y' },
      { property: 'width', label: 'W' },
      { property: 'height', label: 'H' },
      { property: 'rotation', label: 'icon:angle' },
      { property: 'x2', label: 'X2' },
      { property: 'y2', label: 'Y2' },
    ],
  }))
  .volatile(() => {
    return {
      useTransformer: true,
      preferTransformer: true,
      supportsRotate: true,
      supportsScale: true,
    };
  })
  .views((self) => ({
    get store() {
      return getRoot(self);
    },
    get parent() {
      return isAlive(self) ? self.object : null;
    },
    get bboxCoords() {
      const bboxCoords = {
        left: self.x,
        top: self.y,
        right: self.x + self.width,
        bottom: self.y + self.height,
      };

      if (self.rotation === 0 || !self.parent) return bboxCoords;

      return rotateBboxCoords(bboxCoords, self.rotation, { x: self.x, y: self.y }, self.parent.whRatio);
    },
    get canvasX() {
      return isFF(FF_DEV_3793) ? self.parent?.internalToCanvasX(self.x) : self.x;
    },
    get canvasY() {
      return isFF(FF_DEV_3793) ? self.parent?.internalToCanvasY(self.y) : self.y;
    },
    get canvasWidth() {
      return isFF(FF_DEV_3793) ? self.parent?.internalToCanvasX(self.width) : self.width;
    },
    get canvasHeight() {
      return isFF(FF_DEV_3793) ? self.parent?.internalToCanvasY(self.height) : self.height;
    },
    get canvasX2() {
      return isFF(FF_DEV_3793) ? self.parent?.internalToCanvasX(self.x2) : self.x2;
    },
    get canvasY2() {
      return isFF(FF_DEV_3793) ? self.parent?.internalToCanvasY(self.y2) : self.y2;
    },
  }))
  .actions((self) => ({
    afterCreate() {
      self.startX = self.x;
      self.startY = self.y;
    },

    getDistanceBetweenPoints(pointA, pointB) {
      const { x: xA, y: yA } = pointA;
      const { x: xB, y: yB } = pointB;
      const distanceX = xA - xB;
      const distanceY = yA - yB;

      return Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
    },

    getHeightOnPerpendicular(pointA, pointB, cursor) {
      const dX = pointB.x - pointA.x;
      const dY = pointB.y - pointA.y;
      const s2 = Math.abs(dY * cursor.x - dX * cursor.y + pointB.x * pointA.y - pointB.y * pointA.x);
      const ab = Math.sqrt(dY * dY + dX * dX);

      return s2 / ab;
    },

    isAboveTheLine(a, b, c) {
      return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) < 0;
    },

    draw(x, y, points) {
      const oldHeight = self.height;
      const canvasX = self.parent.internalToCanvasX(x);
      const canvasY = self.parent.internalToCanvasY(y);

      console.log('draw', x, y, points);

      if (points.length === 1) {
        const canvasWidth = self.getDistanceBetweenPoints(
          { x: canvasX, y: canvasY },
          {
            x: self.canvasX,
            y: self.canvasY,
          },
        );

        self.width = self.parent.canvasToInternalX(canvasWidth);
        self.rotation = self.rotationAtCreation =
          Math.atan2(canvasY - self.canvasY, canvasX - self.canvasX) * (180 / Math.PI);
      } else if (points.length === 2) {
        const canvasPoints = points.map(({ x, y }) => ({
          x: self.parent.internalToCanvasX(x),
          y: self.parent.internalToCanvasY(y),
        }));
        const { y: firstPointY, x: firstPointX } = points[0];
        const { y: secondPointY, x: secondPointX } = points[1];

        self.x = firstPointX;
        self.y = firstPointY;
        self.rotation = self.rotationAtCreation;

        self.x2 = secondPointX;
        self.y2 = secondPointY;

        const canvasHeight = self.getHeightOnPerpendicular(canvasPoints[0], canvasPoints[1], {
          x: canvasX,
          y: canvasY,
        });

        self.height = self.parent.canvasToInternalY(canvasHeight);
      }
      self.setPositionInternal(self.x, self.y, self.width, self.height, self.rotation, self.x2, self.y2);

      const areaBBoxCoords = self?.bboxCoords;
      if (
        areaBBoxCoords?.left < 0 ||
        areaBBoxCoords?.top < 0 ||
        areaBBoxCoords?.right > RELATIVE_STAGE_WIDTH ||
        areaBBoxCoords?.bottom > RELATIVE_STAGE_HEIGHT
      ) {
        self.height = oldHeight;
      }
    },

    setPositionInternal(x, y, width, height, rotation, x2, y2) {
      self.x = x;
      self.y = y;
      self.width = width;
      self.height = height;
      self.x2 = x2;
      self.y2 = y2;
      self.rotation = (rotation + 360) % 360;
    },

    /**
     * Bounding Box set position on canvas
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} rotation
     */
    setPosition(x, y, width, height, rotation, x2, y2) {
      self.setPositionInternal(
        self.parent.canvasToInternalX(x),
        self.parent.canvasToInternalY(y),
        self.parent.canvasToInternalX(width),
        self.parent.canvasToInternalY(height),
        rotation,
        self.parent.canvasToInternalX(x2),
        self.parent.canvasToInternalY(y2),
      );
    },

    setScale(x, y) {
      self.scaleX = x;
      self.scaleY = y;
    },

    addState(state) {
      self.states.push(state);
    },

    setFill(color) {
      self.fill = color;
    },

    updateImageSize() {},

    /**
     * @example
     * {
     *   "original_width": 1920,
     *   "original_height": 1280,
     *   "image_rotation": 0,
     *   "value": {
     *     "x": 3.1,
     *     "y": 8.2,
     *     "width": 20,
     *     "height": 16,
     *     "rectanglelabels": ["Car"]
     *   }
     * }
     * @typedef {Object} LineRegionResult
     * @property {number} original_width width of the original image (px)
     * @property {number} original_height height of the original image (px)
     * @property {number} image_rotation rotation degree of the image (deg)
     * @property {Object} value
     * @property {number} value.x x coordinate of the top left corner before rotation (0-100)
     * @property {number} value.y y coordinate of the top left corner before rotation (0-100)
     * @property {number} value.x2 x coordinate of the top left corner before rotation (0-100)
     * @property {number} value.y2 y coordinate of the top left corner before rotation (0-100)
     * @property {number} value.width width of the bounding box (0-100)
     * @property {number} value.height height of the bounding box (0-100)
     * @property {number} value.rotation rotation degree of the bounding box (deg)
     */

    /**
     * @return {LineRegionResult}
     */
    serialize() {
      const value = {
        x: self.parent.stageWidth > 1 && !isFF(FF_DEV_3793) ? self.convertXToPerc(self.x) : self.x,
        y: self.parent.stageWidth > 1 && !isFF(FF_DEV_3793) ? self.convertYToPerc(self.y) : self.y,
        width: self.parent.stageWidth > 1 && !isFF(FF_DEV_3793) ? self.convertHDimensionToPerc(self.width) : self.width,
        height:
          self.parent.stageWidth > 1 && !isFF(FF_DEV_3793) ? self.convertVDimensionToPerc(self.height) : self.height,
        rotation: self.rotation,
        x2: self.parent.stageWidth > 1 && !isFF(FF_DEV_3793) ? self.convertXToPerc(self.x2) : self.x2,
        y2: self.parent.stageWidth > 1 && !isFF(FF_DEV_3793) ? self.convertYToPerc(self.y2) : self.y2,
      };

      return self.parent.createSerializedResult(self, value);
    },
  }));

const LineRegionModel = types.compose(
  'LineRegionModel',
  RegionsMixin,
  NormalizationMixin,
  AreaMixin,
  KonvaRegionMixin,
  EditableRegion,
  Model,
);

const HtxLineView = ({ item, setShapeRef }) => {
  const { store } = item;

  const { suggestion } = useContext(ImageViewContext) ?? {};
  const regionStyles = useRegionStyles(item, { suggestion });
  const stage = item.parent?.stageRef;

  const eventHandlers = {};

  console.log('HtxLineView', !suggestion && !item.isReadOnly());

  if (!item.parent) return null;
  if (!item.inViewPort) return null;

  if (!suggestion && !item.isReadOnly()) {
    eventHandlers.onTransform = ({ target }) => {
      // resetting the skew makes transformations weird but predictable
      target.setAttr('skewX', 0);
      target.setAttr('skewY', 0);
    };
    eventHandlers.onTransformEnd = (e) => {
      const t = e.target;
      const [x, y, x2, y2] = t.getAttr('points');

      item.setPosition(
        x * t.getAttr('scaleX'), 
        y * t.getAttr('scaleY'),
        t.getAttr('width') * t.getAttr('scaleX'),
        t.getAttr('height') * t.getAttr('scaleY'),
        t.getAttr('rotation'),
        x2 * t.getAttr('scaleX'),
        y2 * t.getAttr('scaleY'),
      );

      t.setAttr('scaleX', 1);
      t.setAttr('scaleY', 1);

      item.notifyDrawingFinished();
    };

    eventHandlers.onDragStart = (e) => {
      console.log('onDragStart');
      if (item.parent.getSkipInteractions()) {
        e.currentTarget.stopDrag(e.evt);
        return;
      }
      item.annotation.history.freeze(item.id);
    };

    eventHandlers.onDragEnd = (e) => {
      const t = e.target;
      const [x, y, x2, y2] = t.getAttr('points');

      item.setPosition(
        x, 
        y,
        t.getAttr('width'),
        t.getAttr('height'),
        t.getAttr('rotation'),
        x2,
        y2,
      );
      item.setScale(t.getAttr('scaleX'), t.getAttr('scaleY'));
      item.annotation.history.unfreeze(item.id);

      item.notifyDrawingFinished();
    };

    // not needed for the Line
    // eventHandlers.dragBoundFunc = createDragBoundFunc(item, {
    //   x: item.x - item.bboxCoords.left,
    //   y: item.y - item.bboxCoords.top,
    // });
  }
  const canvasX2 = item.canvasX2;
  const canvasY2 = item.canvasY2;

  console.log('points', [item.canvasX, item.canvasY, canvasX2, canvasY2]);

  return (
    <RegionWrapper item={item}>
      <Line
        points={[item.canvasX, item.canvasY, canvasX2, canvasY2]}
        ref={(node) => setShapeRef(node)}
        fill={'#FFFF00'}
        stroke={regionStyles.strokeColor}
        strokeWidth={regionStyles.strokeWidth}
        strokeScaleEnabled={false}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        shadowBlur={0}
        dash={suggestion ? [10, 10] : null}
        scaleX={item.scaleX}
        scaleY={item.scaleY}
        opacity={1}
        rotation={item.rotation}
        draggable={!item.isReadOnly()}
        name={`${item.id} _transformable`}
        {...eventHandlers}
        onMouseOver={() => {
          if (store.annotationStore.selected.relationMode) {
            item.setHighlight(true);
            stage.container().style.cursor = Constants.RELATION_MODE_CURSOR;
          } else {
            stage.container().style.cursor = Constants.POINTER_CURSOR;
          }
        }}
        onMouseOut={() => {
          stage.container().style.cursor = Constants.DEFAULT_CURSOR;

          if (store.annotationStore.selected.relationMode) {
            item.setHighlight(false);
          }
        }}
        onClick={(e) => {
          if (item.parent.getSkipInteractions()) return;
          if (store.annotationStore.selected.relationMode) {
            stage.container().style.cursor = Constants.DEFAULT_CURSOR;
          }

          item.setHighlight(false);
          item.onClickRegion(e);
        }}
        listening={!suggestion && !item.annotation?.isDrawing}
      />
    </RegionWrapper>
  );
};

const HtxLine = AliveRegion(HtxLineView);

Registry.addTag('lineregion', LineRegionModel, HtxLine);
Registry.addRegionType(LineRegionModel, 'image', (value) => {
  console.log('--------------------------------------------', value);
  return typeof value.x2 !== 'undefined';
  // return value;
});

export { LineRegionModel, HtxLine };
