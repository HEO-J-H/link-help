import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import type { MemberProfile, Relationship, StudentLevel } from '@/types/family';

const relationships: { value: Relationship; label: string }[] = [
  { value: 'self', label: '본인' },
  { value: 'spouse', label: '배우자' },
  { value: 'child', label: '자녀' },
  { value: 'parent', label: '부모' },
  { value: 'other', label: '기타' },
];

const INCOME_CHOICES: { value: string; label: string; hint: string }[] = [
  { value: '', label: '선택 안 함', hint: '소득 구간을 모르거나 아직 정하지 않은 경우' },
  {
    value: '기초수급',
    label: '기초생활수급자',
    hint: '국민기초생활보장(생계·의료·주거 등) 수급 가구에 해당할 때',
  },
  {
    value: '차상위',
    label: '차상위계층',
    hint: '의료비·교육비 등 별도 지원 대상으로 인정된 저소득 층(지자체·복지 공고 기준)',
  },
  {
    value: '중위소득150',
    label: '중위소득 150% 이하',
    hint: '가구 단위로 본 소득이 「중위소득」의 150% 이하일 때 쓰는 말입니다. 금액은 가구원 수·연도마다 달라 아래 도움말을 보세요.',
  },
  {
    value: '일반',
    label: '해당 없음·일반',
    hint: '위에 해당하지 않거나 중위소득을 넘는 경우',
  },
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
  const { state, updateMember, removeMember, addMember } = useFamily();
  const member = state.members.find((m) => m.id === id);
  const [local, setLocal] = useState<MemberProfile | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<Relationship>('other');
  const [saveBanner, setSaveBanner] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!member) return;
    setLocal({ ...member.profile });
    setName(member.displayName);
    setRelationship(member.relationship);
  }, [member]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
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

  const save = () => {
    persist(local);
    setSaveBanner(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveBanner(false), 4500);
  };

  const incomeHint = INCOME_CHOICES.find((c) => c.value === local.incomeBand)?.hint ?? '';

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link to="/" className="text-link">
          ← 가족
        </Link>
      </p>
      <h1 className="page-title">구성원 프로필</h1>

      <div
        className="save-live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ clip: 'rect(0 0 0 0)', clipPath: 'inset(50%)', height: 1, overflow: 'hidden', position: 'absolute', width: 1 }}
      >
        {saveBanner ? '프로필을 저장했습니다.' : ''}
      </div>

      {saveBanner && (
        <div className="toast-banner" role="alert">
          <p className="toast-banner__title">저장했습니다</p>
          <p className="toast-banner__text">이제 혜택 목록을 보거나 다른 구성원을 추가할 수 있어요.</p>
          <div className="toast-banner__actions">
            <button type="button" className="btn secondary btn--sm" onClick={() => navigate('/benefits')}>
              혜택 탭으로
            </button>
            <button
              type="button"
              className="btn secondary btn--sm"
              onClick={() => {
                const n = window.prompt('추가할 구성원 이름', '새 구성원');
                if (n?.trim()) {
                  addMember(n.trim());
                  navigate('/');
                }
              }}
            >
              구성원 추가
            </button>
            <button type="button" className="btn ghost btn--sm" onClick={() => setSaveBanner(false)}>
              닫기
            </button>
          </div>
        </div>
      )}

      <div className="field">
        <label htmlFor="m-name">이름</label>
        <input id="m-name" value={name} onChange={(e) => setName(e.target.value)} onBlur={save} />
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
        <label htmlFor="m-region">지역</label>
        <input
          id="m-region"
          value={local.region}
          onChange={(e) => setLocal({ ...local, region: e.target.value })}
          onBlur={save}
          placeholder="예: 용인시"
        />
        <p className="field-hint">복지 공고의 지역 태그와 맞출 때 입력합니다.</p>
      </div>

      <div className="field">
        <label htmlFor="m-job">직업·상태</label>
        <input
          id="m-job"
          value={local.occupation}
          onChange={(e) => setLocal({ ...local, occupation: e.target.value })}
          onBlur={save}
          placeholder="예: 직장인"
        />
        <p className="field-hint">공고에 직업 태그가 있을 때만 매칭에 쓰입니다.</p>
      </div>

      <div className="field">
        <label htmlFor="m-income">소득 구간 (복지 신청 기준)</label>
        <select
          id="m-income"
          value={local.incomeBand}
          onChange={(e) => {
            const v = e.target.value;
            const next = { ...local, incomeBand: v };
            setLocal(next);
            persist(next);
          }}
        >
          {INCOME_CHOICES.map((c) => (
            <option key={c.value || 'empty'} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {incomeHint && <p className="field-hint">{incomeHint}</p>}

        <details className="details-help">
          <summary className="details-help__summary">중위소득·금액이 헷갈려요</summary>
          <div className="details-help__body">
            <p>
              <strong>중위소득 150%는 고정 금액이 아닙니다.</strong> 같은 비율이라도 가구원 수(1인·2인·4인
              …)와 매년 바뀌는 기준액에 따라 달라집니다. 복지마다 인정 소득(근로·사업·재산 환산 등)을
              어떻게 넣는지도 다를 수 있어요.
            </p>
            <p>
              이 앱의 「소득 구간」은 <strong>샘플 복지 데이터의 태그</strong>와 맞추기 위한 선택이며,
              실제 수급·신청 가능 여부를 판정하지 않습니다.
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
              에서 「중위소득」으로 검색하면 가구 기준액·안내를 볼 수 있습니다. 정확한 판단은 공고문·
              주민센터·담당 기관 기준을 따르세요.
            </p>
          </div>
        </details>

        <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
          <label htmlFor="m-income-memo">참고용 연소득 (만 원, 선택)</label>
          <input
            id="m-income-memo"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="예: 3600"
            value={local.annualIncomeMemoManwon}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              setLocal((prev) => (prev ? { ...prev, annualIncomeMemoManwon: raw } : prev));
            }}
            onBlur={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              setLocal((prev) => {
                if (!prev) return prev;
                const next = { ...prev, annualIncomeMemoManwon: raw };
                persist(next);
                return next;
              });
            }}
          />
          <p className="field-hint">
            본인이 기억하기 위한 메모입니다. <strong>자동으로 소득 구간을 바꾸지 않습니다.</strong>{' '}
            연봉만으로 복지 기준을 계산하면 가구·소득 종류를 빼먹기 쉬워 오해가 생길 수 있어, 앱에서는
            구간은 직접 고르고 숫자는 선택 입력으로 두었습니다.
          </p>
        </div>
      </div>

      <fieldset className="field fieldset-plain">
        <legend className="fieldset-legend">학생 여부</legend>
        <p className="field-hint field-hint--tight">초·중·고와 대학을 나눴습니다. 공고의 태그(청소년·대학생)와 맞춥니다.</p>
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
        <button type="button" className="btn" onClick={save}>
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
