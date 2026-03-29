import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { useWelfare } from '@/context/WelfareContext';
import { suggestTagsFromText } from '@/core/ai/suggestTags';
import type { Reminder } from '@/types/reminder';
import { makeId } from '@/utils/uid';
import { isWelfareEffectivelyExpired } from '@/core/welfare/welfareLifecycle';
import type { WelfareCatalogOrigin } from '@/types/benefit';

function catalogOriginLabel(origin?: WelfareCatalogOrigin): string | null {
  if (!origin) return null;
  const m: Record<WelfareCatalogOrigin, string> = {
    bundled: '앱 번들',
    crowd: '기여·공유',
    import: '파일 가져오기',
  };
  return `출처 유형: ${m[origin]}`;
}

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
        {w.source_url && (
          <p style={{ marginTop: 10 }}>
            <a href={w.source_url} target="_blank" rel="noreferrer">
              공고·원문 페이지
            </a>
          </p>
        )}
        {(w.catalog_origin ||
          typeof w.schema_version === 'number' ||
          typeof w.ai_confidence === 'number' ||
          w.dedupe_key) && (
          <p className="muted" style={{ marginTop: 10, marginBottom: 0, fontSize: '0.88rem', lineHeight: 1.55 }}>
            {catalogOriginLabel(w.catalog_origin)}
            {typeof w.schema_version === 'number' && (
              <>
                {w.catalog_origin ? ' · ' : ''}스키마 v{w.schema_version}
              </>
            )}
            {typeof w.ai_confidence === 'number' && (
              <>
                {(w.catalog_origin || typeof w.schema_version === 'number') ? ' · ' : ''}AI 신뢰도{' '}
                {Math.round(w.ai_confidence * 100)}%
              </>
            )}
            {w.dedupe_key && (
              <>
                <br />
                중복 키: <code style={{ fontSize: '0.82em' }}>{w.dedupe_key.slice(0, 48)}</code>
                {w.dedupe_key.length > 48 ? '…' : ''}
              </>
            )}
          </p>
        )}
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
          공고문을 붙여넣으면 태그 사전과 맞춰 힌트를 줍니다. 구조화된 복지 JSON 배열은{' '}
          <Link to="/settings">설정</Link>에서 파일로 불러와 이 기기 카탈로그에 합칠 수 있습니다. 공용 DB·AI
          파이프라인 설계는 저장소 <code>docs/catalog-pipeline.md</code>를 참고하세요.
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
