import type { ReactNode } from 'react';
import { Sidebar } from '../Sidebar';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.canvasWrapper}>
        {children}
      </div>
    </div>
  );
}

