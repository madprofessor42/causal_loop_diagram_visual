import { useMemo } from 'react';
import { useStore } from '@xyflow/react';
import { useAppSelector } from '../store/hooks';
import { selectEdges } from '../store/slices/diagramSlice';
import { getStraightEdgeParams } from '../utils/edge';
import type { FlowEdgeData } from '../types';

/**
 * Hook to calculate the midpoint of a Flow edge
 * Used for rendering Links that connect to Flow edges
 * 
 * @param flowEdgeId - The ID of the Flow edge
 * @returns Midpoint coordinates or null if edge not found
 */
export function useFlowEdgeMidpoint(flowEdgeId: string): { x: number; y: number } | null {
  const edges = useAppSelector(selectEdges);
  const nodeLookup = useStore((store) => store.nodeLookup);
  
  return useMemo(() => {
    // Find the Flow edge
    const flowEdge = edges.find(e => e.id === flowEdgeId && e.type === 'flow');
    if (!flowEdge) {
      return null;
    }
    
    const flowData = flowEdge.data as FlowEdgeData | undefined;
    
    // Handle cloud edges - they have fixed positions
    const sourcePos = flowData?.sourcePosition;
    const targetPos = flowData?.targetPosition;
    
    if (sourcePos && targetPos) {
      // Both endpoints are fixed positions (cloud-to-cloud)
      return {
        x: (sourcePos.x + targetPos.x) / 2,
        y: (sourcePos.y + targetPos.y) / 2,
      };
    }
    
    // Get source node
    const sourceNode = nodeLookup.get(flowEdge.source);
    if (!sourceNode) {
      return null;
    }
    
    // Calculate source center
    const sourceWidth = sourceNode.measured?.width ?? 100;
    const sourceHeight = sourceNode.measured?.height ?? 60;
    const sourceCenterX = sourceNode.position.x + sourceWidth / 2;
    const sourceCenterY = sourceNode.position.y + sourceHeight / 2;
    
    if (targetPos) {
      // Source is node, target is fixed position (cloud at target)
      return {
        x: (sourceCenterX + targetPos.x) / 2,
        y: (sourceCenterY + targetPos.y) / 2,
      };
    }
    
    if (sourcePos) {
      // Source is fixed position (cloud at source), target is node
      const targetNode = nodeLookup.get(flowEdge.target);
      if (!targetNode) {
        return null;
      }
      
      const targetWidth = targetNode.measured?.width ?? 100;
      const targetHeight = targetNode.measured?.height ?? 60;
      const targetCenterX = targetNode.position.x + targetWidth / 2;
      const targetCenterY = targetNode.position.y + targetHeight / 2;
      
      return {
        x: (sourcePos.x + targetCenterX) / 2,
        y: (sourcePos.y + targetCenterY) / 2,
      };
    }
    
    // Both endpoints are nodes
    const targetNode = nodeLookup.get(flowEdge.target);
    if (!targetNode) {
      return null;
    }
    
    // Calculate edge params to get actual start/end points on node boundaries
    const { sx, sy, tx, ty } = getStraightEdgeParams(sourceNode, targetNode, 0);
    
    // Return midpoint
    return {
      x: (sx + tx) / 2,
      y: (sy + ty) / 2,
    };
  }, [flowEdgeId, edges, nodeLookup]);
}

