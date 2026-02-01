import { useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectNodes, selectEdges } from '../../store/slices/diagramSlice';
import { uiActions } from '../../store/slices/uiSlice';
import { findCycles } from '../../utils/graph';
import type { Cycle } from '../../utils/graph';
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
          const loopColor = getLoopColor(cycle.length);
          const loopPath = formatLoopPath(cycle);

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
                      {cycle.length} nodes
                    </span>
                  </div>
                </div>
              </div>

              {/* Loop path visualization */}
              <div className={styles.loopPath}>
                {loopPath}
              </div>

              {/* Loop metadata */}
              <div className={styles.loopMetadata}>
                {cycle.length === 2 && (
                  <span className={`${styles.metadataBadge} ${styles.badgeDirectFeedback}`}>
                    Direct Feedback
                  </span>
                )}
                {cycle.length > 5 && (
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

