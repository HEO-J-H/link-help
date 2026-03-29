import { useEffect, useRef } from 'react';
import { useFamily } from '@/context/FamilyContext';

/**
 * Fires system notifications for due reminders when enabled in settings.
 */
export function ReminderRunner() {
  const { state, updateState } = useFamily();
  const stateRef = useRef(state);
  stateRef.current = state;
  const updateRef = useRef(updateState);
  updateRef.current = updateState;

  useEffect(() => {
    const tick = () => {
      const s = stateRef.current;
      if (!s.appSettings.browserNotifications) return;
      if (typeof Notification === 'undefined') return;
      if (Notification.permission !== 'granted') return;

      const now = Date.now();
      const pending = s.reminders.filter(
        (r) => !r.delivered && new Date(r.fireAt).getTime() <= now
      );
      if (pending.length === 0) return;

      for (const r of pending) {
        try {
          new Notification(r.title, { body: r.body, tag: r.id });
        } catch {
          /* ignore */
        }
      }

      const ids = new Set(pending.map((p) => p.id));
      updateRef.current((prev) => ({
        ...prev,
        reminders: prev.reminders.map((r) => (ids.has(r.id) ? { ...r, delivered: true } : r)),
      }));
    };

    const id = window.setInterval(tick, 45_000);
    tick();
    return () => clearInterval(id);
  }, []);

  return null;
}
