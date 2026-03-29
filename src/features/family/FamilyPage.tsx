import { Link } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { formatDateKR } from '@/utils/format';

const relLabel: Record<string, string> = {
  self: '본인',
  spouse: '배우자',
  child: '자녀',
  parent: '부모',
  other: '기타',
};

export function FamilyPage() {
  const { state, addMember } = useFamily();

  return (
    <div>
      <h1 className="page-title">가족</h1>
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
        구성원을 눌러 프로필을 입력하면 추천에 반영됩니다.
      </p>
      <div className="card" style={{ marginBottom: 16, padding: '12px 14px' }}>
        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.55 }}>
          처음이면 <Link to="/start">빠른 시작</Link>에서 실행 방법을 보거나,{' '}
          <Link to="/settings">설정</Link>의 「로컬 API 주소 넣기」로 서버와 연결할 수 있습니다.
        </p>
      </div>
      <div className="stack">
        {state.members.map((m) => (
          <Link key={m.id} to={`/family/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card">
              <h3>
                {m.displayName}{' '}
                <span className="muted" style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                  ({relLabel[m.relationship]})
                </span>
              </h3>
              <p>
                {m.profile.region || '지역 미입력'} ·{' '}
                {m.profile.birthDate ? formatDateKR(m.profile.birthDate) : '생년월일 미입력'}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <button
        type="button"
        className="btn secondary"
        style={{ width: '100%', marginTop: 16 }}
        onClick={() => {
          const name = window.prompt('구성원 이름', '새 구성원');
          if (name?.trim()) addMember(name.trim());
        }}
      >
        + 구성원 추가
      </button>
    </div>
  );
}
