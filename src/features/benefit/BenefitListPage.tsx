import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { useWelfare } from '@/context/WelfareContext';
import {
  compareWelfareForBenefitListSort,
  filterWelfareByText,
  MIN_PROFILE_LIST_JACCARD_01,
  profileToDerivedTags,
  welfareBlockedByMemberProfile,
  welfareMeetsMinProfileOverlap,
  welfareProfileTagMatchScore01,
  welfareStrictFullCatalogTagCoverage,
  welfareStrictMissingCatalogTags,
} from '@/core/filter/filterEngine';
import { getEffectiveProfile } from '@/core/family/effectiveProfile';
import { isWelfareEffectivelyExpired, sortWelfareForDiscovery } from '@/core/welfare/welfareLifecycle';
import { GoogleCalendarPeriodButton } from '@/components/GoogleCalendarPeriodButton';
import {
  findWelfareTracking,
  welfareIdsForMemberStatus,
} from '@/core/family/welfareTracking';
import { WelfareStatusPill, WelfareStatusQuickSelect } from '@/components/WelfareStatusControls';
import {
  WELFARE_TRACKING_LABELS,
  type WelfareTrackingEntry,
  type WelfareTrackingStatus,
} from '@/types/welfareTracking';
import type { WelfareRecord } from '@/types/benefit';
import type { FamilyMember } from '@/types/family';
import type { HouseholdDefaults } from '@/types/household';
import { ApplicationDeadlineBadge } from '@/components/ApplicationDeadlineBadge';
import { WelfareTagChips } from '@/components/WelfareTagChips';

type StatusFilter = 'all' | WelfareTrackingStatus;

function hiddenByDefaultForMember(
  w: WelfareRecord,
  memberId: string,
  tracking: WelfareTrackingEntry[]
): boolean {
  const e = findWelfareTracking(tracking, memberId, w.id);
  return e?.status === 'excluded' || e?.status === 'later';
}

/** Drop rows that match the member's 프로필 제외 태그 (same rules as 맞춤 추천·숨은 복지 찾기 제외). */
function filterOutProfileExcluded(
  sorted: WelfareRecord[],
  memberId: string,
  members: FamilyMember[],
  household: HouseholdDefaults
): WelfareRecord[] {
  const m = members.find((x) => x.id === memberId);
  if (!m) return sorted;
  const eff = getEffectiveProfile(m, household);
  return sorted.filter((w) => !welfareBlockedByMemberProfile(w, eff));
}

function filterRowsForMemberView(
  sorted: WelfareRecord[],
  memberId: string,
  tracking: WelfareTrackingEntry[],
  statusFilter: StatusFilter
): WelfareRecord[] {
  if (!memberId) return sorted;
  if (statusFilter !== 'all') {
    const ids = welfareIdsForMemberStatus(tracking, memberId, statusFilter);
    return sorted.filter((w) => ids.has(w.id));
  }
  return sorted.filter((w) => !hiddenByDefaultForMember(w, memberId, tracking));
}

/** Per-member strict/loose pool so grid counts stay correct when switching tabs. */
function visibleCountForMember(
  pool: WelfareRecord[],
  memberId: string,
  members: FamilyMember[],
  household: HouseholdDefaults,
  tracking: WelfareTrackingEntry[],
  statusFilter: StatusFilter,
  relaxStrictMatch: boolean
): number {
  const m = members.find((x) => x.id === memberId);
  if (!m) return 0;
  const eff = getEffectiveProfile(m, household);
  let rows = pool;
  if (profileToDerivedTags(eff).length > 0) {
    if (!relaxStrictMatch) {
      rows = pool.filter((w) => welfareStrictFullCatalogTagCoverage(w, eff));
    } else {
      rows = pool.filter((w) => welfareMeetsMinProfileOverlap(w, eff));
    }
  }
  const base = filterOutProfileExcluded(rows, memberId, members, household);
  return filterRowsForMemberView(base, memberId, tracking, statusFilter).length;
}

export function BenefitListPage() {
  const { state } = useFamily();
  const { list, loading, error } = useWelfare();
  const [q, setQ] = useState('');
  const [sortPopular, setSortPopular] = useState(false);
  const [showEnded, setShowEnded] = useState(false);
  /** Off = 혜택 태그 전부가 프로필로 설명될 때만 표시(기본). On = 일부 겹침·자카드 완화. */
  const [relaxStrictMatch, setRelaxStrictMatch] = useState(false);
  /** 엄격 매칭에서 빠진 항목 + 부족한 태그 안내. */
  const [showUnmatchedReasons, setShowUnmatchedReasons] = useState(false);
  const [memberId, setMemberId] = useState(state.members[0]?.id ?? '');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  /** Portal / 종합 안내 행(복지로 메인, 시·도 총괄 안내 등) — 기본 숨김 */
  const [showPortalRows, setShowPortalRows] = useState(false);

  useEffect(() => {
    if (state.members.length === 0) return;
    if (!state.members.some((m) => m.id === memberId)) {
      setMemberId(state.members[0].id);
    }
  }, [state.members, memberId]);

  /** Selected member's profile-tag overlap (0–1) per welfare row; drives "프로필 매칭 %" pills. */
  const profileMatch01ByWelfareId = useMemo(() => {
    const map = new Map<string, number>();
    if (!memberId || state.members.length === 0) return map;
    const m = state.members.find((x) => x.id === memberId);
    if (!m) return map;
    const eff = getEffectiveProfile(m, state.household);
    for (const w of list) {
      const s = welfareProfileTagMatchScore01(w, eff);
      if (s != null) map.set(w.id, s);
    }
    return map;
  }, [memberId, state.members, state.household, list]);

  /** For highlighting catalog tags that intersect the selected member profile. */
  const profileDerivedSet = useMemo(() => {
    if (!memberId || state.members.length === 0) return null;
    const m = state.members.find((x) => x.id === memberId);
    if (!m) return null;
    const eff = getEffectiveProfile(m, state.household);
    const arr = profileToDerivedTags(eff);
    return arr.length > 0 ? new Set(arr) : null;
  }, [memberId, state.members, state.household]);

  const poolFiltered = useMemo(() => {
    const textFiltered = filterWelfareByText(list, q);
    const visibility = showEnded
      ? textFiltered
      : textFiltered.filter((w) => !isWelfareEffectivelyExpired(w));
    return showPortalRows ? visibility : visibility.filter((w) => !w.hide_from_main_list);
  }, [list, q, showEnded, showPortalRows]);

  const sortedBase = useMemo(() => {
    const mSel = state.members.find((x) => x.id === memberId);
    const effProf = mSel ? getEffectiveProfile(mSel, state.household) : null;
    const derivedTags = effProf != null && profileToDerivedTags(effProf).length > 0;

    let rows = poolFiltered;
    if (effProf && derivedTags) {
      if (!relaxStrictMatch) {
        rows = poolFiltered.filter((w) => welfareStrictFullCatalogTagCoverage(w, effProf));
      } else {
        rows = poolFiltered.filter((w) => welfareMeetsMinProfileOverlap(w, effProf));
      }
    }

    const now = new Date();
    if (sortPopular) {
      if (effProf && derivedTags) {
        return [...rows].sort((a, b) => {
          const pop = (b.popularity ?? 0) - (a.popularity ?? 0);
          if (pop !== 0) return pop;
          return compareWelfareForBenefitListSort(a, b, effProf, now);
        });
      }
      return [...rows].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    }
    if (effProf && derivedTags) {
      return [...rows].sort((a, b) => compareWelfareForBenefitListSort(a, b, effProf, now));
    }
    return sortWelfareForDiscovery(rows);
  }, [
    poolFiltered,
    relaxStrictMatch,
    sortPopular,
    memberId,
    state.members,
    state.household,
  ]);

  const strictUnmatchedSamples = useMemo(() => {
    if (relaxStrictMatch || !memberId || state.members.length === 0) return [];
    const m = state.members.find((x) => x.id === memberId);
    if (!m) return [];
    const eff = getEffectiveProfile(m, state.household);
    if (profileToDerivedTags(eff).length === 0) return [];
    let cand = filterOutProfileExcluded(poolFiltered, memberId, state.members, state.household);
    cand = cand.filter((w) => !welfareStrictFullCatalogTagCoverage(w, eff));
    cand = cand.filter((w) => (w.tags?.length ?? 0) > 0);
    return cand.slice(0, 50).map((w) => ({ w, missing: welfareStrictMissingCatalogTags(w, eff) }));
  }, [poolFiltered, memberId, state.members, state.household, relaxStrictMatch]);

  const filtered = useMemo(() => {
    const base = filterOutProfileExcluded(sortedBase, memberId, state.members, state.household);
    return filterRowsForMemberView(base, memberId, state.welfareTracking, statusFilter);
  }, [sortedBase, memberId, state.members, state.household, state.welfareTracking, statusFilter]);

  if (loading) return <p className="muted">복지 데이터를 불러오는 중…</p>;
  if (error) return <p role="alert">{error}</p>;

  const accentMember = state.members.find((m) => m.id === memberId);
  const selectedEffProfile = accentMember ? getEffectiveProfile(accentMember, state.household) : null;

  return (
    <div>
      <h1 className="page-title">혜택</h1>
      <div className="page-lead card card--soft">
        <p className="page-lead__row">
          <span className="page-lead__icon" aria-hidden>
            🎁
          </span>
          <span>
            기본은 <strong>프로필 태그로 혜택의 모든 키워드(태그)를 설명할 수 있을 때만</strong> 목록에 나옵니다(100% 태그
            정합). 프로필을 꼼꼼할수록 맞는 항목만 남습니다. <strong>제외 태그</strong>는 항상 반영되며, 아래에서
            「완화 매칭」이나 「매칭 실패 사유」를 켤 수 있습니다.
          </span>
        </p>
      </div>

      {state.members.length > 0 && (
        <div className="benefit-member-grid" role="tablist" aria-label="가족 구성원별 혜택">
          {state.members.map((m) => {
            const n = visibleCountForMember(
              poolFiltered,
              m.id,
              state.members,
              state.household,
              state.welfareTracking,
              statusFilter,
              relaxStrictMatch
            );
            const selected = m.id === memberId;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`benefit-member-box${selected ? ' benefit-member-box--selected' : ''}`}
                style={
                  {
                    '--member-accent': m.memberColor,
                  } as CSSProperties
                }
                onClick={() => setMemberId(m.id)}
              >
                <span className="benefit-member-box__dot" style={{ backgroundColor: m.memberColor }} />
                <span className="benefit-member-box__name">{m.displayName}</span>
                <span className="benefit-member-box__count">{n}</span>
                <span className="benefit-member-box__unit">혜택</span>
              </button>
            );
          })}
        </div>
      )}

      {state.members.length > 0 && (
        <div className="card filter-panel">
          <p className="filter-panel__title">신청 상태로 보기</p>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="visually-hidden" htmlFor="ben-list-status">
              신청 상태 필터
            </label>
            <select
              id="ben-list-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">전체 (제외·나중에 숨김)</option>
              <option value="applying">{WELFARE_TRACKING_LABELS.applying}만</option>
              <option value="excluded">{WELFARE_TRACKING_LABELS.excluded}만</option>
              <option value="later">{WELFARE_TRACKING_LABELS.later}만</option>
            </select>
          </div>
        </div>
      )}

      <input
        className="search-input"
        type="search"
        placeholder="제목·설명·태그 검색"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="혜택 검색"
      />
      <div className="card filter-panel">
        <p className="filter-panel__title">목록·정렬 옵션</p>
        <div className="filter-panel__options">
          <label className="filter-panel__option" htmlFor="sort-pop">
            <input
              id="sort-pop"
              className="input-checkbox"
              type="checkbox"
              checked={sortPopular}
              onChange={(e) => setSortPopular(e.target.checked)}
            />
            <span>정렬 참고 점수 순 (카탈로그 메타)</span>
          </label>
          <label className="filter-panel__option" htmlFor="show-ended">
            <input
              id="show-ended"
              className="input-checkbox"
              type="checkbox"
              checked={showEnded}
              onChange={(e) => setShowEnded(e.target.checked)}
            />
            <span>종료·기간 만료 항목 보기</span>
          </label>
          <label className="filter-panel__option" htmlFor="show-portals">
            <input
              id="show-portals"
              className="input-checkbox"
              type="checkbox"
              checked={showPortalRows}
              onChange={(e) => setShowPortalRows(e.target.checked)}
            />
            <span>포털·종합 안내 항목 포함</span>
          </label>
          {state.members.length > 0 && memberId && (
            <label className="filter-panel__option" htmlFor="relax-strict">
              <input
                id="relax-strict"
                className="input-checkbox"
                type="checkbox"
                checked={relaxStrictMatch}
                onChange={(e) => setRelaxStrictMatch(e.target.checked)}
              />
              <span>
                완화 매칭 — 태그 일부만 겹쳐도 표시 (자카드 약 {Math.round(MIN_PROFILE_LIST_JACCARD_01 * 100)}% 이상,
                기본 끔)
              </span>
            </label>
          )}
          {state.members.length > 0 && memberId && (
            <label className="filter-panel__option" htmlFor="show-unmatched">
              <input
                id="show-unmatched"
                className="input-checkbox"
                type="checkbox"
                checked={showUnmatchedReasons}
                onChange={(e) => setShowUnmatchedReasons(e.target.checked)}
              />
              <span>매칭 실패 항목·부족한 태그 보기 (참고, 기본 목록과 별도)</span>
            </label>
          )}
        </div>
        {state.members.length > 0 && memberId && (
          <p className="muted" style={{ marginTop: 8, marginBottom: 0, fontSize: '0.88rem' }}>
            기본은 혜택 각 행의 <strong>모든 태그가</strong> 이 구성원 프로필에서 나온 키워드와 맞을 때만 표시합니다. 「전국」
            태그는 <strong>거주 지역만 있으면</strong> 통과로 봅니다. 프로필의 <strong>관심 복지 영역</strong>·포함 태그를
            늘리면 여기에 나오는 항목이 늘어납니다.
          </p>
        )}
      </div>
      {showUnmatchedReasons && strictUnmatchedSamples.length > 0 && memberId && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="filter-panel__title" style={{ marginTop: 0 }}>
            엄격 기준에서 빠진 항목 (프로필에 없는 혜택 태그)
          </p>
          <p className="muted" style={{ marginTop: 0, fontSize: '0.9rem' }}>
            아래 태그를 프로필(관심 영역·포함 태그·지역·직업 등)에 맞게 채우면 위 목록으로 올라올 수 있습니다. 법적
            자격과 다를 수 있습니다.
          </p>
          <div className="stack" style={{ marginTop: 12 }}>
            {strictUnmatchedSamples.map(({ w, missing }) => (
              <div key={`un-${w.id}`} className="card benefit-card benefit-card--unmatched">
                <Link to={`/benefits/${w.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: '1rem' }}>{w.title}</h3>
                  <p className="muted" style={{ margin: 0, fontSize: '0.88rem' }}>
                    <strong>프로필에 없는 태그:</strong> {missing.join(', ') || '—'}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="stack">
        {filtered.map((w) => {
          const entry = memberId
            ? findWelfareTracking(state.welfareTracking, memberId, w.id)
            : undefined;
          const docs = w.required_documents?.trim();
          return (
            <div
              key={w.id}
              className="card benefit-card"
              style={{
                borderLeft: accentMember ? '4px solid' : undefined,
                borderLeftColor: accentMember?.memberColor ?? 'transparent',
              }}
            >
              <div className="benefit-card__head">
                <ApplicationDeadlineBadge record={w} showSubline />
                <Link to={`/benefits/${w.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}>
                  <h3 style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, margin: 0 }}>
                    {w.title}
                    {isWelfareEffectivelyExpired(w) && (
                      <span className="score-pill" title="기간 종료 또는 만료로 표시된 항목">
                        종료
                      </span>
                    )}
                    {entry && <WelfareStatusPill status={entry.status} />}
                  </h3>
                </Link>
              </div>
              <Link to={`/benefits/${w.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <p style={{ marginTop: 8 }}>
                  {w.region.join(', ')} · {w.benefit}
                </p>
                {docs && (
                  <p className="benefit-card__docs" style={{ marginTop: 8 }}>
                    <strong>신청 서류</strong> {docs.length > 120 ? `${docs.slice(0, 120)}…` : docs}
                  </p>
                )}
                <p className="muted welfare-card-tags-line" style={{ marginTop: 6 }}>
                  <WelfareTagChips record={w} profileDerived={profileDerivedSet} />
                  {state.members.length > 0 &&
                    memberId &&
                    (() => {
                      const s01 = profileMatch01ByWelfareId.get(w.id);
                      if (s01 == null) return null;
                      const pct = relaxStrictMatch
                        ? Math.round(s01 * 100)
                        : selectedEffProfile &&
                            welfareStrictFullCatalogTagCoverage(w, selectedEffProfile)
                          ? 100
                          : Math.round(s01 * 100);
                      return (
                        <span
                          className="score-pill"
                          style={{ marginLeft: 8 }}
                          title={
                            relaxStrictMatch
                              ? '완화 모드: 태그 자카드 겹침(참고).'
                              : '엄격 모드: 혜택의 모든 태그가 프로필 키워드로 설명되면 100%로 표시합니다.'
                          }
                        >
                          프로필 매칭 {pct}%
                        </span>
                      );
                    })()}
                </p>
                {entry?.status === 'excluded' && entry.excludeReason && (
                  <p className="muted" style={{ marginTop: 8, fontSize: '0.85rem' }}>
                    제외: {entry.excludeReason}
                  </p>
                )}
              </Link>
              {state.members.length > 0 && memberId && (
                <div className="field-row field-row--wrap" style={{ marginTop: 10, marginBottom: 0, gap: 8 }}>
                  <WelfareStatusQuickSelect welfare={w} memberId={memberId} />
                  <GoogleCalendarPeriodButton record={w} className="btn secondary btn--compact" label="Google 캘린더" />
                </div>
              )}
              {state.members.length === 0 && (
                <div className="field-row field-row--wrap" style={{ marginTop: 10, marginBottom: 0, gap: 8 }}>
                  <GoogleCalendarPeriodButton record={w} className="btn secondary btn--compact" label="Google 캘린더" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="muted">검색 결과가 없습니다.</p>}
    </div>
  );
}
