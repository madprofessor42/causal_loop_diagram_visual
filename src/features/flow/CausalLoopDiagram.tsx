/**
 * CausalLoopDiagram - Main React Flow component for the CLD editor
 */

import { useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  ConnectionMode,
  type Node,
  type Edge,
  type OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { VariableNode, CausalEdge, FloatingConnectionLine, type CausalPolarity } from './components';
import styles from './CausalLoopDiagram.module.css';

// Custom node types
const nodeTypes = {
  variable: VariableNode,
};

// Custom edge types
const edgeTypes = {
  causal: CausalEdge,
};

// Default edge options
const defaultEdgeOptions = {
  type: 'causal',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#868e96',
  },
  data: {
    polarity: 'positive' as CausalPolarity,
  },
};

// Initial nodes for demo
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'variable',
    position: { x: 100, y: 100 },
    data: { label: 'Population' },
  },
  {
    id: '2',
    type: 'variable',
    position: { x: 350, y: 100 },
    data: { label: 'Birth Rate' },
  },
  {
    id: '3',
    type: 'variable',
    position: { x: 350, y: 300 },
    data: { label: 'Death Rate' },
  },
];

// Initial edges for demo
const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    sourceHandle: 'source',
    targetHandle: 'source',
    type: 'causal',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#868e96' },
    data: { polarity: 'positive' },
  },
  {
    id: 'e2-1',
    source: '2',
    target: '1',
    sourceHandle: 'source',
    targetHandle: 'source',
    type: 'causal',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#868e96' },
    data: { polarity: 'positive' },
  },
  {
    id: 'e3-1',
    source: '3',
    target: '1',
    sourceHandle: 'source',
    targetHandle: 'source',
    type: 'causal',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#868e96' },
    data: { polarity: 'negative' },
  },
];

// Generate unique ID for new nodes
let nodeIdCounter = 4;
const generateNodeId = () => `${nodeIdCounter++}`;

/**
 * Inner component with access to React Flow hooks
 */
function CausalLoopDiagramInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  // Handle new connections
  const onConnect: OnConnect = useCallback(
    (connection) => {
      // Prevent self-connections
      if (connection.source === connection.target) return;
      
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'causal',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#868e96' },
            data: { polarity: 'positive' as CausalPolarity },
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  // Handle variable label changes (from custom event)
  useEffect(() => {
    const handleLabelChange = (e: Event) => {
      const { id, label } = (e as CustomEvent).detail;
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, label } }
            : node,
        ),
      );
    };

    window.addEventListener('variable-label-change', handleLabelChange);
    return () => window.removeEventListener('variable-label-change', handleLabelChange);
  }, [setNodes]);

  // Handle edge polarity toggle (from custom event)
  useEffect(() => {
    const handlePolarityToggle = (e: Event) => {
      const { id } = (e as CustomEvent).detail;
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id !== id) return edge;
          
          const currentPolarity = (edge.data as { polarity?: CausalPolarity })?.polarity ?? 'unknown';
          const nextPolarity: CausalPolarity =
            currentPolarity === 'positive'
              ? 'negative'
              : currentPolarity === 'negative'
              ? 'unknown'
              : 'positive';
          
          return {
            ...edge,
            data: { ...edge.data, polarity: nextPolarity },
          };
        }),
      );
    };

    window.addEventListener('edge-polarity-toggle', handlePolarityToggle);
    return () => window.removeEventListener('edge-polarity-toggle', handlePolarityToggle);
  }, [setEdges]);

  // Handle drag over for dropping new nodes
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop to create new node
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: generateNodeId(),
        type: 'variable',
        position,
        data: { label: 'New Variable' },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes],
  );

  // Handle delete key for selected nodes/edges
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        setNodes((nds) => nds.filter((node) => !node.selected));
        setEdges((eds) => eds.filter((edge) => !edge.selected));
      }
    },
    [setNodes, setEdges],
  );

  return (
    <div
      ref={reactFlowWrapper}
      className={styles.wrapper}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineComponent={FloatingConnectionLine}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        snapToGrid
        snapGrid={[15, 15]}
        deleteKeyCode={['Delete', 'Backspace']}
      >
        <Background color="#e9ecef" gap={20} />
        <Controls />
        <MiniMap
          nodeColor="#4dabf7"
          maskColor="rgba(0, 0, 0, 0.1)"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}

/**
 * Main component with ReactFlowProvider wrapper
 */
export function CausalLoopDiagram() {
  return (
    <ReactFlowProvider>
      <CausalLoopDiagramInner />
    </ReactFlowProvider>
  );
}

export default CausalLoopDiagram;
