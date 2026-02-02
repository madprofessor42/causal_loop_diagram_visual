/**
 * Graph utilities for finding cycles and analyzing diagram structure
 */

import type { CLDNode, CLDEdge, LinkEdgeData, FlowEdgeData } from '../types';

/** Represents a cycle in the graph */
export interface Cycle {
  nodeIds: string[];
  edgeIds: string[];
  length: number;
}

/** Prefix for virtual Flow node IDs */
export const FLOW_VIRTUAL_PREFIX = 'flow_virtual_';
const FLOW_FWD_SUFFIX = '_fwd';
const FLOW_BWD_SUFFIX = '_bwd';

/** Check if an ID represents a virtual Flow node */
export function isFlowVirtualNode(nodeId: string): boolean {
  return nodeId.startsWith(FLOW_VIRTUAL_PREFIX);
}

/** Get the original Flow edge ID from a virtual node ID */
export function getFlowEdgeIdFromVirtual(virtualNodeId: string): string | null {
  if (!isFlowVirtualNode(virtualNodeId)) return null;
  
  let flowId = virtualNodeId.slice(FLOW_VIRTUAL_PREFIX.length);
  if (flowId.endsWith(FLOW_FWD_SUFFIX)) {
    flowId = flowId.slice(0, -FLOW_FWD_SUFFIX.length);
  } else if (flowId.endsWith(FLOW_BWD_SUFFIX)) {
    flowId = flowId.slice(0, -FLOW_BWD_SUFFIX.length);
  }
  return flowId;
}

// ============ Adjacency List Builder ============

type AdjacencyList = Map<string, Array<{ target: string; edgeId: string }>>;

function addEdgeToGraph(graph: AdjacencyList, from: string, to: string, edgeId: string) {
  const list = graph.get(from);
  if (list) {
    list.push({ target: to, edgeId });
  }
}

function ensureNode(graph: AdjacencyList, nodeId: string) {
  if (!graph.has(nodeId)) {
    graph.set(nodeId, []);
  }
}

function getVirtualNodeId(flowEdgeId: string, suffix: string = ''): string {
  return `${FLOW_VIRTUAL_PREFIX}${flowEdgeId}${suffix}`;
}

function findVirtualNode(graph: AdjacencyList, flowEdgeId: string): string | null {
  const candidates = [
    getVirtualNodeId(flowEdgeId),
    getVirtualNodeId(flowEdgeId, FLOW_FWD_SUFFIX),
    getVirtualNodeId(flowEdgeId, FLOW_BWD_SUFFIX),
  ];
  return candidates.find(id => graph.has(id)) ?? null;
}

/** Process Flow edges - create virtual nodes */
function processFlowEdges(graph: AdjacencyList, flowEdges: CLDEdge[]) {
  for (const edge of flowEdges) {
    const data = edge.data as FlowEdgeData | undefined;
    const sourceIsCloud = data?.sourceIsCloud ?? false;
    const targetIsCloud = data?.targetIsCloud ?? false;
    
    if (data?.bidirectional && !sourceIsCloud && !targetIsCloud) {
      // Bidirectional flow: create two virtual nodes
      const fwdNode = getVirtualNodeId(edge.id, FLOW_FWD_SUFFIX);
      const bwdNode = getVirtualNodeId(edge.id, FLOW_BWD_SUFFIX);
      
      ensureNode(graph, fwdNode);
      ensureNode(graph, bwdNode);
      
      // Forward: Source → Flow_fwd → Target
      addEdgeToGraph(graph, edge.source, fwdNode, edge.id);
      addEdgeToGraph(graph, fwdNode, edge.target, edge.id);
      
      // Backward: Target → Flow_bwd → Source
      addEdgeToGraph(graph, edge.target, bwdNode, edge.id);
      addEdgeToGraph(graph, bwdNode, edge.source, edge.id);
    } else {
      // Single virtual node
      const virtualNode = getVirtualNodeId(edge.id);
      ensureNode(graph, virtualNode);
      
      if (!sourceIsCloud) {
        addEdgeToGraph(graph, edge.source, virtualNode, edge.id);
      }
      if (!targetIsCloud) {
        addEdgeToGraph(graph, virtualNode, edge.target, edge.id);
      }
    }
  }
}

/** Process Link edges */
function processLinkEdges(graph: AdjacencyList, linkEdges: CLDEdge[]) {
  for (const edge of linkEdges) {
    const data = edge.data as LinkEdgeData | undefined;
    const isReversed = data?.reversed ?? false;
    const isBidirectional = data?.bidirectional ?? false;
    
    const sourceIsFlow = data?.sourceIsFlowEdge && data?.sourceFlowEdgeId;
    const targetIsFlow = data?.targetIsFlowEdge && data?.targetFlowEdgeId;
    
    // Determine actual source and target in the graph
    let graphSource: string | null;
    let graphTarget: string | null;
    
    if (sourceIsFlow && targetIsFlow) {
      // Flow → Flow link
      graphSource = findVirtualNode(graph, data!.sourceFlowEdgeId!);
      graphTarget = findVirtualNode(graph, data!.targetFlowEdgeId!);
    } else if (sourceIsFlow) {
      // Flow → Node link
      graphSource = findVirtualNode(graph, data!.sourceFlowEdgeId!);
      graphTarget = edge.source; // Self-loop model: node is in edge.source
    } else if (targetIsFlow) {
      // Node → Flow link
      graphSource = edge.source;
      graphTarget = findVirtualNode(graph, data!.targetFlowEdgeId!);
    } else {
      // Node → Node link
      graphSource = edge.source;
      graphTarget = edge.target;
    }
    
    if (!graphSource || !graphTarget) continue;
    
    // Add edges based on direction
    if (isBidirectional) {
      addEdgeToGraph(graph, graphSource, graphTarget, edge.id);
      addEdgeToGraph(graph, graphTarget, graphSource, edge.id);
    } else if (isReversed) {
      addEdgeToGraph(graph, graphTarget, graphSource, edge.id);
    } else {
      addEdgeToGraph(graph, graphSource, graphTarget, edge.id);
    }
  }
}

/** Build the complete adjacency list */
function buildAdjacencyList(nodes: CLDNode[], edges: CLDEdge[]): AdjacencyList {
  const graph: AdjacencyList = new Map();
  
  // Initialize with real nodes
  for (const node of nodes) {
    graph.set(node.id, []);
  }
  
  // Process edges by type
  const flowEdges = edges.filter(e => e.type === 'flow');
  const linkEdges = edges.filter(e => e.type === 'link');
  
  processFlowEdges(graph, flowEdges);
  processLinkEdges(graph, linkEdges);
  
  return graph;
}

// ============ Cycle Detection ============

/** Check if cycle is duplicate */
function isDuplicateCycle(existingCycles: Cycle[], newNodes: string[]): boolean {
  const newSet = new Set(newNodes);
  
  for (const cycle of existingCycles) {
    if (cycle.nodeIds.length !== newNodes.length) continue;
    
    const existingSet = new Set(cycle.nodeIds);
    if (existingSet.size !== newSet.size) continue;
    
    if (newNodes.every(n => existingSet.has(n))) {
      return true;
    }
  }
  return false;
}

/** Find all cycles using DFS */
export function findCycles(nodes: CLDNode[], edges: CLDEdge[]): Cycle[] {
  const graph = buildAdjacencyList(nodes, edges);
  const cycles: Cycle[] = [];
  
  function dfs(
    start: string,
    current: string,
    visited: Set<string>,
    stack: Set<string>,
    path: string[],
    pathEdges: string[]
  ): void {
    visited.add(current);
    stack.add(current);
    path.push(current);
    
    for (const { target, edgeId } of graph.get(current) || []) {
      if (!visited.has(target)) {
        pathEdges.push(edgeId);
        dfs(start, target, visited, stack, path, pathEdges);
        pathEdges.pop();
      } else if (stack.has(target)) {
        // Found cycle
        const startIdx = path.indexOf(target);
        if (startIdx !== -1) {
          const cycleNodes = path.slice(startIdx);
          const cycleEdges = [...pathEdges.slice(startIdx), edgeId];
          
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
    stack.delete(current);
    visited.delete(current);
  }
  
  // Run DFS from each node
  for (const nodeId of graph.keys()) {
    dfs(nodeId, nodeId, new Set(), new Set(), [], []);
  }
  
  // Sort by length
  cycles.sort((a, b) => a.length - b.length);
  
  return cycles;
}
