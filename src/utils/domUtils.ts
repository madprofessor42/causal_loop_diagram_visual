/**
 * DOM Utilities for finding elements at screen coordinates
 * Used for custom connection handling (drag from Flow edges, etc.)
 */

import type { CLDNode, CLDEdge } from '../types';

/**
 * Find a node at the given screen coordinates
 */
export function findNodeAtPoint(
  clientX: number, 
  clientY: number, 
  nodes: CLDNode[]
): CLDNode | null {
  const elements = document.elementsFromPoint(clientX, clientY);
  
  for (const element of elements) {
    const nodeElement = element.closest('.react-flow__node');
    if (nodeElement) {
      const nodeId = nodeElement.getAttribute('data-id');
      if (nodeId) {
        return nodes.find(n => n.id === nodeId) || null;
      }
    }
  }
  return null;
}

/**
 * Find a Flow edge at the given screen coordinates
 * Checks both the edge group and flow handles
 */
export function findFlowEdgeAtPoint(
  clientX: number, 
  clientY: number, 
  edges: CLDEdge[]
): string | null {
  const elements = document.elementsFromPoint(clientX, clientY);
  
  for (const element of elements) {
    // Check if this is a flow handle (circle with data-flow-id)
    const flowId = (element as HTMLElement).getAttribute?.('data-flow-id');
    if (flowId) {
      const edge = edges.find(e => e.id === flowId);
      if (edge?.type === 'flow') {
        return flowId;
      }
    }
    
    // Check if this is part of a flow edge group
    const edgeGroup = element.closest('.react-flow__edge');
    if (edgeGroup) {
      let edgeId = edgeGroup.getAttribute('data-id');
      
      if (!edgeId) {
        const testId = edgeGroup.getAttribute('data-testid');
        if (testId?.startsWith('rf__edge-')) {
          edgeId = testId.replace('rf__edge-', '');
        }
      }
      
      if (!edgeId) {
        const pathElement = edgeGroup.querySelector('.react-flow__edge-path');
        if (pathElement) {
          edgeId = pathElement.getAttribute('id');
        }
      }
      
      if (edgeId) {
        const edge = edges.find(e => e.id === edgeId);
        if (edge?.type === 'flow') {
          return edgeId;
        }
      }
    }
  }
  
  return null;
}

/**
 * Get the ReactFlow container element
 */
export function getReactFlowContainer(): Element | null {
  return document.querySelector('.react-flow');
}

/**
 * Get the bounding rect of the ReactFlow container
 * Used for converting between screen and container coordinates
 */
export function getContainerRect(): DOMRect | null {
  const container = getReactFlowContainer();
  return container?.getBoundingClientRect() ?? null;
}

