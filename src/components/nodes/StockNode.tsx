import { useState } from 'react';
import { Handle, Position, useConnection, type NodeProps } from '@xyflow/react';
import {
  STOCK_WIDTH,
  STOCK_HEIGHT,
  STOCK_COLORS,
} from '../../constants';
import type { StockNodeData } from '../../types';

// Center handle size - small circle that must be precisely targeted
const CENTER_HANDLE_SIZE = 14;
const CENTER_HANDLE_COLOR = '#22c55e';
const CENTER_HANDLE_BORDER = '#16a34a';

/**
 * StockNode - Accumulator node (blue rectangle)
 * 
 * Connection logic:
 * - Source: Small center point - must precisely hover to start connection
 * - Target: Entire node area - active only when dragging a connection
 */
export function StockNode({ data }: NodeProps) {
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  
  // Check if there's a connection being drawn
  const connection = useConnection();
  const isConnecting = connection.inProgress;

  const nodeData = data as StockNodeData;

  return (
    <div
      style={{
        width: STOCK_WIDTH,
        height: STOCK_HEIGHT,
        position: 'relative',
      }}
    >
      {/* The visual rectangle */}
      <div
        className="stock-node"
        style={{
          width: STOCK_WIDTH,
          height: STOCK_HEIGHT,
          background: STOCK_COLORS.background,
          border: `2px solid ${STOCK_COLORS.border}`,
          borderRadius: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: STOCK_COLORS.text,
          fontWeight: 500,
          fontSize: '14px',
        }}
      >
        <div style={{ pointerEvents: 'none' }}>{nodeData?.label || 'Stock'}</div>
        {nodeData?.initialValue !== undefined && (
          <div style={{ fontSize: '11px', opacity: 0.8, pointerEvents: 'none' }}>
            {nodeData.initialValue}
            {nodeData.units ? ` ${nodeData.units}` : ''}
          </div>
        )}
      </div>

      {/* Center handle indicator - always visible for Stock, highlights on hover */}
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

      {/* Source handle - exactly at center, small size for starting connections */}
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

      {/* Target handle - covers entire node, only active when connection is being drawn */}
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        style={{
          position: 'absolute',
          width: STOCK_WIDTH,
          height: STOCK_HEIGHT,
          background: 'transparent',
          border: 'none',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: 4,
          zIndex: 10,
          // Only enable pointer events when actively connecting
          pointerEvents: isConnecting ? 'auto' : 'none',
        }}
      />
    </div>
  );
}
