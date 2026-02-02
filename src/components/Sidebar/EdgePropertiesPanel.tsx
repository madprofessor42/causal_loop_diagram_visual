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
  const isLink = selectedEdge.type === 'link';
  
  // Check if this is a Link connected to a Flow edge
  const linkData = isLink ? (edgeData as LinkEdgeData | undefined) : undefined;
  const isLinkToFlow = linkData?.targetIsFlowEdge ?? false;
  const isLinkFromFlow = linkData?.sourceIsFlowEdge ?? false;
  const isLinkConnectedToFlow = isLinkToFlow || isLinkFromFlow;
  
  // Flow-specific data
  const flowData = isFlow ? (edgeData as FlowEdgeData | undefined) : undefined;
  
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
          {isFlow ? 'Flow Properties' : 'Link Edge'}
        </div>
        <button onClick={handleClose} className={styles.closeButton}>
          ×
        </button>
      </div>
      
      {/* Edge info */}
      <div className={styles.info}>
        <Badge variant={isFlow ? 'flow' : 'neutral'}>{isFlow ? 'Flow' : 'Link'}</Badge>
        {flowData?.name && <span className={styles.infoName}>{flowData.name}</span>}
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
        
        {/* Info about current direction for Links connected to Flow */}
        {isLinkConnectedToFlow && (
          <div className={styles.infoText}>
            {(() => {
              // For Links TO Flow: normal = Node→Flow, reversed = Flow→Node
              // For Links FROM Flow: normal = Flow→Node, reversed = Node→Flow
              if (isLinkToFlow) {
                return linkData?.reversed ? 'Direction: Flow → Node' : 'Direction: Node → Flow';
              } else {
                return linkData?.reversed ? 'Direction: Node → Flow' : 'Direction: Flow → Node';
              }
            })()}
          </div>
        )}
      </div>
      
      {/* Flow-specific fields */}
      {isFlow && (
        <>
          {/* Name field - used in formulas */}
          <FormField
            label="Name"
            value={flowData?.name ?? ''}
            onChange={(value) => {
              dispatch(diagramActions.updateEdgeData({
                id: selectedEdge.id,
                data: { name: value || undefined },
              }));
            }}
            placeholder="e.g., Births, Infections..."
            hint="Used in formulas as [Name]"
          />
          
          {/* Rate/Formula field */}
          <FormField
            label="Rate / Formula"
            value={flowData?.rate ?? ''}
            onChange={(value) => {
              dispatch(diagramActions.updateEdgeData({
                id: selectedEdge.id,
                data: { rate: value || undefined },
              }));
            }}
            placeholder="e.g., 10 or [Stock] * 0.1"
            hint="Use [NodeName] to reference other primitives"
            monospace
          />
          
          {/* Units field */}
          <FormField
            label="Units"
            value={flowData?.units ?? ''}
            onChange={(value) => {
              dispatch(diagramActions.updateEdgeData({
                id: selectedEdge.id,
                data: { units: value || undefined },
              }));
            }}
            placeholder="e.g., people/year, kg/day"
          />
        </>
      )}
      
      {/* Label input (for display, different from Name) */}
      <FormField
        label={isFlow ? "Display Label" : "Label"}
        value={edgeData?.label ?? ''}
        onChange={(value) => {
          dispatch(diagramActions.updateEdgeData({
            id: selectedEdge.id,
            data: { label: value || undefined },
          }));
        }}
        placeholder="Enter label..."
      />
      
      {/* Notes field - for Flow only (Link doesn't need extensive notes) */}
      {isFlow && (
        <FormField
          label="Notes"
          type="textarea"
          value={flowData?.notes ?? ''}
          onChange={(value) => {
            dispatch(diagramActions.updateEdgeData({
              id: selectedEdge.id,
              data: { notes: value || undefined },
            }));
          }}
          placeholder="Add description or notes..."
          rows={4}
        />
      )}
      
      {/* Delete button */}
      <button onClick={handleDelete} className={`${styles.button} ${styles.buttonDanger}`}>
        Delete Edge
      </button>
    </div>
  );
}
