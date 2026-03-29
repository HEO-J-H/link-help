import { useRef } from 'react';
import { useFamily } from '@/context/FamilyContext';
import { exportFamilyJson, parseFamilyImportJson } from '@/core/storage/exportImport';
import { initialFamilyState } from '@/core/family/familyManager';

export function SettingsPage() {
  const { state, setState } = useFamily();
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const blob = new Blob([exportFamilyJson(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `link-help-family-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const next = parseFamilyImportJson(text);
      setState(next);
      alert('가족 데이터를 불러왔습니다.');
    } catch {
      alert('파일 형식이 올바르지 않습니다.');
    }
  };

  const reset = () => {
    if (window.confirm('로컬에 저장된 가족 데이터를 초기화할까요?')) {
      setState(initialFamilyState());
    }
  };

  const requestNotify = async () => {
    if (typeof Notification === 'undefined') {
      alert('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }
    const p = await Notification.requestPermission();
    if (p === 'granted') {
      setState({
        ...state,
        appSettings: { ...state.appSettings, browserNotifications: true },
      });
      alert('브라우저 알림이 허용되었습니다.');
    } else {
      alert('알림이 거부되었습니다. 브라우저 설정에서 사이트 알림을 허용할 수 있습니다.');
    }
  };

  const toggleNotify = () => {
    setState({
      ...state,
      appSettings: {
        ...state.appSettings,
        browserNotifications: !state.appSettings.browserNotifications,
      },
    });
  };

  return (
    <div>
      <h1 className="page-title">설정</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        가족·보험·알림 데이터는 브라우저 IndexedDB에만 저장됩니다. 예전 버전(localStorage)은 첫
        실행 시 자동으로 옮겨집니다. 백업은 JSON보내기를 사용하세요.
      </p>

      <h2 style={{ fontSize: '1.1rem', margin: '0 0 10px' }}>알림</h2>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="field-row" style={{ marginBottom: 12 }}>
          <input
            id="set-notify"
            type="checkbox"
            checked={state.appSettings.browserNotifications}
            onChange={toggleNotify}
          />
          <label htmlFor="set-notify">브라우저 알림 사용 (예정 시각에 표시)</label>
        </div>
        <button type="button" className="btn secondary" style={{ width: '100%' }} onClick={requestNotify}>
          알림 권한 요청
        </button>
        <p className="muted" style={{ marginTop: 10, marginBottom: 0, fontSize: '0.88rem' }}>
          알림은 앱이 열려 있을 때 주기적으로 확인합니다. OS·브라우저 설정도 확인하세요.
        </p>
      </div>

      <h2 style={{ fontSize: '1.1rem', margin: '0 0 10px' }}>연동 (예약)</h2>
      <div className="field" style={{ marginBottom: 20 }}>
        <label htmlFor="api-base">동기화/API 베이스 URL</label>
        <input
          id="api-base"
          value={state.appSettings.syncApiBaseUrl}
          onChange={(e) =>
            setState({
              ...state,
              appSettings: { ...state.appSettings, syncApiBaseUrl: e.target.value },
            })
          }
          placeholder="비워 두면 사용 안 함"
          autoComplete="off"
        />
        <p className="muted" style={{ marginTop: 8, marginBottom: 0, fontSize: '0.88rem' }}>
          향후 서버·AI 연동용 필드입니다. 현재 요청은 전송하지 않습니다.
        </p>
      </div>

      <div className="stack">
        <button type="button" className="btn" style={{ width: '100%' }} onClick={download}>
          가족 정보보내기 (JSON)
        </button>
        <button
          type="button"
          className="btn secondary"
          style={{ width: '100%' }}
          onClick={() => fileRef.current?.click()}
        >
          가족 정보 불러오기
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={onFile}
        />
        <button type="button" className="btn secondary" style={{ width: '100%' }} onClick={reset}>
          데이터 초기화
        </button>
      </div>

      <p className="muted" style={{ marginTop: 24, fontSize: '0.85rem' }}>
        빌드 후 서비스 워커가 앱과 <code>welfare-db</code> JSON을 캐시해 오프라인에서도 열 수 있습니다.
        복지 원본은 <code>public/welfare-db</code>입니다.
      </p>
    </div>
  );
}
