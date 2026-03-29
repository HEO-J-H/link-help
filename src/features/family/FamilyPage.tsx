import { Link } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { formatDateKR } from '@/utils/format';
import { getEffectiveProfile } from '@/core/family/effectiveProfile';
import { HouseholdFormFields } from '@/features/family/HouseholdFormFields';
import { useRegionCatalog } from '@/features/family/useRegionCatalog';
const relLabel: Record<string, string> = {
  self: '본인',
  spouse: '배우자',
  child: '자녀',
  parent: '부모',
  other: '기타',
};

export function FamilyPage() {
  const { state, addMember, updateState } = useFamily();
  const catalog = useRegionCatalog();

  return (
    <div>
      <h1 className="page-title">가족</h1>
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
        <strong>가구 기본 정보</strong>(지역·소득)은 구성원 전체가 함께 쓰는 값입니다. 구성원 프로필에서
        「가구와 동일」을 켜 두면 추천·스마트 매칭에 이 값이 반영됩니다.
      </p>
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
        <strong>이 주소만 열어도</strong> 가족·혜택·추천·스마트 매칭이 이 브라우저 안에서 동작합니다.
        탭을 닫기 전에 필요하면 설정에서 JSON 백업을 하세요.
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>가구 기본 — 지역·소득</h2>
        <p className="field-hint" style={{ marginTop: 0 }}>
          시·도와 시·군·구를 고르면 복지 태그(예: 경기도, 용인시)가 둘 다 잡힙니다. 테스트할 때는{' '}
          <strong>경기도 → 용인시</strong>처럼 번들 복지 데이터와 맞춰 보세요.
        </p>
        <HouseholdFormFields
          catalog={catalog}
          enabled={catalog !== null}
          value={state.household}
          incomeIdPrefix="fam"
          onChange={(household) => updateState((prev) => ({ ...prev, household }))}
        />
      </div>

      {state.members.length === 0 && (
        <p className="muted" style={{ marginBottom: 14, fontSize: '0.92rem' }}>
          아직 구성원이 없습니다. 아래에서 추가하거나, 설정의 <strong>가족 정보 불러오기</strong>로
          JSON을 넣으면 이전 입력을 복원할 수 있습니다.
        </p>
      )}
      <div className="card" style={{ marginBottom: 16, padding: '12px 14px' }}>
        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.55 }}>
          <Link to="/start">빠른 시작</Link> · <Link to="/settings">설정</Link>
        </p>
      </div>
      <div className="stack">
        {state.members.map((m) => {
          const eff = getEffectiveProfile(m, state.household);
          return (
            <Link key={m.id} to={`/family/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card">
                <h3>
                  {m.displayName}{' '}
                  <span className="muted" style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                    ({relLabel[m.relationship]})
                  </span>
                </h3>
                <p>
                  {eff.region || '지역 미입력'} ·{' '}
                  {m.profile.birthDate ? formatDateKR(m.profile.birthDate) : '생년월일 미입력'}
                </p>
                {!m.profile.useHouseholdRegionIncome && (
                  <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
                    이 구성원은 가구와 다른 지역·소득을 씁니다.
                  </p>
                )}
              </div>
            </Link>
          );
        })}
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
