import type { Metadata } from 'next';
import { isOwner } from '@/lib/auth';
import { getSiteContent } from '@/lib/site';
import { getStore } from '@/lib/store';
import { LoginPanel } from '@/components/admin/LoginPanel';
import { Dashboard } from '@/components/admin/Dashboard';
import styles from '@/components/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Owner dashboard',
  robots: { index: false, follow: false },
};

/**
 * The dashboard.
 *
 * The session check happens here on the server, and again in every route
 * handler the dashboard calls. Rendering the editors is gated, but that is the
 * convenience — the writes are what the route handlers protect.
 */
export default async function AdminPage() {
  if (!(await isOwner())) {
    return (
      <main id="main" className={styles.page}>
        <LoginPanel />
      </main>
    );
  }

  const [site, messages] = await Promise.all([getSiteContent(), getStore().listMessages()]);

  return (
    <main id="main" className={styles.page}>
      <Dashboard initialSite={site} initialMessages={messages} />
    </main>
  );
}
