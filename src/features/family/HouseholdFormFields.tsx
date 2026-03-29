import type { RegionCatalog } from '@/types/regionCatalog';
import type { HouseholdDefaults } from '@/types/household';
import { INCOME_CHOICES } from '@/features/family/formConstants';
import { sortedSidoList } from '@/features/family/useRegionCatalog';

type Props = {
  value: HouseholdDefaults;
  onChange: (next: HouseholdDefaults) => void;
  catalog: RegionCatalog | null;
  /** When false, only sido/sigungu (e.g. loading). */
  enabled?: boolean;
  incomeIdPrefix?: string;
};

export function HouseholdFormFields({
  value,
  onChange,
  catalog,
  enabled = true,
  incomeIdPrefix = 'hh',
}: Props) {
  const sigunguList =
    value.sido && value.sido !== '전국' && catalog?.sidoSigungu[value.sido]
      ? catalog.sidoSigungu[value.sido]
      : [];
  const sidoList = catalog ? sortedSidoList(catalog.sidoSigungu) : ['경기도', '서울특별시'];

  return (
    <>
      <div className="field">
        <label htmlFor={`${incomeIdPrefix}-sido`}>시·도</label>
        <select
          id={`${incomeIdPrefix}-sido`}
          disabled={!enabled}
          value={value.sido}
          onChange={(e) => {
            const sido = e.target.value;
            onChange({ ...value, sido, sigungu: '' });
          }}
        >
          <option value="">선택</option>
          <option value="전국">전국 (태그만)</option>
          {sidoList.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {value.sido && value.sido !== '전국' && (
        <div className="field">
          <label htmlFor={`${incomeIdPrefix}-sigungu`}>시·군·구</label>
          <select
            id={`${incomeIdPrefix}-sigungu`}
            disabled={!enabled || sigunguList.length === 0}
            value={value.sigungu}
            onChange={(e) => onChange({ ...value, sigungu: e.target.value })}
          >
            <option value="">선택</option>
            {sigunguList.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="field">
        <label htmlFor={`${incomeIdPrefix}-income`}>가구 소득 구간</label>
        <select
          id={`${incomeIdPrefix}-income`}
          disabled={!enabled}
          value={value.incomeBand}
          onChange={(e) => onChange({ ...value, incomeBand: e.target.value })}
        >
          {INCOME_CHOICES.map((c) => (
            <option key={c.value || 'empty'} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${incomeIdPrefix}-memo`}>가구 참고 연소득 (만 원, 선택)</label>
        <input
          id={`${incomeIdPrefix}-memo`}
          disabled={!enabled}
          inputMode="numeric"
          placeholder="예: 4800"
          value={value.annualIncomeMemoManwon}
          onChange={(e) =>
            onChange({ ...value, annualIncomeMemoManwon: e.target.value.replace(/\D/g, '') })
          }
        />
      </div>
    </>
  );
}
