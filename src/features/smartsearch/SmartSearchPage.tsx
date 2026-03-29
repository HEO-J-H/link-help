import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { useWelfare } from '@/context/WelfareContext';
import { profileToDerivedTags } from '@/core/filter/filterEngine';
import { getEffectiveProfile } from '@/core/family/effectiveProfile';
import { parseKeywordInput, runSmartMatch, type SmartMatchedWelfare } from '@/core/filter/smartMatchEngine';
import { upsertWelfareRecords } from '@/core/storage/welfareIndexedDb';
import { contributeRecords } from '@/core/api/linkHelpServer';
import type { WelfareRecord } from '@/types/benefit';
import { GoogleCalendarPeriodButton } from '@/components/GoogleCalendarPeriodButton';
import { findWelfareTracking } from '@/core/family/welfareTracking';
import { WelfareStatusPill, WelfareStatusQuickSelect } from '@/components/WelfareStatusControls';

const STAGES = [
  { id: 'prep', label: '프로필·포함·제외 조건 정리' },
  { id: 'scan', label: '데이터 소스 스캔' },
  { id: 'match', label: '매칭·점수·정렬' },
  { id: 'persist', label: '로컬 카탈로그(IndexedDB) 동기화' },
] as const;

const SCAN_SOURCES = [
  'national.json · 전국',
  'gyeonggi.json · 경기',
  'yongin.json · 용인',
  'IndexedDB · 이전 매칭 누적',
] as const;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function toPersistable(w: SmartMatchedWelfare): WelfareRecord {
  const { smartScore: _s, ...r } = w;
  return r;
}

export function SmartSearchPage() {
  const { state } = useFamily();
  const { list, loading, error, refreshWelfareCatalog } = useWelfare();
  const [memberId, setMemberId] = useState(state.members[0]?.id ?? '');
  const [includeRaw, setIncludeRaw] = useState('');
  const [excludeRaw, setExcludeRaw] = useState('');
  const [running, setRunning] = useState(false);
  const [stageIndex, setStageIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [statusLine, setStatusLine] = useState('');
  const [results, setResults] = useState<SmartMatchedWelfare[]>([]);
  const [foundCount, setFoundCount] = useState<number | null>(null);
  const [persistNote, setPersistNote] = useState<string | null>(null);
  const [contribBusy, setContribBusy] = useState(false);
  const [contribNote, setContribNote] = useState<string | null>(null);

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

  const run = useCallback(async () => {
    if (!member) return;
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
    const excludeKeywords = [
      ...parseKeywordInput(excludeRaw),
      ...eff.extraExcludeTags.map((t) => t.trim()).filter(Boolean),
    ];

    const matched = runSmartMatch(list, { profileTags, includeKeywords, excludeKeywords });

    setStageIndex(2);
    setStatusLine(`매칭·정렬 중… (${matched.length}건 후보)`);
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
        matched.length > 0
          ? '매칭 결과를 이 기기 IndexedDB에 맞춰 두었습니다. (추후 가져오기·새 id가 붙으면 통합 목록이 늘어납니다.)'
          : '조건에 맞는 항목이 없어 저장할 매칭 결과가 없습니다.'
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
  }, [member, list, includeRaw, excludeRaw, state.household, refreshWelfareCatalog]);

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
        차상위, 장애인)를 조합해 통합 카탈로그에서 찾습니다. 핵심은 붙여넣기가 아니라{' '}
        <strong>이 조건으로 스캔·매칭</strong>하는 흐름입니다. 매칭으로 걸린 항목은{' '}
        <strong>이 기기 IndexedDB</strong>에 쌓입니다. 설정에서 공용 API를 넣고 기여에 동의한 경우에만, 매칭
        결과(복지 메타만)를 서버로 보낼 수 있습니다. 신청 기간이 파싱되면 결과 카드에서{' '}
        <strong>Google 캘린더</strong>로 종일 일정을 넣을 수 있습니다.
      </p>
      <p className="muted" style={{ marginTop: -8, marginBottom: 16, fontSize: '0.85rem' }}>
        통합 카탈로그 <strong>{list.length}</strong>건 로드됨 (번들 JSON + 로컬 누적).
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="rec-member-row">
          {member && (
            <span
              className="member-color-dot"
              style={{ backgroundColor: member.memberColor }}
              title="이 구성원의 표시 색"
              aria-hidden
            />
          )}
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
          {running ? '매칭 중…' : '스마트 매칭 시작'}
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
              </li>
            ))}
          </ul>
        </div>
      )}

      {!running && foundCount !== null && (
        <p style={{ marginBottom: 8, fontWeight: 600 }}>
          {foundCount}개를 찾았습니다.
          <span className="muted" style={{ fontWeight: 400, marginLeft: 8 }}>
            진행 중 어디를 스캔했는지·진행률은 위 단계에서 표시됩니다.
          </span>
        </p>
      )}
      {!running && persistNote && <p className="muted" style={{ marginBottom: 12 }}>{persistNote}</p>}

      {!running &&
        results.length > 0 &&
        state.appSettings.linkHelpApiBaseUrl.trim() &&
        state.appSettings.welfareContributeConsent && (
          <div className="card" style={{ marginBottom: 16 }}>
            <p style={{ marginTop: 0, fontSize: '0.92rem', lineHeight: 1.55 }}>
              아래 버튼은 <strong>매칭된 복지 항목 JSON만</strong> 공용 DB(
              <code>POST /welfare/contribute</code>)로 보냅니다. 가족 프로필은 포함되지 않습니다.
            </p>
            <button
              type="button"
              className="btn secondary"
              style={{ width: '100%' }}
              disabled={contribBusy}
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
              API 주소·토큰·동의는 <Link to="/settings">설정</Link>에서 바꿀 수 있습니다.
            </p>
          </div>
        )}

      <div className="stack">
        {results.map((w) => {
          const entry = member && findWelfareTracking(state.welfareTracking, member.id, w.id);
          return (
            <div key={w.id} className="card">
              <Link to={`/benefits/${w.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                    {w.title}
                    {entry && <WelfareStatusPill status={entry.status} />}
                  </h3>
                  <span className="score-pill" title="스마트 매칭 점수">
                    {w.smartScore}
                  </span>
                </div>
                <p>{w.benefit}</p>
                <p className="muted" style={{ marginTop: 6 }}>
                  {w.tags.join(' · ')}
                </p>
                {entry?.status === 'excluded' && entry.excludeReason && (
                  <p className="muted" style={{ marginTop: 8, fontSize: '0.85rem' }}>
                    제외: {entry.excludeReason}
                  </p>
                )}
              </Link>
              {member && (
                <div className="field-row field-row--wrap" style={{ marginTop: 10, marginBottom: 0, gap: 8 }}>
                  <WelfareStatusQuickSelect welfare={w} memberId={member.id} />
                  <GoogleCalendarPeriodButton record={w} className="btn secondary btn--compact" label="Google 캘린더" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!running && results.length === 0 && foundCount === 0 && (
        <p className="muted">조건에 맞는 항목이 없습니다. 포함 키워드를 줄이거나 제외를 조정해 보세요.</p>
      )}
    </div>
  );
}
