import { useCallback, useRef } from 'react';
import { useReactFlow, type OnConnect, type OnConnectStart, type Connection } from '@xyflow/react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { diagramActions, selectNodes } from '../store/slices/diagramSlice';
import { selectConnectionMode } from '../store/slices/uiSlice';
import type { CLDEdge, FlowEdgeData } from '../types';

/**
 * Hook для управления созданием connections между нодами
 * Инкапсулирует логику:
 * - Создание обычных edge (node-to-node)
 * - Создание cloud edges (node-to-canvas в flow mode)
 * - Валидация connections (flow только между stocks)
 * 
 * @returns handlers для connection событий
 */
export function useConnectionHandlers() {
  const dispatch = useAppDispatch();
  const connectionMode = useAppSelector(selectConnectionMode);
  const nodes = useAppSelector(selectNodes);
  const { screenToFlowPosition } = useReactFlow();
  
  // Store source node info for cloud edge creation
  const sourceNodeIdRef = useRef<string | null>(null);
  const sourceNodeTypeRef = useRef<string | null>(null);
  
  // Track connection start
  const onConnectStart: OnConnectStart = useCallback(
    (_event, { nodeId }) => {
      sourceNodeIdRef.current = nodeId;
      // Find node type
      const node = nodes.find(n => n.id === nodeId);
      sourceNodeTypeRef.current = node?.type ?? null;
    },
    [nodes]
  );

  // Simple connection handler - create the edge when connected to a node
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      
      // For flow mode, only allow stock-to-stock connections
      if (connectionMode === 'flow') {
        const sourceNode = nodes.find(n => n.id === connection.source);
        const targetNode = nodes.find(n => n.id === connection.target);
        
        if (sourceNode?.type !== 'stock' || targetNode?.type !== 'stock') {
          // Don't allow flow between non-stocks
          return;
        }
      }
      
      const newEdge: CLDEdge = {
        id: `edge_${connection.source}_${connection.target}_${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || undefined,
        targetHandle: connection.targetHandle || undefined,
        type: connectionMode,
        data: {},
      };
      
      dispatch(diagramActions.addEdge(newEdge));
      sourceNodeIdRef.current = null;
      sourceNodeTypeRef.current = null;
    },
    [dispatch, connectionMode, nodes]
  );

  // Handle connection end - create flow with cloud when dropped on canvas
  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const sourceNodeId = sourceNodeIdRef.current;
      const sourceNodeType = sourceNodeTypeRef.current;
      
      // Reset refs
      sourceNodeIdRef.current = null;
      sourceNodeTypeRef.current = null;
      
      // Only handle flow mode and only from stock nodes
      if (connectionMode !== 'flow' || !sourceNodeId || sourceNodeType !== 'stock') {
        return;
      }
      
      // Check if we dropped on a node (connection was successful via onConnect)
      const target = event.target as HTMLElement;
      const isDroppedOnPane = target.classList.contains('react-flow__pane');
      
      if (!isDroppedOnPane) {
        return;
      }

      // Get drop position
      const clientX = 'touches' in event ? event.touches[0]?.clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0]?.clientY : event.clientY;

      if (clientX === undefined || clientY === undefined) {
        return;
      }

      // Convert to flow position
      const dropPosition = screenToFlowPosition({ x: clientX, y: clientY });

      // Create a flow edge with cloud at target
      // Use sourceNodeId as target (self-reference) but with unique edge ID and targetPosition
      const newEdge: CLDEdge<FlowEdgeData> = {
        id: `edge_${sourceNodeId}_cloud_${Date.now()}`,
        source: sourceNodeId,
        target: sourceNodeId, // Self-reference, but we use targetPosition for actual endpoint
        type: 'flow',
        data: {
          targetIsCloud: true,
          targetPosition: dropPosition,
        },
      };
      
      dispatch(diagramActions.addEdge(newEdge));
    },
    [dispatch, connectionMode, screenToFlowPosition]
  );

  return {
    onConnectStart,
    onConnect,
    onConnectEnd,
  };
}

