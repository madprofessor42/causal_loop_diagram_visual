import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectSelectedEdgeId, uiActions } from '../../store/slices/uiSlice';
import { selectEdges, diagramActions } from '../../store/slices/diagramSlice';
import type { CLDEdge, FlowEdgeData, LinkEdgeData } from '../../types';
import { FormField } from '../ui/FormField';
import { Badge } from '../ui/Badge';
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
      <div className={styles.emptyState}>
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
        <Badge variant="neutral">{isFlow ? 'Flow' : 'Link'}</Badge>
        <div className={styles.infoText}>ID: {selectedEdge.id.slice(0, 20)}...</div>
      </div>
      
      {/* Direction controls */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>
          Direction
        </div>
        
        {/* Bidirectional toggle */}
        <label className={styles.checkboxLabel}>
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
          <button onClick={handleReverseDirection} className={styles.button}>
            ⇄ Reverse Direction
          </button>
        )}
      </div>
      
      {/* Label input */}
      <FormField
        label="Label"
        value={edgeData?.label ?? ''}
        onChange={(value) => {
          dispatch(diagramActions.updateEdgeData({
            id: selectedEdge.id,
            data: { label: value || undefined },
          }));
        }}
        placeholder="Enter label..."
      />
      
      {/* Delete button */}
      <button onClick={handleDelete} className={`${styles.button} ${styles.buttonDanger}`}>
        Delete Edge
      </button>
    </div>
  );
}
