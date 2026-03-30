import type { WelfareRecord } from '@/types/benefit';

type Props = {
  record: WelfareRecord;
  /** Profile-derived tags to mark as matching catalog tags. Null = no highlight. */
  profileDerived: Set<string> | null;
  className?: string;
};

/** Renders welfare row tags with visual emphasis when they overlap the active profile. */
export function WelfareTagChips({ record, profileDerived, className = '' }: Props) {
  const tags = record.tags ?? [];
  if (tags.length === 0) return null;
  return (
    <span className={`welfare-tag-chips ${className}`.trim()} role="list">
      {tags.map((t, i) => {
        const match = profileDerived?.has(t) ?? false;
        return (
          <span
            key={`${record.id}-${t}-${i}`}
            role="listitem"
            className={`welfare-tag-chip${match ? ' welfare-tag-chip--match' : ''}`}
            title={match ? '내 프로필 연관 태그와 일치' : undefined}
          >
            {t}
          </span>
        );
      })}
    </span>
  );
}
