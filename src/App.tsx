import { useCallback, useRef, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
  BackgroundVariant,
  ConnectionMode,
  ConnectionLineType,
  useReactFlow,
  type OnConnect,
  type OnConnectStart,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type Edge,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import './App.css';

import { nodeTypes } from './components/nodes';
import { LinkEdge, FlowEdge } from './components/edges';
import { Sidebar } from './components/Sidebar';
import { GhostNode } from './components/GhostNode';
import type { BaseEdgeData, CLDNode, CLDEdge, FlowEdgeData } from './types';
import {
  STOCK_WIDTH,
  STOCK_HEIGHT,
  VARIABLE_WIDTH,
  VARIABLE_HEIGHT,
} from './constants';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
  diagramActions,
  selectNodes,
  selectEdges,
} from './store/slices/diagramSlice';
import {
  uiActions,
  selectIsDragging,
  selectGhostPosition,
  selectConnectionMode,
  selectSelectedEdgeId,
  selectSelectedNodeId,
} from './store/slices/uiSlice';

// Context to pass edge update function to edge components
export type UpdateEdgeData = (edgeId: string, data: Partial<BaseEdgeData>) => void;

const initialNodes: CLDNode[] = [
  {
    id: '1',
    type: 'stock',
    position: { x: 250, y: 100 },
    data: { label: 'Population', initialValue: 1000 },
    style: { width: STOCK_WIDTH, height: STOCK_HEIGHT },
  },
  {
    id: '2',
    type: 'variable',
    position: { x: 450, y: 250 },
    data: { label: 'Growth Rate', value: '0.02' },
    style: { width: VARIABLE_WIDTH, height: VARIABLE_HEIGHT },
  },
  {
    id: '3',
    type: 'variable',
    position: { x: 150, y: 300 },
    data: { label: 'Birth Rate', value: '[Population] * [Growth Rate]' },
    style: { width: VARIABLE_WIDTH, height: VARIABLE_HEIGHT },
  },
];

// Counter for generating unique IDs
let idCounter = 4; // Start after initial nodes (1, 2, 3)

function getNextId(): string {
  return `id_${idCounter++}`;
}

function getNextLabel(nodes: CLDNode[]): string {
  // Find existing labels and get the next letter
  const existingLabels = new Set(nodes.map(n => n.data.label));
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  for (const letter of alphabet) {
    if (!existingLabels.has(letter)) {
      return letter;
    }
  }
  
  // If all single letters used, use double letters
  for (let i = 0; i < alphabet.length; i++) {
    for (let j = 0; j < alphabet.length; j++) {
      const label = alphabet[i] + alphabet[j];
      if (!existingLabels.has(label)) {
        return label;
      }
    }
  }
  
  return '?';
}

function Flow() {
  const dispatch = useAppDispatch();
  const nodes = useAppSelector(selectNodes);
  const edges = useAppSelector(selectEdges);
  const isDragging = useAppSelector(selectIsDragging);
  const ghostPosition = useAppSelector(selectGhostPosition);
  const connectionMode = useAppSelector(selectConnectionMode);
  const selectedEdgeId = useAppSelector(selectSelectedEdgeId);
  const selectedNodeId = useAppSelector(selectSelectedNodeId);
  
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Store source node info for cloud edge creation
  const sourceNodeIdRef = useRef<string | null>(null);
  const sourceNodeTypeRef = useRef<string | null>(null);
  
  // Initialize nodes on mount
  useEffect(() => {
    if (nodes.length === 0) {
      dispatch(diagramActions.setNodes(initialNodes));
    }
  }, [dispatch, nodes.length]);
  
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
  
  // Update edge data via Redux
  const updateEdgeData = useCallback(
    (edgeId: string, newData: Partial<BaseEdgeData>) => {
      dispatch(diagramActions.updateEdgeData({ id: edgeId, data: newData }));
    },
    [dispatch]
  );
  
  // Create edge types with updateEdgeData bound
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
      
      // Create new node with appropriate data
      const label = getNextLabel(nodes);
      const newNode: CLDNode = {
        id: getNextId(),
        type,
        position,
        data: type === 'stock'
          ? { label, initialValue: 0 }
          : { label, value: '0' },
        style: type === 'stock'
          ? { width: STOCK_WIDTH, height: STOCK_HEIGHT }
          : { width: VARIABLE_WIDTH, height: VARIABLE_HEIGHT },
      };
      
      dispatch(diagramActions.addNode(newNode));
      dispatch(uiActions.setDragEnd());
    },
    [dispatch, nodes, screenToFlowPosition]
  );

  // Toggle connection mode handler
  const handleToggleConnectionMode = useCallback(() => {
    dispatch(uiActions.toggleConnectionMode());
  }, [dispatch]);
  
  // Connection line style based on mode
  const connectionLineStyle = useMemo(() => ({
    stroke: connectionMode === 'link' ? '#666666' : '#5b9bd5',
    strokeWidth: connectionMode === 'link' ? 1.5 : 3,
    strokeDasharray: connectionMode === 'link' ? '5,5' : undefined,
  }), [connectionMode]);
  
  // Handle edge click - select edge for editing in sidebar
  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      dispatch(uiActions.setSelectedEdge(edge.id));
    },
    [dispatch]
  );
  
  // Handle node click - select node for editing in sidebar
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: CLDNode) => {
      dispatch(uiActions.setSelectedNode(node.id));
    },
    [dispatch]
  );
  
  // Handle pane click - deselect edge and node
  const onPaneClick = useCallback(() => {
    dispatch(uiActions.setSelectedEdge(null));
    dispatch(uiActions.setSelectedNode(null));
  }, [dispatch]);

  // Memoize nodes with selection to avoid creating new objects on every render
  const nodesWithSelection = useMemo(
    () => nodes.map(n => ({
      ...n,
      selected: n.id === selectedNodeId,
    })),
    [nodes, selectedNodeId]
  );

  // Memoize edges with selection to avoid creating new objects on every render
  const edgesWithSelection = useMemo(
    () => edges.map(e => ({
      ...e,
      selected: e.id === selectedEdgeId,
    })),
    [edges, selectedEdgeId]
  );

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      <Sidebar />
      <div
        ref={reactFlowWrapper}
        style={{ flex: 1, height: '100%', position: 'relative' }}
      >
        {/* Connection mode toggle button */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 10,
            display: 'flex',
            gap: 8,
            background: 'white',
            padding: '8px 12px',
            borderRadius: 8,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500 }}>Connection:</span>
          <button
            onClick={handleToggleConnectionMode}
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              background: connectionMode === 'link' ? '#666666' : '#5b9bd5',
              color: 'white',
            }}
          >
            {connectionMode === 'link' ? '--- Link' : '═══ Flow'}
          </button>
        </div>
        
        <ReactFlow
          nodes={nodesWithSelection}
          edges={edgesWithSelection}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnectStart={onConnectStart}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
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
      </div>
    </div>
  );
}

// Wrapper component with ReactFlowProvider
function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}

export default App;
