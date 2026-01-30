import { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  BackgroundVariant,
  ConnectionMode,
  type OnConnect,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import './App.css';

import { CircularNode } from './components/CircularNode';
import FloatingEdge from './components/FloatingEdge';
import type { CircularNodeData } from './types';

const nodeTypes: NodeTypes = {
  circular: CircularNode,
};

const edgeTypes = {
  floating: FloatingEdge,
};

const initialNodes: Node<CircularNodeData>[] = [
  {
    id: '1',
    type: 'circular',
    position: { x: 250, y: 100 },
    data: { label: 'A' },
  },
  {
    id: '2',
    type: 'circular',
    position: { x: 450, y: 250 },
    data: { label: 'B' },
  },
  {
    id: '3',
    type: 'circular',
    position: { x: 150, y: 300 },
    data: { label: 'C' },
  },
];

const initialEdges: Edge[] = [];

function App() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'floating',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#b1b1b7',
            },
          },
          eds
        )
      ),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        minZoom={0.5}
        maxZoom={2}
      >
        <Controls />
        <MiniMap nodeColor="#6366f1" />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

export default App;

