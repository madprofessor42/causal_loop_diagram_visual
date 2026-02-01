import { memo } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import type { StockNodeData } from '../../types';
import { useNodeHighlight, useNodeHandles } from '../../hooks';
import { RESIZER_CONFIG } from '../../constants';
import styles from './StockNode.module.css';

/**
 * StockNode - Accumulator node (blue rectangle)
 * 
 * Connection logic:
 * - Source: Small center point - must precisely hover to start connection
 * - Target: Entire node area - active only when dragging a connection
 */
function StockNodeComponent({ data, selected, id }: NodeProps) {
  // Use custom hooks for highlight and handles logic
  const { isHighlighted } = useNodeHighlight(id);
  const { isHoveringHandle, setIsHoveringHandle, isConnecting } = useNodeHandles('stock');

  const nodeData = data as StockNodeData;

  return (
    <div className={styles.container}>
      {/* Resize handles - only visible when node is selected */}
      <NodeResizer
        isVisible={selected}
        {...RESIZER_CONFIG}
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

// Memoize to prevent unnecessary re-renders
export const StockNode = memo(StockNodeComponent);
