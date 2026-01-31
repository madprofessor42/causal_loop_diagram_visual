import { useState } from 'react';
import { Handle, Position, NodeResizer, useConnection, type NodeProps } from '@xyflow/react';
import { useSelector } from 'react-redux';
import {
  VARIABLE_WIDTH,
  VARIABLE_HEIGHT,
  VARIABLE_COLORS,
} from '../../constants';
import type { VariableNodeData } from '../../types';
import { selectConnectionMode, selectHighlightedLoop } from '../../store/slices/uiSlice';

// Center handle size - small circle that must be precisely targeted
const CENTER_HANDLE_SIZE = 14;
const CENTER_HANDLE_COLOR = '#22c55e';
const CENTER_HANDLE_BORDER = '#16a34a';

/**
 * VariableNode - Formula or constant node (orange oval)
 * 
 * Connection logic:
 * - Source: Small center point - must precisely hover to start connection
 * - Target: Entire node area - active only when dragging a connection
 */
export function VariableNode({ data, selected, id }: NodeProps) {
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  
  // Check if there's a connection being drawn
  const connection = useConnection();
  const isConnecting = connection.inProgress;
  
  // Get current connection mode
  const connectionMode = useSelector(selectConnectionMode);
  const showCenterHandle = connectionMode === 'link';

  // Check if this node is highlighted as part of a loop
  const highlightedLoop = useSelector(selectHighlightedLoop);
  const isHighlighted = highlightedLoop?.nodeIds.includes(id);

  const nodeData = data as VariableNodeData;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Resize handles - only visible when node is selected */}
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={50}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: '50%',
        }}
      />
      
      {/* The visual oval */}
      <div
        className="variable-node"
        style={{
          width: '100%',
          height: '100%',
          background: VARIABLE_COLORS.background,
          border: isHighlighted 
            ? '3px solid #22c55e' 
            : `2px solid ${VARIABLE_COLORS.border}`,
          borderRadius: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: VARIABLE_COLORS.text,
          fontWeight: 500,
          fontSize: '14px',
          boxShadow: isHighlighted 
            ? '0 0 0 3px rgba(34, 197, 94, 0.2)' 
            : 'none',
        }}
      >
        <div style={{ pointerEvents: 'none' }}>{nodeData?.label || 'Variable'}</div>
      </div>

      {/* Center handle indicator - visible only in link mode, highlights on hover */}
      <div
        style={{
          position: 'absolute',
          width: CENTER_HANDLE_SIZE,
          height: CENTER_HANDLE_SIZE,
          background: isHoveringHandle ? CENTER_HANDLE_COLOR : 'rgba(34, 197, 94, 0.4)',
          border: `2px solid ${isHoveringHandle ? CENTER_HANDLE_BORDER : 'rgba(22, 163, 74, 0.6)'}`,
          borderRadius: '50%',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 15,
          transition: 'all 0.15s ease',
          opacity: showCenterHandle ? 1 : 0,
        }}
      />

      {/* Source handle - exactly at center, small size for starting connections */}
      {/* Always in DOM for existing edges, but only interactive in link mode */}
      <Handle
        type="source"
        position={Position.Top}
        id="source"
        onMouseEnter={() => setIsHoveringHandle(true)}
        onMouseLeave={() => setIsHoveringHandle(false)}
        style={{
          position: 'absolute',
          width: CENTER_HANDLE_SIZE,
          height: CENTER_HANDLE_SIZE,
          background: 'transparent',
          border: 'none',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          cursor: showCenterHandle ? 'crosshair' : 'default',
          zIndex: 20,
          // Disable pointer events when not in link mode
          pointerEvents: showCenterHandle ? 'auto' : 'none',
        }}
      />

      {/* Target handle - covers entire node, only active when connection is being drawn */}
      {/* Always in DOM for existing edges, but only interactive when connecting in link mode */}
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'transparent',
          border: 'none',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          zIndex: 10,
          // Only enable pointer events when actively connecting in link mode
          pointerEvents: (isConnecting && showCenterHandle) ? 'auto' : 'none',
        }}
      />
    </div>
  );
}
