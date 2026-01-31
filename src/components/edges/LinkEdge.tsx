import { useCallback } from 'react';
import { useStore, type EdgeProps } from '@xyflow/react';
import { getStraightEdgeParams } from '../../utils/edge';
import type { LinkEdgeData, CLDEdge } from '../../types';
import {
  ARROW_SIZE,
  LINK_EDGE,
} from '../../constants';

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
  const sourceNode = useStore(useCallback((store) => store.nodeLookup.get(source), [source]));
  const targetNode = useStore(useCallback((store) => store.nodeLookup.get(target), [target]));
  
  // Check if there's a flow edge between same nodes
  const hasParallelFlow = useStore(useCallback((store) => {
    const edges = Array.from(store.edges.values()) as CLDEdge[];
    return edges.some(e => 
      e.type === 'flow' && 
      ((e.source === source && e.target === target) || 
       (e.source === target && e.target === source))
    );
  }, [source, target]));

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

  return (
    <g className="react-flow__edge">
      {/* Invisible wide path for easier clicking */}
      <path
        d={edgePath}
        strokeWidth={HITBOX_WIDTH}
        stroke="transparent"
        fill="none"
        style={{ cursor: 'pointer' }}
      />
      
      {/* Main edge path - dashed line for Link */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={LINK_EDGE.strokeWidth}
        stroke={selected ? '#3b82f6' : LINK_EDGE.color}
        fill="none"
        strokeDasharray={LINK_EDGE.dashArray}
        strokeLinecap="round"
        style={{ ...style, pointerEvents: 'none' }}
      />
      
      {/* Arrow at target */}
      <path
        d={`M ${targetArrowX1},${targetArrowY1} L ${endX},${endY} L ${targetArrowX2},${targetArrowY2}`}
        strokeWidth={LINK_EDGE.strokeWidth}
        stroke={selected ? '#3b82f6' : LINK_EDGE.color}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Arrow at source - only for bidirectional */}
      {isBidirectional && (
        <path
          d={`M ${sourceArrowX1},${sourceArrowY1} L ${startX},${startY} L ${sourceArrowX2},${sourceArrowY2}`}
          strokeWidth={LINK_EDGE.strokeWidth}
          stroke={selected ? '#3b82f6' : LINK_EDGE.color}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pointerEvents: 'none' }}
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
            style={{ pointerEvents: 'none' }}
          />
          <text
            x={midX}
            y={midY - 10}
            textAnchor="middle"
            style={{
              fontSize: '12px',
              fill: selected ? '#3b82f6' : LINK_EDGE.color,
              pointerEvents: 'none',
            }}
          >
            {label}
          </text>
        </>
      )}
    </g>
  );
}

export default LinkEdge;
