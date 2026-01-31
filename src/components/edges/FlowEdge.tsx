import { useCallback, useState, useRef, useEffect } from 'react';
import { useStore, useReactFlow, type EdgeProps } from '@xyflow/react';
import { getStraightEdgeParams } from '../../utils/edge';
import type { FlowEdgeData, CLDEdge } from '../../types';
import {
  ARROW_SIZE,
  FLOW_EDGE,
} from '../../constants';

export type UpdateEdgeData = (edgeId: string, data: Partial<FlowEdgeData>) => void;

interface FlowEdgeProps extends EdgeProps {
  updateEdgeData?: UpdateEdgeData;
}

// Cloud SVG as inline path - simple cloud shape
const CLOUD_SIZE = 24;
const cloudPath = `
  M ${CLOUD_SIZE * 0.15},${CLOUD_SIZE * 0.6}
  C ${CLOUD_SIZE * 0.05},${CLOUD_SIZE * 0.6} 0,${CLOUD_SIZE * 0.5} ${CLOUD_SIZE * 0.05},${CLOUD_SIZE * 0.4}
  C 0,${CLOUD_SIZE * 0.3} ${CLOUD_SIZE * 0.1},${CLOUD_SIZE * 0.2} ${CLOUD_SIZE * 0.25},${CLOUD_SIZE * 0.25}
  C ${CLOUD_SIZE * 0.3},${CLOUD_SIZE * 0.1} ${CLOUD_SIZE * 0.45},${CLOUD_SIZE * 0.1} ${CLOUD_SIZE * 0.55},${CLOUD_SIZE * 0.2}
  C ${CLOUD_SIZE * 0.7},${CLOUD_SIZE * 0.1} ${CLOUD_SIZE * 0.85},${CLOUD_SIZE * 0.25} ${CLOUD_SIZE * 0.85},${CLOUD_SIZE * 0.4}
  C ${CLOUD_SIZE * 0.95},${CLOUD_SIZE * 0.5} ${CLOUD_SIZE * 0.85},${CLOUD_SIZE * 0.6} ${CLOUD_SIZE * 0.75},${CLOUD_SIZE * 0.6}
  Z
`;

// Offset for parallel edges between same nodes
const PARALLEL_EDGE_OFFSET = 10;

// Invisible hitbox width for easier clicking
const HITBOX_WIDTH = 20;

// Cloud hitbox for dragging - larger than cloud for easier grabbing
const CLOUD_HITBOX_SIZE = 40;

/**
 * FlowEdge - Material flow between Stocks (thick straight arrow)
 * With valve indicator at midpoint
 * Supports bidirectional arrows and cloud icons at endpoints
 * Clouds are draggable to reposition
 */
function FlowEdge({ id, source, target, style, data, selected, updateEdgeData }: FlowEdgeProps) {
  const sourceNode = useStore(useCallback((store) => store.nodeLookup.get(source), [source]));
  const targetNode = useStore(useCallback((store) => store.nodeLookup.get(target), [target]));
  const { screenToFlowPosition } = useReactFlow();
  
  // Dragging state
  const [isDraggingCloud, setIsDraggingCloud] = useState<'source' | 'target' | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  
  // Check if there's a link edge between same nodes
  const hasParallelLink = useStore(useCallback((store) => {
    const edges = Array.from(store.edges.values()) as CLDEdge[];
    return edges.some(e => 
      e.type === 'link' && 
      ((e.source === source && e.target === target) || 
       (e.source === target && e.target === source))
    );
  }, [source, target]));

  const edgeData = data as FlowEdgeData | undefined;
  const isBidirectional = edgeData?.bidirectional ?? false;
  const hasCloudAtSource = edgeData?.sourceIsCloud ?? false;
  const hasCloudAtTarget = edgeData?.targetIsCloud ?? false;
  
  // Get fixed positions for cloud endpoints
  const fixedSourcePos = edgeData?.sourcePosition;
  const fixedTargetPos = edgeData?.targetPosition;

  // Handle pointer move and up for dragging
  useEffect(() => {
    if (!isDraggingCloud) return;
    
    const handlePointerMove = (event: PointerEvent) => {
      if (!updateEdgeData) return;
      
      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      
      if (isDraggingCloud === 'target') {
        updateEdgeData(id, { targetPosition: flowPos });
      } else if (isDraggingCloud === 'source') {
        updateEdgeData(id, { sourcePosition: flowPos });
      }
    };
    
    const handlePointerUp = () => {
      setIsDraggingCloud(null);
      dragStartRef.current = null;
    };
    
    // Use capture phase to ensure we get the events
    window.addEventListener('pointermove', handlePointerMove, { capture: true });
    window.addEventListener('pointerup', handlePointerUp, { capture: true });
    window.addEventListener('pointercancel', handlePointerUp, { capture: true });
    
    return () => {
      window.removeEventListener('pointermove', handlePointerMove, { capture: true });
      window.removeEventListener('pointerup', handlePointerUp, { capture: true });
      window.removeEventListener('pointercancel', handlePointerUp, { capture: true });
    };
  }, [isDraggingCloud, id, updateEdgeData, screenToFlowPosition]);

  // Handle cloud drag start
  const handleCloudPointerDown = (cloudType: 'source' | 'target') => (event: React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
    // Capture pointer to ensure we get all subsequent events
    (event.target as Element).setPointerCapture(event.pointerId);
    setIsDraggingCloud(cloudType);
    dragStartRef.current = { x: event.clientX, y: event.clientY };
  };

  // Calculate edge points
  let sx: number, sy: number, tx: number, ty: number;
  
  if (fixedSourcePos) {
    sx = fixedSourcePos.x;
    sy = fixedSourcePos.y;
  }
  
  if (fixedTargetPos) {
    tx = fixedTargetPos.x;
    ty = fixedTargetPos.y;
  }
  
  // Get node-based positions if not fixed
  if (sourceNode && targetNode && !fixedSourcePos && !fixedTargetPos) {
    const params = getStraightEdgeParams(sourceNode, targetNode);
    sx = params.sx;
    sy = params.sy;
    tx = params.tx;
    ty = params.ty;
  } else if (sourceNode && fixedTargetPos) {
    // Calculate source point towards fixed target
    const sourcePos = sourceNode.position;
    const sourceWidth = sourceNode.measured?.width ?? 100;
    const sourceHeight = sourceNode.measured?.height ?? 60;
    const centerX = sourcePos.x + sourceWidth / 2;
    const centerY = sourcePos.y + sourceHeight / 2;
    
    const angle = Math.atan2(fixedTargetPos.y - centerY, fixedTargetPos.x - centerX);
    
    // Simple edge point calculation
    if (sourceNode.type === 'stock') {
      const hw = sourceWidth / 2;
      const hh = sourceHeight / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const tanAngle = Math.abs(sin / cos);
      const edgeTan = hh / hw;
      
      if (tanAngle <= edgeTan) {
        sx = centerX + (cos > 0 ? hw : -hw);
        sy = centerY + (cos > 0 ? hw : -hw) * (sin / cos);
      } else {
        sy = centerY + (sin > 0 ? hh : -hh);
        sx = centerX + (sin > 0 ? hh : -hh) * (cos / sin);
      }
    } else {
      // Ellipse
      const rx = sourceWidth / 2;
      const ry = sourceHeight / 2;
      sx = centerX + rx * Math.cos(angle);
      sy = centerY + ry * Math.sin(angle);
    }
    
    tx = fixedTargetPos.x;
    ty = fixedTargetPos.y;
  } else if (fixedSourcePos && targetNode) {
    // Calculate target point from fixed source
    const targetPos = targetNode.position;
    const targetWidth = targetNode.measured?.width ?? 100;
    const targetHeight = targetNode.measured?.height ?? 60;
    const centerX = targetPos.x + targetWidth / 2;
    const centerY = targetPos.y + targetHeight / 2;
    
    const angle = Math.atan2(fixedSourcePos.y - centerY, fixedSourcePos.x - centerX);
    
    if (targetNode.type === 'stock') {
      const hw = targetWidth / 2;
      const hh = targetHeight / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const tanAngle = Math.abs(sin / cos);
      const edgeTan = hh / hw;
      
      if (tanAngle <= edgeTan) {
        tx = centerX + (cos > 0 ? hw : -hw);
        ty = centerY + (cos > 0 ? hw : -hw) * (sin / cos);
      } else {
        ty = centerY + (sin > 0 ? hh : -hh);
        tx = centerX + (sin > 0 ? hh : -hh) * (cos / sin);
      }
    } else {
      const rx = targetWidth / 2;
      const ry = targetHeight / 2;
      tx = centerX + rx * Math.cos(angle);
      ty = centerY + ry * Math.sin(angle);
    }
    
    sx = fixedSourcePos.x;
    sy = fixedSourcePos.y;
  } else if (!sourceNode && !targetNode) {
    // Both are fixed positions (shouldn't happen but handle it)
    return null;
  } else {
    return null;
  }

  // Calculate angle and perpendicular offset direction
  const angle = Math.atan2(ty - sy, tx - sx);
  const perpAngle = angle + Math.PI / 2;
  
  // Apply offset in opposite direction from LinkEdge if there's a parallel link edge
  const offset = hasParallelLink ? -PARALLEL_EDGE_OFFSET : 0;
  const offsetX = offset * Math.cos(perpAngle);
  const offsetY = offset * Math.sin(perpAngle);
  
  // Offset start and end points
  const startX = sx + offsetX;
  const startY = sy + offsetY;
  const endX = tx + offsetX;
  const endY = ty + offsetY;

  // Straight line path (with offset)
  const edgePath = `M ${startX},${startY} L ${endX},${endY}`;

  // Calculate midpoint for valve
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  // Arrow size for flow
  const flowArrowSize = ARROW_SIZE * 1.5;

  // Arrow at target (pointing towards target)
  const targetArrowAngle1 = angle + Math.PI * 0.8;
  const targetArrowAngle2 = angle - Math.PI * 0.8;
  
  // Offset arrow back if there's a cloud at target
  const targetArrowOffset = hasCloudAtTarget ? CLOUD_SIZE / 2 + 5 : 0;
  const arrowTx = endX - targetArrowOffset * Math.cos(angle);
  const arrowTy = endY - targetArrowOffset * Math.sin(angle);
  
  const targetArrowX1 = arrowTx + flowArrowSize * Math.cos(targetArrowAngle1);
  const targetArrowY1 = arrowTy + flowArrowSize * Math.sin(targetArrowAngle1);
  const targetArrowX2 = arrowTx + flowArrowSize * Math.cos(targetArrowAngle2);
  const targetArrowY2 = arrowTy + flowArrowSize * Math.sin(targetArrowAngle2);

  // Arrow at source (pointing towards source) - for bidirectional
  const sourceArrowAngle1 = angle + Math.PI + Math.PI * 0.8;
  const sourceArrowAngle2 = angle + Math.PI - Math.PI * 0.8;
  
  const sourceArrowOffset = hasCloudAtSource ? CLOUD_SIZE / 2 + 5 : 0;
  const arrowSx = startX + sourceArrowOffset * Math.cos(angle);
  const arrowSy = startY + sourceArrowOffset * Math.sin(angle);
  
  const sourceArrowX1 = arrowSx + flowArrowSize * Math.cos(sourceArrowAngle1);
  const sourceArrowY1 = arrowSy + flowArrowSize * Math.sin(sourceArrowAngle1);
  const sourceArrowX2 = arrowSx + flowArrowSize * Math.cos(sourceArrowAngle2);
  const sourceArrowY2 = arrowSy + flowArrowSize * Math.sin(sourceArrowAngle2);

  // Valve indicator at midpoint (small perpendicular line)
  const valveSize = FLOW_EDGE.valveSize;
  const valve1X = midX + valveSize * Math.cos(perpAngle);
  const valve1Y = midY + valveSize * Math.sin(perpAngle);
  const valve2X = midX - valveSize * Math.cos(perpAngle);
  const valve2Y = midY - valveSize * Math.sin(perpAngle);

  // Label
  const label = edgeData?.label;
  
  // Colors based on selection
  const strokeColor = selected ? '#3b82f6' : FLOW_EDGE.color;

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
      
      {/* Main edge path - thick solid line for Flow */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={FLOW_EDGE.strokeWidth}
        stroke={strokeColor}
        fill="none"
        strokeLinecap="round"
        style={{ ...style, pointerEvents: 'none' }}
      />
      
      {/* Valve indicator at midpoint */}
      <line
        x1={valve1X}
        y1={valve1Y}
        x2={valve2X}
        y2={valve2Y}
        strokeWidth={FLOW_EDGE.strokeWidth}
        stroke={strokeColor}
        strokeLinecap="round"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Filled arrowhead at target */}
      <path
        d={`M ${targetArrowX1},${targetArrowY1} L ${arrowTx},${arrowTy} L ${targetArrowX2},${targetArrowY2} Z`}
        strokeWidth={1}
        stroke={strokeColor}
        fill={strokeColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Filled arrowhead at source - only for bidirectional */}
      {isBidirectional && (
        <path
          d={`M ${sourceArrowX1},${sourceArrowY1} L ${arrowSx},${arrowSy} L ${sourceArrowX2},${sourceArrowY2} Z`}
          strokeWidth={1}
          stroke={strokeColor}
          fill={strokeColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pointerEvents: 'none' }}
        />
      )}
      
      {/* Cloud at target - draggable */}
      {hasCloudAtTarget && (
        <>
          {/* Cloud visual */}
          <g transform={`translate(${endX - CLOUD_SIZE / 2}, ${endY - CLOUD_SIZE / 2})`}>
            <path
              d={cloudPath}
              fill="#f5f5f5"
              stroke={selected || isDraggingCloud === 'target' ? '#3b82f6' : '#999999'}
              strokeWidth={1.5}
              style={{ pointerEvents: 'none' }}
            />
          </g>
          {/* Invisible hitbox for dragging - on top of everything */}
          <rect
            x={endX - CLOUD_HITBOX_SIZE / 2}
            y={endY - CLOUD_HITBOX_SIZE / 2}
            width={CLOUD_HITBOX_SIZE}
            height={CLOUD_HITBOX_SIZE}
            fill="transparent"
            style={{ cursor: isDraggingCloud === 'target' ? 'grabbing' : 'grab', pointerEvents: 'all' }}
            onPointerDown={handleCloudPointerDown('target')}
          />
        </>
      )}
      
      {/* Cloud at source - draggable */}
      {hasCloudAtSource && (
        <>
          {/* Cloud visual */}
          <g transform={`translate(${startX - CLOUD_SIZE / 2}, ${startY - CLOUD_SIZE / 2})`}>
            <path
              d={cloudPath}
              fill="#f5f5f5"
              stroke={selected || isDraggingCloud === 'source' ? '#3b82f6' : '#999999'}
              strokeWidth={1.5}
              style={{ pointerEvents: 'none' }}
            />
          </g>
          {/* Invisible hitbox for dragging - on top of everything */}
          <rect
            x={startX - CLOUD_HITBOX_SIZE / 2}
            y={startY - CLOUD_HITBOX_SIZE / 2}
            width={CLOUD_HITBOX_SIZE}
            height={CLOUD_HITBOX_SIZE}
            fill="transparent"
            style={{ cursor: isDraggingCloud === 'source' ? 'grabbing' : 'grab', pointerEvents: 'all' }}
            onPointerDown={handleCloudPointerDown('source')}
          />
        </>
      )}
      
      {/* Label if present */}
      {label && (
        <>
          {/* White background for label text */}
          <rect
            x={midX - (label.length * 3.5 + 6)}
            y={midY - 25}
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
            y={midY - 15}
            textAnchor="middle"
            style={{
              fontSize: '12px',
              fill: strokeColor,
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

export default FlowEdge;
