import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectSelectedNodeId } from '../../store/slices/uiSlice';
import { selectNodes, diagramActions } from '../../store/slices/diagramSlice';
import type { StockNodeData, VariableNodeData } from '../../types';
import { FormField } from '../ui/FormField';
import { Badge } from '../ui/Badge';
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
      <Badge variant={isStock ? 'stock' : 'variable'}>
        {isStock ? 'Stock' : 'Variable'}
      </Badge>
      
      {/* Label field */}
      <FormField
        label="Name"
        value={label}
        onChange={handleLabelChange}
      />
      
      {/* Stock-specific fields */}
      {isStock && (
        <FormField
          label="Initial Value"
          type="number"
          value={initialValue}
          onChange={handleInitialValueChange}
          placeholder="0"
        />
      )}
      
      {/* Variable-specific fields */}
      {!isStock && (
        <FormField
          label="Formula / Value"
          value={value}
          onChange={handleValueChange}
          placeholder="e.g., 100 or [Stock1] * 0.5"
          hint="Use [NodeName] to reference other nodes"
          monospace
        />
      )}
      
      {/* Units field */}
      <FormField
        label="Units"
        value={units}
        onChange={handleUnitsChange}
        placeholder="e.g., people, kg, $"
      />
      
      {/* Notes field */}
      <FormField
        label="Notes"
        type="textarea"
        value={notes}
        onChange={handleNotesChange}
        placeholder="Add description or notes..."
        rows={4}
      />
      
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

