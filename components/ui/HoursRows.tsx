import type { SiteContent } from '@/lib/content';
import styles from './HoursRows.module.css';

/**
 * The hours list, on the footer's dark ground or a light one.
 *
 * Both label and value are owner-entered free text ("Tue–Thu, Sun",
 * "12pm – 10pm") and are rendered as text, never parsed.
 */
export function HoursRows({
  hours,
  variant,
}: {
  hours: SiteContent['hours'];
  variant: 'footer' | 'light';
}) {
  return (
    <dl className={`${styles.list} ${styles[variant]}`}>
      {hours.map((row, i) => (
        <div key={`${row.label}-${i}`} className={styles.row}>
          <dt className={styles.label}>{row.label}</dt>
          <dd className={styles.value}>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
