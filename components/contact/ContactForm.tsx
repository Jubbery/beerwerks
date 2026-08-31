'use client';

import { useId, useState } from 'react';
import { BUSINESS, CONTACT_TOPICS } from '@/lib/constants';
import { contactSchema, fieldErrors, type FieldErrors } from '@/lib/validation';
import styles from './ContactForm.module.css';

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  topic: CONTACT_TOPICS[0] as string,
  message: '',
  website: '',
};

type Status = 'editing' | 'sending' | 'sent';

export function ContactForm() {
  const id = useId();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>('editing');
  const [sentEmail, setSentEmail] = useState('');
  const [formError, setFormError] = useState('');

  const set = (key: keyof typeof EMPTY) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    // Clear a field's error as soon as it is touched — leaving it up while
    // someone is fixing it reads as though the fix did not register.
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');

    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setFormError(
          body?.error ??
            `That did not go through. Try again, or email us directly at ${BUSINESS.email}.`,
        );
        setStatus('editing');
        return;
      }

      setSentEmail(parsed.data.email);
      setForm(EMPTY);
      setStatus('sent');
    } catch {
      setFormError(
        `That did not go through — check your connection, or email us directly at ${BUSINESS.email}.`,
      );
      setStatus('editing');
    }
  }

  if (status === 'sent') {
    return (
      <div className={styles.sent}>
        <h2 className={styles.sentTitle}>Message sent</h2>
        <p className={styles.sentBody}>
          Thanks — Ava or Jacob will get back to you at {sentEmail}. Usually within a day or two.
        </p>
        <button type="button" onClick={() => setStatus('editing')} className={styles.again}>
          Send another
        </button>
      </div>
    );
  }

  const sending = status === 'sending';

  const describedBy = (key: keyof FieldErrors) => (errors[key] ? `${id}-${key}-error` : undefined);

  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      {formError ? (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      ) : null}

      <div className={styles.field}>
        <label htmlFor={`${id}-name`} className={styles.label}>
          Name
        </label>
        <input
          id={`${id}-name`}
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={(e) => set('name')(e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy('name')}
          className={`${styles.input} ${errors.name ? styles.invalid : ''}`}
        />
        {errors.name ? (
          <p id={`${id}-name-error`} className={styles.error}>
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${id}-email`} className={styles.label}>
          Email
        </label>
        <input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => set('email')(e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describedBy('email')}
          className={`${styles.input} ${errors.email ? styles.invalid : ''}`}
        />
        {errors.email ? (
          <p id={`${id}-email-error`} className={styles.error}>
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${id}-phone`} className={styles.label}>
          Phone (optional)
        </label>
        <input
          id={`${id}-phone`}
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => set('phone')(e.target.value)}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={describedBy('phone')}
          className={`${styles.input} ${errors.phone ? styles.invalid : ''}`}
        />
        {errors.phone ? (
          <p id={`${id}-phone-error`} className={styles.error}>
            {errors.phone}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${id}-topic`} className={styles.label}>
          What&apos;s this about
        </label>
        <select
          id={`${id}-topic`}
          value={form.topic}
          onChange={(e) => set('topic')(e.target.value)}
          className={styles.input}
        >
          {CONTACT_TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor={`${id}-message`} className={styles.label}>
          Message
        </label>
        <textarea
          id={`${id}-message`}
          rows={6}
          value={form.message}
          onChange={(e) => set('message')(e.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describedBy('message')}
          className={`${styles.textarea} ${errors.message ? styles.invalid : ''}`}
        />
        {errors.message ? (
          <p id={`${id}-message-error`} className={styles.error}>
            {errors.message}
          </p>
        ) : null}
      </div>

      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input
          id={`${id}-website`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => set('website')(e.target.value)}
        />
      </div>

      <button type="submit" disabled={sending} className={styles.submit}>
        {sending ? 'Sending…' : 'Send to the owners'}
      </button>
      <p className={styles.footnote}>Goes to {BUSINESS.email}.</p>
    </form>
  );
}
