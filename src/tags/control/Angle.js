import { types } from 'mobx-state-tree';

import Registry from '../../core/Registry';
import { Hotkey } from '../../core/Hotkey';
import ControlBase from './Base';
import { customTypes } from '../../core/CustomTypes';
import Types from '../../core/Types';
import { AnnotationMixin } from '../../mixins/AnnotationMixin';
import SeparatedControlMixin from '../../mixins/SeparatedControlMixin';
import { ToolManagerMixin } from '../../mixins/ToolManagerMixin';
import { FF_DEV_2576, isFF } from '../../utils/feature-flags';


const hotkeys = Hotkey('Angles');

/**
 * The `Angle` tag is used to add angles to an image without selecting a label. This can be useful when you have only one label to assign to the angle. Use for image segmentation tasks.
 *
 * Use with the following data types: image.
 * @example
 * <!--Basic labeling configuration for angleal image segmentation -->
 * <View>
 *   <Angle name="rect-1" toName="img-1" />
 *   <Image name="img-1" value="$img" />
 * </View>
 * @name Angle
 * @meta_title Angle Tag for Adding Angles to Images
 * @meta_description Customize Label Studio with the Angle tag by adding angles to images for segmentation machine learning and data science projects.
 * @param {string} name                           - Name of tag
 * @param {string} toname                         - Name of image to label
 * @param {number} [opacity=0.6]                  - Opacity of angle
 * @param {string} [fillColor=transparent]        - Angle fill color in hexadecimal or HTML color name
 * @param {string} [strokeColor=#f48a42]          - Stroke color in hexadecimal
 * @param {number} [strokeWidth=3]                - Width of stroke
 * @param {small|medium|large} [pointSize=small]  - Size of angle handle points
 * @param {rectangle|circle} [pointStyle=circle]  - Style of points
 * @param {boolean} [smart]                       - Show smart tool for interactive pre-annotations
 * @param {boolean} [smartOnly]                   - Only show smart tool for interactive pre-annotations
 * @param {pixel|none} [snap=none]                - Snap angle to image pixels
 */
const TagAttrs = types.model({
  toname: types.maybeNull(types.string),

  opacity: types.optional(customTypes.range(), '0.2'),
  fillcolor: types.optional(customTypes.color, '#f48a42'),

  strokewidth: types.optional(types.string, '2'),
  strokecolor: types.optional(customTypes.color, '#f48a42'),

  snap: types.optional(types.string, 'none'),

  pointsize: types.optional(types.string, 'small'),
  pointstyle: types.optional(types.string, 'circle'),
});

const Validation = types.model({
  controlledTags: Types.unionTag(['Image']),
});

const Model = types
  .model({
    type: 'angle',

    // regions: types.array(RectRegionModel),
    _value: types.optional(types.string, ''),
  })
  .volatile(() => ({
    toolNames: ['Angle'],
  }))
  .actions(self => {
    return {
      initializeHotkeys() {
        if (isFF(FF_DEV_2576)) {
          hotkeys.addNamed('angle:undo', () => {
            if (self.annotation.isDrawing) self.annotation.undo();
          });
          hotkeys.addNamed('angle:redo', () => {
            if (self.annotation.isDrawing) self.annotation.redo();
          });
        }
      },

      disposeHotkeys() {
        if (isFF(FF_DEV_2576)) {
          hotkeys.removeNamed('angle:undo');
          hotkeys.removeNamed('angle:redo');
        }
      },

      afterCreate() {
        self.initializeHotkeys();
      },

      beforeDestroy() {
        self.disposeHotkeys();
      },
    };
  });

const AngleModel = types.compose(
  'AngleModel',
  ControlBase,
  AnnotationMixin,
  SeparatedControlMixin,
  TagAttrs,
  Validation,
  ToolManagerMixin,
  Model,
);

const HtxView = () => null;

Registry.addTag('angle', AngleModel, HtxView);

export { HtxView, AngleModel };
