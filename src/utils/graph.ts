/**
 * Graph utilities for finding cycles and analyzing diagram structure
 */

import type { CLDNode, CLDEdge } from '../types';

/**
 * Represents a cycle in the graph
 */
export interface Cycle {
  /** Array of node IDs forming the cycle */
  nodeIds: string[];
  /** Array of edge IDs connecting the nodes in the cycle */
  edgeIds: string[];
  /** Length of the cycle (number of nodes) */
  length: number;
}

/**
 * Find all simple cycles in the directed graph using Johnson's algorithm (simplified)
 * A cycle is a path where you can return to the starting node
 */
export function findCycles(nodes: CLDNode[], edges: CLDEdge[]): Cycle[] {
  const cycles: Cycle[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];
  const pathEdges: string[] = [];

  // Build adjacency list: node -> array of {targetNode, edgeId}
  const adjacencyList = new Map<string, Array<{ target: string; edgeId: string }>>();
  
  // Filter out cloud edges (edges to/from nowhere)
  const regularEdges = edges.filter(edge => {
    return !edge.data?.sourceIsCloud && !edge.data?.targetIsCloud;
  });

  // Initialize adjacency list
  nodes.forEach(node => {
    adjacencyList.set(node.id, []);
  });

  // Build adjacency list
  regularEdges.forEach(edge => {
    const list = adjacencyList.get(edge.source);
    if (list) {
      list.push({ target: edge.target, edgeId: edge.id });
    }
    
    // Handle bidirectional edges
    if (edge.data?.bidirectional) {
      const reverseList = adjacencyList.get(edge.target);
      if (reverseList) {
        reverseList.push({ target: edge.source, edgeId: edge.id });
      }
    }
  });

  /**
   * DFS to find cycles
   */
  function dfs(nodeId: string): void {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];

    for (const { target, edgeId } of neighbors) {
      if (!visited.has(target)) {
        pathEdges.push(edgeId);
        dfs(target);
        pathEdges.pop();
      } else if (recursionStack.has(target)) {
        // Found a cycle!
        const cycleStartIndex = path.indexOf(target);
        if (cycleStartIndex !== -1) {
          const cycleNodes = path.slice(cycleStartIndex);
          const cycleEdges = pathEdges.slice(cycleStartIndex);
          cycleEdges.push(edgeId); // Add the closing edge

          // Only add if it's not a duplicate (same nodes in different order)
          if (!isDuplicateCycle(cycles, cycleNodes)) {
            cycles.push({
              nodeIds: [...cycleNodes],
              edgeIds: [...cycleEdges],
              length: cycleNodes.length,
            });
          }
        }
      }
    }

    path.pop();
    recursionStack.delete(nodeId);
  }

  // Run DFS from each unvisited node
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  });

  // Sort cycles by length (shorter cycles first)
  cycles.sort((a, b) => a.length - b.length);

  return cycles;
}

/**
 * Check if a cycle is a duplicate (same nodes in possibly different rotation)
 */
function isDuplicateCycle(existingCycles: Cycle[], newCycleNodes: string[]): boolean {
  const newCycleSet = new Set(newCycleNodes);
  
  for (const cycle of existingCycles) {
    // Must have same length
    if (cycle.nodeIds.length !== newCycleNodes.length) {
      continue;
    }

    // Must contain same nodes
    const cycleSet = new Set(cycle.nodeIds);
    if (cycleSet.size !== newCycleSet.size) {
      continue;
    }

    let allMatch = true;
    for (const nodeId of newCycleNodes) {
      if (!cycleSet.has(nodeId)) {
        allMatch = false;
        break;
      }
    }

    if (allMatch) {
      return true; // It's a duplicate
    }
  }

  return false;
}

/**
 * Classify a cycle as reinforcing (positive feedback) or balancing (negative feedback)
 * based on the polarity of links
 * 
 * Note: This is a simplified version. In a full implementation, you'd need to 
 * analyze the actual relationships (+ or -) between connected nodes.
 */
export function classifyCycle(cycle: Cycle, edges: CLDEdge[]): 'reinforcing' | 'balancing' | 'unknown' {
  // This is a placeholder - in a real implementation, you would:
  // 1. Check each edge's polarity (+ or -)
  // 2. Count the number of negative links
  // 3. Even number of negatives = reinforcing (positive feedback)
  // 4. Odd number of negatives = balancing (negative feedback)
  
  return 'unknown';
}

