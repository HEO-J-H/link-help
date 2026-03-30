import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { formatDateKR } from '@/utils/format';
import { getEffectiveProfile } from '@/core/family/effectiveProfile';
import { HouseholdFormFields } from '@/features/family/HouseholdFormFields';
import { useRegionCatalog } from '@/features/family/useRegionCatalog';
import { exportFamilyJson, parseFamilyImportJson } from '@/core/storage/exportImport';
import { emptySessionFamilyState } from '@/core/family/familyManager';
import { saveFamilyLocalBackup, clearFamilyLocalBackup } from '@/core/storage/familyLocalBackup';
import { FAMILY_SAVE_NUDGE_SESSION_KEY } from '@/core/storage/localStorageKeys';
import { shouldSuggestFamilyBackup } from '@/core/family/familyBackupNudge';
const relLabel: Record<string, string> = {
  self: '본인',
  spouse: '배우자',
  child: '자녀',
  parent: '부모',
  other: '기타',
};

export function FamilyPage() {
  const { state, setState, addMember, updateState } = useFamily();
  const catalog = useRegionCatalog();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saveNudgeVisible, setSaveNudgeVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(FAMILY_SAVE_NUDGE_SESSION_KEY)) return;
    } catch {
      return;
    }
    setSaveNudgeVisible(shouldSuggestFamilyBackup(state));
  }, [state]);

  const dismissSaveNudge = () => {
    try {
      sessionStorage.setItem(FAMILY_SAVE_NUDGE_SESSION_KEY, '1');
    } catch {
      /* ignore */
    }
    setSaveNudgeVisible(false);
  };

  const downloadJson = () => {
    const blob = new Blob([exportFamilyJson(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `link-help-family-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    saveFamilyLocalBackup(state);
    dismissSaveNudge();
  };

  const saveBrowserBackupOnly = () => {
    const ok = saveFamilyLocalBackup(state);
    window.alert(
      ok
        ? '이 브라우저에 백업해 두었습니다. 다음에 새 탭에서 열면 복원할지 물어봅니다.'
        : '브라우저 저장에 실패했습니다. JSON 파일로 내려받기를 이용해 주세요.',
    );
    dismissSaveNudge();
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const next = parseFamilyImportJson(text);
      setState(next);
      saveFamilyLocalBackup(next);
      window.alert('불러왔습니다. 브라우저 백업도 갱신했습니다.');
    } catch {
      window.alert('파일 형식을 확인해 주세요.');
    }
  };

  const resetFamily = () => {
    if (
      window.confirm(
        '이 탭의 가족 데이터를 모두 지울까요?\n\n브라우저에만 있던 백업도 함께 삭제합니다. JSON 파일은 그대로입니다.',
      )
    ) {
      clearFamilyLocalBackup();
      setState(emptySessionFamilyState());
    }
  };

  return (
    <div>
      <h1 className="page-title">가족</h1>
      <div className="page-lead card card--soft">
        <p>
          <strong>가구 기본 정보</strong>(지역·소득)은 구성원 전체가 함께 쓰는 값입니다. 구성원 프로필에서 「가구와
          동일」을 켜 두면 혜택·복지찾기에 이 값이 반영됩니다.
        </p>
        <p>
          <strong>데이터는 이 탭 세션에만</strong> 유지됩니다. 탭을 닫기 전에 아래에서 JSON으로 내려받거나 브라우저
          백업을 해 두세요.
        </p>
      </div>

      {saveNudgeVisible && (
        <div
          className="card"
          style={{
            marginBottom: 16,
            border: '1px solid rgba(79, 140, 255, 0.45)',
            background: 'rgba(79, 140, 255, 0.08)',
          }}
        >
          <p style={{ margin: '0 0 10px', fontWeight: 600 }}>입력이 꽤 채워졌어요</p>
          <p className="muted" style={{ margin: '0 0 12px', fontSize: '0.9rem', lineHeight: 1.5 }}>
            탭을 닫기 전에 파일로 저장해 두면 다른 기기나 나중에 같은 브라우저에서도 복구하기 쉽습니다.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" className="btn" onClick={downloadJson}>
              JSON 파일로 저장
            </button>
            <button type="button" className="btn secondary" onClick={saveBrowserBackupOnly}>
              브라우저에만 백업
            </button>
            <button type="button" className="btn secondary" onClick={dismissSaveNudge}>
              나중에
            </button>
          </div>
        </div>
      )}

      <div className="settings-hub" style={{ marginBottom: 16 }}>
        <button type="button" className="settings-hub__tile btn" onClick={downloadJson}>
          <span className="settings-hub__emoji" aria-hidden>
            💾
          </span>
          <span className="settings-hub__label">가족 데이터 보내기</span>
        </button>
        <button type="button" className="settings-hub__tile btn secondary" onClick={() => fileRef.current?.click()}>
          <span className="settings-hub__emoji" aria-hidden>
            📂
          </span>
          <span className="settings-hub__label">파일에서 불러오기</span>
        </button>
        <button type="button" className="settings-hub__tile btn secondary" onClick={resetFamily}>
          <span className="settings-hub__emoji" aria-hidden>
            🗑️
          </span>
          <span className="settings-hub__label">가족 데이터 초기화</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={onImportFile}
        />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>가구 기본 — 지역·소득</h2>
        <p className="field-hint" style={{ marginTop: 0 }}>
          시·도와 시·군·구를 고르면 복지 태그(예: 경기도, 용인시)가 둘 다 잡힙니다. 테스트할 때는{' '}
          <strong>경기도 → 용인시</strong>처럼 번들 복지 데이터와 맞춰 보세요.
        </p>
        <HouseholdFormFields
          catalog={catalog}
          enabled={catalog !== null}
          value={state.household}
          incomeIdPrefix="fam"
          onChange={(household) => updateState((prev) => ({ ...prev, household }))}
        />
      </div>

      {state.members.length === 0 && (
        <p className="muted" style={{ marginBottom: 14, fontSize: '0.92rem' }}>
          아직 구성원이 없습니다. 아래에서 추가하거나, 위의 <strong>파일에서 불러오기</strong>로 JSON을 넣으면
          이전 입력을 복원할 수 있습니다.
        </p>
      )}
      <div className="link-card-row">
        <p>
          <Link to="/start" className="text-link">
            빠른 시작
          </Link>
          {' · '}
          <Link to="/settings" className="text-link">
            설정
          </Link>{' '}
          <span className="muted">(알림·약관)</span>
        </p>
      </div>
      <div className="stack">
        {state.members.map((m) => {
          const eff = getEffectiveProfile(m, state.household);
          return (
            <Link key={m.id} to={`/family/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    className="member-color-dot member-color-dot--lg"
                    style={{ backgroundColor: m.memberColor }}
                    title="표시 색"
                    aria-hidden
                  />
                  {m.displayName}{' '}
                  <span className="muted" style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                    ({relLabel[m.relationship]})
                  </span>
                </h3>
                <p>
                  {eff.region || '지역 미입력'} ·{' '}
                  {m.profile.birthDate ? formatDateKR(m.profile.birthDate) : '생년월일 미입력'}
                </p>
                {!m.profile.useHouseholdRegionIncome && (
                  <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
                    이 구성원은 가구와 다른 지역·소득을 씁니다.
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      <button
        type="button"
        className="btn secondary"
        style={{ width: '100%', marginTop: 16 }}
        onClick={() => {
          const name = window.prompt('구성원 이름', '새 구성원');
          if (name?.trim()) addMember(name.trim());
        }}
      >
        구성원 추가
      </button>
    </div>
  );
}
