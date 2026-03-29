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
        ? d.label === '상시·연중'
          ? '접수기간·마감은 기관 공고'
          : '기관 공고에서 기간 확인'
        : showSubline && d.urgency === 'unknown'
          ? '기간 문구를 날짜로 읽지 못함'
          : null;

  return (
    <span
      className={cls}
      title={
        record.period?.trim()
          ? record.period
          : '카탈로그에 신청 마감일이 없습니다. 버튼으로 기관 공고를 확인하세요.'
      }
    >
      <span className="app-dday__label">{d.label}</span>
      {sub && <span className="app-dday__sub">{sub}</span>}
    </span>
  );
}
