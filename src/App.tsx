import { ReactFlowProvider } from '@xyflow/react';

import './App.css';

import { AppLayout } from './components/AppLayout';
import { DiagramCanvas } from './components/DiagramCanvas';
import type { BaseEdgeData } from './types';

// Context to pass edge update function to edge components
export type UpdateEdgeData = (edgeId: string, data: Partial<BaseEdgeData>) => void;

function Flow() {
  return (
    <AppLayout>
      <DiagramCanvas />
    </AppLayout>
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
