import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { RemindersPanel } from '@/features/settings/RemindersPanel';

export function SettingsPage() {
  const { state, setState } = useFamily();
  const location = useLocation();

  useEffect(() => {
    if (location.hash !== '#reminders') return;
    const t = window.setTimeout(() => {
      document.getElementById('settings-reminders')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(t);
  }, [location.hash, location.pathname]);

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

      <p className="muted" style={{ marginTop: -6, marginBottom: 20, fontSize: '0.92rem', lineHeight: 1.55 }}>
        가족 데이터 백업·불러오기·초기화는 <Link to="/">가족</Link> 탭에서 할 수 있습니다. (탭을 닫으면 이 브라우저
        세션 데이터가 사라질 수 있어요.)
      </p>

      <section className="settings-section" style={{ marginTop: 0 }}>
        <h2 className="settings-section__h">
          <span className="settings-section__icon" aria-hidden>
            🌓
          </span>
          화면 테마
        </h2>
        <div className="card settings-alert-card">
          <p className="muted" style={{ margin: '0 0 12px', fontSize: '0.9rem', lineHeight: 1.55 }}>
            기본은 어두운 배경입니다. 밝은 화면을 원하면 아래에서 바꿀 수 있어요.
          </p>
          <div className="segmented" style={{ gap: 10 }}>
            <button
              type="button"
              className={`segmented__btn${state.appSettings.uiTheme === 'dark' ? ' segmented__btn--active' : ''}`}
              onClick={() =>
                setState({
                  ...state,
                  appSettings: { ...state.appSettings, uiTheme: 'dark' },
                })
              }
            >
              <span className="segmented__title">어두운 테마</span>
              <span className="segmented__hint">눈에 부담이 덜한 기본값</span>
            </button>
            <button
              type="button"
              className={`segmented__btn${state.appSettings.uiTheme === 'light' ? ' segmented__btn--active' : ''}`}
              onClick={() =>
                setState({
                  ...state,
                  appSettings: { ...state.appSettings, uiTheme: 'light' },
                })
              }
            >
              <span className="segmented__title">밝은 테마</span>
              <span className="segmented__hint">밝은 배경·대비</span>
            </button>
          </div>
        </div>
      </section>

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
          Google 캘린더는 혜택 카드의 버튼으로 넣을 수 있어요.
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
