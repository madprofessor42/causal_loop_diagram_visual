/**
 * Sidebar component - Contains draggable variable templates
 */

import { VariableTemplate } from './VariableTemplate';
import styles from './Sidebar.module.css';

/**
 * Sidebar with draggable elements and instructions
 */
export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h1 className={styles.title}>CLD Editor</h1>
        <p className={styles.subtitle}>Causal Loop Diagram</p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Elements</h2>
          <div className={styles.templates}>
            <VariableTemplate id="variable-template" label="Variable" />
          </div>
        </section>

        <div className={styles.divider} />

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How to use</h2>
          <div className={styles.instructions}>
            <div className={styles.instructionItem}>
              <span className={styles.instructionNumber}>1</span>
              <p className={styles.instructionText}>
                Drag a Variable to the canvas
              </p>
            </div>
            <div className={styles.instructionItem}>
              <span className={styles.instructionNumber}>2</span>
              <p className={styles.instructionText}>
                Click on a variable edge to draw an arrow
              </p>
            </div>
            <div className={styles.instructionItem}>
              <span className={styles.instructionNumber}>3</span>
              <p className={styles.instructionText}>
                Release on another variable to connect
              </p>
            </div>
            <div className={styles.instructionItem}>
              <span className={styles.instructionNumber}>4</span>
              <p className={styles.instructionText}>
                Use scroll wheel to zoom in/out
              </p>
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
}
