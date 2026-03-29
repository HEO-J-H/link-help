import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { exportFamilyJson, parseFamilyImportJson } from '@/core/storage/exportImport';
import { emptySessionFamilyState } from '@/core/family/familyManager';
import { RemindersPanel } from '@/features/settings/RemindersPanel';

export function SettingsPage() {
  const { state, setState } = useFamily();
  const fileRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.hash !== '#reminders') return;
    const t = window.setTimeout(() => {
      document.getElementById('settings-reminders')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(t);
  }, [location.hash, location.pathname]);

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
      alert('불러왔습니다.');
    } catch {
      alert('파일 형식을 확인해 주세요.');
    }
  };

  const reset = () => {
    if (window.confirm('이 탭에 저장된 가족 데이터를 지울까요?')) {
      setState(emptySessionFamilyState());
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

      <details className="settings-hint-details">
        <summary>데이터는 어디에 저장되나요?</summary>
        <p className="muted" style={{ margin: '10px 0 0', fontSize: '0.88rem', lineHeight: 1.55 }}>
          이 탭이 열려 있는 동안만 브라우저에 보관됩니다. 창을 닫으면 비워지므로 필요하면{' '}
          <strong>보내기</strong>로 파일을 남겨 두세요.
        </p>
      </details>

      <div className="settings-hub" style={{ marginTop: 16 }}>
        <button type="button" className="settings-hub__tile btn" onClick={download}>
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
        <button type="button" className="settings-hub__tile btn secondary" onClick={reset}>
          <span className="settings-hub__emoji" aria-hidden>
            🗑️
          </span>
          <span className="settings-hub__label">초기화</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={onFile}
        />
      </div>

      <section id="settings-alerts" className="settings-section" style={{ marginTop: 24 }}>
        <h2 className="settings-section__h">
          <span className="settings-section__icon" aria-hidden>
            🔔
          </span>
          브라우저 알림
        </h2>
        <div className="card settings-alert-card">
          <label className="settings-toggle-row">
            <input
              type="checkbox"
              className="input-checkbox"
              checked={state.appSettings.browserNotifications}
              onChange={toggleNotify}
            />
            <span>예정 시각에 알림 켜기</span>
          </label>
          <button type="button" className="btn secondary" style={{ width: '100%', marginTop: 12 }} onClick={requestNotify}>
            권한 요청
          </button>
        </div>
      </section>

      <section id="settings-reminders" className="settings-section" style={{ marginTop: 24 }}>
        <h2 className="settings-section__h">
          <span className="settings-section__icon" aria-hidden>
            📋
          </span>
          예정 알림 목록
        </h2>
        <div className="card">
          <RemindersPanel />
        </div>
        <p className="muted" style={{ marginTop: 10, fontSize: '0.82rem' }}>
          Google 캘린더는 혜택·추천 카드의 버튼으로 넣을 수 있어요.
        </p>
      </section>

      <section className="settings-section" style={{ marginTop: 28 }}>
        <h2 className="settings-section__h">
          <span className="settings-section__icon" aria-hidden>
            ℹ️
          </span>
          안내
        </h2>
        <div className="settings-link-grid">
          <Link to="/about" className="settings-link-tile">
            <span aria-hidden>📖</span>
            <span>서비스 안내</span>
          </Link>
          <Link to="/legal/disclaimer" className="settings-link-tile">
            <span aria-hidden>⚖️</span>
            <span>면책</span>
          </Link>
          <Link to="/legal/privacy" className="settings-link-tile">
            <span aria-hidden>🔒</span>
            <span>개인정보</span>
          </Link>
          <Link to="/legal/terms" className="settings-link-tile">
            <span aria-hidden>📜</span>
            <span>약관</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
