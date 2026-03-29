import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { useWelfare } from '@/context/WelfareContext';
import { exportFamilyJson, parseFamilyImportJson } from '@/core/storage/exportImport';
import { emptySessionFamilyState } from '@/core/family/familyManager';
import { clearWelfareCache, upsertWelfareRecords } from '@/core/storage/welfareIndexedDb';
import { parseWelfareImportJson } from '@/core/welfare/normalizeWelfareImport';
import {
  analyzeNoticeOnServer,
  contributeRecords,
  fetchPublicCatalog,
} from '@/core/api/linkHelpServer';
import type { WelfareRecord } from '@/types/benefit';

export function SettingsPage() {
  const { state, setState } = useFamily();
  const { refreshWelfareCatalog } = useWelfare();
  const fileRef = useRef<HTMLInputElement>(null);
  const welfareFileRef = useRef<HTMLInputElement>(null);
  const [noticeText, setNoticeText] = useState('');
  const [analyzed, setAnalyzed] = useState<WelfareRecord | null>(null);
  const [analyzeSource, setAnalyzeSource] = useState<string | null>(null);
  const [analyzeBusy, setAnalyzeBusy] = useState(false);
  const [pullBusy, setPullBusy] = useState(false);
  const [contribBusy, setContribBusy] = useState(false);

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

  const onWelfareFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseWelfareImportJson(text);
      await upsertWelfareRecords(rows);
      refreshWelfareCatalog();
      alert(`복지 항목 ${rows.length}건을 이 기기 카탈로그(IndexedDB)에 합쳤습니다.`);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      const msg =
        code === 'invalid_json'
          ? 'JSON 형식이 올바르지 않습니다.'
          : code === 'not_array'
            ? '파일 내용은 복지 항목 배열([...])이어야 합니다.'
            : code === 'no_valid_rows'
              ? 'id와 title이 있는 항목이 하나도 없습니다.'
              : '복지 파일을 읽지 못했습니다.';
      alert(msg);
    }
  };

  const clearWelfare = async () => {
    if (
      !window.confirm(
        '이 기기에 쌓인 복지 누적(스마트 매칭·파일 가져오기)을 모두 지울까요? 앱에 포함된 번들 JSON은 그대로입니다.'
      )
    ) {
      return;
    }
    try {
      await clearWelfareCache();
      refreshWelfareCatalog();
      alert('복지 누적 캐시를 비웠습니다.');
    } catch {
      alert('캐시를 비우지 못했습니다. 비공개 창 등 저장소 제한일 수 있습니다.');
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

  const apiBase = state.appSettings.linkHelpApiBaseUrl.trim();
  const apiToken = state.appSettings.linkHelpApiToken;

  const pullPublicCatalog = async () => {
    if (!apiBase) {
      alert('API 기본 URL을 입력하세요.');
      return;
    }
    setPullBusy(true);
    try {
      const rows = await fetchPublicCatalog(apiBase);
      await upsertWelfareRecords(rows);
      refreshWelfareCatalog();
      alert(`서버에서 ${rows.length}건을 받아 이 기기 카탈로그에 합쳤습니다.`);
    } catch {
      alert('공용 목록을 가져오지 못했습니다. URL·CORS·서버 상태를 확인하세요.');
    } finally {
      setPullBusy(false);
    }
  };

  const runServerAnalyze = async () => {
    if (!apiBase) {
      alert('API 기본 URL을 입력하세요.');
      return;
    }
    if (!noticeText.trim()) {
      alert('공고문 본문을 입력하세요.');
      return;
    }
    setAnalyzeBusy(true);
    setAnalyzed(null);
    setAnalyzeSource(null);
    try {
      const out = await analyzeNoticeOnServer(apiBase, noticeText, apiToken);
      setAnalyzed(out.record);
      setAnalyzeSource(out.analysis_source);
    } catch (e) {
      alert(e instanceof Error ? e.message : '분석 요청에 실패했습니다.');
    } finally {
      setAnalyzeBusy(false);
    }
  };

  const saveAnalyzedLocal = async () => {
    if (!analyzed) return;
    try {
      await upsertWelfareRecords([analyzed]);
      refreshWelfareCatalog();
      alert('이 기기 IndexedDB에 저장했습니다.');
    } catch {
      alert('로컬 저장에 실패했습니다.');
    }
  };

  const contributeAnalyzed = async () => {
    if (!analyzed || !apiBase) return;
    if (!state.appSettings.welfareContributeConsent) {
      alert('기여 동의에 체크한 뒤 다시 시도하세요.');
      return;
    }
    setContribBusy(true);
    try {
      const r = await contributeRecords(apiBase, [analyzed], apiToken);
      alert(`서버 공용 DB에 ${r.accepted}건 반영(건너뜀 ${r.skipped}).`);
    } catch (e) {
      alert(e instanceof Error ? e.message : '기여에 실패했습니다.');
    } finally {
      setContribBusy(false);
    }
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

      <h2 style={{ fontSize: '1.1rem', margin: '28px 0 10px' }}>복지 카탈로그 (이 기기)</h2>
      <div className="card" style={{ marginBottom: 20 }}>
        <p className="muted" style={{ marginTop: 0, fontSize: '0.92rem', lineHeight: 1.55 }}>
          <code>WelfareRecord</code> 객체의 <strong>JSON 배열</strong> 파일을 불러오면{' '}
          <code>link-help-welfare-cache</code>(IndexedDB)에 합쳐지고, 번들 카탈로그와 통합 목록으로
          표시됩니다(번들 JSON과 병합). 서버로 전송되지 않습니다. 필드 정의는{' '}
          <code>src/types/benefit.ts</code>의 <code>WelfareRecord</code>를 참고하세요.
        </p>
        <button
          type="button"
          className="btn secondary"
          style={{ width: '100%', marginBottom: 10 }}
          onClick={() => welfareFileRef.current?.click()}
        >
          복지 JSON 불러오기 (배열)
        </button>
        <input
          ref={welfareFileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={onWelfareFile}
        />
        <button type="button" className="btn secondary" style={{ width: '100%' }} onClick={clearWelfare}>
          복지 누적 캐시 비우기
        </button>
      </div>

      <h2 style={{ fontSize: '1.1rem', margin: '28px 0 10px' }}>공용 복지 API (호스팅 시)</h2>
      <div className="card" style={{ marginBottom: 20 }}>
        <p className="muted" style={{ marginTop: 0, fontSize: '0.92rem', lineHeight: 1.55 }}>
          직접 띄운 <code>link-help-api</code>(<code>server/</code>) 주소를 넣으면 공용 복지 DB와 연동할 수
          있습니다. <strong>가족·프로필은 전송하지 않습니다.</strong> 서버 실행법은{' '}
          <code>server/README.md</code> 참고.
        </p>
        {String(import.meta.env.VITE_LINK_HELP_API_BASE ?? '').trim() && (
          <p className="muted" style={{ marginTop: 0, fontSize: '0.85rem' }}>
            이 빌드는 <code>VITE_LINK_HELP_API_BASE</code>로 신규 세션의 기본 URL을 채울 수 있습니다. 아래
            입력란에서 항상 바꿀 수 있습니다.
          </p>
        )}
        <div className="field">
          <label htmlFor="api-base">API 기본 URL (슬래시 없이)</label>
          <input
            id="api-base"
            value={state.appSettings.linkHelpApiBaseUrl}
            onChange={(e) =>
              setState({
                ...state,
                appSettings: { ...state.appSettings, linkHelpApiBaseUrl: e.target.value },
              })
            }
            placeholder="http://localhost:8787"
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor="api-token">API 토큰 (선택, 서버에 API_SHARED_TOKEN 설정 시)</label>
          <input
            id="api-token"
            type="password"
            value={state.appSettings.linkHelpApiToken}
            onChange={(e) =>
              setState({
                ...state,
                appSettings: { ...state.appSettings, linkHelpApiToken: e.target.value },
              })
            }
            placeholder="Bearer로 전송됩니다"
            autoComplete="off"
          />
        </div>
        <div className="field-row" style={{ marginBottom: 12 }}>
          <input
            id="contrib-consent"
            type="checkbox"
            className="input-checkbox"
            checked={state.appSettings.welfareContributeConsent}
            onChange={() =>
              setState({
                ...state,
                appSettings: {
                  ...state.appSettings,
                  welfareContributeConsent: !state.appSettings.welfareContributeConsent,
                },
              })
            }
          />
          <label htmlFor="contrib-consent">
            복지 메타(JSON)를 공용 DB에 보내는 것에 동의합니다. (PII·가족 데이터 제외)
          </label>
        </div>
        <button
          type="button"
          className="btn secondary"
          style={{ width: '100%', marginBottom: 10 }}
          onClick={pullPublicCatalog}
          disabled={pullBusy || !apiBase}
        >
          {pullBusy ? '가져오는 중…' : '서버에서 공용 목록 가져오기 (GET /welfare)'}
        </button>
        <div className="field">
          <label htmlFor="notice-paste">공고문 전문 (AI 분석용)</label>
          <textarea
            id="notice-paste"
            rows={5}
            value={noticeText}
            onChange={(e) => setNoticeText(e.target.value)}
            placeholder="공고 본문을 붙여넣으세요. OPENAI_API_KEY가 있으면 서버에서 LLM 구조화, 없으면 휴리스틱 요약입니다."
            style={{ width: '100%', minHeight: 100 }}
          />
        </div>
        <button
          type="button"
          className="btn secondary"
          style={{ width: '100%', marginBottom: 10 }}
          onClick={runServerAnalyze}
          disabled={analyzeBusy || !apiBase}
        >
          {analyzeBusy ? '분석 중…' : '서버에서 공고 분석 (POST /welfare/analyze)'}
        </button>
        {analyzeSource && (
          <p className="muted" style={{ marginTop: 0, fontSize: '0.88rem' }}>
            분석 엔진: {analyzeSource === 'openai' ? 'OpenAI' : '휴리스틱(로컬 규칙)'}
          </p>
        )}
        {analyzed && (
          <>
            <pre
              style={{
                margin: '12px 0',
                padding: 12,
                fontSize: '0.78rem',
                overflow: 'auto',
                maxHeight: 220,
                background: 'var(--color-surface-muted, #f4f6f4)',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
              }}
            >
              {JSON.stringify(analyzed, null, 2)}
            </pre>
            <button
              type="button"
              className="btn secondary"
              style={{ width: '100%', marginBottom: 10 }}
              onClick={saveAnalyzedLocal}
            >
              분석 결과를 이 기기에만 저장
            </button>
            <button
              type="button"
              className="btn"
              style={{ width: '100%' }}
              onClick={contributeAnalyzed}
              disabled={contribBusy || !state.appSettings.welfareContributeConsent}
            >
              {contribBusy ? '전송 중…' : '분석 결과를 서버 공용 DB에 기여'}
            </button>
          </>
        )}
      </div>

      <p className="muted" style={{ marginTop: 24, fontSize: '0.85rem' }}>
        빌드 후 서비스 워커가 앱과 <code>welfare-db</code> JSON을 캐시해 오프라인에서도 열 수 있습니다.
        번들 복지 JSON은 <code>public/welfare-db</code>에 있습니다.
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
