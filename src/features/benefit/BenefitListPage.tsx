import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { useWelfare } from '@/context/WelfareContext';
import { filterWelfareByText } from '@/core/filter/filterEngine';
import { isWelfareEffectivelyExpired, sortWelfareForDiscovery } from '@/core/welfare/welfareLifecycle';
import { GoogleCalendarPeriodButton } from '@/components/GoogleCalendarPeriodButton';
import {
  findWelfareTracking,
  welfareIdsForMemberStatus,
} from '@/core/family/welfareTracking';
import { WelfareStatusPill, WelfareStatusQuickSelect } from '@/components/WelfareStatusControls';
import { WELFARE_TRACKING_LABELS, type WelfareTrackingStatus } from '@/types/welfareTracking';

type StatusFilter = 'all' | WelfareTrackingStatus;

export function BenefitListPage() {
  const { state } = useFamily();
  const { list, loading, error } = useWelfare();
  const [q, setQ] = useState('');
  const [sortPopular, setSortPopular] = useState(false);
  const [showEnded, setShowEnded] = useState(false);
  const [memberId, setMemberId] = useState(state.members[0]?.id ?? '');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    if (state.members.length === 0) return;
    if (!state.members.some((m) => m.id === memberId)) {
      setMemberId(state.members[0].id);
    }
  }, [state.members, memberId]);

  const filtered = useMemo(() => {
    const textFiltered = filterWelfareByText(list, q);
    const visibility = showEnded
      ? textFiltered
      : textFiltered.filter((w) => !isWelfareEffectivelyExpired(w));
    let rows = sortPopular
      ? [...visibility].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      : sortWelfareForDiscovery(visibility);

    if (statusFilter !== 'all' && memberId) {
      const ids = welfareIdsForMemberStatus(state.welfareTracking, memberId, statusFilter);
      rows = rows.filter((w) => ids.has(w.id));
    }
    return rows;
  }, [list, q, sortPopular, showEnded, statusFilter, memberId, state.welfareTracking]);

  if (loading) return <p className="muted">복지 데이터를 불러오는 중…</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div>
      <h1 className="page-title">혜택</h1>
      <p className="muted" style={{ marginTop: -8, marginBottom: 14, fontSize: '0.92rem', lineHeight: 1.55 }}>
        공식 API에만 의존하지 않고, 태그·프로필·앞으로 쌓이는 데이터로{' '}
        <strong>놓치기 쉬운 지원</strong>을 더 찾는 방향입니다. 아래는 로컬·원격 복지 목록입니다. 신청 기간이
        파싱되는 항목은 <strong>Google 캘린더</strong>로 종일 일정을 추가할 수 있습니다.
      </p>

      {state.members.length > 0 && (
        <div className="card" style={{ marginBottom: 14, padding: '12px 14px' }}>
          <div className="field" style={{ marginBottom: 10 }}>
            <label htmlFor="ben-list-member">진행 상태를 볼 구성원</label>
            <select
              id="ben-list-member"
              value={memberId}
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
            <label htmlFor="ben-list-status">목록 필터</label>
            <select
              id="ben-list-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">전체</option>
              <option value="applying">{WELFARE_TRACKING_LABELS.applying}만</option>
              <option value="excluded">{WELFARE_TRACKING_LABELS.excluded}만</option>
              <option value="later">{WELFARE_TRACKING_LABELS.later}만</option>
            </select>
          </div>
          <p className="muted" style={{ margin: '8px 0 0', fontSize: '0.82rem' }}>
            「{WELFARE_TRACKING_LABELS.later}만」은 잠깐 미뤄 둔 항목만 모아 봅니다. 제외 사유는 상세에서
            적을 수 있습니다.
          </p>
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
      </div>
      <div className="stack">
        {filtered.map((w) => {
          const entry = memberId
            ? findWelfareTracking(state.welfareTracking, memberId, w.id)
            : undefined;
          return (
            <div key={w.id} className="card">
              <Link to={`/benefits/${w.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h3 style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                  {w.title}
                  {isWelfareEffectivelyExpired(w) && (
                    <span className="score-pill" title="기간 종료 또는 만료로 표시된 항목">
                      종료
                    </span>
                  )}
                  {entry && <WelfareStatusPill status={entry.status} />}
                </h3>
                <p>
                  {w.region.join(', ')} · {w.benefit}
                </p>
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
