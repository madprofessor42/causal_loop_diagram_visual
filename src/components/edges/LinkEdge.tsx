import { useStore, type EdgeProps } from '@xyflow/react';
import { useSelector } from 'react-redux';
import { getStraightEdgeParams } from '../../utils/edge';
import type { LinkEdgeData, CLDEdge } from '../../types';
import {
  ARROW_SIZE,
  LINK_EDGE,
} from '../../constants';
import { selectHighlightedLoop } from '../../store/slices/uiSlice';
import styles from './LinkEdge.module.css';

export type UpdateEdgeData = (edgeId: string, data: Partial<LinkEdgeData>) => void;

interface LinkEdgeProps extends EdgeProps {
  updateEdgeData?: UpdateEdgeData;
}

// Offset for parallel edges between same nodes
const PARALLEL_EDGE_OFFSET = 10;

// Invisible hitbox width for easier clicking
const HITBOX_WIDTH = 20;

/**
 * LinkEdge - Information connection (dashed straight line with arrow)
 * Supports bidirectional arrows when data.bidirectional is true
 */
function LinkEdge({ id, source, target, style, data, selected }: LinkEdgeProps) {
  const sourceNode = useStore((store) => store.nodeLookup.get(source));
  const targetNode = useStore((store) => store.nodeLookup.get(target));
  
  // Check if this edge is highlighted as part of a loop
  const highlightedLoop = useSelector(selectHighlightedLoop);
  const isHighlighted = highlightedLoop?.edgeIds.includes(id);
  
  // Check if there's a flow edge between same nodes
  const hasParallelFlow = useStore((store) => {
    const edges = Array.from(store.edges.values()) as CLDEdge[];
    return edges.some(e => 
      e.type === 'flow' && 
      ((e.source === source && e.target === target) || 
       (e.source === target && e.target === source))
    );
  });

  if (!sourceNode || !targetNode) {
    return null;
  }

  const edgeData = data as LinkEdgeData | undefined;
  const isBidirectional = edgeData?.bidirectional ?? false;
  const { sx, sy, tx, ty } = getStraightEdgeParams(sourceNode, targetNode);

  // Calculate angle and perpendicular offset direction
  const angle = Math.atan2(ty - sy, tx - sx);
  const perpAngle = angle + Math.PI / 2;
  
  // Apply offset if there's a parallel flow edge
  const offset = hasParallelFlow ? PARALLEL_EDGE_OFFSET : 0;
  const offsetX = offset * Math.cos(perpAngle);
  const offsetY = offset * Math.sin(perpAngle);
  
  // Offset start and end points
  const startX = sx + offsetX;
  const startY = sy + offsetY;
  const endX = tx + offsetX;
  const endY = ty + offsetY;

  // Straight line path (with offset)
  const edgePath = `M ${startX},${startY} L ${endX},${endY}`;

  // Arrow at target (pointing towards target)
  const targetArrowAngle1 = angle + Math.PI * 0.8;
  const targetArrowAngle2 = angle - Math.PI * 0.8;
  
  const targetArrowX1 = endX + ARROW_SIZE * Math.cos(targetArrowAngle1);
  const targetArrowY1 = endY + ARROW_SIZE * Math.sin(targetArrowAngle1);
  const targetArrowX2 = endX + ARROW_SIZE * Math.cos(targetArrowAngle2);
  const targetArrowY2 = endY + ARROW_SIZE * Math.sin(targetArrowAngle2);

  // Arrow at source (pointing towards source) - for bidirectional
  const sourceArrowAngle1 = angle + Math.PI + Math.PI * 0.8;
  const sourceArrowAngle2 = angle + Math.PI - Math.PI * 0.8;
  
  const sourceArrowX1 = startX + ARROW_SIZE * Math.cos(sourceArrowAngle1);
  const sourceArrowY1 = startY + ARROW_SIZE * Math.sin(sourceArrowAngle1);
  const sourceArrowX2 = startX + ARROW_SIZE * Math.cos(sourceArrowAngle2);
  const sourceArrowY2 = startY + ARROW_SIZE * Math.sin(sourceArrowAngle2);

  // Label
  const label = edgeData?.label;
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  // Determine highlight/selection state
  const highlightColor = isHighlighted ? '#22c55e' : (selected ? '#3b82f6' : null);
  const outlineWidth = LINK_EDGE.strokeWidth + 6; // Thicker for outline effect

  return (
    <g className="react-flow__edge">
      {/* Invisible wide path for easier clicking */}
      <path
        d={edgePath}
        strokeWidth={HITBOX_WIDTH}
        stroke="transparent"
        fill="none"
        className={styles.hitbox}
      />
      
      {/* Outline layer - drawn first (underneath) when highlighted or selected */}
      {highlightColor && (
        <>
          {/* Outline for main edge path */}
          <path
            d={edgePath}
            strokeWidth={outlineWidth}
            stroke={highlightColor}
            fill="none"
            strokeDasharray={LINK_EDGE.dashArray}
            strokeLinecap="round"
            className={styles.outline}
          />
          
          {/* Outline for arrow at target */}
          <path
            d={`M ${targetArrowX1},${targetArrowY1} L ${endX},${endY} L ${targetArrowX2},${targetArrowY2}`}
            strokeWidth={outlineWidth}
            stroke={highlightColor}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.outline}
          />
          
          {/* Outline for arrow at source - only for bidirectional */}
          {isBidirectional && (
            <path
              d={`M ${sourceArrowX1},${sourceArrowY1} L ${startX},${startY} L ${sourceArrowX2},${sourceArrowY2}`}
              strokeWidth={outlineWidth}
              stroke={highlightColor}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.outline}
            />
          )}
        </>
      )}
      
      {/* Main edge path - dashed line for Link (always in original color) */}
      <path
        id={id}
        className={`react-flow__edge-path ${styles.mainPath}`}
        d={edgePath}
        strokeWidth={LINK_EDGE.strokeWidth}
        stroke={LINK_EDGE.color}
        fill="none"
        strokeDasharray={LINK_EDGE.dashArray}
        strokeLinecap="round"
        style={style}
      />
      
      {/* Arrow at target (always in original color) */}
      <path
        d={`M ${targetArrowX1},${targetArrowY1} L ${endX},${endY} L ${targetArrowX2},${targetArrowY2}`}
        strokeWidth={LINK_EDGE.strokeWidth}
        stroke={LINK_EDGE.color}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.mainPath}
      />
      
      {/* Arrow at source - only for bidirectional (always in original color) */}
      {isBidirectional && (
        <path
          d={`M ${sourceArrowX1},${sourceArrowY1} L ${startX},${startY} L ${sourceArrowX2},${sourceArrowY2}`}
          strokeWidth={LINK_EDGE.strokeWidth}
          stroke={LINK_EDGE.color}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.mainPath}
        />
      )}
      
      {/* Label if present */}
      {label && (
        <>
          {/* White background for label text */}
          <rect
            x={midX - (label.length * 3.5 + 6)}
            y={midY - 20}
            width={label.length * 7 + 12}
            height={18}
            fill="white"
            stroke="white"
            strokeWidth={2}
            rx={3}
            className={styles.labelBg}
          />
          <text
            x={midX}
            y={midY - 10}
            textAnchor="middle"
            fill={LINK_EDGE.color}
            className={styles.labelText}
          >
            {label}
          </text>
        </>
      )}
    </g>
  );
}

export default LinkEdge;
