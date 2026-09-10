'use client';

import { useState } from 'react';
import type { ContactMessage } from '@/lib/content';
import { Confirm } from './Confirm';
import styles from './admin.module.css';

/** Localized, but tolerant of a bad timestamp rather than crashing the tab. */
function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export function MessagesPanel({
  messages,
  onDelete,
  error,
}: {
  messages: ContactMessage[];
  onDelete: (id: string) => void;
  error?: string;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (messages.length === 0) {
    return (
      <section>
        <p className={styles.empty}>
          No messages yet. Anything sent from the contact page lands here.
        </p>
      </section>
    );
  }

  return (
    <section>
      {error ? (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      ) : null}
      {messages.map((message) => (
        <article key={message.id} className={styles.message}>
          <div className={styles.messageHead}>
            <div>
              <p className={styles.messageName}>{message.name}</p>
              <p className={styles.messageMeta}>
                {message.email} · {message.phone}
              </p>
            </div>
            <div className={styles.messageAside}>
              <span className={styles.topicTag}>{message.topic}</span>
              <p className={styles.messageWhen}>{formatWhen(message.receivedAt)}</p>
            </div>
          </div>

          <p className={styles.messageBody}>{message.message}</p>

          {confirmingId === message.id ? (
            <Confirm
              text={`Delete this message from ${message.name}? It cannot be brought back.`}
              confirmLabel="Delete it"
              onConfirm={() => {
                setConfirmingId(null);
                onDelete(message.id);
              }}
              onCancel={() => setConfirmingId(null)}
            />
          ) : (
            <div className={styles.messageActions}>
              <a
                href={`mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(
                  `Re: ${message.topic}`,
                )}`}
                className={styles.replyBtn}
              >
                Reply by email
              </a>
              <button
                type="button"
                onClick={() => setConfirmingId(message.id)}
                className={styles.dangerBtn}
              >
                Delete
              </button>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
