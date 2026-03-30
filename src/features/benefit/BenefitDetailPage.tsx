import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { useWelfare } from '@/context/WelfareContext';
import { suggestTagsFromText } from '@/core/ai/suggestTags';
import {
  profileToDerivedTags,
  welfareProfileTagMatchScore01,
  welfareStrictFullCatalogTagCoverage,
  welfareStrictMissingCatalogTags,
} from '@/core/filter/filterEngine';
import { getEffectiveProfile } from '@/core/family/effectiveProfile';
import { isWelfareEffectivelyExpired } from '@/core/welfare/welfareLifecycle';
import { googleCalendarUrlForApplicationPeriod } from '@/core/calendar/googleCalendar';
import { GoogleCalendarPeriodButton } from '@/components/GoogleCalendarPeriodButton';
import type { WelfareCatalogOrigin } from '@/types/benefit';
import { WelfareStatusControls } from '@/components/WelfareStatusControls';
import { ApplicationDeadlineBadge } from '@/components/ApplicationDeadlineBadge';
import { WelfareTagChips } from '@/components/WelfareTagChips';

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
  const { state } = useFamily();
  const w = list.find((x) => x.id === id);

  const [paste, setPaste] = useState('');
  const [suggested, setSuggested] = useState<string[]>([]);
  const [suggestBusy, setSuggestBusy] = useState(false);

  const defaultTrackMemberId = useMemo(
    () => state.members.find((m) => m.relationship === 'self')?.id ?? state.members[0]?.id ?? '',
    [state.members]
  );
  const [trackMemberId, setTrackMemberId] = useState(defaultTrackMemberId);

  useEffect(() => {
    if (!trackMemberId && defaultTrackMemberId) setTrackMemberId(defaultTrackMemberId);
  }, [defaultTrackMemberId, trackMemberId]);

  useEffect(() => {
    if (!state.members.some((m) => m.id === trackMemberId)) {
      setTrackMemberId(defaultTrackMemberId);
    }
  }, [state.members, trackMemberId, defaultTrackMemberId]);

  const profileMatchDetail = useMemo(() => {
    if (!w) return { kind: 'no-row' as const };
    if (!trackMemberId || state.members.length === 0) return { kind: 'no-row' as const };
    const m = state.members.find((x) => x.id === trackMemberId);
    if (!m) return { kind: 'no-row' as const };
    const s01 = welfareProfileTagMatchScore01(w, getEffectiveProfile(m, state.household));
    if (s01 === null) return { kind: 'empty-profile' as const };
    return { kind: 'ok' as const, pct: Math.round(s01 * 100) };
  }, [w, trackMemberId, state.members, state.household]);

  const detailTagProfileSet = useMemo(() => {
    if (!trackMemberId || state.members.length === 0) return null;
    const m = state.members.find((x) => x.id === trackMemberId);
    if (!m) return null;
    const eff = getEffectiveProfile(m, state.household);
    const arr = profileToDerivedTags(eff);
    return arr.length > 0 ? new Set(arr) : null;
  }, [trackMemberId, state.members, state.household]);

  const strictGapForDetail = useMemo(() => {
    if (!w || !trackMemberId) return null;
    const m = state.members.find((x) => x.id === trackMemberId);
    if (!m) return null;
    const eff = getEffectiveProfile(m, state.household);
    if (profileToDerivedTags(eff).length === 0) return null;
    if (welfareStrictFullCatalogTagCoverage(w, eff)) return { ok: true as const, missing: [] as string[] };
    return { ok: false as const, missing: welfareStrictMissingCatalogTags(w, eff) };
  }, [w, trackMemberId, state.members, state.household]);

  if (loading) return <p className="muted">불러오는 중…</p>;
  if (!w) {
    return (
      <div>
        <p>항목을 찾을 수 없습니다.</p>
        <Link to="/benefits">혜택 목록</Link>
      </div>
    );
  }

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
  const hasGcal = !!googleCalendarUrlForApplicationPeriod(w);
  const sameApplyAndSource =
    w.apply_url &&
    w.source_url &&
    w.apply_url.trim() === w.source_url.trim();

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link to="/benefits">← 혜택 목록</Link>
      </p>
      <div className="benefit-detail__title-row">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          {w.title}
        </h1>
        <ApplicationDeadlineBadge record={w} showSubline className="benefit-detail__dday" />
      </div>
      {ended && (
        <p className="remote-warn" role="status" style={{ marginBottom: 14, borderRadius: 8 }}>
          이 항목은 <strong>기간 종료</strong> 또는 <strong>만료</strong>로 보입니다. 타임라인 등에서는 빼고 참고용으로만
          남겨 둡니다. 신청 가능 여부는 반드시 공식 공고를 확인하세요.
        </p>
      )}

      <div className="benefit-action-bar card" style={{ marginBottom: 14, padding: '12px 14px' }}>
        <p className="muted" style={{ margin: '0 0 10px', fontSize: '0.82rem' }}>
          바로가기
        </p>
        <div className="benefit-action-bar__buttons">
          {hasGcal ? (
            <GoogleCalendarPeriodButton record={w} className="btn secondary" label="Google 캘린더" />
          ) : (
            <span className="btn secondary" style={{ opacity: 0.5, cursor: 'not-allowed' }} aria-disabled>
              캘린더(기간 없음)
            </span>
          )}
          {w.source_url && (
            <a className="btn secondary" href={w.source_url} target="_blank" rel="noreferrer">
              공고·원문
            </a>
          )}
          {w.apply_url && !sameApplyAndSource && (
            <a className="btn secondary" href={w.apply_url} target="_blank" rel="noreferrer">
              신청·안내
            </a>
          )}
          {sameApplyAndSource && (
            <a className="btn secondary" href={w.apply_url} target="_blank" rel="noreferrer">
              공고·신청
            </a>
          )}
        </div>
        <p className="muted benefit-external-hint" style={{ margin: '14px 0 0', fontSize: '0.9rem', lineHeight: 1.6 }}>
          위 버튼은 <strong>해당 기관 웹사이트</strong>로만 연결됩니다. 공고 전문·접수 양식·정확한 서류 목록·마감일은{' '}
          <strong>사이트 안 검색·메뉴</strong>에서 확인해야 합니다. 이 앱의 본문은 요약이며 법적 효력이 없습니다.
        </p>
      </div>

      <div className="card">
        <p>{w.description}</p>
        {w.required_documents?.trim() && (
          <>
            <p style={{ marginTop: 14, marginBottom: 6 }}>
              <strong>신청 서류(참고)</strong>
            </p>
            <pre className="benefit-docs-block">{w.required_documents.trim()}</pre>
          </>
        )}
        <p style={{ marginTop: 12 }}>
          <strong>혜택</strong> {w.benefit}
        </p>
        <p>
          <strong>기간</strong>{' '}
          {w.period?.trim()
            ? w.period
            : '이 카탈로그에는 날짜 범위가 없습니다. 상시·연중 사업이거나 공고문에만 기재된 경우가 많습니다. 기관 사이트에서 확인하세요.'}
        </p>
        <p>
          <strong>지역</strong> {w.region.join(', ')}
        </p>
        <p className="benefit-detail-tags">
          <strong>태그</strong>{' '}
          {w.tags.length > 0 ? (
            <WelfareTagChips record={w} profileDerived={detailTagProfileSet} />
          ) : (
            <span className="muted">—</span>
          )}
        </p>
        {state.members.length > 0 && profileMatchDetail.kind === 'ok' && (
          <p className="muted" style={{ marginTop: 8 }}>
            <strong>프로필 매칭</strong>{' '}
            {strictGapForDetail?.ok ? '100% (엄격: 혜택 태그 전부 설명 가능)' : `${profileMatchDetail.pct}%`}{' '}
            <span style={{ fontSize: '0.92em' }}>
              — 자카드·엄격 일치는 참고입니다. 공고 자격 판정이 아닙니다.
            </span>
          </p>
        )}
        {strictGapForDetail && !strictGapForDetail.ok && strictGapForDetail.missing.length > 0 && (
          <p className="benefit-detail-strict-gap" style={{ marginTop: 10, marginBottom: 0 }}>
            <strong>엄격 기준 미충족</strong> — 프로필 키워드에 없는 혜택 태그: {strictGapForDetail.missing.join(', ')}.
            구성원 프로필의 관심 영역·포함 태그 등을 채우면 혜택 목록에 나타날 수 있습니다.
          </p>
        )}
        {state.members.length > 0 && profileMatchDetail.kind === 'empty-profile' && (
          <p className="muted" style={{ marginTop: 8 }}>
            프로필에서 연관 태그를 만들 정보가 없어 <strong>프로필 매칭</strong> %를 표시하지 않습니다. 가족 탭에서 지역·직업 등을
            채우면 여기와 혜택 목록에 나타납니다.
          </p>
        )}
        <p className="muted" style={{ marginTop: 12 }}>
          출처: {w.source}
        </p>
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
      </div>

      <h2 style={{ fontSize: '1.1rem', margin: '20px 0 10px' }}>진행 상태</h2>
      <div className="card">
        {state.members.length === 0 ? (
          <p className="muted" style={{ marginTop: 0 }}>
            <Link to="/">가족</Link>에서 구성원을 추가하면 신청 중·제외·나중에 볼게요를 남길 수 있습니다.
          </p>
        ) : (
          <>
            <div className="field">
              <label htmlFor="ben-track-member">기준 구성원</label>
              <select
                id="ben-track-member"
                value={trackMemberId}
                onChange={(e) => setTrackMemberId(e.target.value)}
              >
                {state.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </div>
            <WelfareStatusControls welfare={w} memberId={trackMemberId} />
          </>
        )}
      </div>

      <h2 style={{ fontSize: '1.1rem', margin: '20px 0 10px' }}>태그 힌트 (로컬)</h2>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          공고문을 붙여넣으면 태그 사전과 맞춰 힌트를 줍니다. 구조화된 복지 JSON 배열은{' '}
          <Link to="/settings">설정</Link>에서 파일로 불러와 이 기기 카탈로그에 합칠 수 있습니다.
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
