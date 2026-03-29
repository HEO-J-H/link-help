import type { WelfareRecord } from '@/types/benefit';
import type { FamilyMember } from '@/types/family';
import type { HouseholdDefaults } from '@/types/household';
import type { MemberProfile } from '@/types/family';
import { getEffectiveProfile } from '@/core/family/effectiveProfile';
import { memberExcludeTags } from '@/core/filter/filterEngine';
import type { WelfareTrackingEntry, WelfareTrackingStatus } from '@/types/welfareTracking';

export function findWelfareTracking(
  entries: WelfareTrackingEntry[],
  memberId: string,
  welfareId: string
): WelfareTrackingEntry | undefined {
  return entries.find((e) => e.memberId === memberId && e.welfareId === welfareId);
}

/** Overwrite or append one entry (same member+welfare). Clears exclude fields when not `excluded`. */
export function upsertWelfareTracking(
  entries: WelfareTrackingEntry[],
  next: Omit<WelfareTrackingEntry, 'updatedAt'> & { updatedAt?: string }
): WelfareTrackingEntry[] {
  const updatedAt = next.updatedAt ?? new Date().toISOString();
  const row: WelfareTrackingEntry = {
    memberId: next.memberId,
    welfareId: next.welfareId,
    status: next.status,
    updatedAt,
  };
  if (next.status === 'excluded') {
    row.excludeReason = next.excludeReason;
    row.excludeFromProfileTags = next.excludeFromProfileTags;
  }
  const rest = entries.filter((e) => !(e.memberId === row.memberId && e.welfareId === row.welfareId));
  return [...rest, row];
}

export function removeWelfareTracking(
  entries: WelfareTrackingEntry[],
  memberId: string,
  welfareId: string
): WelfareTrackingEntry[] {
  return entries.filter((e) => !(e.memberId === memberId && e.welfareId === welfareId));
}

/** Which welfare tags (or title/description hits) intersect profile exclude tags. */
export function deriveAutoExcludeReason(w: WelfareRecord, profile: MemberProfile): string {
  const ex = memberExcludeTags(profile);
  if (ex.size === 0) return '프로필에 제외 태그가 없습니다. 아래에 직접 사유를 적어 주세요.';

  const hits: string[] = [];
  const hayTitle = `${w.title} ${w.description}`.toLowerCase();
  for (const tag of ex) {
    const t = tag.trim();
    if (!t) continue;
    if (w.tags.some((wt) => wt === t)) hits.push(`태그「${t}」`);
    else if (hayTitle.includes(t.toLowerCase())) hits.push(`글에「${t}」`);
  }
  if (hits.length === 0) {
    return `프로필 제외 태그(${[...ex].join(', ')})와 이 항목 태그·제목이 직접 겹치지 않습니다. 필요하면 사유를 직접 수정하세요.`;
  }
  return `프로필 제외 설정과 맞춰 본 항목: ${hits.join(', ')}`;
}

export function refreshAutoExcludeReasons(
  entries: WelfareTrackingEntry[],
  members: FamilyMember[],
  household: HouseholdDefaults,
  list: WelfareRecord[]
): WelfareTrackingEntry[] {
  const byId = new Map(list.map((x) => [x.id, x]));
  return entries.map((e) => {
    if (e.status !== 'excluded' || !e.excludeFromProfileTags) return e;
    const m = members.find((x) => x.id === e.memberId);
    const w = byId.get(e.welfareId);
    if (!m || !w) return e;
    const eff = getEffectiveProfile(m, household);
    const reason = deriveAutoExcludeReason(w, eff);
    if (reason === e.excludeReason) return e;
    return { ...e, excludeReason: reason, updatedAt: new Date().toISOString() };
  });
}

export function welfareIdsForMemberStatus(
  entries: WelfareTrackingEntry[],
  memberId: string,
  status: WelfareTrackingStatus
): Set<string> {
  return new Set(
    entries.filter((e) => e.memberId === memberId && e.status === status).map((e) => e.welfareId)
  );
}

/** Strip entries for removed members (defensive). */
export function pruneWelfareTrackingForMembers(
  entries: WelfareTrackingEntry[],
  memberIds: Set<string>
): WelfareTrackingEntry[] {
  return entries.filter((e) => memberIds.has(e.memberId));
}

export function normalizeWelfareTrackingRaw(raw: unknown): WelfareTrackingEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: WelfareTrackingEntry[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    const memberId = typeof o.memberId === 'string' ? o.memberId : '';
    const welfareId = typeof o.welfareId === 'string' ? o.welfareId : '';
    const status = o.status;
    if (!memberId || !welfareId) continue;
    if (status !== 'applying' && status !== 'excluded' && status !== 'later') continue;
    out.push({
      memberId,
      welfareId,
      status,
      excludeReason: typeof o.excludeReason === 'string' ? o.excludeReason : undefined,
      excludeFromProfileTags:
        typeof o.excludeFromProfileTags === 'boolean' ? o.excludeFromProfileTags : undefined,
      updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : new Date().toISOString(),
    });
  }
  return out;
}

