import { useAppSelector } from '../../store/hooks';
import { selectNodes, selectEdges } from '../../store/slices/diagramSlice';
import type { LinkEdgeData, FlowEdgeData } from '../../types';
import panelStyles from './Panel.module.css';
import styles from './ConnectionsPanel.module.css';

export function ConnectionsPanel() {
  const nodes = useAppSelector(selectNodes);
  const edges = useAppSelector(selectEdges);

  // Create a map of node IDs to labels for quick lookup
  const nodeLabels = new Map(
    nodes.map(node => [node.id, node.data.label || node.id])
  );
  
  // Create a map of Flow edge IDs to labels for Links that target Flow edges
  const flowEdgeLabels = new Map(
    edges
      .filter(e => e.type === 'flow')
      .map(e => {
        const flowData = e.data as FlowEdgeData | undefined;
        return [e.id, flowData?.name || flowData?.label || `Flow`];
      })
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
          // For Links that target or source from Flow edges
          const linkData = edge.data as LinkEdgeData | undefined;
          const isLinkToFlow = edge.type === 'link' && linkData?.targetIsFlowEdge && linkData?.targetFlowEdgeId;
          const isLinkFromFlow = edge.type === 'link' && linkData?.sourceIsFlowEdge && linkData?.sourceFlowEdgeId;
          const isReversed = linkData?.reversed ?? false;
          
          // Determine source and target labels
          let displaySourceLabel: string;
          let displayTargetLabel: string;
          let displaySourceIsFlow = false;
          let displayTargetIsFlow = false;
          
          if (isLinkFromFlow) {
            // Link originates from a Flow edge
            const nodeLabel = nodeLabels.get(edge.source) || edge.source;
            const flowLabel = flowEdgeLabels.get(linkData!.sourceFlowEdgeId!) || 'Flow';
            
            if (isReversed) {
              // Reversed: Node → Flow
              displaySourceLabel = nodeLabel;
              displayTargetLabel = flowLabel;
              displayTargetIsFlow = true;
            } else {
              // Normal: Flow → Node
              displaySourceLabel = flowLabel;
              displayTargetLabel = nodeLabel;
              displaySourceIsFlow = true;
            }
          } else if (isLinkToFlow) {
            const nodeLabel = nodeLabels.get(edge.source) || edge.source;
            const flowLabel = flowEdgeLabels.get(linkData!.targetFlowEdgeId!) || 'Flow';
            
            if (isReversed) {
              // Reversed: Flow → Node
              displaySourceLabel = flowLabel;
              displayTargetLabel = nodeLabel;
              displaySourceIsFlow = true;
            } else {
              // Normal: Node → Flow
              displaySourceLabel = nodeLabel;
              displayTargetLabel = flowLabel;
              displayTargetIsFlow = true;
            }
          } else {
            displaySourceLabel = nodeLabels.get(edge.source) || edge.source;
            displayTargetLabel = nodeLabels.get(edge.target) || edge.target;
          }
          
          const arrowSymbol = getArrowSymbol(edge);
          const edgeType = getEdgeTypeLabel(edge);
          const arrowClass = getArrowClass(edge);
          const isBidirectional = edge.data?.bidirectional;

          return (
            <div key={edge.id} className={panelStyles.item}>
              {/* Connection visualization */}
              <div className={`${panelStyles.itemRow} ${styles.connectionRow}`}>
                <span
                  className={`${styles.nodeLabel} ${displaySourceIsFlow ? styles.flowTarget : ''}`}
                  title={displaySourceLabel}
                >
                  {displaySourceIsFlow ? `⚙ ${displaySourceLabel}` : displaySourceLabel}
                </span>
                <span className={`${styles.arrowSymbol} ${arrowClass}`}>
                  {arrowSymbol}
                </span>
                <span
                  className={`${styles.nodeLabel} ${displayTargetIsFlow ? styles.flowTarget : ''}`}
                  title={displayTargetLabel}
                >
                  {displayTargetIsFlow ? `⚙ ${displayTargetLabel}` : displayTargetLabel}
                </span>
              </div>

              {/* Edge type badge */}
              <div className={`${panelStyles.itemRow} ${styles.badgesRow}`}>
                <span className={`${panelStyles.badge} ${edge.type === 'flow' ? panelStyles.badgeFlow : panelStyles.badgeLink}`}>
                  {edgeType}
                </span>
                {isLinkFromFlow && (
                  <span className={`${panelStyles.badge} ${panelStyles.badgeSecondary}`}>
                    {isReversed ? '→ Flow' : '← Flow'}
                  </span>
                )}
                {isLinkToFlow && (
                  <span className={`${panelStyles.badge} ${panelStyles.badgeSecondary}`}>
                    {isReversed ? '← Flow' : '→ Flow'}
                  </span>
                )}
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

