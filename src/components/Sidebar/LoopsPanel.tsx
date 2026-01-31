import { useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectNodes, selectEdges } from '../../store/slices/diagramSlice';
import { uiActions } from '../../store/slices/uiSlice';
import { findCycles } from '../../utils/graph';
import type { Cycle } from '../../utils/graph';

export function LoopsPanel() {
  const dispatch = useAppDispatch();
  const nodes = useAppSelector(selectNodes);
  const edges = useAppSelector(selectEdges);

  // Find all cycles in the graph
  const cycles = useMemo(() => {
    return findCycles(nodes, edges);
  }, [nodes, edges]);

  // Create a map of node IDs to labels for quick lookup
  const nodeLabels = useMemo(() => {
    return new Map(nodes.map(node => [node.id, node.data.label || node.id]));
  }, [nodes]);

  // Helper to get loop polarity symbol
  const getLoopSymbol = (_cycle: Cycle) => {
    // For now, we use a generic loop symbol
    // In future, we can add polarity detection (+ or -)
    return '↻'; // Circular arrow
  };

  // Helper to get loop color - using single neutral color for all loops
  const getLoopColor = (_length: number) => {
    return '#6b7280'; // Gray for all loops
  };

  // Helper to format loop description
  const formatLoopPath = (cycle: Cycle) => {
    const labels = cycle.nodeIds.map(nodeId => nodeLabels.get(nodeId) || nodeId);
    return labels.join(' → ') + ' → ' + labels[0];
  };

  // Handle mouse enter on loop item
  const handleLoopMouseEnter = (cycle: Cycle) => {
    dispatch(uiActions.setHighlightedLoop({
      nodeIds: cycle.nodeIds,
      edgeIds: cycle.edgeIds,
    }));
  };

  // Handle mouse leave on loop item
  const handleLoopMouseLeave = () => {
    dispatch(uiActions.clearHighlightedLoop());
  };

  if (cycles.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '8px',
          }}
        >
          Feedback Loops
        </div>
        <div
          style={{
            fontSize: '12px',
            color: '#6b7280',
            fontStyle: 'italic',
          }}
        >
          No feedback loops detected. Create connections to form loops.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#111827',
          marginBottom: '8px',
        }}
      >
        Feedback Loops ({cycles.length})
      </div>

      <div
        style={{
          fontSize: '11px',
          color: '#6b7280',
          marginBottom: '12px',
          lineHeight: 1.4,
        }}
      >
        Cycles where paths return to their starting point
      </div>

      {/* Loops list */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {cycles.map((cycle, index) => {
          const loopSymbol = getLoopSymbol(cycle);
          const loopColor = getLoopColor(cycle.length);
          const loopPath = formatLoopPath(cycle);

          return (
            <div
              key={`cycle-${index}`}
              onMouseEnter={() => handleLoopMouseEnter(cycle)}
              onMouseLeave={handleLoopMouseLeave}
              style={{
                padding: '10px 12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '12px',
                cursor: 'pointer',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f0fdf4';
                e.currentTarget.style.borderColor = '#86efac';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              {/* Loop header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '18px',
                    color: loopColor,
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}
                >
                  {loopSymbol}
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color: '#111827',
                      }}
                    >
                      Loop {index + 1}
                    </span>
                    <span
                      style={{
                        padding: '2px 6px',
                        backgroundColor: loopColor,
                        color: '#ffffff',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 600,
                      }}
                    >
                      {cycle.length} nodes
                    </span>
                  </div>
                </div>
              </div>

              {/* Loop path visualization */}
              <div
                style={{
                  padding: '8px',
                  backgroundColor: '#ffffff',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb',
                  fontSize: '11px',
                  color: '#374151',
                  lineHeight: 1.6,
                  wordBreak: 'break-word',
                }}
              >
                {loopPath}
              </div>

              {/* Loop metadata */}
              <div
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                {cycle.length === 2 && (
                  <span
                    style={{
                      padding: '2px 6px',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 500,
                      border: '1px solid #fecaca',
                    }}
                  >
                    Direct Feedback
                  </span>
                )}
                {cycle.length > 5 && (
                  <span
                    style={{
                      padding: '2px 6px',
                      backgroundColor: '#faf5ff',
                      color: '#7c3aed',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 500,
                      border: '1px solid #e9d5ff',
                    }}
                  >
                    Complex Loop
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info box */}
      {cycles.length > 0 && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 10px',
            backgroundColor: '#eff6ff',
            borderRadius: '6px',
            border: '1px solid #dbeafe',
            fontSize: '11px',
            color: '#1e40af',
            lineHeight: 1.5,
          }}
        >
          <strong>💡 Tip:</strong> Feedback loops are fundamental to system dynamics. 
          They represent circular causality in your model.
        </div>
      )}
    </div>
  );
}

