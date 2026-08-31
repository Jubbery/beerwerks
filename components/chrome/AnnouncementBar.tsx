import styles from './AnnouncementBar.module.css';

export function AnnouncementBar({ enabled, text }: { enabled: boolean; text: string }) {
  // Renders only when switched on AND non-empty — an owner who clears the text
  // without unticking the box should not get an empty red band.
  if (!enabled || !text.trim()) return null;

  return (
    <div className={styles.bar}>
      <span className={styles.square} aria-hidden="true" />
      <span className={styles.text}>{text}</span>
    </div>
  );
}
