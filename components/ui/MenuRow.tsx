import styles from './MenuRow.module.css';

/**
 * A ruled item row. `abv` is omitted for food truck items, which have no
 * trailing cell.
 *
 * If prices are ever added, this is the component that grows a fourth cell —
 * the handoff asks that prices be confirmed before that happens.
 */
export function MenuRow({
  name,
  detail,
  abv,
  variant = 'menu',
}: {
  name: string;
  detail: string;
  abv?: string;
  variant?: 'menu' | 'onTap' | 'food';
}) {
  const variantClass = variant === 'menu' ? '' : styles[variant];

  return (
    <div className={`${styles.row} ${variantClass}`}>
      <h3 className={styles.name}>{name}</h3>
      <span className={styles.leader} aria-hidden="true" />
      {detail ? <span className={styles.detail}>{detail}</span> : null}
      {abv ? <span className={styles.abv}>{abv}</span> : null}
    </div>
  );
}
