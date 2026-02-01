import { memo } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import type { VariableNodeData } from '../../types';
import { useNodeHighlight, useNodeHandles } from '../../hooks';
import { RESIZER_CONFIG } from '../../constants';
import styles from './VariableNode.module.css';

/**
 * VariableNode - Formula or constant node (orange oval)
 * 
 * Connection logic:
 * - Source: Small center point - must precisely hover to start connection
 * - Target: Entire node area - active only when dragging a connection
 */
function VariableNodeComponent({ data, selected, id }: NodeProps) {
  // Use custom hooks for highlight and handles logic
  const { isHighlighted } = useNodeHighlight(id);
  const { isHoveringHandle, setIsHoveringHandle, showCenterHandle, isConnecting, canBeTarget } = useNodeHandles('variable');

  const nodeData = data as VariableNodeData;

  return (
    <div className={styles.container}>
      {/* Resize handles - only visible when node is selected */}
      <NodeResizer
        isVisible={selected}
        {...RESIZER_CONFIG}
      />
      
      {/* The visual oval */}
      <div className={`${styles.shape} ${isHighlighted ? styles.highlighted : ''}`}>
        <div className={styles.label}>{nodeData?.label || 'Variable'}</div>
      </div>

      {/* Center handle indicator - visible only in link mode, highlights on hover */}
      <div 
        className={`${styles.handleIndicator} ${showCenterHandle ? styles.visible : ''} ${isHoveringHandle ? styles.active : ''}`}
      />

      {/* Source handle - exactly at center, small size for starting connections */}
      {/* Always in DOM for existing edges, but only interactive in link mode */}
      <Handle
        type="source"
        position={Position.Top}
        id="source"
        onMouseEnter={() => setIsHoveringHandle(true)}
        onMouseLeave={() => setIsHoveringHandle(false)}
        className={styles.handleSource}
        style={{
          cursor: showCenterHandle ? 'crosshair' : 'default',
          pointerEvents: showCenterHandle ? 'auto' : 'none',
        }}
      />

      {/* Target handle - covers entire node, only active when connection is being drawn */}
      {/* Always in DOM for existing edges, but only interactive when connecting in link mode */}
      {/* In flow mode, Variable CANNOT be a target (only Stock -> Stock allowed) */}
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        className={styles.handleTarget}
        isConnectable={canBeTarget}
        style={{
          pointerEvents: (isConnecting && canBeTarget) ? 'auto' : 'none',
        }}
      />
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const VariableNode = memo(VariableNodeComponent);
