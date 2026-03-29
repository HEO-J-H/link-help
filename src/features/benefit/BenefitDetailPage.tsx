import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { useWelfare } from '@/context/WelfareContext';
import { suggestTagsFromText } from '@/core/ai/suggestTags';
import type { Reminder } from '@/types/reminder';
import { makeId } from '@/utils/uid';
import { isWelfareEffectivelyExpired } from '@/core/welfare/welfareLifecycle';

export function BenefitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { list, loading } = useWelfare();
  const { state, setState } = useFamily();
  const w = list.find((x) => x.id === id);

  const [remindAt, setRemindAt] = useState('');
  const [paste, setPaste] = useState('');
  const [suggested, setSuggested] = useState<string[]>([]);
  const [suggestBusy, setSuggestBusy] = useState(false);

  if (loading) return <p className="muted">불러오는 중…</p>;
  if (!w) {
    return (
      <div>
        <p>항목을 찾을 수 없습니다.</p>
        <Link to="/benefits">혜택 목록</Link>
      </div>
    );
  }

  const addReminder = () => {
    if (!remindAt) {
      alert('알림 날짜·시간을 선택하세요.');
      return;
    }
    const fireAt = new Date(remindAt);
    if (Number.isNaN(fireAt.getTime())) {
      alert('날짜 형식을 확인하세요.');
      return;
    }
    const r: Reminder = {
      id: makeId('rem'),
      kind: 'benefit',
      title: `복지 알림: ${w.title}`,
      body: w.period || w.benefit,
      fireAt: fireAt.toISOString(),
      refId: w.id,
      createdAt: new Date().toISOString(),
    };
    setState({ ...state, reminders: [...state.reminders, r] });
    setRemindAt('');
    alert('알림 목록에 추가했습니다.');
  };

  const runSuggest = async () => {
    setSuggestBusy(true);
    setSuggested([]);
    try {
      const tags = await suggestTagsFromText(`${w.title}\n${w.description}\n${paste}`);
      setSuggested(tags);
    } finally {
      setSuggestBusy(false);
    }
  };

  const ended = isWelfareEffectivelyExpired(w);

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link to="/benefits">← 혜택 목록</Link>
      </p>
      <h1 className="page-title">{w.title}</h1>
      {ended && (
        <p
          className="remote-warn"
          role="status"
          style={{ marginBottom: 14, borderRadius: 8 }}
        >
          이 항목은 <strong>기간 종료</strong> 또는 <strong>만료</strong>로 보입니다. 추천·타임라인에서는
          빼고, 참고용으로만 남겨 둡니다. 신청 가능 여부는 반드시 공식 공고를 확인하세요.
        </p>
      )}
      <div className="card">
        <p>{w.description}</p>
        <p style={{ marginTop: 12 }}>
          <strong>혜택</strong> {w.benefit}
        </p>
        <p>
          <strong>기간</strong> {w.period}
        </p>
        <p>
          <strong>지역</strong> {w.region.join(', ')}
        </p>
        <p>
          <strong>태그</strong> {w.tags.join(', ')}
        </p>
        {typeof w.popularity === 'number' && (
          <p className="muted" style={{ marginTop: 8 }}>
            인기도(샘플) {w.popularity}
          </p>
        )}
        <p className="muted" style={{ marginTop: 12 }}>
          출처: {w.source}
        </p>
        {w.apply_url && (
          <p style={{ marginTop: 16 }}>
            <a href={w.apply_url} target="_blank" rel="noreferrer">
              신청·안내 링크
            </a>
          </p>
        )}
      </div>

      <h2 style={{ fontSize: '1.1rem', margin: '20px 0 10px' }}>알림 예약</h2>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          선택한 시각에 브라우저 알림(허용 시)과 알림 탭 목록을 사용합니다.
        </p>
        <div className="field">
          <label htmlFor="ben-rem">알림 시각</label>
          <input
            id="ben-rem"
            type="datetime-local"
            value={remindAt}
            onChange={(e) => setRemindAt(e.target.value)}
          />
        </div>
        <button type="button" className="btn secondary" style={{ width: '100%' }} onClick={addReminder}>
          알림 추가
        </button>
        <p className="muted" style={{ marginTop: 12, marginBottom: 0, fontSize: '0.88rem' }}>
          <Link to="/notifications">알림 목록 보기</Link>
        </p>
      </div>

      <h2 style={{ fontSize: '1.1rem', margin: '20px 0 10px' }}>태그 힌트 (로컬)</h2>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          공고문을 붙여넣으면 태그 사전과 맞춰 힌트를 줍니다. 앞으로는 AI로 공고 본문을 구조화해 숨은
          조건을 더 찾고, 익명·비식별로 공용 DB를 키우는 방향과 이어질 수 있습니다.
        </p>
        <textarea
          rows={4}
          placeholder="추가 공고문 (선택)"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          style={{ width: '100%', minHeight: 88, marginBottom: 10 }}
        />
        <button type="button" className="btn secondary" style={{ width: '100%' }} onClick={runSuggest} disabled={suggestBusy}>
          {suggestBusy ? '분석 중…' : '태그 제안'}
        </button>
        {suggested.length > 0 && (
          <p style={{ marginTop: 12, marginBottom: 0 }}>
            제안: {suggested.join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}
