import { useState, useRef, useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react';
import { getClosestPointOnCircle, getDistance } from '../utils/geometry';

// The visual circle radius
const RADIUS = 40;
// How far inside the circle edge to start showing handles
const INNER_THRESHOLD = 15;
// How far outside the circle edge to keep showing handles
const OUTER_THRESHOLD = 25;

export function CircularNode({ id, data }: NodeProps) {
  const [handlePos, setHandlePos] = useState({ x: 0, y: 0, angle: 0, visible: false });
  const circleRef = useRef<HTMLDivElement>(null);
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    if (handlePos.visible) {
      updateNodeInternals(id);
    }
  }, [handlePos, id, updateNodeInternals]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!circleRef.current) return;

    // Get the visual circle's bounding rect for accurate center calculation
    const circleRect = circleRef.current.getBoundingClientRect();
    
    // Calculate center of the visual circle
    const centerX = circleRect.left + circleRect.width / 2;
    const centerY = circleRect.top + circleRect.height / 2;

    // Calculate distance from mouse to circle center
    const distance = getDistance(centerX, centerY, event.clientX, event.clientY);
    
    // Connection zone: from inner threshold to sensor boundary (sensor handles outer limit via onMouseLeave)
    const minDistance = RADIUS - INNER_THRESHOLD; // 25px from center - not too far inside
    const nearEdge = distance >= minDistance;

    if (nearEdge) {
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

  const sensorSize = (RADIUS + OUTER_THRESHOLD) * 2;

  return (
    // Outer container at the exact node size for React Flow positioning
    <div
      style={{
        width: RADIUS * 2,
        height: RADIUS * 2,
        position: 'relative',
      }}
    >
      {/* The visual circle */}
      <div
        ref={circleRef}
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
          position: 'relative',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s',
          zIndex: 0,
          pointerEvents: 'none', // Let sensor handle events
        }}
      >
        <div>{data?.label as string || ''}</div>
      </div>
      
      {/* Invisible sensor area - extends beyond the visual circle, sits on top */}
      <div
        className="circular-node-sensor"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'absolute',
          // Center the sensor around the visual circle
          left: -OUTER_THRESHOLD,
          top: -OUTER_THRESHOLD,
          width: sensorSize,
          height: sensorSize,
          // Crosshair cursor when handle is visible, default otherwise
          cursor: handlePos.visible ? 'crosshair' : 'default',
          // Transparent background needed to capture mouse events on the entire area
          background: 'rgba(255,0,0,0.1)', // Debug: visible sensor
          borderRadius: '50%',
          zIndex: 1,
        }}
      />
      
      {/* Dynamic handle that follows the mouse around the edge */}
      <Handle
        type="source"
        position={Position.Top}
        id="dynamic-source"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          background: handlePos.visible ? '#22c55e' : 'transparent',
          border: handlePos.visible ? '2px solid #16a34a' : 'none',
          width: '12px',
          height: '12px',
          left: `calc(50% + ${handlePos.x}px)`,
          top: `calc(50% + ${handlePos.y}px)`,
          transform: 'translate(-50%, -50%)',
          opacity: handlePos.visible ? 1 : 0,
          pointerEvents: handlePos.visible ? 'auto' : 'none',
          transition: 'opacity 0.1s',
          zIndex: 10,
          cursor: 'crosshair',
        }}
      />
      
      {/* Target handle - also dynamic */}
      <Handle
        type="target"
        position={Position.Top}
        id="dynamic-target"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          background: handlePos.visible ? '#3b82f6' : 'transparent',
          border: handlePos.visible ? '2px solid #2563eb' : 'none',
          width: '12px',
          height: '12px',
          left: `calc(50% + ${handlePos.x}px)`,
          top: `calc(50% + ${handlePos.y}px)`,
          transform: 'translate(-50%, -50%)',
          opacity: handlePos.visible ? 1 : 0,
          pointerEvents: handlePos.visible ? 'auto' : 'none',
          transition: 'opacity 0.1s',
          zIndex: 10,
          cursor: 'crosshair',
        }}
      />
    </div>
  );
}

