import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { exportFamilyJson, parseFamilyImportJson } from '@/core/storage/exportImport';
import { initialFamilyState } from '@/core/family/familyManager';
import { postPushSubscription, subscribeWebPush, unsubscribeWebPush } from '@/core/push/pushClient';

export function SettingsPage() {
  const { state, setState, updateState } = useFamily();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pushBusy, setPushBusy] = useState(false);

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

  const registerPush = async () => {
    const base = state.appSettings.syncApiBaseUrl.trim();
    if (!base) {
      alert('먼저 아래에 API 베이스 URL(예: http://localhost:8787)을 입력하세요.');
      return;
    }
    if (!('serviceWorker' in navigator)) {
      alert('이 환경에서는 서비스 워커를 사용할 수 없습니다. 빌드 미리보기(HTTPS 또는 localhost)에서 시도하세요.');
      return;
    }
    setPushBusy(true);
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
        alert('알림 권한이 필요합니다.');
        return;
      }
      await navigator.serviceWorker.ready;
      const sub = await subscribeWebPush();
      const json = JSON.stringify(sub.toJSON());
      await postPushSubscription(base, sub);
      updateState((prev) => ({
        ...prev,
        appSettings: {
          ...prev.appSettings,
          pushSubscriptionJson: json,
          browserNotifications: true,
        },
      }));
      alert('푸시 구독이 등록되었습니다. 서버에서 테스트 발송을 할 수 있습니다.');
    } catch (e) {
      alert(e instanceof Error ? e.message : '푸시 구독에 실패했습니다.');
    } finally {
      setPushBusy(false);
    }
  };

  const clearPush = async () => {
    setPushBusy(true);
    try {
      await unsubscribeWebPush();
      updateState((prev) => ({
        ...prev,
        appSettings: {
          ...prev.appSettings,
          pushSubscriptionJson: undefined,
        },
      }));
    } catch {
      /* ignore */
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">설정</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        가족·알림 데이터는 브라우저 IndexedDB에만 저장됩니다. 예전 버전(localStorage)은 첫
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
          예약 알림은 앱이 열려 있을 때 주기적으로 확인합니다. 앱을 닫아도 받으려면 아래 Web Push를 사용하세요.
        </p>
        <button
          type="button"
          className="btn secondary"
          style={{ width: '100%', marginTop: 12 }}
          disabled={pushBusy}
          onClick={registerPush}
        >
          {pushBusy ? '처리 중…' : 'Web Push 구독 (서버 등록)'}
        </button>
        <button
          type="button"
          className="btn ghost"
          style={{ width: '100%', marginTop: 8, border: '1px solid var(--color-border)' }}
          disabled={pushBusy}
          onClick={clearPush}
        >
          푸시 구독 해제
        </button>
        {state.appSettings.pushSubscriptionJson && (
          <p className="muted" style={{ marginTop: 8, marginBottom: 0, fontSize: '0.85rem' }}>
            구독 정보가 저장되어 있습니다. 서비스 워커가 푸시 페이로드를 알림으로 표시합니다.
          </p>
        )}
      </div>

      <h2 style={{ fontSize: '1.1rem', margin: '0 0 10px' }}>원격 API</h2>
      <div className="field" style={{ marginBottom: 20 }}>
        <label htmlFor="api-base">API 베이스 URL</label>
        <input
          id="api-base"
          value={state.appSettings.syncApiBaseUrl}
          onChange={(e) =>
            setState({
              ...state,
              appSettings: { ...state.appSettings, syncApiBaseUrl: e.target.value },
            })
          }
          placeholder="예: http://localhost:8787"
          autoComplete="off"
        />
        <p className="muted" style={{ marginTop: 8, marginBottom: 0, fontSize: '0.88rem' }}>
          설정 시 <code>GET …/welfare</code>로 원격 복지 목록을 불러와 로컬 JSON과 병합합니다. 푸시 구독은{' '}
          <code>POST …/push/subscribe</code>로 전송됩니다. 데모 서버: <code>npm run server:demo</code>
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

      <h2 style={{ fontSize: '1.1rem', margin: '28px 0 10px' }}>안내 및 법적 고지</h2>
      <div className="card">
        <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.7 }}>
          <li>
            <Link to="/about">서비스 안내 · 데이터 저장 위치 · 향후 계획</Link>
          </li>
          <li>
            <Link to="/legal/disclaimer">면책 · 복지 정보 정확성</Link>
          </li>
          <li>
            <Link to="/legal/privacy">개인정보 처리 안내</Link>
          </li>
          <li>
            <Link to="/legal/terms">이용약관</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
