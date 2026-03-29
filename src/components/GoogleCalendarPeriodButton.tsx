import type { CSSProperties } from 'react';
import type { WelfareRecord } from '@/types/benefit';
import { googleCalendarUrlForApplicationPeriod } from '@/core/calendar/googleCalendar';

type Props = {
  record: WelfareRecord;
  className?: string;
  style?: CSSProperties;
  label?: string;
};

export function GoogleCalendarPeriodButton({
  record,
  className = 'btn secondary',
  style,
  label = 'Google 캘린더에 신청 기간 추가',
}: Props) {
  const href = googleCalendarUrlForApplicationPeriod(record);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
    >
      {label}
    </a>
  );
}
