import { useAppSelector } from '../../store/hooks';
import { selectNodes, selectEdges } from '../../store/slices/diagramSlice';
import panelStyles from './Panel.module.css';

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
      <div className={panelStyles.panel}>
        <div className={panelStyles.panelTitle}>
          Connections
        </div>
        <div className={panelStyles.panelEmpty}>
          No connections yet. Connect nodes to see their relationships here.
        </div>
      </div>
    );
  }

  return (
    <div className={panelStyles.panel}>
      {/* Header */}
      <div className={panelStyles.panelTitle}>
        Connections ({regularEdges.length})
      </div>

      {/* Connections list */}
      <div className={panelStyles.panelSection}>
        {regularEdges.map(edge => {
          const sourceLabel = nodeLabels.get(edge.source) || edge.source;
          const targetLabel = nodeLabels.get(edge.target) || edge.target;
          const arrowSymbol = getArrowSymbol(edge);
          const edgeType = getEdgeTypeLabel(edge);
          const edgeColor = getEdgeColor(edge);
          const isBidirectional = edge.data?.bidirectional;

          return (
            <div key={edge.id} className={panelStyles.item}>
              {/* Connection visualization */}
              <div className={panelStyles.itemRow} style={{ marginBottom: '4px' }}>
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
              <div className={panelStyles.itemRow} style={{ marginTop: '4px' }}>
                <span className={`${panelStyles.badge} ${edge.type === 'flow' ? panelStyles.badgeFlow : panelStyles.badgeLink}`}>
                  {edgeType}
                </span>
                {isBidirectional && (
                  <span className={`${panelStyles.badge} ${panelStyles.badgeSecondary}`}>
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

