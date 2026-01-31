import { useAppSelector } from '../../store/hooks';
import { selectNodes, selectEdges } from '../../store/slices/diagramSlice';

export function ConnectionsPanel() {
  const nodes = useAppSelector(selectNodes);
  const edges = useAppSelector(selectEdges);

  // Create a map of node IDs to labels for quick lookup
  const nodeLabels = new Map(
    nodes.map(node => [node.id, node.data.label || node.id])
  );

  // Helper to get arrow symbol based on edge type and direction
  const getArrowSymbol = (edge: typeof edges[0]) => {
    const isBidirectional = edge.data?.bidirectional;
    const isFlow = edge.type === 'flow';
    
    if (isBidirectional) {
      return isFlow ? '⇄' : '↔'; // Bidirectional arrows
    }
    return isFlow ? '→' : '→'; // Unidirectional arrow
  };

  // Helper to get edge type label
  const getEdgeTypeLabel = (edge: typeof edges[0]) => {
    if (edge.type === 'flow') {
      return 'Flow';
    }
    return 'Link';
  };

  // Helper to get edge color
  const getEdgeColor = (edge: typeof edges[0]) => {
    if (edge.type === 'flow') {
      return '#3b82f6'; // Blue for flow
    }
    return '#6b7280'; // Gray for link
  };

  // Filter out cloud edges (edges to/from nowhere)
  const regularEdges = edges.filter(edge => {
    return !edge.data?.sourceIsCloud && !edge.data?.targetIsCloud;
  });

  if (regularEdges.length === 0) {
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
          Connections
        </div>
        <div
          style={{
            fontSize: '12px',
            color: '#6b7280',
            fontStyle: 'italic',
          }}
        >
          No connections yet. Connect nodes to see their relationships here.
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
          marginBottom: '12px',
        }}
      >
        Connections ({regularEdges.length})
      </div>

      {/* Connections list */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {regularEdges.map(edge => {
          const sourceLabel = nodeLabels.get(edge.source) || edge.source;
          const targetLabel = nodeLabels.get(edge.target) || edge.target;
          const arrowSymbol = getArrowSymbol(edge);
          const edgeType = getEdgeTypeLabel(edge);
          const edgeColor = getEdgeColor(edge);
          const isBidirectional = edge.data?.bidirectional;

          return (
            <div
              key={edge.id}
              style={{
                padding: '8px 12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '12px',
              }}
            >
              {/* Connection visualization */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontWeight: 500,
                    color: '#111827',
                    maxWidth: '35%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={sourceLabel}
                >
                  {sourceLabel}
                </span>
                <span
                  style={{
                    color: edgeColor,
                    fontSize: '16px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}
                >
                  {arrowSymbol}
                </span>
                <span
                  style={{
                    fontWeight: 500,
                    color: '#111827',
                    maxWidth: '35%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={targetLabel}
                >
                  {targetLabel}
                </span>
              </div>

              {/* Edge type badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '4px',
                }}
              >
                <span
                  style={{
                    padding: '2px 6px',
                    backgroundColor: edgeColor,
                    color: '#ffffff',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  {edgeType}
                </span>
                {isBidirectional && (
                  <span
                    style={{
                      padding: '2px 6px',
                      backgroundColor: '#f3f4f6',
                      color: '#6b7280',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 500,
                    }}
                  >
                    Bidirectional
                  </span>
                )}
              </div>

              {/* Optional label */}
              {edge.data?.label && (
                <div
                  style={{
                    marginTop: '4px',
                    color: '#6b7280',
                    fontSize: '11px',
                    fontStyle: 'italic',
                  }}
                >
                  "{edge.data.label}"
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

