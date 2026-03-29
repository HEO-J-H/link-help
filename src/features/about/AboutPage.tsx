import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LOCAL_DEV_API_BASE } from '@/config/localDev';

export function AboutPage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#quick-start') {
      document.getElementById('quick-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, location.key]);

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link to="/settings">← 설정</Link>
      </p>
      <h1 className="page-title">서비스 안내</h1>

      <section id="quick-start" className="card" style={{ marginBottom: 14 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>빠른 시작</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          개발 PC에서 저장소 폴더를 연 뒤 터미널(PowerShell 등)에서 순서대로 진행하면 됩니다.
        </p>
        <h3 style={{ fontSize: '0.98rem', margin: '14px 0 8px' }}>웹만 쓰기 (서버 없음)</h3>
        <pre
          style={{
            margin: '0 0 12px',
            padding: 12,
            fontSize: '0.82rem',
            overflow: 'auto',
            background: 'var(--color-surface-muted, #f4f6f4)',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
          }}
        >
          {`npm install
npm run dev`}
        </pre>
        <p className="muted" style={{ marginTop: 0, fontSize: '0.9rem' }}>
          브라우저에 나온 주소(보통 localhost:5173)로 접속합니다. 복지 JSON은 앱에 포함된 것만 사용합니다.
        </p>

        <h3 style={{ fontSize: '0.98rem', margin: '16px 0 8px' }}>API·푸시까지 (로컬)</h3>
        <ol style={{ margin: '0 0 10px', paddingLeft: '1.25rem', lineHeight: 1.65 }}>
          <li>
            <code>npm run server:install</code> (최초 1회)
          </li>
          <li>
            <code>server/.env.example</code>을 복사해 <code>server/.env</code>로 두고,{' '}
            <code>npx web-push generate-vapid-keys</code>로 만든 키를 넣습니다.
          </li>
          <li>
            루트에 <code>.env</code>를 두고 <code>VITE_VAPID_PUBLIC_KEY</code>에{' '}
            <strong>서버와 같은 공개 키</strong>를 넣습니다. 그다음 <code>npm run dev</code>를 다시 켭니다.
          </li>
          <li>
            아래 중 편한 방법으로 <strong>API와 웹을 같이</strong> 띄웁니다.
          </li>
        </ol>
        <pre
          style={{
            margin: '0 0 8px',
            padding: 12,
            fontSize: '0.82rem',
            overflow: 'auto',
            background: 'var(--color-surface-muted, #f4f6f4)',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
          }}
        >
          {`npm run dev:full`}
        </pre>
        <p className="muted" style={{ margin: '0 0 10px', fontSize: '0.88rem' }}>
          Windows에서는 탐색기에서 <code>scripts\\dev-full.cmd</code>을 더블 클릭해도 됩니다(같은 효과).
        </p>
        <p style={{ marginBottom: 0 }}>
          앱 <Link to="/settings">설정</Link>에서 <strong>「로컬 API 주소 넣기」</strong>를 누르거나, API 베이스
          URL에 <code>{LOCAL_DEV_API_BASE}</code>를 입력합니다.
        </p>
        <p className="muted" style={{ marginTop: 12, marginBottom: 0, fontSize: '0.88rem' }}>
          GitHub Pages 등 <strong>웹에만</strong> 올린 주소에서는 앱·복지 JSON은 동작하지만, API는 별도
          서버를 두고 설정에 그 URL을 넣어야 합니다. 저장소에서는 <code>npm run build:gh</code>로 배포용
          빌드를 만듭니다.
        </p>
      </section>

      <div className="card" style={{ marginBottom: 14 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Link-Help가 하는 일</h2>
        <p style={{ marginBottom: 0 }}>
          가족 프로필과 태그를 바탕으로 복지·혜택 목록을 보여 주고, 알림·추천·타임라인으로 놓치기
          쉬운 정보를 <strong>참고용</strong>으로 모아 두는 도구입니다.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>지향하는 방향</h2>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.65 }}>
          <li>
            공식 API만으로는 닿지 않는 <strong>숨은 지원</strong>을 넓히기 위해, 하단 <strong>스마트</strong>{' '}
            탭에서 프로필·포함·제외 키워드를 조합한 <strong>매칭 엔진</strong>을 쓰고, 서버에 연결하면 검색
            이력이 쌓여 같은 조건을 반복하기 쉬워집니다. 외부 LLM은 이 파이프라인에 이어 붙일 수 있습니다.
          </li>
          <li>
            사용·필터·공고 활동이 쌓이면 <strong>개인정보 없이</strong> 공용 복지 레코드가 늘어나, 모두의
            후보 풀이 커지는 효과를 노립니다.
          </li>
          <li>
            <strong>기간이 끝난 혜택</strong>은 추천·타임라인에서 제외하고, 혜택 탭에서만 &quot;종료·기간
            만료 항목 보기&quot;로 <strong>참고</strong>할 수 있게 합니다.
          </li>
        </ul>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>내 데이터는 어디에 있나요?</h2>
        <ul style={{ marginBottom: 0, paddingLeft: '1.2rem' }}>
          <li>
            <strong>가족·알림·설정</strong> → <strong>sessionStorage</strong>(탭·창 단위). 창을 닫으면
            지워지고, <strong>JSON 불러오기</strong>로만 다시 채웁니다. 회원 가입 없음.
          </li>
          <li>
            <strong>복지 목록(서버 DB)</strong> → 운영·AI 검색 등으로 확보·정리한 항목을 DB에 두고
            앱은 <code>GET /welfare</code> 등으로 받아 보여 줄 수 있습니다. 가족 프로필은 그 DB에
            자동 저장되지 않습니다.
          </li>
          <li>
            <strong>로컬 복지 JSON</strong> → 앱과 함께 배포된 파일을 브라우저에서 읽어 옵니다.
          </li>
          <li>
            <strong>Web Push</strong>를 켜고 API 주소를 넣은 경우 → 구독 정보가{' '}
            <strong>그 서버</strong>로 전송될 수 있습니다(가족 프로필 본문과는 별개).
          </li>
        </ul>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>아직 포함되지 않은 것 (향후)</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          기획 문서상 확장 항목 중, 아래는 <strong>앱만으로는 미구현</strong>이거나 운영 단계에서
          별도로 준비하는 영역입니다.
        </p>
        <ul style={{ marginBottom: 0, paddingLeft: '1.2rem' }}>
          <li>회원 가입·클라우드 동기화(기기 간 자동 백업)</li>
          <li>공식 복지 API와의 실시간 연동·데이터 검수 프로세스</li>
          <li>운영용 관리자 화면·다중 사용자 권한</li>
          <li>전 기종·전 브라우저에 대한 품질 보증(QA)</li>
        </ul>
      </div>

      <p className="muted" style={{ fontSize: '0.9rem' }}>
        관련 문서:{' '}
        <Link to="/legal/disclaimer">면책 안내</Link> · <Link to="/legal/privacy">개인정보 안내</Link> ·{' '}
        <Link to="/legal/terms">이용약관</Link>
      </p>
    </div>
  );
}
