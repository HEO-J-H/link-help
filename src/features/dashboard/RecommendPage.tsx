import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { useWelfare } from '@/context/WelfareContext';
import { recommendScoredForProfile } from '@/core/filter/filterEngine';

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
    return recommendScoredForProfile(list, member.profile);
  }, [list, member]);

  if (loading) return <p className="muted">복지 데이터를 불러오는 중…</p>;
  if (error) return <p role="alert">{error}</p>;

  if (state.members.length === 0) {
    return (
      <div>
        <h1 className="page-title">추천</h1>
        <p className="muted">
          추천을 보려면 <Link to="/">가족</Link>에서 구성원을 추가하거나,{' '}
          <Link to="/settings">설정</Link>에서 JSON을 불러오세요.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">추천</h1>
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
        프로필에서 파생된 태그와 일치하는 항목을 보여 줍니다. <strong>기간이 지난·종료</strong>로 보이는
        항목은 빼고, 공용 데이터가 쌓일수록 더 많은 후보를 노릴 수 있게 만드는 방향입니다.{' '}
        <Link to="/smart-find">스마트 매칭</Link>에서 포함·제외 키워드를 조합해 더 넓게 찾을 수 있습니다.
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
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0 }}>{w.title}</h3>
                <span className="score-pill" title="프로필 태그와의 일치 정도(자카드)">
                  {Math.round(w.matchScore * 100)}%
                </span>
              </div>
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
          조건에 맞는 항목이 없습니다. 지역·나이(생년월일)·장애·학생(초중고/대학)·소득 구간 또는 포함
          태그를 프로필에서 입력해 보세요.
        </p>
      )}
    </div>
  );
}
