import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import type { InsurancePolicy } from '@/types/insurance';
import type { Reminder } from '@/types/reminder';
import { makeId } from '@/utils/uid';

function emptyPolicy(memberId: string): Omit<InsurancePolicy, 'id' | 'createdAt'> {
  return {
    memberId,
    title: '',
    insurer: '',
    premiumNote: '',
    renewalDate: '',
    notes: '',
  };
}

export function InsuranceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, setState } = useFamily();
  const isNew = id === 'new';
  const existing = !isNew ? state.insurancePolicies.find((p) => p.id === id) : undefined;

  const [draft, setDraft] = useState<Omit<InsurancePolicy, 'id' | 'createdAt'>>(() =>
    emptyPolicy(state.members[0]?.id ?? '')
  );

  useEffect(() => {
    if (isNew) {
      setDraft(emptyPolicy(state.members[0]?.id ?? ''));
      return;
    }
    const ex = state.insurancePolicies.find((p) => p.id === id);
    if (ex) {
      const { id: _i, createdAt: _c, ...rest } = ex;
      setDraft(rest);
    }
  }, [isNew, id, state.members, state.insurancePolicies]);

  if (!isNew && !existing) {
    return (
      <div>
        <p>항목을 찾을 수 없습니다.</p>
        <Link to="/insurance">보험 목록</Link>
      </div>
    );
  }

  const save = () => {
    if (!draft.title.trim()) {
      alert('보험 이름을 입력하세요.');
      return;
    }
    if (isNew) {
      const policy: InsurancePolicy = {
        ...draft,
        id: makeId('ins'),
        createdAt: new Date().toISOString(),
      };
      setState({ ...state, insurancePolicies: [...state.insurancePolicies, policy] });
      navigate(`/insurance/${policy.id}`, { replace: true });
      return;
    }
    if (!existing) return;
    const next: InsurancePolicy = { ...existing, ...draft };
    setState({
      ...state,
      insurancePolicies: state.insurancePolicies.map((p) => (p.id === existing.id ? next : p)),
    });
  };

  const remove = () => {
    if (!existing || !window.confirm('이 보험 정보를 삭제할까요?')) return;
    setState({
      ...state,
      insurancePolicies: state.insurancePolicies.filter((p) => p.id !== existing.id),
    });
    navigate('/insurance');
  };

  const addRenewalReminder = () => {
    if (!draft.renewalDate) {
      alert('갱신일을 먼저 입력하세요.');
      return;
    }
    const end = new Date(draft.renewalDate);
    if (Number.isNaN(end.getTime())) {
      alert('갱신일 형식을 확인하세요.');
      return;
    }
    const fire = new Date(end);
    fire.setDate(fire.getDate() - 7);
    const title = draft.title.trim() || '보험 갱신';
    const r: Reminder = {
      id: makeId('rem'),
      kind: 'insurance',
      title: `보험 갱신: ${title}`,
      body: `갱신 예정일 7일 전 · ${draft.insurer}`,
      fireAt: fire.toISOString(),
      refId: existing?.id,
      createdAt: new Date().toISOString(),
    };
    setState({ ...state, reminders: [...state.reminders, r] });
    alert('알림 목록에 추가했습니다. 설정에서 브라우저 알림을 켜면 시간에 맞춰 표시됩니다.');
  };

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link to="/insurance">← 보험 목록</Link>
      </p>
      <h1 className="page-title">{isNew ? '보험 추가' : '보험 상세'}</h1>

      <div className="field">
        <label htmlFor="ins-member">구성원</label>
        <select
          id="ins-member"
          value={draft.memberId}
          onChange={(e) => setDraft({ ...draft, memberId: e.target.value })}
        >
          {state.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="ins-title">보험 이름</label>
        <input
          id="ins-title"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="예: 실손의료비"
        />
      </div>

      <div className="field">
        <label htmlFor="ins-co">보험사</label>
        <input
          id="ins-co"
          value={draft.insurer}
          onChange={(e) => setDraft({ ...draft, insurer: e.target.value })}
        />
      </div>

      <div className="field">
        <label htmlFor="ins-prem">보험료 메모</label>
        <input
          id="ins-prem"
          value={draft.premiumNote}
          onChange={(e) => setDraft({ ...draft, premiumNote: e.target.value })}
          placeholder="예: 월 12만원"
        />
      </div>

      <div className="field">
        <label htmlFor="ins-ren">갱신일 (YYYY-MM-DD)</label>
        <input
          id="ins-ren"
          type="date"
          value={draft.renewalDate ? draft.renewalDate.slice(0, 10) : ''}
          onChange={(e) => setDraft({ ...draft, renewalDate: e.target.value })}
        />
      </div>

      <div className="field">
        <label htmlFor="ins-notes">메모</label>
        <textarea
          id="ins-notes"
          rows={3}
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          style={{ minHeight: 80, resize: 'vertical' }}
        />
      </div>

      <button type="button" className="btn" style={{ width: '100%' }} onClick={save}>
        저장
      </button>

      {!isNew && (
        <>
          <button
            type="button"
            className="btn secondary"
            style={{ width: '100%', marginTop: 10 }}
            onClick={addRenewalReminder}
          >
            갱신 7일 전 알림 추가
          </button>
          <button
            type="button"
            className="btn secondary"
            style={{ width: '100%', marginTop: 10 }}
            onClick={remove}
          >
            삭제
          </button>
        </>
      )}
    </div>
  );
}
