import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import type { MemberProfile, Relationship } from '@/types/family';

const relationships: { value: Relationship; label: string }[] = [
  { value: 'self', label: '본인' },
  { value: 'spouse', label: '배우자' },
  { value: 'child', label: '자녀' },
  { value: 'parent', label: '부모' },
  { value: 'other', label: '기타' },
];

const incomeOptions = ['', '기초수급', '차상위', '중위소득150', '일반'];

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
      <div className="field-row" style={{ flexWrap: 'wrap' }}>
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
              className="btn ghost"
              style={{ minHeight: 32, marginLeft: 6, padding: '0 8px' }}
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
          className="btn secondary"
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
  const member = state.members.find((m) => m.id === id);
  const [local, setLocal] = useState<MemberProfile | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<Relationship>('other');

  useEffect(() => {
    if (!member) return;
    setLocal({ ...member.profile });
    setName(member.displayName);
    setRelationship(member.relationship);
  }, [member]);

  if (!member || !local) {
    return (
      <div>
        <p>구성원을 찾을 수 없습니다.</p>
        <Link to="/">가족 목록</Link>
      </div>
    );
  }

  const save = () => {
    updateMember(member.id, {
      displayName: name,
      relationship,
      profile: local,
    });
  };

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link to="/">← 가족</Link>
      </p>
      <h1 className="page-title">구성원 프로필</h1>

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
            setRelationship(e.target.value as Relationship);
            updateMember(member.id, { relationship: e.target.value as Relationship });
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
          onChange={(e) => setLocal({ ...local, birthDate: e.target.value })}
          onBlur={save}
        />
      </div>

      <div className="field">
        <label htmlFor="m-region">지역 (태그로 매칭, 예: 용인시)</label>
        <input
          id="m-region"
          value={local.region}
          onChange={(e) => setLocal({ ...local, region: e.target.value })}
          onBlur={save}
          placeholder="용인시"
        />
      </div>

      <div className="field">
        <label htmlFor="m-job">직업/상태 (태그로 매칭, 예: 직장인)</label>
        <input
          id="m-job"
          value={local.occupation}
          onChange={(e) => setLocal({ ...local, occupation: e.target.value })}
          onBlur={save}
          placeholder="직장인"
        />
      </div>

      <div className="field">
        <label htmlFor="m-income">소득 구간</label>
        <select
          id="m-income"
          value={local.incomeBand}
          onChange={(e) => {
            const v = e.target.value;
            setLocal({ ...local, incomeBand: v });
            updateMember(member.id, { profile: { ...local, incomeBand: v } });
          }}
        >
          {incomeOptions.map((o) => (
            <option key={o || 'empty'} value={o}>
              {o || '선택 안 함'}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <div className="field-row">
          <input
            id="m-student"
            type="checkbox"
            checked={local.isStudent}
            onChange={(e) => {
              const isStudent = e.target.checked;
              setLocal({ ...local, isStudent });
              updateMember(member.id, { profile: { ...local, isStudent } });
            }}
          />
          <label htmlFor="m-student">학생(대학생 태그)</label>
        </div>
      </div>

      <div className="field">
        <div className="field-row">
          <input
            id="m-dis"
            type="checkbox"
            checked={local.hasDisability}
            onChange={(e) => {
              const hasDisability = e.target.checked;
              setLocal({ ...local, hasDisability });
              updateMember(member.id, { profile: { ...local, hasDisability } });
            }}
          />
          <label htmlFor="m-dis">장애인 해당</label>
        </div>
      </div>

      <div className="field">
        <label>포함 태그 (추가 조건)</label>
        <TagsEditor
          value={local.extraIncludeTags}
          onChange={(v) => {
            setLocal({ ...local, extraIncludeTags: v });
            updateMember(member.id, { profile: { ...local, extraIncludeTags: v } });
          }}
          placeholder="예: 청년"
        />
      </div>

      <div className="field">
        <label>제외 태그</label>
        <TagsEditor
          value={local.extraExcludeTags}
          onChange={(v) => {
            setLocal({ ...local, extraExcludeTags: v });
            updateMember(member.id, { profile: { ...local, extraExcludeTags: v } });
          }}
          placeholder="예: 차상위"
        />
      </div>

      <button type="button" className="btn" style={{ width: '100%', marginTop: 8 }} onClick={save}>
        저장
      </button>

      {member.relationship !== 'self' && (
        <button
          type="button"
          className="btn secondary"
          style={{ width: '100%', marginTop: 10 }}
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
