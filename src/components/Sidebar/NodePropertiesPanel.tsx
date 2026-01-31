import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectSelectedNodeId } from '../../store/slices/uiSlice';
import { selectNodes, diagramActions } from '../../store/slices/diagramSlice';
import type { StockNodeData, VariableNodeData } from '../../types';

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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
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
        {isStock ? 'Stock Properties' : 'Variable Properties'}
      </div>
      
      {/* Node type badge */}
      <div
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500,
          background: isStock ? '#dbeafe' : '#fed7aa',
          color: isStock ? '#1e40af' : '#9a3412',
          width: 'fit-content',
        }}
      >
        {isStock ? 'Stock' : 'Variable'}
      </div>
      
      {/* Label field */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: '#374151',
          }}
        >
          Name
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => handleLabelChange(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px',
            outline: 'none',
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
        />
      </div>
      
      {/* Stock-specific fields */}
      {isStock && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#374151',
            }}
          >
            Initial Value
          </label>
          <input
            type="number"
            value={initialValue}
            onChange={(e) => handleInitialValueChange(e.target.value)}
            placeholder="0"
            style={{
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              outline: 'none',
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>
      )}
      
      {/* Variable-specific fields */}
      {!isStock && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#374151',
            }}
          >
            Formula / Value
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="e.g., 100 or [Stock1] * 0.5"
            style={{
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              outline: 'none',
              fontFamily: 'monospace',
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
          <div
            style={{
              fontSize: '11px',
              color: '#6b7280',
              marginTop: '2px',
            }}
          >
            Use [NodeName] to reference other nodes
          </div>
        </div>
      )}
      
      {/* Units field */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: '#374151',
          }}
        >
          Units
        </label>
        <input
          type="text"
          value={units}
          onChange={(e) => handleUnitsChange(e.target.value)}
          placeholder="e.g., people, kg, $"
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px',
            outline: 'none',
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
        />
      </div>
      
      {/* Notes field */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: '#374151',
          }}
        >
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Add description or notes..."
          rows={4}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
        />
      </div>
      
      {/* Divider */}
      <div
        style={{
          height: '1px',
          background: '#e5e7eb',
          margin: '8px 0',
        }}
      />
      
      {/* Node ID (read-only) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Node ID
        </label>
        <div
          style={{
            padding: '6px 8px',
            background: '#f3f4f6',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#6b7280',
            fontFamily: 'monospace',
          }}
        >
          {selectedNode.id}
        </div>
      </div>
    </div>
  );
}

