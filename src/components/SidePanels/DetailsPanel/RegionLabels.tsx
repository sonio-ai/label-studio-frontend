import { FC, useContext } from 'react';
import { observer } from 'mobx-react';

import { Block } from '../../../utils/bem';

export const RegionLabels: FC<{region: LSFRegion}> = observer(({ region }) => {
  const labelsInResults = region.labelings
    .map((result: any) => result.selectedLabels || []);
  const labels: any[] = [].concat(...labelsInResults);
  
  if (!labels.length) return <Block name="labels-list">{region?.sonioDistance.toFixed(1)} mm</Block>;

  return (
    <Block name="labels-list">
      {labels.map((label, index) => {
        const color = label.background || '#000000';

        return [
          index ? ', ' : null,
          <span key={label.id} style={{ color }}>
            {label.value}
          </span>,
        ];
      })}
    </Block>
  );
});
