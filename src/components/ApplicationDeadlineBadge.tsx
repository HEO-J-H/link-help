import type { WelfareRecord } from '@/types/benefit';
import { getApplicationDDay } from '@/core/welfare/applicationDDay';

type Props = {
  record: WelfareRecord;
  className?: string;
  /** Extra detail under label, e.g. "12일 남음" */
  showSubline?: boolean;
};

const urgencyClass: Record<string, string> = {
  ended: 'app-dday app-dday--ended',
  urgent: 'app-dday app-dday--urgent',
  soon: 'app-dday app-dday--soon',
  steady: 'app-dday app-dday--steady',
  ongoing: 'app-dday app-dday--ongoing',
  unknown: 'app-dday app-dday--unknown',
};

export function ApplicationDeadlineBadge({ record, className = '', showSubline }: Props) {
  const d = getApplicationDDay(record);
  const cls = `${urgencyClass[d.urgency] ?? urgencyClass.unknown} ${className}`.trim();
  const sub =
    showSubline && d.daysLeft !== null && d.daysLeft >= 0
      ? `${d.daysLeft}일 남음`
      : showSubline && d.urgency === 'ongoing'
        ? '별도 마감 확인'
        : null;

  return (
    <span className={cls} title={record.period || undefined}>
      <span className="app-dday__label">{d.label}</span>
      {sub && <span className="app-dday__sub">{sub}</span>}
    </span>
  );
}
