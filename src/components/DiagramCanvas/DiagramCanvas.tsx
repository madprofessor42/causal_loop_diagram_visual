import { useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  ConnectionMode,
  ConnectionLineType,
  useReactFlow,
  useOnSelectionChange,
  type OnConnect,
  type OnConnectStart,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type OnSelectionChangeFunc,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { nodeTypes } from '../nodes';
import { LinkEdge, FlowEdge } from '../edges';
import { GhostNode } from '../GhostNode';
import { ConnectionModeToggle } from '../ConnectionModeToggle';
import type { BaseEdgeData, CLDNode, CLDEdge, FlowEdgeData } from '../../types';
import {
  STOCK_WIDTH,
  STOCK_HEIGHT,
  VARIABLE_WIDTH,
  VARIABLE_HEIGHT,
  LINK_EDGE,
  FLOW_EDGE,
} from '../../constants';
import { createNode } from '../../utils/nodeFactory';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  diagramActions,
  selectNodes,
  selectEdges,
} from '../../store/slices/diagramSlice';
import {
  uiActions,
  selectIsDragging,
  selectGhostPosition,
  selectConnectionMode,
} from '../../store/slices/uiSlice';
import { useFlowConnection } from '../../hooks';
import { findFlowEdgeAtPoint } from '../../utils/domUtils';
import type { LinkEdgeData } from '../../types';

export function DiagramCanvas() {
  const dispatch = useAppDispatch();
  const nodes = useAppSelector(selectNodes);
  const edges = useAppSelector(selectEdges);
  const isDragging = useAppSelector(selectIsDragging);
  const ghostPosition = useAppSelector(selectGhostPosition);
  const connectionMode = useAppSelector(selectConnectionMode);
  
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Use the flow connection hook for dragging from Flow edges
  const { previewLine: flowConnectionPreview } = useFlowConnection();
  
  // Store source node info for cloud edge creation
  const sourceNodeIdRef = useRef<string | null>(null);
  const sourceNodeTypeRef = useRef<string | null>(null);
  
  // Sync React Flow selection with Redux/UI state
  // When user selects nodes/edges via shift+drag or click, update UI selection
  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }) => {
      // Update UI selection based on what's selected
      // For single selection, update the sidebar
      if (selectedNodes.length === 1 && selectedEdges.length === 0) {
        dispatch(uiActions.setSelectedNode(selectedNodes[0].id));
      } else if (selectedEdges.length === 1 && selectedNodes.length === 0) {
        dispatch(uiActions.setSelectedEdge(selectedEdges[0].id));
      } else if (selectedNodes.length === 0 && selectedEdges.length === 0) {
        // Nothing selected - clear UI selection
        dispatch(uiActions.setSelectedNode(null));
        dispatch(uiActions.setSelectedEdge(null));
      } else {
        // Multiple selection - clear single item editing in sidebar
        // (could extend UI to show multi-selection info)
        dispatch(uiActions.setSelectedNode(null));
        dispatch(uiActions.setSelectedEdge(null));
      }
    },
    [dispatch]
  );
  
  // Register selection change handler
  useOnSelectionChange({ onChange: onSelectionChange });
  
  // React Flow change handlers -> Redux
  const onNodesChange = useCallback(
    (changes: NodeChange<CLDNode>[]) => {
      dispatch(diagramActions.onNodesChange(changes));
    },
    [dispatch]
  );
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange<CLDEdge>[]) => {
      dispatch(diagramActions.onEdgesChange(changes));
    },
    [dispatch]
  );
  
  // Update edge data via Redux - use ref to avoid recreating edge types
  const updateEdgeDataRef = useRef<(edgeId: string, newData: Partial<BaseEdgeData>) => void>(undefined);
  updateEdgeDataRef.current = (edgeId: string, newData: Partial<BaseEdgeData>) => {
    dispatch(diagramActions.updateEdgeData({ id: edgeId, data: newData }));
  };
  
  // Stable updateEdgeData function that uses ref
  const updateEdgeData = useCallback(
    (edgeId: string, newData: Partial<BaseEdgeData>) => {
      updateEdgeDataRef.current?.(edgeId, newData);
    },
    []
  );
  
  // Create edge types with stable reference - defined once
  const edgeTypesWithUpdate = useMemo(() => ({
    link: (props: React.ComponentProps<typeof LinkEdge>) => (
      <LinkEdge {...props} updateEdgeData={updateEdgeData} />
    ),
    flow: (props: React.ComponentProps<typeof FlowEdge>) => (
      <FlowEdge {...props} updateEdgeData={updateEdgeData} />
    ),
  }), [updateEdgeData]);

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
      
      // Prevent self-connections
      if (connection.source === connection.target) return;
      
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
  // OR create Link to Flow edge when in link mode
  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const sourceNodeId = sourceNodeIdRef.current;
      const sourceNodeType = sourceNodeTypeRef.current;
      
      // Reset refs
      sourceNodeIdRef.current = null;
      sourceNodeTypeRef.current = null;
      
      // Get drop position
      const clientX = 'touches' in event ? event.touches[0]?.clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0]?.clientY : event.clientY;

      if (clientX === undefined || clientY === undefined) {
        return;
      }
      
      // === Handle Link mode: check if dropping on a Flow edge ===
      if (connectionMode === 'link' && sourceNodeId) {
        const flowEdgeId = findFlowEdgeAtPoint(clientX, clientY, edges);
        
        if (flowEdgeId) {
          // Create Link from Node to Flow
          const newLink: CLDEdge<LinkEdgeData> = {
            id: `link_${sourceNodeId}_flow_${flowEdgeId}_${Date.now()}`,
            source: sourceNodeId,
            target: sourceNodeId,  // Self-loop for React Flow
            type: 'link',
            data: {
              targetIsFlowEdge: true,
              targetFlowEdgeId: flowEdgeId,
            },
          };
          dispatch(diagramActions.addEdge(newLink));
          return;
        }
      }
      
      // === Handle Flow mode: create cloud edge when dropped on canvas ===
      if (connectionMode !== 'flow' || !sourceNodeId || sourceNodeType !== 'stock') {
        return;
      }
      
      // Check if we dropped on a node (connection was successful via onConnect)
      const target = event.target as HTMLElement;
      const isDroppedOnPane = target.classList.contains('react-flow__pane');
      
      if (!isDroppedOnPane) {
        return;
      }

      // Convert to flow position
      const dropPosition = screenToFlowPosition({ x: clientX, y: clientY });

      // Create a flow edge with cloud at target
      const newEdge: CLDEdge<FlowEdgeData> = {
        id: `edge_${sourceNodeId}_cloud_${Date.now()}`,
        source: sourceNodeId,
        target: sourceNodeId,
        type: 'flow',
        data: {
          targetIsCloud: true,
          targetPosition: dropPosition,
        },
      };
      
      dispatch(diagramActions.addEdge(newEdge));
    },
    [dispatch, connectionMode, screenToFlowPosition, edges]
  );

  // Drag and Drop handlers for sidebar items
  const onDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      
      // Convert screen coordinates to flow coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      // Update ghost position in store
      dispatch(uiActions.setGhostPosition(position));
    },
    [dispatch, screenToFlowPosition]
  );

  const onDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      // Only clear if leaving the ReactFlow container (not entering a child)
      const relatedTarget = event.relatedTarget as HTMLElement;
      if (!relatedTarget || !reactFlowWrapper.current?.contains(relatedTarget)) {
        dispatch(uiActions.setGhostPosition(null));
      }
    },
    [dispatch]
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      
      const type = event.dataTransfer.getData('application/reactflow') as 'stock' | 'variable';
      if (!type) return;
      
      // Get the drop position in flow coordinates
      const cursorPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      // Offset the position based on node type (center node at cursor)
      let offsetX: number;
      let offsetY: number;
      
      if (type === 'stock') {
        offsetX = STOCK_WIDTH / 2;
        offsetY = STOCK_HEIGHT / 2;
      } else {
        offsetX = VARIABLE_WIDTH / 2;
        offsetY = VARIABLE_HEIGHT / 2;
      }
      
      const position = {
        x: cursorPosition.x - offsetX,
        y: cursorPosition.y - offsetY,
      };
      
      // Create new node using factory function
      const newNode = createNode(type, position, nodes);
      
      dispatch(diagramActions.addNode(newNode));
      dispatch(uiActions.setDragEnd());
    },
    [dispatch, nodes, screenToFlowPosition]
  );
  
  // Connection line style based on mode
  const connectionLineStyle = useMemo(() => ({
    stroke: connectionMode === 'link' ? LINK_EDGE.color : FLOW_EDGE.color,
    strokeWidth: connectionMode === 'link' ? LINK_EDGE.previewStrokeWidth : FLOW_EDGE.previewStrokeWidth,
    strokeDasharray: connectionMode === 'link' ? LINK_EDGE.dashArray : '5,5',
  }), [connectionMode]);
  
  return (
    <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ConnectionModeToggle />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnectStart={onConnectStart}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypesWithUpdate}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.Straight}
        connectionLineStyle={connectionLineStyle}
        fitView
        minZoom={0.5}
        maxZoom={2}
        selectNodesOnDrag={false}
      >
        <Controls />
        <MiniMap
          nodeColor={(node) => node.type === 'stock' ? '#5b9bd5' : '#ed7d31'}
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        
        {/* Ghost node preview during drag */}
        {isDragging && ghostPosition && (
          <GhostNode position={ghostPosition} />
        )}
      </ReactFlow>
      
      {/* Flow connection preview line (custom overlay) */}
      {flowConnectionPreview && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          <line
            x1={flowConnectionPreview.startX}
            y1={flowConnectionPreview.startY}
            x2={flowConnectionPreview.endX}
            y2={flowConnectionPreview.endY}
            stroke={LINK_EDGE.color}
            strokeWidth={LINK_EDGE.previewStrokeWidth}
            strokeDasharray={LINK_EDGE.dashArray}
          />
        </svg>
      )}
    </div>
  );
}

