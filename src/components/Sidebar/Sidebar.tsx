import { DraggableNodeItem } from './DraggableNodeItem';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div
        style={{
          width: 220,
          height: '100%',
          backgroundColor: '#f8f9fa',
          borderRight: '1px solid #e5e7eb',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxSizing: 'border-box',
        }}
      >
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
          <DraggableNodeItem nodeType="circular" label="Variable" />
        </div>
      </div>
    </aside>
  );
}
