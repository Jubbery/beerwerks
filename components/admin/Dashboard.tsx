'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { defaults, type ContactMessage, type SiteContent } from '@/lib/content';
import { useDebouncedSave } from './useDebouncedSave';
import { BannerEditor, DrinksEditor, EventsEditor, FoodEditor, HoursEditor } from './editors';
import { MessagesPanel } from './MessagesPanel';
import { Confirm } from './Confirm';
import styles from './admin.module.css';

const TABS = [
  { id: 'drinks', label: 'Drink Menu' },
  { id: 'food', label: 'Food Truck' },
  { id: 'hours', label: 'Hours' },
  { id: 'events', label: 'Events' },
  { id: 'banner', label: 'Banner' },
  { id: 'messages', label: 'Messages' },
] as const;

type TabId = (typeof TABS)[number]['id'];

async function request(url: string, init: RequestInit): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new Error('No connection — your changes are still here.');
  }

  if (res.status === 401) {
    throw new Error('Your session expired. Sign in again in another tab, then retry.');
  }
  if (!res.ok) {
    const parsed = await res.json().catch(() => null);
    throw new Error(parsed?.error ?? 'Could not save.');
  }
}

export function Dashboard({
  initialSite,
  initialMessages,
}: {
  initialSite: SiteContent;
  initialMessages: ContactMessage[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>('drinks');
  const [site, setSite] = useState(initialSite);
  const [messages, setMessages] = useState(initialMessages);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const [messageError, setMessageError] = useState('');

  const saveSite = useCallback(async (next: SiteContent) => {
    await request('/api/site', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
  }, []);
  const siteSave = useDebouncedSave(saveSite);

  // The editors call this on every keystroke; the hook debounces the write.
  const update = useCallback(
    (next: SiteContent) => {
      setSite(next);
      siteSave.schedule(next);
    },
    [siteSave],
  );

  /**
   * Deleting is immediate, not debounced: it is already behind a confirmation
   * step, and the row is only removed from the list once the server has
   * actually deleted it. A failed delete must not look like a successful one.
   */
  const deleteMessage = useCallback(async (id: string) => {
    setMessageError('');
    try {
      await request(`/api/messages?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      setMessages((current) => current.filter((m) => m.id !== id));
    } catch (e) {
      setMessageError(e instanceof Error ? e.message : 'Could not delete that message.');
    }
  }, []);

  const active = siteSave;

  const saveLabel = (() => {
    switch (active.status) {
      case 'pending':
        return 'Unsaved…';
      case 'saving':
        return 'Saving…';
      case 'saved':
        return 'Saved';
      case 'failed':
        return active.error || 'Not saved';
      default:
        return '';
    }
  })();

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
  }

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <div>
          <p className={styles.headerKicker}>Owner dashboard</p>
          <h1 className={styles.headerTitle}>Manage the site</h1>
        </div>
        <div className={styles.headerActions}>
          <span
            className={`${styles.saveState} ${active.status === 'failed' ? styles.saveFailed : ''}`}
            role="status"
            aria-live="polite"
          >
            {saveLabel}
          </span>
          {active.status === 'failed' ? (
            <button type="button" onClick={active.retry} className={styles.outlineBtn}>
              Retry
            </button>
          ) : null}
          <button type="button" onClick={signOut} className={styles.outlineBtn}>
            Sign out
          </button>
        </div>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Dashboard sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'drinks' ? <DrinksEditor site={site} update={update} /> : null}
        {tab === 'food' ? <FoodEditor site={site} update={update} /> : null}
        {tab === 'hours' ? <HoursEditor site={site} update={update} /> : null}
        {tab === 'events' ? <EventsEditor site={site} update={update} /> : null}
        {tab === 'banner' ? <BannerEditor site={site} update={update} /> : null}
        {tab === 'messages' ? (
          <MessagesPanel messages={messages} onDelete={deleteMessage} error={messageError} />
        ) : null}
      </div>

      <div className={styles.footer}>
        {confirmingReset ? null : (
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className={styles.resetBtn}
          >
            Reset to defaults
          </button>
        )}
        <p className={styles.footerNote}>
          Changes save automatically and appear on the live pages.
        </p>
      </div>

      {confirmingReset ? (
        <Confirm
          text="Reset every menu, the hours, the events and the banner back to their original text? Everything you have typed will be replaced, and this cannot be undone."
          confirmLabel="Reset everything"
          onConfirm={() => {
            setConfirmingReset(false);
            update(defaults());
          }}
          onCancel={() => setConfirmingReset(false)}
        />
      ) : null}
    </div>
  );
}
