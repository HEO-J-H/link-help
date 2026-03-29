import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { useWelfare } from '@/context/WelfareContext';
import { profileToDerivedTags } from '@/core/filter/filterEngine';
import { parseKeywordInput, runSmartMatch, type SmartMatchedWelfare } from '@/core/filter/smartMatchEngine';
import { persistSmartMatchRun } from '@/core/welfare/persistSmartMatch';

const STAGES = [
  { id: 'prep', label: '프로필·포함·제외 조건 정리' },
  { id: 'local', label: '로컬·병합 복지 DB 스캔' },
  { id: 'server', label: '서버 매칭·기록 API' },
  { id: 'ai', label: 'AI 매칭 가중치·정렬' },
] as const;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function SmartSearchPage() {
  const { state } = useFamily();
  const { list, loading, error } = useWelfare();
  const [memberId, setMemberId] = useState(state.members[0]?.id ?? '');
  const [includeRaw, setIncludeRaw] = useState('');
  const [excludeRaw, setExcludeRaw] = useState('');
  const [running, setRunning] = useState(false);
  const [stageIndex, setStageIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [statusLine, setStatusLine] = useState('');
  const [results, setResults] = useState<SmartMatchedWelfare[]>([]);
  const [foundCount, setFoundCount] = useState<number | null>(null);
  const [persistOk, setPersistOk] = useState<boolean | null>(null);

  const member = useMemo(
    () => state.members.find((m) => m.id === memberId) ?? state.members[0],
    [state.members, memberId]
  );

  useEffect(() => {
    if (state.members.length === 0) return;
    if (!state.members.some((m) => m.id === memberId)) {
      setMemberId(state.members[0].id);
    }
  }, [state.members, memberId]);

  const baseUrl = state.appSettings.syncApiBaseUrl.trim();

  const run = useCallback(async () => {
    if (!member) return;
    setRunning(true);
    setResults([]);
    setFoundCount(null);
    setPersistOk(null);
    setProgress(0);
    setStageIndex(0);
    setStatusLine(STAGES[0].label);

    await sleep(280);
    setStageIndex(1);
    setStatusLine(STAGES[1].label);
    for (let p = 0; p <= 100; p += 12) {
      setProgress(p);
      await sleep(45);
    }

    const profileTags = profileToDerivedTags(member.profile);
    const includeKeywords = parseKeywordInput(includeRaw);
    const excludeKeywords = [
      ...parseKeywordInput(excludeRaw),
      ...member.profile.extraExcludeTags.map((t) => t.trim()).filter(Boolean),
    ];

    const matched = runSmartMatch(list, { profileTags, includeKeywords, excludeKeywords });

    setStageIndex(2);
    setStatusLine(STAGES[2].label);
    setProgress(0);

    if (baseUrl) {
      for (let p = 0; p <= 100; p += 20) {
        setProgress(p);
        await sleep(50);
      }
      const persist = await persistSmartMatchRun(baseUrl, {
        profileTags,
        includeKeywords,
        excludeKeywords,
        resultIds: matched.map((w) => w.id),
        foundCount: matched.length,
      });
      setPersistOk(persist.ok);
    } else {
      setProgress(100);
      setPersistOk(null);
      await sleep(200);
    }

    setStageIndex(3);
    setStatusLine(STAGES[3].label);
    setProgress(0);
    for (let p = 0; p <= 100; p += 25) {
      setProgress(p);
      await sleep(55);
    }

    setResults(matched);
    setFoundCount(matched.length);
    setRunning(false);
    setProgress(100);
    setStatusLine('완료');
  }, [member, list, includeRaw, excludeRaw, baseUrl]);

  if (loading) return <p className="muted">복지 데이터를 불러오는 중…</p>;
  if (error) return <p role="alert">{error}</p>;

  if (state.members.length === 0) {
    return (
      <div>
        <h1 className="page-title">스마트 매칭</h1>
        <p className="muted">
          구성원을 먼저 추가하세요. <Link to="/">가족</Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">스마트 매칭</h1>
      <p className="muted" style={{ marginTop: -8, marginBottom: 16, fontSize: '0.92rem', lineHeight: 1.55 }}>
        <strong>기본 프로필 태그</strong> + <strong>추가 포함</strong>(예: 자동차) + <strong>추가 제외</strong>(예:
        차상위, 장애인)를 조합해 복지·혜택을 찾습니다. 공고 붙여넣기가 아니라{' '}
        <strong>키워드·필터 중심 AI형 매칭</strong>이며, 외부 LLM 연동은 같은 파이프라인에 끼울 수 있습니다.
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="field">
          <label htmlFor="sm-member">기준 구성원 (프로필에서 태그 유도)</label>
          <select
            id="sm-member"
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
        <div className="field">
          <label htmlFor="sm-include">추가 포함 키워드 (쉼표로 구분)</label>
          <input
            id="sm-include"
            value={includeRaw}
            onChange={(e) => setIncludeRaw(e.target.value)}
            placeholder="예: 자동차, 전기차"
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor="sm-exclude">추가 제외 키워드 (쉼표로 구분)</label>
          <input
            id="sm-exclude"
            value={excludeRaw}
            onChange={(e) => setExcludeRaw(e.target.value)}
            placeholder="예: 차상위, 장애인"
            autoComplete="off"
          />
        </div>
        <p className="muted" style={{ marginTop: 0, marginBottom: 12, fontSize: '0.85rem' }}>
          프로필의 <strong>제외 태그</strong>는 자동으로 제외 조건에 합쳐집니다.
        </p>
        <button type="button" className="btn" style={{ width: '100%' }} onClick={run} disabled={running}>
          {running ? '매칭 중…' : '스마트 AI 매칭 시작'}
        </button>
      </div>

      {running && (
        <div className="card" style={{ marginBottom: 16 }} aria-live="polite">
          <p style={{ marginTop: 0, marginBottom: 8, fontWeight: 600 }}>{statusLine}</p>
          <div className="smart-progress-track">
            <div className="smart-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <ul style={{ margin: '10px 0 0', paddingLeft: '1.2rem', fontSize: '0.88rem', color: 'var(--color-muted)' }}>
            {STAGES.map((s, i) => (
              <li
                key={s.id}
                style={{
                  fontWeight: i === stageIndex ? 700 : 400,
                  color: i <= stageIndex ? 'var(--color-text)' : undefined,
                }}
              >
                {s.label}
                {i === stageIndex && i === 2 && !baseUrl && ' (API 미설정 — 기록 생략)'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!running && foundCount !== null && (
        <p style={{ marginBottom: 12, fontWeight: 600 }}>
          {foundCount}개를 찾았습니다.
          {baseUrl && persistOk === true && (
            <span className="muted" style={{ fontWeight: 400, marginLeft: 8 }}>
              서버에 검색 이력·매칭 횟수가 누적되었습니다.
            </span>
          )}
          {baseUrl && persistOk === false && (
            <span className="muted" style={{ fontWeight: 400, marginLeft: 8 }}>
              서버 기록에 실패했습니다. API 주소·CORS를 확인하세요.
            </span>
          )}
          {!baseUrl && (
            <span className="muted" style={{ fontWeight: 400, marginLeft: 8 }}>
              설정에 API URL을 넣으면 같은 결과가 서버 DB에 쌓여 이후 검색이 가벼워질 수 있습니다.
            </span>
          )}
        </p>
      )}

      <div className="stack">
        {results.map((w) => (
          <Link key={w.id} to={`/benefits/${w.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0 }}>{w.title}</h3>
                <span className="score-pill" title="스마트 매칭 점수">
                  {w.smartScore}
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

      {!running && results.length === 0 && foundCount === 0 && (
        <p className="muted">조건에 맞는 항목이 없습니다. 포함 키워드를 줄이거나 제외를 조정해 보세요.</p>
      )}
    </div>
  );
}
