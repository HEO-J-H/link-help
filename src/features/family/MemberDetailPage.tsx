import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import type { HouseholdDefaults } from '@/types/household';
import type {
  AssetAnswer,
  EmploymentContractKind,
  EnrollmentStatus,
  HealthInsuranceKind,
  HousingTenure,
  LivelihoodSupportTier,
  MemberProfile,
  ParentingStage,
  PrimarySectorContext,
  Relationship,
  StudentLevel,
} from '@/types/family';
import { getEffectiveProfile } from '@/core/family/effectiveProfile';
import { profileMatchReadiness } from '@/core/family/profileMatchReadiness';
import { ASSET_CHOICES, INCOME_CHOICES, OCCUPATION_KIND_CHOICES } from '@/features/family/formConstants';
import { HouseholdFormFields } from '@/features/family/HouseholdFormFields';
import { useRegionCatalog } from '@/features/family/useRegionCatalog';
import { MEMBER_COLOR_PRESETS, memberColorForInput } from '@/core/family/memberColors';
import { sanitizeBirthDateCompactInput, normalizeBirthDateForStorage, birthDateStoredToCompact } from '@/utils/date';
import { WELFARE_INTEREST_CATEGORY_DEFS } from '@/core/filter/filterEngine';

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

const EMPLOYMENT_CONTRACT_CHOICES: { value: EmploymentContractKind; label: string }[] = [
  { value: '', label: '선택 (근로·육아휴직일 때 권장)' },
  { value: 'regular', label: '정규직' },
  { value: 'contract', label: '계약직·기간제' },
  { value: 'daily', label: '일용·단기' },
  { value: 'special', label: '특수형태·프리랜서 등' },
  { value: 'unknown', label: '잘 모름' },
];

const ENROLLMENT_CHOICES: { value: EnrollmentStatus; label: string }[] = [
  { value: '', label: '선택 (학생일 때)' },
  { value: 'enrolled', label: '재학' },
  { value: 'on_leave', label: '휴학' },
  { value: 'expected_graduate', label: '졸업 예정' },
];

const PARENTING_CHOICES: { value: ParentingStage; label: string }[] = [
  { value: 'none', label: '해당 없음' },
  { value: 'pregnancy', label: '임신 중' },
  { value: 'infant', label: '영유아 양육' },
  { value: 'school_age', label: '취학 자녀 양육' },
];

const HOUSING_CHOICES: { value: HousingTenure; label: string }[] = [
  { value: '', label: '선택' },
  { value: 'owned', label: '자가' },
  { value: 'jeonse', label: '전세' },
  { value: 'monthly', label: '월세' },
  { value: 'free', label: '무상거주 등' },
  { value: 'other', label: '기타' },
];

const HEALTH_CHOICES: { value: HealthInsuranceKind; label: string }[] = [
  { value: '', label: '선택' },
  { value: 'employee', label: '직장·직종 가입' },
  { value: 'local', label: '지역 가입' },
  { value: 'medical_aid', label: '의료급여' },
];

const LIVELIHOOD_TIER_CHOICES: { value: LivelihoodSupportTier; label: string }[] = [
  { value: '', label: '선택 (미지정)' },
  { value: 'none', label: '해당 없음 (기초생계·차상위 해당 아님)' },
  { value: 'basic_livelihood', label: '기초생활수급·생계급여 등' },
  { value: 'near_poverty', label: '차상위계층' },
];

const PRIMARY_SECTOR_CHOICES: { value: PrimarySectorContext; label: string }[] = [
  { value: '', label: '선택 (미지정)' },
  { value: 'none', label: '해당 없음' },
  { value: 'agriculture', label: '농업·농촌 생계와 밀접' },
  { value: 'fishery', label: '어업·어촌 생계와 밀접' },
];

/** One-tap tags — typing optional. */
const INCLUDE_TAG_PRESETS = [
  '청년',
  '중장년',
  '노인',
  '학생',
  '대학생',
  '취업',
  '주거',
  '에너지',
  '보육',
  '임신',
  '육아',
  '돌봄',
  '의료',
] as const;

const EXCLUDE_TAG_PRESETS = ['주택', '자동차', '전기차', '해외', '사업자'] as const;

const OCCUPATION_DETAIL_PRESETS = [
  '사무직',
  '생산·현장',
  '운전·배송',
  '간호·돌봄',
  '교사·강사',
  '매장·서비스',
  'IT·개발',
] as const;

function composeRegion(sido: string, sigungu: string): string {
  if (sido === '전국') return '전국';
  return [sido, sigungu].filter(Boolean).join(' ');
}

function TagsEditor({
  value,
  onChange,
  placeholder,
  presets,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  presets?: readonly string[];
}) {
  const [draft, setDraft] = useState('');
  return (
    <div>
      {presets && presets.length > 0 && (
        <div className="tag-presets-row" aria-label="빠른 선택">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              className="btn secondary btn--compact tag-preset-btn"
              disabled={value.includes(p)}
              onClick={() => {
                if (!value.includes(p)) onChange([...value, p]);
              }}
            >
              + {p}
            </button>
          ))}
        </div>
      )}
      <div className="field-row field-row--wrap">
        {value.map((t) => (
          <span key={t} className="member-tag-chip">
            {t}
            <button
              type="button"
              className="member-tag-chip__remove"
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
  const [birthDraft, setBirthDraft] = useState('');
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<Relationship>('other');
  const [snackbar, setSnackbar] = useState(false);
  const snackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!member) return;
    setLocal({ ...member.profile });
    setBirthDraft(birthDateStoredToCompact(member.profile.birthDate));
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
    const birthIso = normalizeBirthDateForStorage(birthDraft);
    if (birthDraft.trim() && !birthIso) {
      window.alert('생년월일은 8자리 숫자(YYYYMMDD)로 입력해 주세요. 예: 19780225');
      return;
    }
    const profile = { ...local, birthDate: birthIso };
    setLocal(profile);
    persist(profile);
    setBirthDraft(birthDateStoredToCompact(profile.birthDate));
    updateMember(member.id, { displayName: name, relationship });
    setSnackbar(true);
    if (snackTimerRef.current) clearTimeout(snackTimerRef.current);
    snackTimerRef.current = setTimeout(() => setSnackbar(false), 2200);
  };

  const effective = getEffectiveProfile(member, state.household);
  const incomeHint = INCOME_CHOICES.find((c) => c.value === local.incomeBand)?.hint ?? '';
  const readiness = profileMatchReadiness(member, state.household);

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

      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ marginTop: 0, fontWeight: 600 }}>매칭 100% 목표 — 프로필 완성도 (참고)</p>
        <p className="muted" style={{ marginBottom: 0 }}>
          입력은 <strong>선택·버튼</strong>을 우선 쓰고, 타이핑은 보조로 최소화했습니다. 생년월일만{' '}
          <strong>여덟 자리 숫자(YYYYMMDD)</strong>로 넣습니다. 채울수록 「연관 태그」가 늘어 혜택 목록 정밀도가 올라갑니다.
        </p>
        <p style={{ marginTop: 10, marginBottom: 0, fontSize: '1.1rem', fontWeight: 700 }}>
          {readiness.percent}% <span className="muted">({readiness.filled}/{readiness.total} 항목)</span>
        </p>
        {readiness.missing.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <p className="muted" style={{ margin: 0 }}>
              다음을 보완하면 좋습니다:
            </p>
            <ul className="muted" style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {readiness.missing.slice(0, 12).map((m) => (
                <li key={m}>{m}</li>
              ))}
              {readiness.missing.length > 12 && <li>… 외 {readiness.missing.length - 12}개</li>}
            </ul>
          </div>
        )}
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
        <div id="m-color-label">표시 색 (혜택 목록에서 구분)</div>
        <div className="member-color-presets" role="group" aria-labelledby="m-color-label">
          {MEMBER_COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              className="member-color-swatch"
              style={{ backgroundColor: c }}
              data-active={member.memberColor.toLowerCase() === c.toLowerCase() ? 'true' : 'false'}
              title={c}
              aria-label={`색 ${c}`}
              onClick={() => updateMember(member.id, { memberColor: c })}
            />
          ))}
          <input
            type="color"
            className="member-color-picker"
            aria-label="직접 색 선택"
            value={memberColorForInput(member.memberColor)}
            onChange={(e) => updateMember(member.id, { memberColor: e.target.value })}
          />
        </div>
        <p className="field-hint">혜택 탭 박스·카드 왼쪽 강조선에 쓰입니다.</p>
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
        </>
      )}

      <div className="field">
        <label htmlFor="m-bd">생년월일 (숫자 8자리)</label>
        <input
          id="m-bd"
          className="search-input birth-compact-input"
          inputMode="numeric"
          autoComplete="bday"
          maxLength={8}
          placeholder="19780225"
          value={birthDraft}
          onChange={(e) => setBirthDraft(sanitizeBirthDateCompactInput(e.target.value))}
          onBlur={() => {
            const iso = normalizeBirthDateForStorage(birthDraft);
            if (birthDraft.trim() && !iso) {
              setBirthDraft(birthDateStoredToCompact(local.birthDate));
              return;
            }
            const next = { ...local, birthDate: iso };
            setLocal(next);
            persist(next);
            setBirthDraft(birthDateStoredToCompact(iso));
          }}
        />
        <p className="field-hint">
          예: 1978년 2월 25일 → <code>19780225</code>. 저장 시 내부에는 표준형(YYYY-MM-DD)으로만 맞춥니다. 연령·청년/노인 태그
          자동 매칭에 씁니다.
        </p>
      </div>

      <div className="field">
        <label htmlFor="m-occ-kind">활동·직업 상태</label>
        <select
          id="m-occ-kind"
          value={local.occupationKind}
          onChange={(e) => {
            const occupationKind = e.target.value as MemberProfile['occupationKind'];
            const next = { ...local, occupationKind };
            setLocal(next);
            persist(next);
          }}
        >
          {OCCUPATION_KIND_CHOICES.map((o) => (
            <option key={o.value === '' ? '_empty' : o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="field-hint">
          {OCCUPATION_KIND_CHOICES.find((x) => x.value === local.occupationKind)?.hint ??
            '공고의 대상·직업 태그와 맞출 때 사용합니다.'}
        </p>
      </div>

      <div className="field">
        <label htmlFor="m-job">직무·직장·학과 상세</label>
        <div className="tag-presets-row" style={{ marginBottom: 8 }} aria-label="직무 빠른 선택">
          {OCCUPATION_DETAIL_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className="btn secondary btn--compact tag-preset-btn"
              onClick={() => {
                const next = { ...local, occupation: local.occupation.trim() ? `${local.occupation}, ${p}` : p };
                setLocal(next);
                persist(next);
              }}
            >
              {p}
            </button>
          ))}
        </div>
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
          placeholder="버튼 선택 또는 직접 입력 (최소화 권장)"
        />
        <p className="field-hint">모든 활동 상태에서 매칭 태그로 반영됩니다. 쉼표·슬래시로 여러 키워드를 넣을 수 있습니다.</p>
      </div>

      {(local.occupationKind === 'salaried' || local.occupationKind === 'parental_leave') && (
        <div className="field">
          <label htmlFor="m-contract">고용 형태</label>
          <select
            id="m-contract"
            value={local.employmentContract}
            onChange={(e) => {
              const employmentContract = e.target.value as EmploymentContractKind;
              const next = { ...local, employmentContract };
              setLocal(next);
              persist(next);
            }}
          >
            {EMPLOYMENT_CONTRACT_CHOICES.map((o) => (
              <option key={o.value || '_ec'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {(local.occupationKind === 'salaried' || local.occupationKind === 'parental_leave') && (
        <>
          <div className="field">
            <label htmlFor="m-ei">고용보험</label>
            <select
              id="m-ei"
              value={local.employmentInsurance}
              onChange={(e) => {
                const employmentInsurance = e.target.value as AssetAnswer;
                const next = { ...local, employmentInsurance };
                setLocal(next);
                persist(next);
              }}
            >
              {ASSET_CHOICES.map((o) => (
                <option key={`ei-${o.value}`} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="m-np">국민연금</label>
            <select
              id="m-np"
              value={local.nationalPension}
              onChange={(e) => {
                const nationalPension = e.target.value as AssetAnswer;
                const next = { ...local, nationalPension };
                setLocal(next);
                persist(next);
              }}
            >
              {ASSET_CHOICES.map((o) => (
                <option key={`np-${o.value}`} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

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

      {local.occupationKind === 'student' && local.studentLevel !== 'none' && (
        <>
          <div className="field">
            <label htmlFor="m-school">학교명</label>
            <input
              id="m-school"
              value={local.schoolName}
              onChange={(e) => setLocal({ ...local, schoolName: e.target.value })}
              onBlur={(e) => {
                const next = { ...local, schoolName: e.target.value };
                setLocal(next);
                persist(next);
              }}
              placeholder="예: ○○대학교"
            />
          </div>
          <div className="field">
            <label htmlFor="m-enroll">재학 상태</label>
            <select
              id="m-enroll"
              value={local.enrollmentStatus}
              onChange={(e) => {
                const enrollmentStatus = e.target.value as EnrollmentStatus;
                const next = { ...local, enrollmentStatus };
                setLocal(next);
                persist(next);
              }}
            >
              {ENROLLMENT_CHOICES.map((o) => (
                <option key={o.value || '_en'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="field">
        <label htmlFor="m-car">자동차 보유</label>
        <select
          id="m-car"
          value={local.hasCar}
          onChange={(e) => {
            const hasCar = e.target.value as AssetAnswer;
            const next = { ...local, hasCar };
            setLocal(next);
            persist(next);
          }}
        >
          {ASSET_CHOICES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="field-hint">「아니오」이면 자동차·전기차 중심 공고는 목록에서 빼는 데 씁니다.</p>
      </div>

      <div className="field">
        <label htmlFor="m-home">주택 보유 (유주택)</label>
        <select
          id="m-home"
          value={local.ownsHome}
          onChange={(e) => {
            const ownsHome = e.target.value as AssetAnswer;
            const next = { ...local, ownsHome };
            setLocal(next);
            persist(next);
          }}
        >
          {ASSET_CHOICES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="field-hint">
          무주택·유주택 공고 태그 힌트에만 씁니다. 가구 대표만 채워도 됩니다.
        </p>
      </div>

      <details className="card" style={{ marginBottom: 16 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>가구·주거·건강보험 (매칭 정밀도 확장)</summary>
        <p className="muted" style={{ marginTop: 8 }}>
          선택 사항이지만, 주거·의료급여·한부모 등 공고 태그와 연결됩니다.
        </p>
        <div className="field">
          <label htmlFor="m-hh">세대주 여부</label>
          <select
            id="m-hh"
            value={local.isHouseholdHead}
            onChange={(e) => {
              const isHouseholdHead = e.target.value as AssetAnswer;
              const next = { ...local, isHouseholdHead };
              setLocal(next);
              persist(next);
            }}
          >
            {ASSET_CHOICES.map((o) => (
              <option key={`hh-${o.value}`} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="m-hmc">가구 인원 수 (본인 포함)</label>
          <input
            id="m-hmc"
            inputMode="numeric"
            value={local.householdMemberCount}
            onChange={(e) => setLocal({ ...local, householdMemberCount: e.target.value })}
            onBlur={(e) => {
              const next = { ...local, householdMemberCount: e.target.value.trim() };
              setLocal(next);
              persist(next);
            }}
            placeholder="예: 4"
          />
        </div>
        <div className="field">
          <label htmlFor="m-dcc">동거·부양 중인 미성년 자녀 수</label>
          <input
            id="m-dcc"
            inputMode="numeric"
            value={local.dependentsChildrenCount}
            onChange={(e) => setLocal({ ...local, dependentsChildrenCount: e.target.value })}
            onBlur={(e) => {
              const next = { ...local, dependentsChildrenCount: e.target.value.trim() };
              setLocal(next);
              persist(next);
            }}
            placeholder="없으면 0"
          />
        </div>
        <div className="field">
          <label htmlFor="m-par">출산·육아 단계</label>
          <select
            id="m-par"
            value={local.parentingStage}
            onChange={(e) => {
              const parentingStage = e.target.value as ParentingStage;
              const next = { ...local, parentingStage };
              setLocal(next);
              persist(next);
            }}
          >
            {PARENTING_CHOICES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="m-ten">주거 형태</label>
          <select
            id="m-ten"
            value={local.housingTenure}
            onChange={(e) => {
              const housingTenure = e.target.value as HousingTenure;
              const next = { ...local, housingTenure };
              setLocal(next);
              persist(next);
            }}
          >
            {HOUSING_CHOICES.map((o) => (
              <option key={o.value || '_ho'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="m-hi">건강보험 유형</label>
          <select
            id="m-hi"
            value={local.healthInsurance}
            onChange={(e) => {
              const healthInsurance = e.target.value as HealthInsuranceKind;
              const next = { ...local, healthInsurance };
              setLocal(next);
              persist(next);
            }}
          >
            {HEALTH_CHOICES.map((o) => (
              <option key={o.value || '_hi'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="switch-row">
            <input
              type="checkbox"
              className="input-checkbox"
              checked={local.singleParentHousehold}
              onChange={(e) => {
                const next = { ...local, singleParentHousehold: e.target.checked };
                setLocal(next);
                persist(next);
              }}
            />
            <span className="switch-row__body">
              <span className="switch-row__title">한부모 가구에 해당</span>
              <span className="switch-row__hint">「한부모」 태그 공고와 맞춥니다.</span>
            </span>
          </label>
        </div>
        <div className="field">
          <label className="switch-row">
            <input
              type="checkbox"
              className="input-checkbox"
              checked={local.multiculturalFamily}
              onChange={(e) => {
                const next = { ...local, multiculturalFamily: e.target.checked };
                setLocal(next);
                persist(next);
              }}
            />
            <span className="switch-row__body">
              <span className="switch-row__title">다문화 가정</span>
              <span className="switch-row__hint">「다문화」 태그 공고와 맞춥니다.</span>
            </span>
          </label>
        </div>
        <div className="field">
          <label className="switch-row">
            <input
              type="checkbox"
              className="input-checkbox"
              checked={local.veteranOrMeritRelated}
              onChange={(e) => {
                const next = { ...local, veteranOrMeritRelated: e.target.checked };
                setLocal(next);
                persist(next);
              }}
            />
            <span className="switch-row__body">
              <span className="switch-row__title">보훈·국가유공 등 해당</span>
              <span className="switch-row__hint">보훈·유공 관련 공고 태그 힌트에 씁니다.</span>
            </span>
          </label>
        </div>
        <div className="field">
          <label htmlFor="m-dd">장애 관련 메모 (등록 장애인일 때)</label>
          <textarea
            id="m-dd"
            className="search-input"
            style={{ minHeight: 72, width: '100%', resize: 'vertical' }}
            value={local.disabilityDetail}
            onChange={(e) => setLocal({ ...local, disabilityDetail: e.target.value })}
            onBlur={(e) => {
              const next = { ...local, disabilityDetail: e.target.value };
              setLocal(next);
              persist(next);
            }}
            placeholder="정도·유형 등 (기기에만 저장)"
          />
        </div>
      </details>

      <details className="card" style={{ marginBottom: 16 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
          생계·농어업·돌봄 (매칭 정밀도 — 카탈로그 태그와 직접 연결)
        </summary>
        <p className="muted" style={{ marginTop: 8 }}>
          채울수록 「기초생활」「차상위」「농촌」「돌봄」 등 공고 태그와 겹침이 커져, 혜택 목록에서{' '}
          <strong>약한 일치(스팸 느낌)</strong>이 줄어듭니다.
        </p>
        <div className="field">
          <label htmlFor="m-livelihood">기초생계·차상위 해당</label>
          <select
            id="m-livelihood"
            value={local.livelihoodSupportTier}
            onChange={(e) => {
              const livelihoodSupportTier = e.target.value as LivelihoodSupportTier;
              const next = { ...local, livelihoodSupportTier };
              setLocal(next);
              persist(next);
            }}
          >
            {LIVELIHOOD_TIER_CHOICES.map((o) => (
              <option key={o.value || '_liv'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="m-sector">농·어업 생계 힌트</label>
          <select
            id="m-sector"
            value={local.primarySectorContext}
            onChange={(e) => {
              const primarySectorContext = e.target.value as PrimarySectorContext;
              const next = { ...local, primarySectorContext };
              setLocal(next);
              persist(next);
            }}
          >
            {PRIMARY_SECTOR_CHOICES.map((o) => (
              <option key={o.value || '_sec'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="switch-row">
            <input
              type="checkbox"
              className="input-checkbox"
              checked={local.unpaidFamilyCaregiver}
              onChange={(e) => {
                const next = { ...local, unpaidFamilyCaregiver: e.target.checked };
                setLocal(next);
                persist(next);
              }}
            />
            <span className="switch-row__body">
              <span className="switch-row__title">가족 요양·돌봄 부담이 큼 (무급 돌봄 등)</span>
              <span className="switch-row__hint">「돌봄」 태그 공고와 맞춥니다.</span>
            </span>
          </label>
        </div>
        <div className="field">
          <label className="switch-row">
            <input
              type="checkbox"
              className="input-checkbox"
              checked={local.energyOrHousingVulnerable}
              onChange={(e) => {
                const next = { ...local, energyOrHousingVulnerable: e.target.checked };
                setLocal(next);
                persist(next);
              }}
            />
            <span className="switch-row__body">
              <span className="switch-row__title">에너지·주거 비용 부담이 큼</span>
              <span className="switch-row__hint">「에너지」「취약계층」류 태그와 맞춥니다.</span>
            </span>
          </label>
        </div>
      </details>

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

      <details className="card" style={{ marginBottom: 16 }} open>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
          관심 복지 영역 (복지로·보건복지부·정부24 분류 참고, 8개)
        </summary>
        <p className="muted" style={{ marginTop: 8 }}>
          체크만으로 대표 키워드가 프로필에 붙어, 혜택 목록 <strong>100% 태그 일치</strong> 판별에 반영됩니다. 타이핑
          최소화용입니다.
        </p>
        <div className="stack" style={{ marginTop: 12, gap: 10 }}>
          {WELFARE_INTEREST_CATEGORY_DEFS.map((c) => (
            <label key={c.id} className="switch-row" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                className="input-checkbox"
                checked={local.welfareInterestCategoryIds.includes(c.id)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const nextIds = checked
                    ? [...local.welfareInterestCategoryIds, c.id]
                    : local.welfareInterestCategoryIds.filter((x) => x !== c.id);
                  const next = { ...local, welfareInterestCategoryIds: nextIds };
                  setLocal(next);
                  persist(next);
                }}
              />
              <span className="switch-row__body">
                <span className="switch-row__title">{c.label}</span>
                <span className="switch-row__hint">{c.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </details>

      <div className="field">
        <label>포함 태그 (추가 조건)</label>
        <TagsEditor
          value={local.extraIncludeTags}
          onChange={(v) => {
            const next = { ...local, extraIncludeTags: v };
            setLocal(next);
            persist(next);
          }}
          placeholder="필요할 때만 직접 입력"
          presets={INCLUDE_TAG_PRESETS}
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
          placeholder="필요할 때만 직접 입력"
          presets={EXCLUDE_TAG_PRESETS}
        />
        <p className="field-hint">
          혜택 탭 목록·맞춤 추천·숨은 복지 찾기에서 비슷한 표현까지 묶어서 빼 줍니다.
        </p>
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
