import { types } from 'mobx-state-tree';

import { AudioRegionModel } from './AudioRegion';
import { BrushRegionModel, HtxBrush } from './BrushRegion';
import { ParagraphsRegionModel } from './ParagraphsRegion';
import { TimeSeriesRegionModel } from './TimeSeriesRegion';
import { HtxKeyPoint, KeyPointRegionModel } from './KeyPointRegion';
import { PolygonPoint, PolygonPointView } from './PolygonPoint';
import { AnglePoint, AnglePointView } from './AnglePoint';
import { HtxPolygon, PolygonRegionModel } from './PolygonRegion';
import { HtxRectangle, RectRegionModel } from './RectRegion';
import { EllipseRegionModel, HtxEllipse } from './EllipseRegion';
import { HtxTextAreaRegion, TextAreaRegionModel } from './TextAreaRegion';
import { RichTextRegionModel } from './RichTextRegion';
import { VideoRectangleRegionModel } from './VideoRectangleRegion';
import { HtxLine, LineRegionModel } from './LineRegion';
import { HtxAngle, AngleRegionModel } from './AngleRegion';

const AllRegionsType = types.union(
  AudioRegionModel,
  BrushRegionModel,
  EllipseRegionModel,
  LineRegionModel,
  AngleRegionModel,
  TimeSeriesRegionModel,
  KeyPointRegionModel,
  PolygonRegionModel,
  RectRegionModel,
  TextAreaRegionModel,
  RichTextRegionModel,
  TimeSeriesRegionModel,
  ParagraphsRegionModel,
  VideoRectangleRegionModel,
);

export {
  AllRegionsType,
  AudioRegionModel,
  BrushRegionModel,
  EllipseRegionModel,
  LineRegionModel,
  AnglePoint,
  AnglePointView,
  AngleRegionModel,
  HtxBrush,
  HtxEllipse,
  HtxKeyPoint,
  HtxPolygon,
  HtxRectangle,
  HtxLine,
  HtxAngle,
  HtxTextAreaRegion,
  RichTextRegionModel,
  ParagraphsRegionModel,
  TimeSeriesRegionModel,
  KeyPointRegionModel,
  PolygonPoint,
  PolygonPointView,
  PolygonRegionModel,
  RectRegionModel,
  TextAreaRegionModel,
  VideoRectangleRegionModel,
};
