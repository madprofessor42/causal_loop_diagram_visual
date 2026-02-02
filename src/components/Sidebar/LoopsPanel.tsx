import { useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectNodes, selectEdges } from '../../store/slices/diagramSlice';
import { uiActions } from '../../store/slices/uiSlice';
import { findCycles, isFlowVirtualNode, getFlowEdgeIdFromVirtual } from '../../utils/graph';
import type { Cycle } from '../../utils/graph';
import type { FlowEdgeData } from '../../types';
import panelStyles from './Panel.module.css';
import styles from './LoopsPanel.module.css';

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
  
  // Create a map of Flow edge IDs to labels for virtual Flow nodes
  const flowEdgeLabels = useMemo(() => {
    return new Map(
      edges
        .filter(e => e.type === 'flow')
        .map(e => {
          const flowData = e.data as FlowEdgeData | undefined;
          return [e.id, flowData?.name || flowData?.label || 'Flow'];
        })
    );
  }, [edges]);
  
  // Helper to get label for any node ID (real or virtual Flow)
  const getNodeLabel = (nodeId: string): string => {
    if (isFlowVirtualNode(nodeId)) {
      const flowEdgeId = getFlowEdgeIdFromVirtual(nodeId);
      if (flowEdgeId) {
        const label = flowEdgeLabels.get(flowEdgeId);
        return label ? `⚙${label}` : '⚙Flow';
      }
      return '⚙Flow';
    }
    return nodeLabels.get(nodeId) || nodeId;
  };

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
    const labels = cycle.nodeIds.map(nodeId => getNodeLabel(nodeId));
    return labels.join(' → ') + ' → ' + labels[0];
  };

  // Handle mouse enter on loop item
  const handleLoopMouseEnter = (cycle: Cycle) => {
    // Filter out virtual Flow nodes for highlighting - only highlight real nodes
    const realNodeIds = cycle.nodeIds.filter(id => !isFlowVirtualNode(id));
    
    dispatch(uiActions.setHighlightedLoop({
      nodeIds: realNodeIds,
      edgeIds: cycle.edgeIds,
    }));
  };
  
  // Helper to count real nodes in a cycle (excluding virtual Flow nodes)
  const getRealNodeCount = (cycle: Cycle): number => {
    return cycle.nodeIds.filter(id => !isFlowVirtualNode(id)).length;
  };

  // Handle mouse leave on loop item
  const handleLoopMouseLeave = () => {
    dispatch(uiActions.clearHighlightedLoop());
  };

  if (cycles.length === 0) {
    return (
      <div className={panelStyles.panel}>
        <div className={panelStyles.panelTitle}>
          Feedback Loops
        </div>
        <div className={panelStyles.panelEmpty}>
          No feedback loops detected. Create connections to form loops.
        </div>
      </div>
    );
  }

  return (
    <div className={panelStyles.panel}>
      {/* Header */}
      <div className={panelStyles.panelTitle}>
        Feedback Loops ({cycles.length})
      </div>

      <div className={panelStyles.panelSubtitle}>
        Cycles where paths return to their starting point
      </div>

      {/* Loops list */}
      <div className={panelStyles.panelSection}>
        {cycles.map((cycle, index) => {
          const loopSymbol = getLoopSymbol(cycle);
          const realNodeCount = getRealNodeCount(cycle);
          const loopColor = getLoopColor(realNodeCount);
          const loopPath = formatLoopPath(cycle);
          const hasFlowInLoop = cycle.nodeIds.some(id => isFlowVirtualNode(id));

          return (
            <div
              key={`cycle-${index}`}
              className={styles.loopItem}
              onMouseEnter={() => handleLoopMouseEnter(cycle)}
              onMouseLeave={handleLoopMouseLeave}
            >
              {/* Loop header */}
              <div className={styles.loopHeader}>
                <span className={styles.loopSymbol} style={{ color: loopColor }}>
                  {loopSymbol}
                </span>
                <div className={styles.loopTitleRow}>
                  <div className={styles.loopTitleContent}>
                    <span className={styles.loopTitle}>
                      Loop {index + 1}
                    </span>
                    <span 
                      className={styles.loopBadge}
                      style={{ backgroundColor: loopColor }}
                    >
                      {realNodeCount} nodes
                    </span>
                    {hasFlowInLoop && (
                      <span className={`${styles.loopBadge} ${styles.flowBadge}`}>
                        via Flow
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Loop path visualization */}
              <div className={styles.loopPath}>
                {loopPath}
              </div>

              {/* Loop metadata */}
              <div className={styles.loopMetadata}>
                {realNodeCount === 2 && (
                  <span className={`${styles.metadataBadge} ${styles.badgeDirectFeedback}`}>
                    Direct Feedback
                  </span>
                )}
                {realNodeCount > 5 && (
                  <span className={`${styles.metadataBadge} ${styles.badgeComplexLoop}`}>
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
        <div className={styles.infoBox}>
          <strong>💡 Tip:</strong> Feedback loops are fundamental to system dynamics. 
          They represent circular causality in your model.
        </div>
      )}
    </div>
  );
}

