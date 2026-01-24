/**
 * CausalEdge - Floating edge that connects to circle borders
 * Displays polarity indicator (+/-) on the edge
 */

import { memo, useMemo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useInternalNode,
  type EdgeProps,
} from '@xyflow/react';
import { getFloatingEdgeParams } from '../utils/floatingEdge';
import styles from './CausalEdge.module.css';

/**
 * Polarity types for causal relationships
 */
export type CausalPolarity = 'positive' | 'negative' | 'unknown';

/**
 * Data structure for CausalEdge
 */
export interface CausalEdgeData {
  polarity: CausalPolarity;
}

/**
 * Get display label for polarity
 */
function getPolarityLabel(polarity: CausalPolarity): string {
  switch (polarity) {
    case 'positive':
      return '+';
    case 'negative':
      return '−'; // Using proper minus sign
    default:
      return '?';
  }
}

/**
 * Get CSS class for polarity styling
 */
function getPolarityClassName(polarity: CausalPolarity): string {
  switch (polarity) {
    case 'positive':
      return styles.positive;
    case 'negative':
      return styles.negative;
    default:
      return styles.unknown;
  }
}

/**
 * Custom floating edge component for CLD connections
 * - Connects to circle borders (not fixed handles)
 * - Curved bezier path
 * - Arrow marker at end
 * - Polarity indicator (+/-) at midpoint
 */
export const CausalEdge = memo(function CausalEdge({
  id,
  source,
  target,
  data,
  selected,
  markerEnd,
}: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  
  const edgeData = (data ?? { polarity: 'unknown' }) as unknown as CausalEdgeData;
  
  // Calculate floating edge path
  const { sx, sy, tx, ty, sourcePos, targetPos } = useMemo(() => {
    if (!sourceNode || !targetNode) {
      return { sx: 0, sy: 0, tx: 0, ty: 0, sourcePos: undefined, targetPos: undefined };
    }
    return getFloatingEdgeParams(sourceNode, targetNode);
  }, [sourceNode, targetNode]);
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
  });

  if (!sourceNode || !targetNode) {
    return null;
  }

  const polarityLabel = getPolarityLabel(edgeData.polarity);
  const polarityClassName = getPolarityClassName(edgeData.polarity);

  const labelClassName = [
    styles.label,
    polarityClassName,
    selected && styles.labelSelected,
  ].filter(Boolean).join(' ');

  // Use inline styles for SVG path since CSS modules don't work well with SVG
  const edgeStyle = {
    stroke: selected ? '#339af0' : '#868e96',
    strokeWidth: selected ? 3 : 2,
    fill: 'none',
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
      />
      <EdgeLabelRenderer>
        <div
          className={labelClassName}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          onClick={(e) => {
            e.stopPropagation();
            // Dispatch event to toggle polarity
            window.dispatchEvent(new CustomEvent('edge-polarity-toggle', {
              detail: { id }
            }));
          }}
          title="Click to change polarity"
        >
          {polarityLabel}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

export default CausalEdge;
