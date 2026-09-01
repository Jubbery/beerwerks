'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'failed';

/**
 * Debounced autosave with a save state the owner can actually see.
 *
 * The design prototype saved optimistically on every keystroke and had no way
 * to report a failure. For owners with nobody to call, that is the highest-risk
 * behaviour in the whole dashboard: a dropped connection looks identical to a
 * successful save. So this hook:
 *
 * - debounces (default 500ms) rather than writing on every keystroke;
 * - surfaces pending / saving / saved / failed distinctly;
 * - never discards the edit on failure — the value lives in React state, and
 *   `retry` re-sends the most recent one;
 * - warns before the tab closes with anything unsaved.
 */
export function useDebouncedSave<T>(save: (value: T) => Promise<void>, delay = 500) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState('');

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValue = useRef<T | null>(null);
  const saveRef = useRef(save);
  // A save in flight must not be overwritten by a stale response.
  const generation = useRef(0);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const flush = useCallback(async () => {
    const value = pendingValue.current;
    if (value === null) return;

    const mine = ++generation.current;
    setStatus('saving');
    setError('');

    try {
      await saveRef.current(value);
      if (generation.current !== mine) return;
      setStatus('saved');
      // "Saved" is transient; it clears so it cannot be mistaken for the
      // state of a later, unsaved edit.
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => {
        setStatus((s) => (s === 'saved' ? 'idle' : s));
      }, 1600);
    } catch (e) {
      if (generation.current !== mine) return;
      setStatus('failed');
      setError(e instanceof Error ? e.message : 'Could not save.');
    }
  }, []);

  const schedule = useCallback(
    (value: T) => {
      pendingValue.current = value;
      setStatus('pending');
      setError('');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [delay, flush],
  );

  /** Re-send the latest value after a failure. */
  const retry = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    void flush();
  }, [flush]);

  // Anything not yet committed is at risk if the tab closes.
  const unsaved = status === 'pending' || status === 'saving' || status === 'failed';
  useEffect(() => {
    if (!unsaved) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [unsaved]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  return { status, error, schedule, retry, unsaved };
}
