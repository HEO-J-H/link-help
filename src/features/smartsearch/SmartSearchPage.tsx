import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { useWelfare } from '@/context/WelfareContext';
import { profileToDerivedTags } from '@/core/filter/filterEngine';
import { getEffectiveProfile } from '@/core/family/effectiveProfile';
import {
  buildSmartSearchExcludeKeywords,
  parseKeywordInput,
  runSmartMatch,
  type SmartMatchedWelfare,
} from '@/core/filter/smartMatchEngine';
import {
  SMART_SEARCH_PRESETS,
  SMART_QUICK_CHIPS,
  SMART_SEARCH_COACH_STEPS,
  SMART_MATCH_MANY_THRESHOLD,
  collectDrilldownGuides,
  appendKeywordToDraft,
  fallbackChipsForEmpty,
} from '@/features/smartsearch/smartSearchAssist';
import { upsertWelfareRecords } from '@/core/storage/welfareIndexedDb';
import { contributeRecords } from '@/core/api/linkHelpServer';
import type { WelfareRecord } from '@/types/benefit';
import { GoogleCalendarPeriodButton } from '@/components/GoogleCalendarPeriodButton';
import { findWelfareTracking } from '@/core/family/welfareTracking';
import { WelfareStatusPill, WelfareStatusQuickSelect } from '@/components/WelfareStatusControls';

const STAGES = [
  { id: 'prep', label: '조건 확인' },
  { id: 'scan', label: '복지 DB 스캔' },
  { id: 'match', label: '키워드 매칭' },
  { id: 'persist', label: '이 기기에 저장' },
] as const;

const SCAN_SOURCES = [
  'national.json · 전국',
  'gyeonggi.json · 경기',
  'yongin.json · 용인',
  'IndexedDB · 이전 누적',
] as const;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function toPersistable(w: SmartMatchedWelfare): WelfareRecord {
  const { smartScore: _s, matchedProfileTags: _p, matchedIncludeKeywords: _i, ...r } = w;
  return r;
}

export function SmartSearchPage() {
  const { state, setState, updateState } = useFamily();
  const { list, loading, error, refreshWelfareCatalog } = useWelfare();
  const [memberId, setMemberId] = useState(state.members[0]?.id ?? '');
  const [includeRaw, setIncludeRaw] = useState(state.appSettings.hiddenBenefitIncludeDraft);
  const [excludeRaw, setExcludeRaw] = useState(state.appSettings.hiddenBenefitExcludeDraft);
  const [running, setRunning] = useState(false);
  const [stageIndex, setStageIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [statusLine, setStatusLine] = useState('');
  const [results, setResults] = useState<SmartMatchedWelfare[]>([]);
  const [foundCount, setFoundCount] = useState<number | null>(null);
  const [persistNote, setPersistNote] = useState<string | null>(null);
  const [contribBusy, setContribBusy] = useState(false);
  const [contribNote, setContribNote] = useState<string | null>(null);
  /** When several include keywords, require every keyword to match (Gemini-style combined query). */
  const [includeMatchAll, setIncludeMatchAll] = useState(false);
  const skipNextPersistRef = useRef(true);

  const member = useMemo(
    () => state.members.find((m) => m.id === memberId) ?? state.members[0],
    [state.members, memberId]
  );

  const includeKeywordsDraft = useMemo(() => parseKeywordInput(includeRaw), [includeRaw]);
  const drilldownGuides = useMemo(() => collectDrilldownGuides(includeRaw), [includeRaw]);
  const emptySuggestChips = useMemo(() => fallbackChipsForEmpty(includeRaw), [includeRaw]);

  const hydratedMemberRef = useRef(false);
  useEffect(() => {
    if (state.members.length === 0) return;
    if (!state.members.some((m) => m.id === memberId)) {
      setMemberId(state.members[0].id);
    }
  }, [state.members, memberId]);

  useEffect(() => {
    if (hydratedMemberRef.current || state.members.length === 0) return;
    hydratedMemberRef.current = true;
    const mid = state.appSettings.hiddenBenefitMemberId;
    if (mid && state.members.some((m) => m.id === mid)) setMemberId(mid);
  }, [state.appSettings.hiddenBenefitMemberId, state.members]);

  useEffect(() => {
    if (includeKeywordsDraft.length < 2) setIncludeMatchAll(false);
  }, [includeKeywordsDraft.length]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (skipNextPersistRef.current) {
        skipNextPersistRef.current = false;
        return;
      }
      updateState((prev) => ({
        ...prev,
        appSettings: {
          ...prev.appSettings,
          hiddenBenefitIncludeDraft: includeRaw,
          hiddenBenefitExcludeDraft: excludeRaw,
          hiddenBenefitMemberId: memberId,
        },
      }));
    }, 450);
    return () => window.clearTimeout(id);
  }, [includeRaw, excludeRaw, memberId, updateState]);

  const run = useCallback(async () => {
    if (!member) return;
    updateState((prev) => ({
      ...prev,
      appSettings: {
        ...prev.appSettings,
        hiddenBenefitIncludeDraft: includeRaw,
        hiddenBenefitExcludeDraft: excludeRaw,
        hiddenBenefitMemberId: memberId,
      },
    }));

    setRunning(true);
    setResults([]);
    setFoundCount(null);
    setPersistNote(null);
    setContribNote(null);
    setProgress(0);
    setStageIndex(0);
    setStatusLine(STAGES[0].label);

    await sleep(220);
    setStageIndex(1);
    const n = SCAN_SOURCES.length;
    for (let i = 0; i < n; i++) {
      setStatusLine(`스캔 중: ${SCAN_SOURCES[i]} · 통합 카탈로그 ${list.length}건`);
      const base = (i / n) * 100;
      const seg = 100 / n;
      for (let p = 0; p <= 100; p += 25) {
        setProgress(Math.min(100, Math.round(base + (seg * p) / 100)));
        await sleep(38);
      }
    }

    const eff = getEffectiveProfile(member, state.household);
    const profileTags = profileToDerivedTags(eff);
    const includeKeywords = parseKeywordInput(includeRaw);
    const excludeKeywords = buildSmartSearchExcludeKeywords(excludeRaw, eff.extraExcludeTags, includeKeywords);

    const matched = runSmartMatch(list, {
      profileTags,
      includeKeywords,
      excludeKeywords,
      hideExpired: true,
      includeMatchAll,
    });

    setStageIndex(2);
    setStatusLine(`키워드 매칭 중… (${matched.length}건)`);
    setProgress(0);
    for (let p = 0; p <= 100; p += 20) {
      setProgress(p);
      await sleep(40);
    }

    setStageIndex(3);
    setStatusLine(STAGES[3].label);
    setProgress(0);
    for (let p = 0; p <= 50; p += 25) {
      setProgress(p);
      await sleep(35);
    }

    try {
      await upsertWelfareRecords(matched.map(toPersistable));
      refreshWelfareCatalog();
      setPersistNote(
        matched.length > 0 ? '이 기기 카탈로그(IndexedDB)에 반영했습니다.' : '맞는 항목이 없어 저장할 결과가 없습니다.'
      );
    } catch {
      setPersistNote('로컬 저장을 건너뛰었습니다. 비공개 창이나 저장소 제한일 수 있습니다.');
    }

    setProgress(100);
    await sleep(120);

    setResults(matched);
    setFoundCount(matched.length);
    setRunning(false);
    setStatusLine('완료');
  }, [
    member,
    list,
    includeRaw,
    excludeRaw,
    state.household,
    refreshWelfareCatalog,
    memberId,
    updateState,
    includeMatchAll,
  ]);

  if (loading) return <p className="muted">복지 데이터를 불러오는 중…</p>;
  if (error) return <p role="alert">{error}</p>;

  if (state.members.length === 0) {
    return (
      <div className="page-comfort smart-find-page">
        <h1 className="page-title">숨은 복지·혜택찾기</h1>
        <p className="muted smart-find-lead">
          구성원을 먼저 추가하세요. <Link to="/">가족</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page-comfort smart-find-page">
      <h1 className="page-title">숨은 복지·혜택찾기</h1>
      <p className="smart-find-subtitle muted">
        한 줄에 상황을 적듯이 쓰고, 안내에 따라 <strong>세부 단어로 바꿔 가며</strong> 찾아 보세요. 챗봇처럼 한 번에 답이
        나오기보다, <strong>주제를 좁히는 질문</strong>을 스스로 던지는 흐름에 가깝게 설계했습니다.
      </p>
      <p className="muted smart-find-lead">
        <strong>포함 키워드</strong>는 제목·내용·태그에서 비슷한 말까지 넓게 짝지어 찾습니다. <strong>쉼표(,)</strong>로
        나눈 단어는 <strong>하나만 맞아도</strong> 나옵니다(OR). 건수가 많으면 단어를 줄이거나 <strong>제외</strong> 칸을
        쓰세요. 띄어쓰기 있는 문장은 한 덩어리로 둡니다. 입력은 이 브라우저에 저장됩니다.
      </p>

      <div className="card smart-find-coach" aria-labelledby="smart-find-coach-title">
        <h2 id="smart-find-coach-title" className="smart-find-coach__title">
          맞춤에 가깝게 쓰는 순서
        </h2>
        <ol className="smart-find-coach__steps">
          {SMART_SEARCH_COACH_STEPS.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      </div>

      <h2 className="subsection-title smart-find-section-title">자주 찾는 묶음</h2>
      <p className="muted smart-find-section-hint">누르면 포함 키워드 칸이 아래 묶음으로 채워집니다. 필요하면 고쳐 쓴 뒤 혜택 찾기를 누르세요.</p>
      <div className="smart-find-preset-grid">
        {SMART_SEARCH_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="btn secondary smart-find-preset-btn"
            onClick={() => setIncludeRaw(p.includeLine)}
            title={p.hint}
          >
            <span className="smart-find-preset-btn__label">{p.label}</span>
            <span className="smart-find-preset-btn__hint muted">{p.hint}</span>
          </button>
        ))}
      </div>

      <h2 className="subsection-title smart-find-section-title">빠른 키워드</h2>
      <p className="muted smart-find-section-hint">탭하면 포함 칸 <strong>맨 뒤에</strong> 붙습니다. 같은 말은 한 번만 넣습니다.</p>
      <div className="smart-find-chip-row" role="group" aria-label="빠른 키워드">
        {SMART_QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            className="smart-find-chip"
            onClick={() => setIncludeRaw((prev) => appendKeywordToDraft(prev, chip))}
          >
            {chip}
          </button>
        ))}
      </div>

      <p className="muted smart-find-meta">
        통합 카탈로그 <strong>{list.length}</strong>건
      </p>

      <div className="card smart-find-card">
        <div className="rec-member-row smart-find-field">
          {member && (
            <span
              className="member-color-dot member-color-dot--lg"
              style={{ backgroundColor: member.memberColor }}
              title="이 구성원의 표시 색"
              aria-hidden
            />
          )}
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label htmlFor="sm-member">기준 구성원 (프로필 태그)</label>
            <select
              id="sm-member"
              className="input-touch"
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
        </div>
        <div className="field smart-find-field">
          <label htmlFor="sm-include">포함 키워드 (쉼표로 구분)</label>
          <input
            id="sm-include"
            className="input-touch"
            value={includeRaw}
            onChange={(e) => setIncludeRaw(e.target.value)}
            placeholder="예: 전기요금 또는 한부모, 장애인 (세부로 바꿔 가며 검색)"
            autoComplete="off"
          />
        </div>
        <div className="field smart-find-field">
          <label htmlFor="sm-exclude">제외 키워드 (쉼표로 구분)</label>
          <input
            id="sm-exclude"
            className="input-touch"
            value={excludeRaw}
            onChange={(e) => setExcludeRaw(e.target.value)}
            placeholder="예: 차상위 (선택)"
            autoComplete="off"
          />
          <p className="muted" style={{ marginTop: 8, marginBottom: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
            프로필 <strong>제외 태그</strong>는 여기에도 붙이되, <strong>포함 칸 키워드와 같은 주제</strong>는 검색이 막히지
            않게 자동으로 뺍니다.
          </p>
        </div>

        <label className="field-row smart-find-and-row" style={{ marginTop: 4, marginBottom: 0, alignItems: 'flex-start', gap: 10 }}>
          <input
            type="checkbox"
            className="input-checkbox"
            checked={includeMatchAll}
            onChange={(e) => setIncludeMatchAll(e.target.checked)}
            disabled={includeKeywordsDraft.length < 2}
          />
          <span style={{ fontSize: '0.95rem', lineHeight: 1.55 }}>
            쉼표로 여러 단어를 넣었을 때 <strong>모두 들어간 항목만</strong> (AND). 장애인·대중교통처럼 같이 묶어 찾을 때
            켜 보세요.
          </span>
        </label>

        {includeKeywordsDraft.length > 0 && drilldownGuides.length > 0 && (
          <div className="smart-find-drill-wrap">
            <p className="smart-find-drill-intro muted">
              지금 적은 말과 맞물리는 주제입니다. <strong>세부로 들어가려면</strong> 아래 칩을 눌러 포함 키워드를 그 단어로
              바꾼 뒤, 다시 혜택 찾기를 눌러 보세요.
            </p>
            {drilldownGuides.map((g) => (
              <div key={g.id} className="card smart-find-drill">
                <h3 className="smart-find-drill__title">{g.title}</h3>
                <p className="muted smart-find-drill__body">{g.body}</p>
                <div className="smart-find-chip-row smart-find-drill__chips" role="group" aria-label={`${g.title} 추천 단어`}>
                  {g.refineChips.map((chip) => (
                    <button key={chip} type="button" className="smart-find-chip smart-find-chip--refine" onClick={() => setIncludeRaw(chip)}>
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <button type="button" className="btn smart-find-primary" onClick={run} disabled={running}>
          {running ? '찾는 중…' : '혜택 찾기'}
        </button>
      </div>

      {running && (
        <div className="card smart-find-progress" aria-live="polite">
          <p className="smart-find-progress__status">{statusLine}</p>
          <div className="smart-progress-track smart-progress-track--lg">
            <div className="smart-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <ul className="smart-find-stages">
            {STAGES.map((s, i) => (
              <li
                key={s.id}
                className={i === stageIndex ? 'smart-find-stages__active' : i <= stageIndex ? '' : 'smart-find-stages__todo'}
              >
                {s.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!running && foundCount !== null && (
        <p className="smart-find-result-count">{foundCount}개를 찾았습니다.</p>
      )}
      {!running &&
        foundCount !== null &&
        foundCount >= SMART_MATCH_MANY_THRESHOLD &&
        includeKeywordsDraft.length > 0 && (
          <div className="card smart-find-alert-many" role="status">
            <p className="smart-find-alert-many__title">결과가 많습니다</p>
            <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
              쉼표로 나눈 키워드는 <strong>하나만 맞아도</strong> 모두 나열합니다. 건수를 줄이려면 포함 칸의 단어 수를 줄이거나,
              제외 칸으로 주제를 거르세요. 위의 「세부로 들어가기」 칩으로 <strong>한 단어 검색</strong>을 여러 번 시도해 보는
              것도 좋습니다.
            </p>
          </div>
        )}
      {!running && persistNote && <p className="muted smart-find-note">{persistNote}</p>}

      {!running && results.length > 0 && state.appSettings.linkHelpApiBaseUrl.trim() && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ marginTop: 0, fontSize: '0.92rem', lineHeight: 1.55 }}>
            <strong>🌐 서버 기여</strong> — 매칭된 복지 JSON만 전송합니다. 가족 프로필은 보내지 않습니다.
          </p>
          <label className="settings-toggle-row" style={{ marginTop: 10, marginBottom: 12 }}>
            <input
              type="checkbox"
              className="input-checkbox"
              checked={state.appSettings.welfareContributeConsent}
              onChange={() =>
                setState({
                  ...state,
                  appSettings: {
                    ...state.appSettings,
                    welfareContributeConsent: !state.appSettings.welfareContributeConsent,
                  },
                })
              }
            />
            <span>동의 후 전송</span>
          </label>
          <button
            type="button"
            className="btn secondary input-touch-wide"
            style={{ width: '100%' }}
            disabled={contribBusy || !state.appSettings.welfareContributeConsent}
            onClick={async () => {
              const base = state.appSettings.linkHelpApiBaseUrl.trim();
              setContribBusy(true);
              setContribNote(null);
              try {
                const r = await contributeRecords(
                  base,
                  results.map(toPersistable),
                  state.appSettings.linkHelpApiToken
                );
                setContribNote(`서버 반영: ${r.accepted}건, 건너뜀 ${r.skipped}건.`);
              } catch (e) {
                setContribNote(e instanceof Error ? e.message : '기여 실패');
              } finally {
                setContribBusy(false);
              }
            }}
          >
            {contribBusy ? '서버로 보내는 중…' : `이 ${results.length}건을 공용 DB에 기여`}
          </button>
          {contribNote && (
            <p className="muted" style={{ marginTop: 10, marginBottom: 0, fontSize: '0.88rem' }}>
              {contribNote}
            </p>
          )}
          <p className="muted" style={{ marginTop: 10, marginBottom: 0, fontSize: '0.85rem' }}>
            API 주소는 빌드 시 환경 변수로 넣은 경우에만 여기가 열립니다.
          </p>
        </div>
      )}

      <div className="stack smart-find-results">
        {results.map((w) => {
          const entry = member && findWelfareTracking(state.welfareTracking, member.id, w.id);
          return (
            <div key={w.id} className="card smart-find-result-card">
              <Link to={`/benefits/${w.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                  <h3 className="smart-find-result-card__title">
                    {w.title}
                    {entry && <WelfareStatusPill status={entry.status} />}
                  </h3>
                  <span className="score-pill" title="매칭 점수">
                    {w.smartScore}
                  </span>
                </div>
                <p className="smart-find-result-card__benefit">{w.benefit}</p>
                <p className="muted smart-find-result-card__tags">{w.tags.join(' · ')}</p>
                {entry?.status === 'excluded' && entry.excludeReason && (
                  <p className="muted" style={{ marginTop: 8, fontSize: '0.85rem' }}>
                    제외: {entry.excludeReason}
                  </p>
                )}
              </Link>
              {member && (
                <div className="field-row field-row--wrap smart-find-result-card__actions">
                  <WelfareStatusQuickSelect welfare={w} memberId={member.id} />
                  <GoogleCalendarPeriodButton record={w} className="btn secondary btn--compact" label="Google 캘린더" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!running && results.length === 0 && foundCount === 0 && (
        <div className="smart-find-empty-block">
          <p className="muted smart-find-empty">조건에 맞는 항목이 없습니다. 동의어·철자를 바꾸거나, 아래를 눌러 포함 칸을 그 단어로 바꾼 뒤 다시 찾아 보세요.</p>
          <div className="smart-find-chip-row" role="group" aria-label="다시 시도할 키워드">
            {emptySuggestChips.map((chip) => (
              <button key={chip} type="button" className="smart-find-chip" onClick={() => setIncludeRaw(chip)}>
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
