import { Link } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { formatDateKR } from '@/utils/format';

function kindLabel(k: string): string {
  if (k === 'benefit') return '복지';
  if (k === 'insurance') return '보험';
  return '기타';
}

export function NotificationsPage() {
  const { state, setState } = useFamily();
  const sorted = [...state.reminders].sort(
    (a, b) => new Date(a.fireAt).getTime() - new Date(b.fireAt).getTime()
  );

  const remove = (rid: string) => {
    setState({ ...state, reminders: state.reminders.filter((r) => r.id !== rid) });
  };

  return (
    <div>
      <h1 className="page-title">알림</h1>
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
        예정된 알림 목록입니다. 브라우저 알림은 설정에서 허용해야 표시됩니다.
      </p>

      <p className="muted" style={{ marginBottom: 16 }}>
        <Link to="/settings">설정에서 알림 허용</Link>
      </p>

      <div className="stack">
        {sorted.length === 0 && <p className="muted">등록된 알림이 없습니다. 혜택·보험 상세에서 추가하세요.</p>}
        {sorted.map((r) => (
          <div key={r.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.02rem' }}>{r.title}</h3>
                <p style={{ margin: 0 }}>{r.body}</p>
                <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
                  {kindLabel(r.kind)} · {formatDateKR(r.fireAt)}
                  {r.delivered ? ' · 전달됨' : ''}
                </p>
              </div>
              <button type="button" className="btn ghost" style={{ minHeight: 40, flexShrink: 0 }} onClick={() => remove(r.id)}>
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
