import { useState } from 'react';
import { Handle, Position, useConnection, type NodeProps } from '@xyflow/react';
import { useSelector } from 'react-redux';
import {
  VARIABLE_WIDTH,
  VARIABLE_HEIGHT,
  VARIABLE_COLORS,
} from '../../constants';
import type { VariableNodeData } from '../../types';
import { selectConnectionMode } from '../../store/slices/uiSlice';

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
export function VariableNode({ data }: NodeProps) {
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  
  // Check if there's a connection being drawn
  const connection = useConnection();
  const isConnecting = connection.inProgress;
  
  // Get current connection mode
  const connectionMode = useSelector(selectConnectionMode);
  const showCenterHandle = connectionMode === 'link';

  const nodeData = data as VariableNodeData;

  return (
    <div
      style={{
        width: VARIABLE_WIDTH,
        height: VARIABLE_HEIGHT,
        position: 'relative',
      }}
    >
      {/* The visual oval */}
      <div
        className="variable-node"
        style={{
          width: VARIABLE_WIDTH,
          height: VARIABLE_HEIGHT,
          background: VARIABLE_COLORS.background,
          border: `2px solid ${VARIABLE_COLORS.border}`,
          borderRadius: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: VARIABLE_COLORS.text,
          fontWeight: 500,
          fontSize: '14px',
        }}
      >
        <div style={{ pointerEvents: 'none' }}>{nodeData?.label || 'Variable'}</div>
        {nodeData?.value !== undefined && (
          <div style={{ fontSize: '11px', opacity: 0.8, pointerEvents: 'none' }}>
            {nodeData.value}
          </div>
        )}
      </div>

      {/* Center handle indicator - visible only in link mode, highlights on hover */}
      {showCenterHandle && (
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
          }}
        />
      )}

      {/* Source handle - exactly at center, small size for starting connections */}
      {/* Only available in link mode - flow connections cannot start from Variable */}
      {showCenterHandle && (
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
            cursor: 'crosshair',
            zIndex: 20,
          }}
        />
      )}

      {/* Target handle - covers entire node, only active when connection is being drawn */}
      {/* Only available in link mode - flow connections cannot end at Variable */}
      {showCenterHandle && (
        <Handle
          type="target"
          position={Position.Top}
          id="target"
          style={{
            position: 'absolute',
            width: VARIABLE_WIDTH,
            height: VARIABLE_HEIGHT,
            background: 'transparent',
            border: 'none',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            zIndex: 10,
            // Only enable pointer events when actively connecting
            pointerEvents: isConnecting ? 'auto' : 'none',
          }}
        />
      )}
    </div>
  );
}
