import { useEffect, useMemo, useState } from 'react';
import type { WelfareRecord } from '@/types/benefit';
import { useFamily } from '@/context/FamilyContext';
import { getEffectiveProfile } from '@/core/family/effectiveProfile';
import {
  deriveAutoExcludeReason,
  findWelfareTracking,
  removeWelfareTracking,
  upsertWelfareTracking,
} from '@/core/family/welfareTracking';
import { WELFARE_TRACKING_LABELS, type WelfareTrackingStatus } from '@/types/welfareTracking';

type Props = {
  welfare: WelfareRecord;
  memberId: string;
};

export function WelfareStatusControls({ welfare, memberId }: Props) {
  const { state, updateState } = useFamily();
  const entry = useMemo(
    () => findWelfareTracking(state.welfareTracking, memberId, welfare.id),
    [state.welfareTracking, memberId, welfare.id]
  );

  const [excludeDraft, setExcludeDraft] = useState(entry?.excludeReason ?? '');
  const [linkProfile, setLinkProfile] = useState(!!entry?.excludeFromProfileTags);

  useEffect(() => {
    setExcludeDraft(entry?.excludeReason ?? '');
    setLinkProfile(!!entry?.excludeFromProfileTags);
  }, [entry?.excludeReason, entry?.excludeFromProfileTags, entry?.status]);

  const member = state.members.find((m) => m.id === memberId);

  const applyPatch = (patch: {
    status: WelfareTrackingStatus;
    excludeReason?: string;
    excludeFromProfileTags?: boolean;
  }) => {
    updateState((prev) => ({
      ...prev,
      welfareTracking: upsertWelfareTracking(prev.welfareTracking, {
        memberId,
        welfareId: welfare.id,
        status: patch.status,
        excludeReason: patch.status === 'excluded' ? patch.excludeReason : undefined,
        excludeFromProfileTags:
          patch.status === 'excluded' ? patch.excludeFromProfileTags : undefined,
      }),
    }));
  };

  const setApplying = () => applyPatch({ status: 'applying' });
  const setLater = () => applyPatch({ status: 'later' });

  const setExcluded = (reason: string, fromProfile: boolean) => {
    applyPatch({
      status: 'excluded',
      excludeReason: reason,
      excludeFromProfileTags: fromProfile,
    });
  };

  const refreshExcludeFromProfile = () => {
    if (!member) return;
    const eff = getEffectiveProfile(member, state.household);
    const reason = deriveAutoExcludeReason(welfare, eff);
    setExcludeDraft(reason);
    setExcluded(reason, true);
  };

  const clearStatus = () => {
    updateState((prev) => ({
      ...prev,
      welfareTracking: removeWelfareTracking(prev.welfareTracking, memberId, welfare.id),
    }));
  };

  if (!member) {
    return <p className="muted" style={{ fontSize: '0.88rem' }}>구성원을 선택하세요.</p>;
  }

  return (
    <div>
      <p className="muted" style={{ marginTop: 0, marginBottom: 8, fontSize: '0.88rem' }}>
        <strong>{member.displayName}</strong> 기준으로 집에서 같이 볼 수 있게 표시합니다. 「
        {WELFARE_TRACKING_LABELS.later}」는 잠깐 미뤄 두었다는 뜻입니다.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        <button type="button" className="btn secondary" onClick={clearStatus} disabled={!entry}>
          표시 안 함
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={setApplying}
          data-active={entry?.status === 'applying' ? 'true' : 'false'}
        >
          {WELFARE_TRACKING_LABELS.applying}
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={() => {
            const eff = getEffectiveProfile(member, state.household);
            const r = linkProfile ? deriveAutoExcludeReason(welfare, eff) : excludeDraft.trim() || '제외함';
            setExcluded(r, linkProfile);
          }}
          data-active={entry?.status === 'excluded' ? 'true' : 'false'}
        >
          {WELFARE_TRACKING_LABELS.excluded}
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={setLater}
          data-active={entry?.status === 'later' ? 'true' : 'false'}
        >
          {WELFARE_TRACKING_LABELS.later}
        </button>
      </div>

      {entry?.status === 'excluded' && (
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor={`ex-reason-${welfare.id}`}>제외 사유 (가족이 나중에 봐도 이해할 수 있게)</label>
          <textarea
            id={`ex-reason-${welfare.id}`}
            rows={3}
            value={excludeDraft}
            onChange={(e) => setExcludeDraft(e.target.value)}
            onBlur={() => {
              if (entry?.status === 'excluded' && !linkProfile && excludeDraft !== entry.excludeReason) {
                setExcluded(excludeDraft.trim(), false);
              }
            }}
            placeholder="예: 이미 다른 지원 받는 중, 대상 아님"
          />
          <label className="field-row" style={{ marginTop: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              className="input-checkbox"
              checked={linkProfile}
              onChange={(e) => {
                const v = e.target.checked;
                setLinkProfile(v);
                if (v) {
                  const eff = getEffectiveProfile(member, state.household);
                  const r = deriveAutoExcludeReason(welfare, eff);
                  setExcludeDraft(r);
                  if (entry?.status === 'excluded') setExcluded(r, true);
                } else if (entry?.status === 'excluded') {
                  setExcluded(excludeDraft.trim(), false);
                }
              }}
            />
            <span className="muted" style={{ fontSize: '0.88rem' }}>
              프로필의 <strong>제외 태그</strong>와 이 항목을 맞춰 사유를 자동으로 갱신합니다 (프로필을 바꾸면
              여기 문구도 따라갑니다).
            </span>
          </label>
          {linkProfile && (
            <button type="button" className="btn ghost btn--compact" style={{ marginTop: 8 }} onClick={refreshExcludeFromProfile}>
              지금 프로필 기준으로 다시 쓰기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Read-only pill for cards */
/** Dropdown for list / 추천 cards (제외 시 기본 문구만; 상세에서 사유 수정). */
export function WelfareStatusQuickSelect({ welfare, memberId }: Props) {
  const { state, updateState } = useFamily();
  const member = state.members.find((m) => m.id === memberId);
  const entry = findWelfareTracking(state.welfareTracking, memberId, welfare.id);
  const val = entry?.status ?? '';

  if (!member) return null;

  const setVal = (status: string) => {
    updateState((prev) => {
      const m = prev.members.find((x) => x.id === memberId);
      if (!m) return prev;
      if (status === '') {
        return {
          ...prev,
          welfareTracking: removeWelfareTracking(prev.welfareTracking, memberId, welfare.id),
        };
      }
      if (status === 'excluded') {
        const eff = getEffectiveProfile(m, prev.household);
        const reason = deriveAutoExcludeReason(welfare, eff);
        return {
          ...prev,
          welfareTracking: upsertWelfareTracking(prev.welfareTracking, {
            memberId,
            welfareId: welfare.id,
            status: 'excluded',
            excludeReason: reason,
            excludeFromProfileTags: true,
          }),
        };
      }
      return {
        ...prev,
        welfareTracking: upsertWelfareTracking(prev.welfareTracking, {
          memberId,
          welfareId: welfare.id,
          status: status as WelfareTrackingStatus,
        }),
      };
    });
  };

  return (
    <select
      className="welfare-status-select"
      aria-label={`${welfare.title} 진행 상태`}
      value={val}
      onChange={(e) => setVal(e.target.value)}
    >
      <option value="">상태 없음</option>
      <option value="applying">{WELFARE_TRACKING_LABELS.applying}</option>
      <option value="excluded">{WELFARE_TRACKING_LABELS.excluded}</option>
      <option value="later">{WELFARE_TRACKING_LABELS.later}</option>
    </select>
  );
}

export function WelfareStatusPill({
  status,
}: {
  status: WelfareTrackingStatus;
}) {
  const label = WELFARE_TRACKING_LABELS[status];
  const cls =
    status === 'applying'
      ? 'welfare-track-pill welfare-track-pill--applying'
      : status === 'excluded'
        ? 'welfare-track-pill welfare-track-pill--excluded'
        : 'welfare-track-pill welfare-track-pill--later';
  return <span className={cls}>{label}</span>;
}
