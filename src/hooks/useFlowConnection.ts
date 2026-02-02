/**
 * useFlowConnection Hook
 * 
 * Manages custom drag-and-drop connections originating FROM a Flow edge.
 * Since React Flow doesn't natively support edges as connection sources,
 * we implement this as a custom drag operation.
 */

import { useCallback, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { uiActions, selectFlowConnection } from '../store/slices/uiSlice';
import { diagramActions, selectNodes, selectEdges } from '../store/slices/diagramSlice';
import { useFlowEdgeMidpoint } from './useFlowEdgeMidpoint';
import { findNodeAtPoint, findFlowEdgeAtPoint, getContainerRect } from '../utils/domUtils';
import type { CLDEdge, LinkEdgeData } from '../types';

interface PreviewLine {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface UseFlowConnectionReturn {
  isConnecting: boolean;
  previewLine: PreviewLine | null;
}

/**
 * Create a Link edge from Flow to Node
 */
function createFlowToNodeLink(sourceFlowId: string, targetNodeId: string): CLDEdge<LinkEdgeData> {
  return {
    id: `link_flow_${sourceFlowId}_${targetNodeId}_${Date.now()}`,
    source: targetNodeId,  // Self-loop for React Flow
    target: targetNodeId,
    type: 'link',
    data: {
      sourceIsFlowEdge: true,
      sourceFlowEdgeId: sourceFlowId,
    },
  };
}

/**
 * Create a Link edge from Flow to Flow
 */
function createFlowToFlowLink(
  sourceFlowId: string, 
  targetFlowId: string, 
  anchorNodeId: string
): CLDEdge<LinkEdgeData> {
  return {
    id: `link_flow_${sourceFlowId}_flow_${targetFlowId}_${Date.now()}`,
    source: anchorNodeId,  // Self-loop on anchor node
    target: anchorNodeId,
    type: 'link',
    data: {
      sourceIsFlowEdge: true,
      sourceFlowEdgeId: sourceFlowId,
      targetIsFlowEdge: true,
      targetFlowEdgeId: targetFlowId,
    },
  };
}

/**
 * Find an anchor node for a Flow → Flow connection
 */
function findAnchorNode(flowEdgeId: string, edges: CLDEdge[]): string | null {
  const flowEdge = edges.find(e => e.id === flowEdgeId && e.type === 'flow');
  if (!flowEdge) return null;
  
  // Use source node if not a cloud, otherwise use target
  if (!flowEdge.data?.sourceIsCloud) {
    return flowEdge.source;
  }
  if (!flowEdge.data?.targetIsCloud) {
    return flowEdge.target;
  }
  return null;
}

export function useFlowConnection(): UseFlowConnectionReturn {
  const dispatch = useAppDispatch();
  const flowConnection = useAppSelector(selectFlowConnection);
  const nodes = useAppSelector(selectNodes);
  const edges = useAppSelector(selectEdges);
  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();
  
  // Get the midpoint of the source flow edge for preview line
  const flowMidpoint = useFlowEdgeMidpoint(flowConnection?.flowEdgeId ?? '');
  
  // Handle mouse move - update cursor position
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!flowConnection) return;
    
    const flowPosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    dispatch(uiActions.updateFlowConnectionCursor({
      cursorPosition: flowPosition,
      screenPosition: { x: event.clientX, y: event.clientY },
    }));
  }, [flowConnection, dispatch, screenToFlowPosition]);
  
  // Handle mouse up - create connection if valid target
  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!flowConnection) return;
    
    const sourceFlowId = flowConnection.flowEdgeId;
    const sourceFlowEdge = edges.find(e => e.id === sourceFlowId);
    
    // Check for target node first
    const targetNode = findNodeAtPoint(event.clientX, event.clientY, nodes);
    if (targetNode) {
      // Don't connect to nodes that the flow is already connected to
      if (sourceFlowEdge && (
        sourceFlowEdge.source === targetNode.id || 
        sourceFlowEdge.target === targetNode.id
      )) {
        dispatch(uiActions.endFlowConnection());
        return;
      }
      
      const newLink = createFlowToNodeLink(sourceFlowId, targetNode.id);
      dispatch(diagramActions.addEdge(newLink));
      dispatch(uiActions.endFlowConnection());
      return;
    }
    
    // Check for target flow edge
    const targetFlowId = findFlowEdgeAtPoint(event.clientX, event.clientY, edges);
    if (targetFlowId && targetFlowId !== sourceFlowId) {
      const anchorNode = findAnchorNode(sourceFlowId, edges);
      if (anchorNode) {
        const newLink = createFlowToFlowLink(sourceFlowId, targetFlowId, anchorNode);
        dispatch(diagramActions.addEdge(newLink));
      }
    }
    
    dispatch(uiActions.endFlowConnection());
  }, [flowConnection, nodes, edges, dispatch]);
  
  // Set up event listeners
  useEffect(() => {
    if (!flowConnection) return;
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [flowConnection, handleMouseMove, handleMouseUp]);
  
  // Calculate preview line
  let previewLine: PreviewLine | null = null;
  
  if (flowConnection && flowMidpoint) {
    const containerRect = getContainerRect();
    if (containerRect) {
      const startViewport = flowToScreenPosition(flowMidpoint);
      
      previewLine = {
        startX: startViewport.x - containerRect.left,
        startY: startViewport.y - containerRect.top,
        endX: flowConnection.screenPosition.x - containerRect.left,
        endY: flowConnection.screenPosition.y - containerRect.top,
      };
    }
  }
  
  return {
    isConnecting: flowConnection !== null,
    previewLine,
  };
}
