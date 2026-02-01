import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectSelectedEdgeId, uiActions } from '../../store/slices/uiSlice';
import { selectEdges, diagramActions } from '../../store/slices/diagramSlice';
import type { CLDEdge, FlowEdgeData, LinkEdgeData } from '../../types';
import styles from './EdgePropertiesPanel.module.css';

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
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          {isFlow ? 'Flow' : 'Link'} Edge
        </div>
        <button onClick={handleClose} className={styles.closeButton}>
          ×
        </button>
      </div>
      
      {/* Edge info */}
      <div className={styles.info}>
        <div>ID: {selectedEdge.id.slice(0, 20)}...</div>
        <div>Type: {selectedEdge.type}</div>
      </div>
      
      {/* Direction controls */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
          Direction
        </div>
        
        {/* Bidirectional toggle */}
        <label className={styles.label}>
          <input
            type="checkbox"
            checked={isBidirectional}
            onChange={handleToggleBidirectional}
            className={styles.checkbox}
          />
          Bidirectional {isFlow ? '↔' : '⟷'}
        </label>
        
        {/* Reverse direction button */}
        {!isBidirectional && (
          <button onClick={handleReverseDirection} className={styles.button} style={{ marginTop: 8 }}>
            ⇄ Reverse Direction
          </button>
        )}
      </div>
      
      {/* Label input */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
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
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
      </div>
      
      {/* Delete button */}
      <button onClick={handleDelete} className={`${styles.button} ${styles.buttonDanger}`} style={{ marginTop: 8 }}>
        Delete Edge
      </button>
    </div>
  );
}
