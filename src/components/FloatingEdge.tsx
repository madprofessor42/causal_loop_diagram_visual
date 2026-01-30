import { useCallback, useRef, useState } from 'react';
import { useStore, useReactFlow, type EdgeProps } from '@xyflow/react';
import { getEdgeParams } from '../utils/edge';
import { PolarityMarker, DelayMarker } from './edges/markers';
import type { UpdateEdgeData } from '../App';
import type { BaseEdgeData } from '../types';
import {
  ARROW_SIZE,
  EDGE_STROKE_WIDTH,
  EDGE_COLORS,
  EDGE_HOVER_STROKE_WIDTH,
  EDGE_ZONES,
  NODE_CONTAINER_SIZE,
} from '../constants';

interface FloatingEdgeProps extends EdgeProps {
  updateEdgeData?: UpdateEdgeData;
}

type HoverZone = 'source' | 'target' | 'curve' | null;

function FloatingEdge({ id, source, target, style, data, updateEdgeData }: FloatingEdgeProps) {
  const sourceNode = useStore(useCallback((store) => store.nodeLookup.get(source), [source]));
  const targetNode = useStore(useCallback((store) => store.nodeLookup.get(target), [target]));
  const { screenToFlowPosition } = useReactFlow();
  
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [hoveredZone, setHoveredZone] = useState<HoverZone>(null);

  if (!sourceNode || !targetNode) {
    return null;
  }

  // Cast data to our expected type
  const edgeData = data as BaseEdgeData | undefined;

  // Pass stored angles for precise edge positioning
  const {
    sx, sy, tx, ty,
    sourceControlOffsetX, sourceControlOffsetY,
    targetControlOffsetX, targetControlOffsetY
  } = getEdgeParams(sourceNode, targetNode, {
    sourceAngle: edgeData?.sourceAngle,
    targetAngle: edgeData?.targetAngle,
  });

  // Apply manual curve offset if present
  const curveOffset = edgeData?.curveOffset || { x: 0, y: 0 };

  // Calculate control points for cubic bezier curve
  const sourceControlX = sx + sourceControlOffsetX + curveOffset.x;
  const sourceControlY = sy + sourceControlOffsetY + curveOffset.y;
  const targetControlX = tx + targetControlOffsetX + curveOffset.x;
  const targetControlY = ty + targetControlOffsetY + curveOffset.y;

  // Check if we need a curve (if any deviation exists)
  const hasCurve = Math.abs(sourceControlOffsetX + curveOffset.x) > 0.1 || 
                   Math.abs(sourceControlOffsetY + curveOffset.y) > 0.1 ||
                   Math.abs(targetControlOffsetX + curveOffset.x) > 0.1 || 
                   Math.abs(targetControlOffsetY + curveOffset.y) > 0.1;

  // Helper to get point on bezier curve at t
  const getBezierPoint = (t: number) => {
    const x = Math.pow(1-t, 3) * sx + 3 * Math.pow(1-t, 2) * t * sourceControlX + 3 * (1-t) * Math.pow(t, 2) * targetControlX + Math.pow(t, 3) * tx;
    const y = Math.pow(1-t, 3) * sy + 3 * Math.pow(1-t, 2) * t * sourceControlY + 3 * (1-t) * Math.pow(t, 2) * targetControlY + Math.pow(t, 3) * ty;
    return { x, y };
  };

  // Helper to get tangent angle on bezier curve at t
  const getBezierTangent = (t: number) => {
    // Derivative of cubic bezier
    const dx = 3 * Math.pow(1-t, 2) * (sourceControlX - sx) + 
               6 * (1-t) * t * (targetControlX - sourceControlX) + 
               3 * Math.pow(t, 2) * (tx - targetControlX);
    const dy = 3 * Math.pow(1-t, 2) * (sourceControlY - sy) + 
               6 * (1-t) * t * (targetControlY - sourceControlY) + 
               3 * Math.pow(t, 2) * (ty - targetControlY);
    return Math.atan2(dy, dx);
  };

  // Helper to get point on straight line at t
  const getLinePoint = (t: number) => {
    return {
      x: sx + (tx - sx) * t,
      y: sy + (ty - sy) * t,
    };
  };

  // Build path
  let edgePath: string;
  let sourceDragPath: string; // First 15% for source angle adjustment
  let curveDragPath: string;  // Middle 70% for curve bending
  let targetDragPath: string; // Last 15% for target angle adjustment
  let arrowAngle: number;
  let midpoint: { x: number; y: number };
  let midpointAngle: number;
  let polarityPosition: { x: number; y: number };
  let polarityAngle: number;
  
  // Use zone boundaries from constants
  const SOURCE_END = EDGE_ZONES.sourceEnd;
  const TARGET_START = EDGE_ZONES.targetStart;
  
  // Position for polarity marker (75% along the edge, near target)
  const POLARITY_T = 0.75;
  // Position for delay marker (50% along the edge)
  const DELAY_T = 0.5;
  
  if (hasCurve) {
    // Cubic bezier curve: M start C control1 control2 end
    edgePath = `M ${sx},${sy} C ${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${tx},${ty}`;
    // Arrow angle is tangent at end point = direction from last control point to end
    arrowAngle = Math.atan2(ty - targetControlY, tx - targetControlX);
    
    // Calculate midpoint and polarity position for markers
    midpoint = getBezierPoint(DELAY_T);
    midpointAngle = getBezierTangent(DELAY_T);
    polarityPosition = getBezierPoint(POLARITY_T);
    polarityAngle = getBezierTangent(POLARITY_T);
    
    // Build paths for each drag zone
    // Source zone: 0% to 15%
    const s1 = getBezierPoint(0);
    const s2 = getBezierPoint(SOURCE_END / 2);
    const s3 = getBezierPoint(SOURCE_END);
    sourceDragPath = `M ${s1.x},${s1.y} L ${s2.x},${s2.y} L ${s3.x},${s3.y}`;
    
    // Curve zone: 15% to 85%
    const c1 = getBezierPoint(SOURCE_END);
    const c2 = getBezierPoint(0.3);
    const c3 = getBezierPoint(0.5);
    const c4 = getBezierPoint(0.7);
    const c5 = getBezierPoint(TARGET_START);
    curveDragPath = `M ${c1.x},${c1.y} L ${c2.x},${c2.y} L ${c3.x},${c3.y} L ${c4.x},${c4.y} L ${c5.x},${c5.y}`;
    
    // Target zone: 85% to 100%
    const t1 = getBezierPoint(TARGET_START);
    const t2 = getBezierPoint((TARGET_START + 1) / 2);
    const t3 = getBezierPoint(1);
    targetDragPath = `M ${t1.x},${t1.y} L ${t2.x},${t2.y} L ${t3.x},${t3.y}`;
  } else {
    // Straight line
    edgePath = `M ${sx},${sy} L ${tx},${ty}`;
    // Arrow angle is direction of line
    arrowAngle = Math.atan2(ty - sy, tx - sx);
    
    // Calculate midpoint and polarity position for markers
    midpoint = getLinePoint(DELAY_T);
    midpointAngle = arrowAngle;
    polarityPosition = getLinePoint(POLARITY_T);
    polarityAngle = arrowAngle;
    
    // Build paths for each drag zone
    const s1 = getLinePoint(0);
    const s2 = getLinePoint(SOURCE_END);
    sourceDragPath = `M ${s1.x},${s1.y} L ${s2.x},${s2.y}`;
    
    const c1 = getLinePoint(SOURCE_END);
    const c2 = getLinePoint(TARGET_START);
    curveDragPath = `M ${c1.x},${c1.y} L ${c2.x},${c2.y}`;
    
    const t1 = getLinePoint(TARGET_START);
    const t2 = getLinePoint(1);
    targetDragPath = `M ${t1.x},${t1.y} L ${t2.x},${t2.y}`;
  }

  // Calculate arrow head points (simple V-shape arrow)
  const arrowAngle1 = arrowAngle + Math.PI * 0.8;
  const arrowAngle2 = arrowAngle - Math.PI * 0.8;
  
  const arrowX1 = tx + ARROW_SIZE * Math.cos(arrowAngle1);
  const arrowY1 = ty + ARROW_SIZE * Math.sin(arrowAngle1);
  const arrowX2 = tx + ARROW_SIZE * Math.cos(arrowAngle2);
  const arrowY2 = ty + ARROW_SIZE * Math.sin(arrowAngle2);

  // Calculate node centers for angle calculations during drag
  const nodeWidth = sourceNode.measured?.width ?? NODE_CONTAINER_SIZE;
  const nodeCenterOffset = nodeWidth / 2;
  
  const sourceCenterX = sourceNode.position.x + nodeCenterOffset;
  const sourceCenterY = sourceNode.position.y + nodeCenterOffset;
  const targetCenterX = targetNode.position.x + nodeCenterOffset;
  const targetCenterY = targetNode.position.y + nodeCenterOffset;

  // Handle drag start
  const handleMouseDown = (handleType: 'source' | 'target' | 'curve') => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!updateEdgeData) return;
      
      const flowPos = screenToFlowPosition({ x: moveEvent.clientX, y: moveEvent.clientY });

      if (handleType === 'source') {
        // Calculate new source angle based on drag position relative to source node center
        const newAngle = Math.atan2(flowPos.y - sourceCenterY, flowPos.x - sourceCenterX);
        updateEdgeData(id, { sourceAngle: newAngle });
      } else if (handleType === 'target') {
        // Calculate new target angle based on drag position relative to target node center
        const newAngle = Math.atan2(flowPos.y - targetCenterY, flowPos.x - targetCenterX);
        updateEdgeData(id, { targetAngle: newAngle });
      } else if (handleType === 'curve') {
        // Calculate curve offset based on drag position relative to original midpoint
        const baseMidX = (sx + tx) / 2;
        const baseMidY = (sy + ty) / 2;
        const newOffset = {
          x: (flowPos.x - baseMidX) * 0.5,
          y: (flowPos.y - baseMidY) * 0.5,
        };
        updateEdgeData(id, { curveOffset: newOffset });
      }
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Get polarity for rendering
  const polarity = edgeData?.polarity ?? 'positive';
  const showDelay = edgeData?.delay ?? false;

  return (
    <g className="react-flow__edge">
      {/* Source drag zone - first 15% of the path */}
      <path
        d={sourceDragPath}
        strokeWidth={20}
        stroke="transparent"
        fill="none"
        style={{ cursor: 'pointer' }}
        onMouseDown={handleMouseDown('source')}
        onMouseEnter={() => setHoveredZone('source')}
        onMouseLeave={() => setHoveredZone(null)}
      />
      
      {/* Curve drag zone - middle 70% of the path */}
      <path
        d={curveDragPath}
        strokeWidth={20}
        stroke="transparent"
        fill="none"
        style={{ cursor: 'move' }}
        onMouseDown={handleMouseDown('curve')}
        onMouseEnter={() => setHoveredZone('curve')}
        onMouseLeave={() => setHoveredZone(null)}
      />
      
      {/* Target drag zone - last 15% of the path */}
      <path
        d={targetDragPath}
        strokeWidth={20}
        stroke="transparent"
        fill="none"
        style={{ cursor: 'pointer' }}
        onMouseDown={handleMouseDown('target')}
        onMouseEnter={() => setHoveredZone('target')}
        onMouseLeave={() => setHoveredZone(null)}
      />
      
      {/* Hover highlight for source zone */}
      {hoveredZone === 'source' && (
        <path
          d={sourceDragPath}
          strokeWidth={EDGE_HOVER_STROKE_WIDTH}
          stroke={EDGE_COLORS.hover}
          fill="none"
          strokeLinecap="round"
          style={{ pointerEvents: 'none', opacity: 0.6 }}
        />
      )}
      
      {/* Hover highlight for curve zone */}
      {hoveredZone === 'curve' && (
        <path
          d={curveDragPath}
          strokeWidth={EDGE_HOVER_STROKE_WIDTH}
          stroke={EDGE_COLORS.hover}
          fill="none"
          strokeLinecap="round"
          style={{ pointerEvents: 'none', opacity: 0.6 }}
        />
      )}
      
      {/* Hover highlight for target zone */}
      {hoveredZone === 'target' && (
        <path
          d={targetDragPath}
          strokeWidth={EDGE_HOVER_STROKE_WIDTH}
          stroke={EDGE_COLORS.hover}
          fill="none"
          strokeLinecap="round"
          style={{ pointerEvents: 'none', opacity: 0.6 }}
        />
      )}
      
      {/* Main edge path - no pointer events */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={EDGE_STROKE_WIDTH}
        stroke={EDGE_COLORS.default}
        fill="none"
        strokeLinecap="round"
        style={{ ...style, pointerEvents: 'none' }}
      />
      
      {/* Custom arrowhead - V-shape, no pointer events */}
      <path
        d={`M ${arrowX1},${arrowY1} L ${tx},${ty} L ${arrowX2},${arrowY2}`}
        strokeWidth={EDGE_STROKE_WIDTH}
        stroke={EDGE_COLORS.default}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Polarity marker (+/-) near the target */}
      <PolarityMarker
        polarity={polarity}
        x={polarityPosition.x}
        y={polarityPosition.y}
        angle={polarityAngle}
      />
      
      {/* Delay marker (||) at midpoint if enabled */}
      {showDelay && (
        <DelayMarker
          x={midpoint.x}
          y={midpoint.y}
          angle={midpointAngle}
        />
      )}
    </g>
  );
}

export default FloatingEdge;
