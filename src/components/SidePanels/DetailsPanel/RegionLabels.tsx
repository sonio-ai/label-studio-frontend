import { FC } from 'react';
import { observer } from 'mobx-react';

import { Block } from '../../../utils/bem';

export const RegionLabels: FC<{region: LSFRegion}> = observer(({ region }) => {
  const labelsInResults = region.labelings
    .map((result: any) => result.selectedLabels || []);
  const labels: any[] = [].concat(...labelsInResults);

  return (
    <Block name="labels-list">
      {!labels.length ? (
        !!region?.sonioAngle ? (
          <>
            {Math.round(region?.sonioAngle?.toFixed(1) * 10) / 10}
            deg
          </>
        ) : (
          <>
            {Math.round(region?.sonioDistance?.toFixed(1) * 10) / 10}
            mm
          </>
        )
      ) : (
        labels.map((label, index) => {
          const color = label.background || '#000000';
  
          return [
            index ? ', ' : null,
            <span key={label.id} style={{ color }}>
              {label.value}
            </span>,
          ];
        })
      )}
    </Block>
  );
});
