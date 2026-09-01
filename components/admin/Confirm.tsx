'use client';

import styles from './admin.module.css';

/**
 * An inline confirmation step for a destructive action.
 *
 * Resetting the site and deleting a message are both irreversible and both
 * one click away in the design. The owners have no undo and no backup they
 * know how to reach, so each gets a deliberate second step.
 */
export function Confirm({
  text,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  text: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className={styles.confirm} role="alertdialog" aria-label={confirmLabel}>
      <p className={styles.confirmText}>{text}</p>
      <div className={styles.confirmActions}>
        <button type="button" onClick={onConfirm} className={styles.confirmDestroy}>
          {confirmLabel}
        </button>
        <button type="button" onClick={onCancel} className={styles.outlineBtn}>
          Cancel
        </button>
      </div>
    </div>
  );
}
