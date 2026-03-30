import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { useWelfare } from '@/context/WelfareContext';
import {
  filterWelfareByText,
  recommendForProfile,
  welfareBlockedByMemberProfile,
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

/** Optional: only rows that recommendForProfile would surface (지역·포함 태그 등이 맞는 항목). */
function filterToProfileRecommendations(
  sorted: WelfareRecord[],
  memberId: string,
  members: FamilyMember[],
  household: HouseholdDefaults,
  catalog: WelfareRecord[]
): WelfareRecord[] {
  const m = members.find((x) => x.id === memberId);
  if (!m) return sorted;
  const eff = getEffectiveProfile(m, household);
  const allowed = new Set(recommendForProfile(catalog, eff).map((w) => w.id));
  return sorted.filter((w) => allowed.has(w.id));
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

function memberVisibleCount(
  sorted: WelfareRecord[],
  memberId: string,
  tracking: WelfareTrackingEntry[],
  statusFilter: StatusFilter,
  members: FamilyMember[],
  household: HouseholdDefaults,
  profileFitOnly: boolean,
  catalog: WelfareRecord[]
): number {
  let base = filterOutProfileExcluded(sorted, memberId, members, household);
  if (profileFitOnly) {
    base = filterToProfileRecommendations(base, memberId, members, household, catalog);
  }
  return filterRowsForMemberView(base, memberId, tracking, statusFilter).length;
}

export function BenefitListPage() {
  const { state } = useFamily();
  const { list, loading, error } = useWelfare();
  const [q, setQ] = useState('');
  const [sortPopular, setSortPopular] = useState(false);
  const [showEnded, setShowEnded] = useState(false);
  const [memberId, setMemberId] = useState(state.members[0]?.id ?? '');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  /** Portal / 종합 안내 행(복지로 메인, 시·도 총괄 안내 등) — 기본 숨김 */
  const [showPortalRows, setShowPortalRows] = useState(false);
  /** Narrow list to recommendForProfile (reacts to 포함·제외·지역·학생 등 프로필 변경). */
  const [profileFitOnly, setProfileFitOnly] = useState(false);

  useEffect(() => {
    if (state.members.length === 0) return;
    if (!state.members.some((m) => m.id === memberId)) {
      setMemberId(state.members[0].id);
    }
  }, [state.members, memberId]);

  const sortedBase = useMemo(() => {
    const textFiltered = filterWelfareByText(list, q);
    const visibility = showEnded
      ? textFiltered
      : textFiltered.filter((w) => !isWelfareEffectivelyExpired(w));
    const noPortals = showPortalRows ? visibility : visibility.filter((w) => !w.hide_from_main_list);
    return sortPopular
      ? [...noPortals].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      : sortWelfareForDiscovery(noPortals);
  }, [list, q, sortPopular, showEnded, showPortalRows]);

  const filtered = useMemo(() => {
    let base = filterOutProfileExcluded(sortedBase, memberId, state.members, state.household);
    if (profileFitOnly) {
      base = filterToProfileRecommendations(base, memberId, state.members, state.household, list);
    }
    return filterRowsForMemberView(base, memberId, state.welfareTracking, statusFilter);
  }, [sortedBase, memberId, state.members, state.household, state.welfareTracking, statusFilter, profileFitOnly, list]);

  if (loading) return <p className="muted">복지 데이터를 불러오는 중…</p>;
  if (error) return <p role="alert">{error}</p>;

  const accentMember = state.members.find((m) => m.id === memberId);

  return (
    <div>
      <h1 className="page-title">혜택</h1>
      <p className="page-lead-graphic" style={{ marginTop: -6, marginBottom: 14 }}>
        <span className="page-lead-graphic__icon" aria-hidden>
          🎁
        </span>
        <span className="muted" style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
          구성원 박스를 눌러 목록을 바꿉니다. <strong>제외 태그</strong>는 항상 반영되고, 아래「프로필에 맞는 항목만」을
          켜면 포함 태그·지역·학생 등이 바뀔 때마다 목록이 좁혀집니다. 제외함·나중에 볼게요는 추가로 숨깁니다.
        </span>
      </p>

      {state.members.length > 0 && (
        <div className="benefit-member-grid" role="tablist" aria-label="가족 구성원별 혜택">
          {state.members.map((m) => {
            const n = memberVisibleCount(
              sortedBase,
              m.id,
              state.welfareTracking,
              statusFilter,
              state.members,
              state.household,
              profileFitOnly,
              list
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
        <div className="card" style={{ marginBottom: 14, padding: '12px 14px' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="ben-list-status">보기</label>
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
      <div className="field-row" style={{ marginBottom: 10, flexWrap: 'wrap', gap: '8px 16px' }}>
        <span className="field-row" style={{ marginBottom: 0 }}>
          <input
            id="sort-pop"
            type="checkbox"
            checked={sortPopular}
            onChange={(e) => setSortPopular(e.target.checked)}
          />
          <label htmlFor="sort-pop">인기도(참고) 순 정렬</label>
        </span>
        <span className="field-row" style={{ marginBottom: 0 }}>
          <input
            id="show-ended"
            type="checkbox"
            checked={showEnded}
            onChange={(e) => setShowEnded(e.target.checked)}
          />
          <label htmlFor="show-ended">종료·기간 만료 항목 보기</label>
        </span>
        <span className="field-row" style={{ marginBottom: 0 }}>
          <input
            id="show-portals"
            type="checkbox"
            checked={showPortalRows}
            onChange={(e) => setShowPortalRows(e.target.checked)}
          />
          <label htmlFor="show-portals">포털·종합 안내 항목 포함</label>
        </span>
        {state.members.length > 0 && (
          <span className="field-row" style={{ marginBottom: 0 }}>
            <input
              id="profile-fit-only"
              type="checkbox"
              checked={profileFitOnly}
              onChange={(e) => setProfileFitOnly(e.target.checked)}
            />
            <label htmlFor="profile-fit-only">프로필에 맞는 항목만 (포함·지역·직업 등)</label>
          </span>
        )}
      </div>
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
                <p className="muted" style={{ marginTop: 6 }}>
                  {w.tags.join(' · ')}
                  {typeof w.popularity === 'number' && (
                    <span className="score-pill" style={{ marginLeft: 8 }}>
                      인기 {w.popularity}
                    </span>
                  )}
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
