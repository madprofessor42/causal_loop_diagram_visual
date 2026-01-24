/**
 * Main App component - Simplified with React Flow
 */

import { CausalLoopDiagram } from '../features/flow';
import { Sidebar } from '../features/sidebar';
import styles from './App.module.css';

/**
 * Root App component
 */
export function App() {
  return (
    <div className={styles.app}>
      <Sidebar />
      <main className={styles.main}>
        <CausalLoopDiagram />
      </main>
    </div>
  );
}

export default App;
