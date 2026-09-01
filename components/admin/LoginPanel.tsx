'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './admin.module.css';

/**
 * Owner sign-in.
 *
 * The prototype's "Demo password: flowershop" hint is deliberately absent —
 * the handoff requires it be deleted when real auth lands, and it has.
 */
export function LoginPanel() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? 'That password does not match.');
        setPassword('');
        return;
      }

      // The session cookie is set; re-render the route server-side so the
      // dashboard is served with fresh content.
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.login}>
      <p className={styles.loginKicker}>Owners only</p>
      <h1 className={styles.loginTitle}>Sign in</h1>
      <p className={styles.loginNote}>
        This is where Jacob and Ava edit the menus, hours, events and the homepage banner.
      </p>

      <form onSubmit={onSubmit} className={styles.loginForm}>
        <label htmlFor="owner-password" className={styles.loginKicker}>
          Password
        </label>
        <input
          id="owner-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.loginInput}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'login-error' : undefined}
        />
        {error ? (
          <p id="login-error" className={styles.loginError} role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={busy} className={styles.loginSubmit}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
