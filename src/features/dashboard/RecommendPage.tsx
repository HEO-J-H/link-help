import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { useWelfare } from '@/context/WelfareContext';
import { recommendForProfile } from '@/core/filter/filterEngine';

export function RecommendPage() {
  const { state } = useFamily();
  const { list, loading, error } = useWelfare();
  const [memberId, setMemberId] = useState(state.members[0]?.id ?? '');

  useEffect(() => {
    if (state.members.length === 0) return;
    if (!state.members.some((m) => m.id === memberId)) {
      setMemberId(state.members[0].id);
    }
  }, [state.members, memberId]);

  const member = state.members.find((m) => m.id === memberId) ?? state.members[0];
  const recs = useMemo(() => {
    if (!member) return [];
    return recommendForProfile(list, member.profile);
  }, [list, member]);

  if (loading) return <p className="muted">복지 데이터를 불러오는 중…</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div>
      <h1 className="page-title">추천</h1>
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
        프로필에서 파생된 태그와 일치하는 항목을 보여 줍니다. 프로필·태그를 채우면 결과가 늘어납니다.
      </p>

      <div className="field">
        <label htmlFor="rec-member">구성원</label>
        <select
          id="rec-member"
          value={member?.id ?? ''}
          onChange={(e) => setMemberId(e.target.value)}
        >
          {state.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
        </select>
      </div>

      {member && (
        <p className="muted" style={{ marginBottom: 16 }}>
          <Link to={`/family/${member.id}`}>프로필 수정</Link>
        </p>
      )}

      <div className="stack">
        {recs.map((w) => (
          <Link key={w.id} to={`/benefits/${w.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card">
              <h3>{w.title}</h3>
              <p>{w.benefit}</p>
              <p className="muted" style={{ marginTop: 6 }}>
                {w.tags.join(' · ')}
              </p>
            </div>
          </Link>
        ))}
      </div>
      {member && recs.length === 0 && (
        <p className="muted">
          조건에 맞는 항목이 없습니다. 지역·나이(생년월일)·장애·학생·소득 구간 또는 포함 태그를
          입력해 보세요.
        </p>
      )}
    </div>
  );
}
