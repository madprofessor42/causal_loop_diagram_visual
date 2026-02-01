import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uiActions, selectConnectionMode } from '../../store/slices/uiSlice';
import styles from './ConnectionModeToggle.module.css';

export function ConnectionModeToggle() {
  const dispatch = useAppDispatch();
  const connectionMode = useAppSelector(selectConnectionMode);

  const handleToggle = useCallback(() => {
    dispatch(uiActions.toggleConnectionMode());
  }, [dispatch]);

  return (
    <div className={styles.container}>
      <span className={styles.label}>Connection:</span>
      <button
        onClick={handleToggle}
        className={`${styles.button} ${connectionMode === 'link' ? styles.buttonLink : styles.buttonFlow}`}
      >
        {connectionMode === 'link' ? '--- Link' : '═══ Flow'}
      </button>
    </div>
  );
}

