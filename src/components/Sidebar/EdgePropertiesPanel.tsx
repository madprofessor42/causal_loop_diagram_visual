import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectSelectedEdgeId, uiActions } from '../../store/slices/uiSlice';
import { selectEdges, diagramActions } from '../../store/slices/diagramSlice';
import type { CLDEdge, FlowEdgeData, LinkEdgeData } from '../../types';

/**
 * EdgePropertiesPanel - Shows properties and controls for selected edge
 */
export function EdgePropertiesPanel() {
  const dispatch = useAppDispatch();
  const selectedEdgeId = useAppSelector(selectSelectedEdgeId);
  const edges = useAppSelector(selectEdges);
  
  const selectedEdge = edges.find(e => e.id === selectedEdgeId) as CLDEdge | undefined;
  
  if (!selectedEdge) {
    return (
      <div style={{ padding: 16, color: '#6b7280', fontSize: 13 }}>
        Click on an edge to edit its properties
      </div>
    );
  }
  
  const edgeData = selectedEdge.data as (FlowEdgeData | LinkEdgeData) | undefined;
  const isBidirectional = edgeData?.bidirectional ?? false;
  const isFlow = selectedEdge.type === 'flow';
  
  const handleClose = () => {
    dispatch(uiActions.setSelectedEdge(null));
  };
  
  const handleToggleBidirectional = () => {
    dispatch(diagramActions.updateEdgeData({
      id: selectedEdge.id,
      data: { bidirectional: !isBidirectional },
    }));
  };
  
  const handleReverseDirection = () => {
    // Swap source and target
    dispatch(diagramActions.reverseEdgeDirection(selectedEdge.id));
  };
  
  const handleDelete = () => {
    dispatch(diagramActions.removeEdge(selectedEdge.id));
    dispatch(uiActions.setSelectedEdge(null));
  };
  
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#111827',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {isFlow ? 'Flow' : 'Link'} Edge
        </div>
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18,
            color: '#6b7280',
            padding: 4,
          }}
        >
          ×
        </button>
      </div>
      
      {/* Edge info */}
      <div
        style={{
          fontSize: 12,
          color: '#6b7280',
          background: '#f3f4f6',
          padding: 8,
          borderRadius: 4,
        }}
      >
        <div>ID: {selectedEdge.id.slice(0, 20)}...</div>
        <div>Type: {selectedEdge.type}</div>
      </div>
      
      {/* Direction controls */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#374151',
          }}
        >
          Direction
        </div>
        
        {/* Bidirectional toggle */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            fontSize: 13,
            color: '#4b5563',
          }}
        >
          <input
            type="checkbox"
            checked={isBidirectional}
            onChange={handleToggleBidirectional}
            style={{ cursor: 'pointer' }}
          />
          Bidirectional {isFlow ? '↔' : '⟷'}
        </label>
        
        {/* Reverse direction button */}
        {!isBidirectional && (
          <button
            onClick={handleReverseDirection}
            style={{
              padding: '8px 12px',
              borderRadius: 4,
              border: '1px solid #d1d5db',
              background: 'white',
              cursor: 'pointer',
              fontSize: 13,
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ⇄ Reverse Direction
          </button>
        )}
      </div>
      
      {/* Label input */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <label
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#374151',
          }}
        >
          Label
        </label>
        <input
          type="text"
          value={edgeData?.label ?? ''}
          onChange={(e) => {
            dispatch(diagramActions.updateEdgeData({
              id: selectedEdge.id,
              data: { label: e.target.value || undefined },
            }));
          }}
          placeholder="Enter label..."
          style={{
            padding: '8px 12px',
            borderRadius: 4,
            border: '1px solid #d1d5db',
            fontSize: 13,
          }}
        />
      </div>
      
      {/* Delete button */}
      <button
        onClick={handleDelete}
        style={{
          padding: '8px 12px',
          borderRadius: 4,
          border: 'none',
          background: '#ef4444',
          color: 'white',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
          marginTop: 8,
        }}
      >
        Delete Edge
      </button>
    </div>
  );
}
