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
   * DFS to find cycles starting from a specific node
   */
  function dfs(
    startNodeId: string,
    currentNodeId: string,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[],
    pathEdges: string[]
  ): void {
    visited.add(currentNodeId);
    recursionStack.add(currentNodeId);
    path.push(currentNodeId);

    const neighbors = adjacencyList.get(currentNodeId) || [];

    for (const { target, edgeId } of neighbors) {
      if (!visited.has(target)) {
        pathEdges.push(edgeId);
        dfs(startNodeId, target, visited, recursionStack, path, pathEdges);
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
    recursionStack.delete(currentNodeId);
    visited.delete(currentNodeId); // Allow revisiting this node via different paths
  }

  // Run DFS from each node as a starting point
  // This ensures we find all cycles, not just those reachable from first node
  nodes.forEach(node => {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];
    const pathEdges: string[] = [];
    
    dfs(node.id, node.id, visited, recursionStack, path, pathEdges);
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

