import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectSelectedNodeId } from '../../store/slices/uiSlice';
import { selectNodes, diagramActions } from '../../store/slices/diagramSlice';
import type { StockNodeData, VariableNodeData } from '../../types';
import styles from './NodePropertiesPanel.module.css';

export function NodePropertiesPanel() {
  const dispatch = useAppDispatch();
  const selectedNodeId = useAppSelector(selectSelectedNodeId);
  const nodes = useAppSelector(selectNodes);
  
  // Find the selected node
  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  
  // Local state for form fields
  const [label, setLabel] = useState('');
  const [initialValue, setInitialValue] = useState('');
  const [value, setValue] = useState('');
  const [units, setUnits] = useState('');
  const [notes, setNotes] = useState('');
  
  // Update local state when selected node changes
  useEffect(() => {
    if (!selectedNode) return;
    
    // Sync form state with selected node data
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLabel(selectedNode.data.label || '');
     
    setNotes(selectedNode.data.notes || '');
     
    setUnits((selectedNode.data.units as string | undefined) || '');
    
    if (selectedNode.type === 'stock') {
      const stockData = selectedNode.data as StockNodeData;
       
      setInitialValue(stockData.initialValue?.toString() || '');
    } else if (selectedNode.type === 'variable') {
      const variableData = selectedNode.data as VariableNodeData;
       
      setValue(variableData.value || '');
    }
  }, [selectedNode]);
  
  if (!selectedNode) {
    return null;
  }
  
  const isStock = selectedNode.type === 'stock';
  
  // Handle changes and update Redux state
  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    dispatch(diagramActions.updateNodeData({
      id: selectedNode.id,
      data: { label: newLabel },
    }));
  };
  
  const handleInitialValueChange = (newValue: string) => {
    setInitialValue(newValue);
    const numValue = parseFloat(newValue);
    dispatch(diagramActions.updateNodeData({
      id: selectedNode.id,
      data: { initialValue: isNaN(numValue) ? undefined : numValue },
    }));
  };
  
  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    dispatch(diagramActions.updateNodeData({
      id: selectedNode.id,
      data: { value: newValue },
    }));
  };
  
  const handleUnitsChange = (newUnits: string) => {
    setUnits(newUnits);
    dispatch(diagramActions.updateNodeData({
      id: selectedNode.id,
      data: { units: newUnits },
    }));
  };
  
  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    dispatch(diagramActions.updateNodeData({
      id: selectedNode.id,
      data: { notes: newNotes },
    }));
  };
  
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.title}>
        {isStock ? 'Stock Properties' : 'Variable Properties'}
      </div>
      
      {/* Node type badge */}
      <div className={`${styles.badge} ${isStock ? styles.badgeStock : styles.badgeVariable}`}>
        {isStock ? 'Stock' : 'Variable'}
      </div>
      
      {/* Label field */}
      <div className={styles.field}>
        <label className={styles.label}>
          Name
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => handleLabelChange(e.target.value)}
          className={styles.input}
        />
      </div>
      
      {/* Stock-specific fields */}
      {isStock && (
        <div className={styles.field}>
          <label className={styles.label}>
            Initial Value
          </label>
          <input
            type="number"
            value={initialValue}
            onChange={(e) => handleInitialValueChange(e.target.value)}
            placeholder="0"
            className={styles.input}
          />
        </div>
      )}
      
      {/* Variable-specific fields */}
      {!isStock && (
        <div className={styles.field}>
          <label className={styles.label}>
            Formula / Value
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="e.g., 100 or [Stock1] * 0.5"
            className={`${styles.input} ${styles.monospace}`}
          />
          <div className={styles.hint}>
            Use [NodeName] to reference other nodes
          </div>
        </div>
      )}
      
      {/* Units field */}
      <div className={styles.field}>
        <label className={styles.label}>
          Units
        </label>
        <input
          type="text"
          value={units}
          onChange={(e) => handleUnitsChange(e.target.value)}
          placeholder="e.g., people, kg, $"
          className={styles.input}
        />
      </div>
      
      {/* Notes field */}
      <div className={styles.field}>
        <label className={styles.label}>
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Add description or notes..."
          rows={4}
          className={styles.textarea}
        />
      </div>
      
      {/* Divider */}
      <div className={styles.divider} />
      
      {/* Node ID (read-only) */}
      <div className={styles.idSection}>
        <label className={styles.idLabel}>
          Node ID
        </label>
        <div className={styles.idValue}>
          {selectedNode.id}
        </div>
      </div>
    </div>
  );
}

