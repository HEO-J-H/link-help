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
