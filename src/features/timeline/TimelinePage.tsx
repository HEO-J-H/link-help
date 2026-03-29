import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { useWelfare } from '@/context/WelfareContext';
import { recommendForProfileAtAge } from '@/core/filter/filterEngine';
import { ageFromBirthDate } from '@/utils/date';
import { upcomingMilestoneAges, yearWhenTurningAge } from '@/utils/timeline';

export function TimelinePage() {
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

  const milestones = useMemo(() => {
    if (!member?.profile.birthDate) return [];
    return upcomingMilestoneAges(member.profile.birthDate);
  }, [member]);

  const blocks = useMemo(() => {
    if (!member) return [];
    return milestones.map((age) => ({
      age,
      year: yearWhenTurningAge(member.profile.birthDate, age),
      items: recommendForProfileAtAge(list, member.profile, age),
    }));
  }, [list, member, milestones]);

  if (loading) return <p className="muted">복지 데이터를 불러오는 중…</p>;
  if (error) return <p role="alert">{error}</p>;

  const currentAge = member ? ageFromBirthDate(member.profile.birthDate) : null;

  return (
    <div>
      <h1 className="page-title">타임라인</h1>
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
        앞으로 도래하는 나이(만 50·55·60…)를 기준으로, 그때의 조건에 맞는 샘플 혜택을 미리 봅니다.
      </p>

      <div className="field">
        <label htmlFor="tl-member">구성원</label>
        <select
          id="tl-member"
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
          {currentAge != null && (
            <>
              {' '}
              · 현재 만 {currentAge}세
            </>
          )}
        </p>
      )}

      {!member?.profile.birthDate && (
        <p className="muted">생년월일을 입력하면 앞으로의 연령별 힌트가 표시됩니다.</p>
      )}

      {member?.profile.birthDate && milestones.length === 0 && (
        <p className="muted">표시할 다음 연령 마일스톤이 없습니다(이미 지난 구간이거나 75세 초과).</p>
      )}

      <div className="stack" style={{ marginTop: 8 }}>
        {blocks.map(({ age, year, items }) => (
          <section key={age} className="card" style={{ marginBottom: 12 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>
              만 {age}세
              {year != null && (
                <span className="muted" style={{ fontWeight: 500, fontSize: '0.95rem' }}>
                  {' '}
                  (약 {year}년)
                </span>
              )}
            </h2>
            {items.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                이 나이대에 맞는 샘플 항목이 없습니다. 복지 DB에 태그를 추가하면 여기에 나타납니다.
              </p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {items.map((w) => (
                  <li key={w.id} style={{ marginBottom: 8 }}>
                    <Link to={`/benefits/${w.id}`}>{w.title}</Link>
                    <span className="muted"> — {w.benefit}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
