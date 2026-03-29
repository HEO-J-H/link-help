import { Link } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { formatDateKR } from '@/utils/format';

export function InsuranceListPage() {
  const { state } = useFamily();
  const byMember = (mid: string) => state.members.find((m) => m.id === mid)?.displayName ?? '구성원';

  return (
    <div>
      <h1 className="page-title">보험</h1>
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
        실손·암 등 가족 보험을 로컬에만 기록합니다. 갱신일 알림은 상세에서 등록할 수 있습니다.
      </p>

      <Link to="/insurance/new" className="btn secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 16 }}>
        + 보험 추가
      </Link>

      <div className="stack">
        {state.insurancePolicies.length === 0 && (
          <p className="muted">등록된 보험이 없습니다.</p>
        )}
        {state.insurancePolicies.map((p) => (
          <Link key={p.id} to={`/insurance/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card">
              <h3>{p.title}</h3>
              <p>
                {p.insurer}
                {p.premiumNote ? ` · ${p.premiumNote}` : ''}
              </p>
              <p className="muted" style={{ marginTop: 6 }}>
                {byMember(p.memberId)} · 갱신 {p.renewalDate ? formatDateKR(p.renewalDate) : '미입력'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
