import { useState } from 'react';
import { Handle, Position, NodeResizer, useConnection, type NodeProps } from '@xyflow/react';
import { useSelector } from 'react-redux';
import type { VariableNodeData } from '../../types';
import { selectConnectionMode, selectHighlightedLoop } from '../../store/slices/uiSlice';
import styles from './VariableNode.module.css';

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
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        className={styles.handleTarget}
        style={{
          pointerEvents: (isConnecting && showCenterHandle) ? 'auto' : 'none',
        }}
      />
    </div>
  );
}
