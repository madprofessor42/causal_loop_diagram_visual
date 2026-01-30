import { useState, useRef } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { getClosestPointOnCircle, getDistance } from '../utils/geometry';
import {
  NODE_RADIUS,
  NODE_INNER_THRESHOLD,
  NODE_OUTER_THRESHOLD,
  NODE_CONTAINER_SIZE,
  NODE_COLORS,
  HANDLE_INDICATOR,
} from '../constants';
import type { HandlePosition, BaseNodeData } from '../types';

export function CircularNode({ data }: NodeProps) {
  const [handlePos, setHandlePos] = useState<HandlePosition>({ 
    x: 0, y: 0, angle: 0, visible: false 
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    // Get the container's bounding rect for accurate center calculation
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Calculate center of the visual circle (container is larger, circle is centered)
    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;

    // Calculate actual rendered radius (accounts for zoom)
    const actualContainerRadius = containerRect.width / 2;
    const scale = actualContainerRadius / (NODE_RADIUS + NODE_OUTER_THRESHOLD);
    const actualRadius = NODE_RADIUS * scale;
    const actualOuterThreshold = NODE_OUTER_THRESHOLD * scale;
    const actualInnerThreshold = NODE_INNER_THRESHOLD * scale;

    // Calculate distance from mouse to circle center (in screen pixels)
    const distance = getDistance(centerX, centerY, event.clientX, event.clientY);
    
    // Connection zone: from (radius - innerThreshold) to (radius + outerThreshold)
    const minDistance = actualRadius - actualInnerThreshold;
    const maxDistance = actualRadius + actualOuterThreshold;
    const inConnectionZone = distance >= minDistance && distance <= maxDistance;

    if (inConnectionZone) {
      // Calculate the closest point on the visual circle
      // Convert mouse position to circle-relative coordinates
      const mouseRelX = event.clientX - centerX;
      const mouseRelY = event.clientY - centerY;
      
      const { x, y, angle } = getClosestPointOnCircle(
        mouseRelX + NODE_RADIUS,
        mouseRelY + NODE_RADIUS,
        NODE_RADIUS,
        NODE_RADIUS,
        NODE_RADIUS
      );
      
      setHandlePos({
        x: x - NODE_RADIUS,
        y: y - NODE_RADIUS,
        angle,
        visible: true,
      });
    } else {
      setHandlePos(prev => ({ ...prev, visible: false }));
    }
  };

  const handleMouseLeave = () => {
    setHandlePos(prev => ({ ...prev, visible: false }));
  };

  return (
    // Outer container includes outer threshold for mouse detection
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        width: NODE_CONTAINER_SIZE,
        height: NODE_CONTAINER_SIZE,
        position: 'relative',
        // Cursor is 'crosshair' in edge zone, CSS handles 'grab/grabbing' for dragging
        cursor: handlePos.visible ? 'crosshair' : undefined,
      }}
    >
      {/* The visual circle - centered within the larger container */}
      <div
        className="circular-node"
        style={{
          width: NODE_RADIUS * 2,
          height: NODE_RADIUS * 2,
          borderRadius: '50%',
          background: NODE_COLORS.default.background,
          border: `2px solid ${NODE_COLORS.default.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: NODE_COLORS.default.text,
          fontWeight: 500,
          fontSize: '14px',
          position: 'absolute',
          left: NODE_OUTER_THRESHOLD,
          top: NODE_OUTER_THRESHOLD,
          transition: 'box-shadow 0.2s',
          zIndex: 0,
        }}
      >
        <div style={{ pointerEvents: 'none' }}>
          {(data as BaseNodeData)?.label || ''}
        </div>
      </div>
      
      {/* Visual indicator dot - shows where connection point will be */}
      {handlePos.visible && (
        <div
          style={{
            position: 'absolute',
            width: HANDLE_INDICATOR.size,
            height: HANDLE_INDICATOR.size,
            background: HANDLE_INDICATOR.color,
            border: `2px solid ${HANDLE_INDICATOR.borderColor}`,
            borderRadius: '50%',
            left: `calc(50% + ${handlePos.x}px)`,
            top: `calc(50% + ${handlePos.y}px)`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none', // Don't interfere with handle clicks
            zIndex: 15,
          }}
        />
      )}
      
      {/* Large invisible source handle - covers sensor area for starting connections */}
      <Handle
        type="source"
        position={Position.Top}
        id="dynamic-source"
        style={{
          position: 'absolute',
          background: 'transparent',
          border: 'none',
          // Cover the entire sensor area
          width: NODE_CONTAINER_SIZE,
          height: NODE_CONTAINER_SIZE,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          // Only intercept when in connection zone, otherwise let node be draggable
          pointerEvents: handlePos.visible ? 'auto' : 'none',
          zIndex: 3,
          cursor: 'crosshair',
        }}
      />
      
      {/* Large invisible target handle - covers sensor area for receiving connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="dynamic-target"
        style={{
          position: 'absolute',
          background: 'transparent',
          border: 'none',
          // Cover the entire sensor area
          width: NODE_CONTAINER_SIZE,
          height: NODE_CONTAINER_SIZE,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          // Only intercept when in connection zone, otherwise let node be draggable
          pointerEvents: handlePos.visible ? 'auto' : 'none',
          zIndex: 2,
          cursor: 'crosshair',
        }}
      />
    </div>
  );
}
