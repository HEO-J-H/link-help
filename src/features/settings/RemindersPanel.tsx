import { useFamily } from '@/context/FamilyContext';
import { formatDateKR } from '@/utils/format';

function kindEmoji(k: string): string {
  if (k === 'benefit') return '🏛️';
  if (k === 'insurance') return '🛡️';
  return '📌';
}

export function RemindersPanel() {
  const { state, setState } = useFamily();
  const sorted = [...state.reminders].sort(
    (a, b) => new Date(a.fireAt).getTime() - new Date(b.fireAt).getTime()
  );

  const remove = (rid: string) => {
    setState({ ...state, reminders: state.reminders.filter((r) => r.id !== rid) });
  };

  if (sorted.length === 0) {
    return (
      <div className="settings-empty-illu" role="status">
        <span className="settings-empty-illu__icon" aria-hidden>
          🗓️
        </span>
        <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
          예정 알림이 없어요. 혜택 상세에서 추가할 수 있어요.
        </p>
      </div>
    );
  }

  return (
    <ul className="reminder-list" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {sorted.map((r) => (
        <li key={r.id} className="reminder-list__item">
          <span className="reminder-list__emoji" aria-hidden>
            {kindEmoji(r.kind)}
          </span>
          <div className="reminder-list__body">
            <div className="reminder-list__title">{r.title}</div>
            <div className="reminder-list__meta">
              <span className="reminder-list__date">{formatDateKR(r.fireAt)}</span>
              {r.delivered ? <span className="reminder-list__badge">전달됨</span> : null}
            </div>
          </div>
          <button
            type="button"
            className="reminder-list__trash"
            aria-label="알림 삭제"
            onClick={() => remove(r.id)}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
