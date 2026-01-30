import { useState, useRef } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { getClosestPointOnCircle, getDistance } from '../utils/geometry';

// The visual circle radius
const RADIUS = 40;
// How far inside the circle edge to start showing handles
const INNER_THRESHOLD = 10;
// How far outside the circle edge to keep showing handles
const OUTER_THRESHOLD = 5;

export function CircularNode({ data }: NodeProps) {
  const [handlePos, setHandlePos] = useState({ x: 0, y: 0, angle: 0, visible: false });
  const containerRef = useRef<HTMLDivElement>(null);

  // Container size includes outer threshold for mouse detection
  const containerSize = (RADIUS + OUTER_THRESHOLD) * 2;
  const sensorSize = containerSize;

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    // Get the container's bounding rect for accurate center calculation
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Calculate center of the visual circle (container is larger, circle is centered)
    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;

    // Calculate actual rendered radius (accounts for zoom)
    // Container width = (RADIUS + OUTER_THRESHOLD) * 2, so actual circle radius is:
    const actualContainerRadius = containerRect.width / 2;
    const scale = actualContainerRadius / (RADIUS + OUTER_THRESHOLD);
    const actualRadius = RADIUS * scale;
    const actualOuterThreshold = OUTER_THRESHOLD * scale;
    const actualInnerThreshold = INNER_THRESHOLD * scale;

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
        mouseRelX + RADIUS,
        mouseRelY + RADIUS,
        RADIUS,
        RADIUS,
        RADIUS
      );
      
      setHandlePos({
        x: x - RADIUS,
        y: y - RADIUS,
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
        width: containerSize,
        height: containerSize,
        position: 'relative',
        // Cursor is 'crosshair' in edge zone, CSS handles 'grab/grabbing' for dragging
        cursor: handlePos.visible ? 'crosshair' : undefined,
      }}
    >
      {/* The visual circle - centered within the larger container */}
      <div
        className="circular-node"
        style={{
          width: RADIUS * 2,
          height: RADIUS * 2,
          borderRadius: '50%',
          background: '#6366f1',
          border: '2px solid #4338ca',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 500,
          fontSize: '14px',
          position: 'absolute',
          left: OUTER_THRESHOLD,
          top: OUTER_THRESHOLD,
          transition: 'box-shadow 0.2s',
          zIndex: 0,
        }}
      >
        <div style={{ pointerEvents: 'none' }}>{data?.label as string || ''}</div>
      </div>
      
      {/* Visual indicator dot - shows where connection point will be */}
      {handlePos.visible && (
        <div
          style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            background: '#22c55e',
            border: '2px solid #16a34a',
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
          width: sensorSize,
          height: sensorSize,
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
          width: sensorSize,
          height: sensorSize,
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

