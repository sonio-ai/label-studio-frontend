import React from 'react';
import { observer } from 'mobx-react';
import { types } from 'mobx-state-tree';

import LabelMixin from '../../mixins/LabelMixin';
import Registry from '../../core/Registry';
import SelectedModelMixin from '../../mixins/SelectedModel';
import Types from '../../core/Types';
import { HtxLabels, LabelsModel } from './Labels/Labels';
import { AngleModel } from './Angle';
import ControlBase from './Base';

/**
 * The `AngleLabels` tag is used to create labeled angles. Use to apply labels to angles in semantic segmentation tasks.
 *
 * Use with the following data types: image.
 * @example
 * <!--Basic labeling configuration for angleal semantic segmentation of images -->
 * <View>
 *   <Image name="image" value="$image" />
 *   <AngleLabels name="labels" toName="image">
 *     <Label value="Car" />
 *     <Label value="Sign" />
 *   </AngleLabels>
 * </View>
 * @name AngleLabels
 * @regions AngleRegion
 * @meta_title Angle Label Tag for Labeling Angles in Images
 * @meta_description Customize Label Studio with the AngleLabels tag and label angles in images for semantic segmentation machine learning and data science projects.
 * @param {string} name                             - Name of tag
 * @param {string} toName                           - Name of image to label
 * @param {single|multiple=} [choice=single]        - Configure whether you can select one or multiple labels
 * @param {number} [maxUsages]                      - Maximum number of times a label can be used per task
 * @param {boolean} [showInline=true]               - Show labels in the same visual line
 * @param {number} [opacity=0.2]                    - Opacity of angle
 * @param {string} [fillColor]                      - Angle fill color in hexadecimal
 * @param {string} [strokeColor]                    - Stroke color in hexadecimal
 * @param {number} [strokeWidth=1]                  - Width of stroke
 * @param {small|medium|large} [pointSize=medium]   - Size of angle handle points
 * @param {rectangle|circle} [pointStyle=rectangle] - Style of points
 * @param {pixel|none} [snap=none]                  - Snap angle to image pixels
 */

const Validation = types.model({
  controlledTags: Types.unionTag(['Image']),
});

const ModelAttrs = types.model('AngleLabelsModel', {
  type: 'anglelabels',
  children: Types.unionArray(['label', 'header', 'view', 'hypertext']),
});

const Composition = types.compose(
  ControlBase,
  LabelsModel,
  ModelAttrs,
  AngleModel,
  Validation,
  LabelMixin,
  SelectedModelMixin.props({ _child: 'LabelModel' }),
);

const AngleLabelsModel = types.compose('AngleLabelsModel', Composition);

const HtxAngleLabels = observer(({ item }) => {
  return <HtxLabels item={item} />;
});

Registry.addTag('anglelabels', AngleLabelsModel, HtxAngleLabels);

export { HtxAngleLabels, AngleLabelsModel };
