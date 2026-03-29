import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { exportFamilyJson, parseFamilyImportJson } from '@/core/storage/exportImport';
import { emptySessionFamilyState } from '@/core/family/familyManager';

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
        가족·알림·설정(앱 안)은 <strong>이 탭이 열려 있는 동안만</strong> 브라우저{' '}
        <strong>sessionStorage</strong>에 JSON 형태로 보관됩니다. 탭이나 창을 닫으면 비워지고, 다시
        열면 빈 상태에서 시작합니다. 이전에 저장해 둔 내용은 <strong>JSON 불러오기</strong>로
        복원하세요. (회원 가입 없음)
      </p>

      <div className="card" style={{ marginBottom: 22 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>처음 켤 때</h2>
        <p style={{ marginTop: 0, fontSize: '0.95rem', lineHeight: 1.55 }}>
          <strong>배포된 웹 주소</strong>(예: GitHub Pages)만 열면 가족·혜택 목록·추천·타임라인·스마트
          매칭까지 <strong>모두 이 브라우저 안에서</strong> 동작합니다. 서버 연결이나 별도 설치는 없습니다.
        </p>
        <p className="muted" style={{ marginTop: 12, marginBottom: 0, fontSize: '0.92rem', lineHeight: 1.55 }}>
          로컬에서 화면을 고치고 미리보려면 <code>npm install</code> → <code>npm run dev</code> — 자세한
          단계는 <Link to="/start">빠른 시작 안내</Link>를 보세요.
        </p>
      </div>

      <h2 style={{ fontSize: '1.1rem', margin: '0 0 10px' }}>알림</h2>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="field-row" style={{ marginBottom: 12 }}>
          <input
            id="set-notify"
            type="checkbox"
            className="input-checkbox"
            checked={state.appSettings.browserNotifications}
            onChange={toggleNotify}
          />
          <label htmlFor="set-notify">브라우저 알림 사용 (예정 시각에 표시)</label>
        </div>
        <button type="button" className="btn secondary" style={{ width: '100%' }} onClick={requestNotify}>
          알림 권한 요청
        </button>
        <p className="muted" style={{ marginTop: 10, marginBottom: 0, fontSize: '0.88rem' }}>
          예약 알림은 이 탭이 열려 있을 때 주기적으로 확인합니다. 탭을 닫으면 브라우저/OS 정책에 따라
          알림이 오지 않을 수 있습니다.
        </p>
      </div>

      <div className="stack">
        <button type="button" className="btn" style={{ width: '100%' }} onClick={download}>
          가족 정보내기 (JSON)
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
        복지 샘플은 <code>public/welfare-db</code>에 있습니다.
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
