import { useState } from 'react';
import { Handle, Position, NodeResizer, useConnection, type NodeProps } from '@xyflow/react';
import { useSelector } from 'react-redux';
import type { StockNodeData } from '../../types';
import { selectHighlightedLoop } from '../../store/slices/uiSlice';
import styles from './StockNode.module.css';

/**
 * StockNode - Accumulator node (blue rectangle)
 * 
 * Connection logic:
 * - Source: Small center point - must precisely hover to start connection
 * - Target: Entire node area - active only when dragging a connection
 */
export function StockNode({ data, selected, id }: NodeProps) {
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  
  // Check if there's a connection being drawn
  const connection = useConnection();
  const isConnecting = connection.inProgress;

  // Check if this node is highlighted as part of a loop
  const highlightedLoop = useSelector(selectHighlightedLoop);
  const isHighlighted = highlightedLoop?.nodeIds.includes(id);

  const nodeData = data as StockNodeData;

  return (
    <div className={styles.container}>
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
      
      {/* The visual rectangle */}
      <div className={`${styles.shape} ${isHighlighted ? styles.highlighted : ''}`}>
        <div className={styles.label}>{nodeData?.label || 'Stock'}</div>
      </div>

      {/* Center handle indicator - always visible for Stock, highlights on hover */}
      <div className={`${styles.handleIndicator} ${isHoveringHandle ? styles.active : ''}`} />

      {/* Source handle - exactly at center, small size for starting connections */}
      <Handle
        type="source"
        position={Position.Top}
        id="source"
        onMouseEnter={() => setIsHoveringHandle(true)}
        onMouseLeave={() => setIsHoveringHandle(false)}
        className={styles.handleSource}
      />

      {/* Target handle - covers entire node, only active when connection is being drawn */}
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        className={styles.handleTarget}
        style={{ pointerEvents: isConnecting ? 'auto' : 'none' }}
      />
    </div>
  );
}
