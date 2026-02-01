import { useAppSelector } from '../../store/hooks';
import { selectNodes, selectEdges } from '../../store/slices/diagramSlice';
import panelStyles from './Panel.module.css';
import styles from './ConnectionsPanel.module.css';

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

  // Helper to get arrow CSS class
  const getArrowClass = (edge: typeof edges[0]) => {
    return edge.type === 'flow' ? styles.arrowFlow : styles.arrowLink;
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
          const arrowClass = getArrowClass(edge);
          const isBidirectional = edge.data?.bidirectional;

          return (
            <div key={edge.id} className={panelStyles.item}>
              {/* Connection visualization */}
              <div className={`${panelStyles.itemRow} ${styles.connectionRow}`}>
                <span
                  className={styles.nodeLabel}
                  title={sourceLabel}
                >
                  {sourceLabel}
                </span>
                <span className={`${styles.arrowSymbol} ${arrowClass}`}>
                  {arrowSymbol}
                </span>
                <span
                  className={styles.nodeLabel}
                  title={targetLabel}
                >
                  {targetLabel}
                </span>
              </div>

              {/* Edge type badge */}
              <div className={`${panelStyles.itemRow} ${styles.badgesRow}`}>
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
                <div className={styles.edgeLabel}>
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

