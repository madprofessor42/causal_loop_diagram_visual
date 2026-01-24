/**
 * FloatingConnectionLine - Visual feedback while drawing a connection
 */

import { memo } from 'react';
import { getBezierPath, type ConnectionLineComponentProps } from '@xyflow/react';

/**
 * Custom connection line that follows the cursor while connecting
 */
export const FloatingConnectionLine = memo(function FloatingConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
}: ConnectionLineComponentProps) {
  const [path] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  });

  return (
    <g>
      <path
        fill="none"
        stroke="#339af0"
        strokeWidth={2}
        d={path}
        strokeDasharray="5,5"
      />
      <circle
        cx={toX}
        cy={toY}
        r={5}
        fill="#339af0"
        stroke="#fff"
        strokeWidth={1.5}
      />
    </g>
  );
});

export default FloatingConnectionLine;
