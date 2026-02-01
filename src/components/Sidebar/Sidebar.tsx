import { DraggableNodeItem } from './DraggableNodeItem';
import { EdgePropertiesPanel } from './EdgePropertiesPanel';
import { NodePropertiesPanel } from './NodePropertiesPanel';
import { ResizeHandle } from './ResizeHandle';
import { ConnectionsPanel } from './ConnectionsPanel';
import { LoopsPanel } from './LoopsPanel';
import { useAppSelector } from '../../store/hooks';
import { selectSelectedEdgeId, selectSelectedNodeId, selectSidebarWidth } from '../../store/slices/uiSlice';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const selectedEdgeId = useAppSelector(selectSelectedEdgeId);
  const selectedNodeId = useAppSelector(selectSelectedNodeId);
  const sidebarWidth = useAppSelector(selectSidebarWidth);
  
  return (
    <aside className={styles.sidebar} style={{ width: sidebarWidth }}>
      <div className={styles.container}>
        {/* Show edge properties panel if an edge is selected */}
        {selectedEdgeId ? (
          <EdgePropertiesPanel />
        ) : selectedNodeId ? (
          /* Show node properties panel if a node is selected */
          <NodePropertiesPanel />
        ) : (
          <>
            {/* Header */}
            <div className={styles.header}>
              Nodes
            </div>
            
            {/* Description */}
            <div className={styles.description}>
              Drag nodes to the canvas to create your diagram
            </div>
            
            {/* Node items */}
            <div className={styles.nodeItems}>
              <DraggableNodeItem nodeType="stock" label="Stock" />
              <DraggableNodeItem nodeType="variable" label="Variable" />
            </div>

            {/* Connections Panel */}
            <div className={styles.section}>
              <ConnectionsPanel />
            </div>

            {/* Feedback Loops Panel */}
            <div className={styles.section}>
              <LoopsPanel />
            </div>
          </>
        )}
      </div>
      
      {/* Resize handle */}
      <ResizeHandle />
    </aside>
  );
}
