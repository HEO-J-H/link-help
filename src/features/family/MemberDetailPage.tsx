import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import type { HouseholdDefaults } from '@/types/household';
import type { MemberProfile, Relationship, StudentLevel } from '@/types/family';
import { getEffectiveProfile } from '@/core/family/effectiveProfile';
import { INCOME_CHOICES } from '@/features/family/formConstants';
import { HouseholdFormFields } from '@/features/family/HouseholdFormFields';
import { useRegionCatalog } from '@/features/family/useRegionCatalog';

const relationships: { value: Relationship; label: string }[] = [
  { value: 'self', label: '본인' },
  { value: 'spouse', label: '배우자' },
  { value: 'child', label: '자녀' },
  { value: 'parent', label: '부모' },
  { value: 'other', label: '기타' },
];

const STUDENT_CHOICES: { value: StudentLevel; title: string; hint: string }[] = [
  { value: 'none', title: '해당 없음', hint: '재학 중이 아님' },
  {
    value: 'k12',
    title: '초·중·고 재학',
    hint: '의무교육 단계. 복지 DB에 「청소년」 태그로 맞춥니다.',
  },
  {
    value: 'university',
    title: '대학·대학원 재학',
    hint: '고등교육기관. 복지 DB에 「대학생」 태그로 맞춥니다(나이·공고 기준).',
  },
];

function composeRegion(sido: string, sigungu: string): string {
  if (sido === '전국') return '전국';
  return [sido, sigungu].filter(Boolean).join(' ');
}

function TagsEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');
  return (
    <div>
      <div className="field-row field-row--wrap">
        {value.map((t) => (
          <span
            key={t}
            style={{
              background: '#e8f0ec',
              padding: '6px 10px',
              borderRadius: 8,
              fontSize: '0.9rem',
            }}
          >
            {t}
            <button
              type="button"
              className="btn ghost btn--compact"
              style={{ marginLeft: 6 }}
              onClick={() => onChange(value.filter((x) => x !== t))}
              aria-label={`${t} 제거`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="field-row" style={{ marginTop: 8 }}>
        <input
          className="search-input"
          style={{ marginBottom: 0 }}
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim()) {
              e.preventDefault();
              if (!value.includes(draft.trim())) onChange([...value, draft.trim()]);
              setDraft('');
            }
          }}
        />
        <button
          type="button"
          className="btn secondary btn--compact"
          style={{ flexShrink: 0 }}
          onClick={() => {
            if (draft.trim() && !value.includes(draft.trim())) {
              onChange([...value, draft.trim()]);
              setDraft('');
            }
          }}
        >
          추가
        </button>
      </div>
    </div>
  );
}

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, updateMember, removeMember } = useFamily();
  const catalog = useRegionCatalog();
  const member = state.members.find((m) => m.id === id);
  const [local, setLocal] = useState<MemberProfile | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<Relationship>('other');
  const [snackbar, setSnackbar] = useState(false);
  const snackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!member) return;
    setLocal({ ...member.profile });
    setName(member.displayName);
    setRelationship(member.relationship);
  }, [member]);

  useEffect(() => {
    return () => {
      if (snackTimerRef.current) clearTimeout(snackTimerRef.current);
    };
  }, []);

  if (!member || !local) {
    return (
      <div>
        <p>구성원을 찾을 수 없습니다.</p>
        <Link to="/">가족 목록</Link>
      </div>
    );
  }

  const persist = (profile: MemberProfile) => {
    updateMember(member.id, {
      displayName: name,
      relationship,
      profile,
    });
  };

  const flushName = () => {
    updateMember(member.id, { displayName: name });
  };

  const saveExplicit = () => {
    persist(local);
    updateMember(member.id, { displayName: name, relationship });
    setSnackbar(true);
    if (snackTimerRef.current) clearTimeout(snackTimerRef.current);
    snackTimerRef.current = setTimeout(() => setSnackbar(false), 2200);
  };

  const effective = getEffectiveProfile(member, state.household);
  const incomeHint = INCOME_CHOICES.find((c) => c.value === local.incomeBand)?.hint ?? '';

  const memberGeoIncomeValue: HouseholdDefaults = {
    sido: local.regionSido,
    sigungu: local.regionSigungu,
    incomeBand: local.incomeBand,
    annualIncomeMemoManwon: local.annualIncomeMemoManwon,
  };

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link to="/" className="text-link">
          ← 가족
        </Link>
      </p>
      <h1 className="page-title">구성원 프로필</h1>

      <div
        className="snackbar"
        role="status"
        aria-live="polite"
        data-visible={snackbar ? 'true' : 'false'}
      >
        저장했습니다
      </div>

      <div className="field">
        <label htmlFor="m-name">이름</label>
        <input id="m-name" value={name} onChange={(e) => setName(e.target.value)} onBlur={flushName} />
      </div>

      <div className="field">
        <label htmlFor="m-rel">관계</label>
        <select
          id="m-rel"
          value={relationship}
          onChange={(e) => {
            const r = e.target.value as Relationship;
            setRelationship(r);
            updateMember(member.id, { relationship: r });
          }}
        >
          {relationships.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="switch-row" style={{ cursor: 'default' }}>
          <input
            type="checkbox"
            className="input-checkbox"
            checked={local.useHouseholdRegionIncome}
            onChange={(e) => {
              const v = e.target.checked;
              const next = { ...local, useHouseholdRegionIncome: v };
              setLocal(next);
              persist(next);
            }}
          />
          <span className="switch-row__body">
            <span className="switch-row__title">지역·소득은 가구 기본과 동일</span>
            <span className="switch-row__hint">
              켜 두면 <Link to="/">가족 탭</Link>의 「가구 기본」이 이 사람에게도 적용됩니다. 꺼면 아래에서만
              따로 고릅니다.
            </span>
          </span>
        </label>
      </div>

      {local.useHouseholdRegionIncome ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ marginTop: 0, fontWeight: 600 }}>적용 중인 지역·소득 (가구 기준)</p>
          <p className="muted" style={{ marginBottom: 0 }}>
            {effective.region || '지역 미설정'} ·{' '}
            {INCOME_CHOICES.find((c) => c.value === effective.incomeBand)?.label ?? '소득 구간 없음'}
          </p>
        </div>
      ) : (
        <>
          <h2 className="subsection-title">이 구성원만의 지역·소득</h2>
          <HouseholdFormFields
            catalog={catalog}
            enabled={catalog !== null}
            incomeIdPrefix="m"
            value={memberGeoIncomeValue}
            onChange={(h) => {
              const region = composeRegion(h.sido, h.sigungu);
              const next: MemberProfile = {
                ...local,
                regionSido: h.sido,
                regionSigungu: h.sigungu,
                region,
                incomeBand: h.incomeBand,
                annualIncomeMemoManwon: h.annualIncomeMemoManwon,
              };
              setLocal(next);
              persist(next);
            }}
          />
          {incomeHint && <p className="field-hint">{incomeHint}</p>}
          <details className="details-help">
            <summary className="details-help__summary">중위소득·금액이 헷갈려요</summary>
            <div className="details-help__body">
              <p>
                <strong>중위소득 150%는 고정 금액이 아닙니다.</strong> 가구원 수·연도·공고마다 달라집니다.
              </p>
              <p>
                이 앱의 「소득 구간」은 <strong>샘플 복지 태그</strong>와 맞추기 위한 선택입니다.
              </p>
              <p className="details-help__links">
                <a
                  href="https://www.bokjiro.go.kr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link"
                >
                  복지로(정부복지포털)
                </a>
                에서 「중위소득」으로 검색해 보세요.
              </p>
            </div>
          </details>
        </>
      )}

      <div className="field">
        <label htmlFor="m-bd">생년월일</label>
        <input
          id="m-bd"
          type="date"
          value={local.birthDate}
          onChange={(e) => {
            const next = { ...local, birthDate: e.target.value };
            setLocal(next);
            persist(next);
          }}
        />
        <p className="field-hint">학생·청년 태그 자동 매칭에 사용됩니다.</p>
      </div>

      <div className="field">
        <label htmlFor="m-job">직업·상태</label>
        <input
          id="m-job"
          value={local.occupation}
          onChange={(e) => setLocal({ ...local, occupation: e.target.value })}
          onBlur={(e) => {
            const occ = e.target.value;
            const next = { ...local, occupation: occ };
            setLocal(next);
            persist(next);
          }}
          placeholder="예: 직장인"
        />
        <p className="field-hint">공고에 직업 태그가 있을 때만 매칭에 쓰입니다.</p>
      </div>

      <fieldset className="field fieldset-plain">
        <legend className="fieldset-legend">학생 여부</legend>
        <p className="field-hint field-hint--tight">초·중·고와 대학을 나눴습니다.</p>
        <div className="segmented" role="radiogroup" aria-label="학생 여부">
          {STUDENT_CHOICES.map((opt) => {
            const active = local.studentLevel === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                className={`segmented__btn${active ? ' segmented__btn--active' : ''}`}
                onClick={() => {
                  const next = { ...local, studentLevel: opt.value };
                  setLocal(next);
                  persist(next);
                }}
              >
                <span className="segmented__title">{opt.title}</span>
                <span className="segmented__hint">{opt.hint}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="field">
        <label className="switch-row">
          <input
            type="checkbox"
            className="input-checkbox"
            checked={local.hasDisability}
            onChange={(e) => {
              const next = { ...local, hasDisability: e.target.checked };
              setLocal(next);
              persist(next);
            }}
          />
          <span className="switch-row__body">
            <span className="switch-row__title">등록 장애인에 해당</span>
            <span className="switch-row__hint">복지 공고의 「장애인」 조건과 맞출 때 켜 주세요.</span>
          </span>
        </label>
      </div>

      <div className="field">
        <label>포함 태그 (추가 조건)</label>
        <TagsEditor
          value={local.extraIncludeTags}
          onChange={(v) => {
            const next = { ...local, extraIncludeTags: v };
            setLocal(next);
            persist(next);
          }}
          placeholder="예: 청년"
        />
      </div>

      <div className="field">
        <label>제외 태그</label>
        <TagsEditor
          value={local.extraExcludeTags}
          onChange={(v) => {
            const next = { ...local, extraExcludeTags: v };
            setLocal(next);
            persist(next);
          }}
          placeholder="예: 차상위"
        />
      </div>

      <div className="stack-actions">
        <button type="button" className="btn" onClick={saveExplicit}>
          저장
        </button>
        <button type="button" className="btn secondary" onClick={() => navigate('/benefits')}>
          혜택 목록으로 이동
        </button>
      </div>

      {member.relationship !== 'self' && (
        <button
          type="button"
          className="btn secondary danger-outline"
          style={{ width: '100%', marginTop: 12 }}
          onClick={() => {
            if (window.confirm('이 구성원을 삭제할까요?')) {
              removeMember(member.id);
              navigate('/');
            }
          }}
        >
          구성원 삭제
        </button>
      )}
    </div>
  );
}
