import { DraggableNodeItem } from './DraggableNodeItem';
import { EdgePropertiesPanel } from './EdgePropertiesPanel';
import { NodePropertiesPanel } from './NodePropertiesPanel';
import { ResizeHandle } from './ResizeHandle';
import { ConnectionsPanel } from './ConnectionsPanel';
import { LoopsPanel } from './LoopsPanel';
import { useAppSelector } from '../../store/hooks';
import { selectSelectedEdgeId, selectSelectedNodeId, selectSidebarWidth } from '../../store/slices/uiSlice';

export function Sidebar() {
  const selectedEdgeId = useAppSelector(selectSelectedEdgeId);
  const selectedNodeId = useAppSelector(selectSelectedNodeId);
  const sidebarWidth = useAppSelector(selectSidebarWidth);
  
  return (
    <aside className="sidebar" style={{ position: 'relative', width: sidebarWidth }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f8f9fa',
          borderRight: '1px solid #e5e7eb',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        {/* Show edge properties panel if an edge is selected */}
        {selectedEdgeId ? (
          <EdgePropertiesPanel />
        ) : selectedNodeId ? (
          /* Show node properties panel if a node is selected */
          <NodePropertiesPanel />
        ) : (
          <>
            {/* Header */}
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#111827',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Nodes
            </div>
            
            {/* Description */}
            <div
              style={{
                fontSize: '12px',
                color: '#6b7280',
                lineHeight: 1.4,
              }}
            >
              Drag nodes to the canvas to create your diagram
            </div>
            
            {/* Node items */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <DraggableNodeItem nodeType="stock" label="Stock" />
              <DraggableNodeItem nodeType="variable" label="Variable" />
            </div>

            {/* Connections Panel */}
            <div style={{ marginTop: '16px' }}>
              <ConnectionsPanel />
            </div>

            {/* Feedback Loops Panel */}
            <div style={{ marginTop: '16px' }}>
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
