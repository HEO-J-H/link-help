import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

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

      <section className="card" style={{ marginBottom: 14, borderColor: '#b8d4c4', background: '#f4fbf7' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>인터넷 주소만으로 쓰기</h2>
        <p style={{ marginTop: 0, lineHeight: 1.6 }}>
          이 사이트 주소(예: GitHub Pages로 배포된 URL)를 브라우저에서 열면 됩니다.{' '}
          <strong>별도 프로그램 설치·회원 가입·서버·API 연결은 없습니다.</strong> 가족과 프로필은 이 탭이
          열려 있는 동안만 브라우저에 저장되며, 닫으면 비워질 수 있으니 필요하면 설정에서 JSON으로
          백업하세요.
        </p>
        <p className="muted" style={{ marginBottom: 0, fontSize: '0.9rem', lineHeight: 1.55 }}>
          복지 샘플 데이터는 앱에 포함된 JSON만 사용합니다. 스마트 매칭 결과도 서버로 보내지 않습니다.
        </p>
      </section>

      <section id="quick-start" className="card" style={{ marginBottom: 14 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>빠른 시작 (개발자용)</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          로컬에서 소스를 수정·실행할 때만 아래가 필요합니다. 일반 이용은 위 「인터넷 주소만」으로
          충분합니다.
        </p>
        <pre
          style={{
            margin: '12px 0',
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
          브라우저에 나온 주소(보통 localhost:5173)로 접속합니다. GitHub Pages 배포는{' '}
          <code>npm run build:gh</code> 후 저장소 워크플로를 사용합니다.
        </p>
        <p className="muted" style={{ marginTop: 12, marginBottom: 0, fontSize: '0.88rem' }}>
          저장소의 <code>server/</code> 폴더는 예전 실험용 백엔드 예시로 남겨 두었을 수 있으나, 현재 웹
          앱 동작에는 필요하지 않습니다.
        </p>
      </section>

      <div className="card" style={{ marginBottom: 14 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Link-Help가 하는 일</h2>
        <p style={{ marginBottom: 0 }}>
          가족 프로필과 태그를 바탕으로 복지·혜택 목록을 보여 주고, 알림·추천·타임라인·스마트 매칭으로
          놓치기 쉬운 정보를 <strong>참고용</strong>으로 모아 두는 도구입니다.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>지향하는 방향</h2>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.65 }}>
          <li>
            하단 <strong>스마트</strong> 탭에서 프로필·포함·제외 키워드를 조합한 <strong>매칭 엔진</strong>을
            브라우저에서만 돌립니다. 외부 LLM을 붙이려면 별도 확장이 필요합니다.
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
            <strong>로컬 복지 JSON</strong> → 앱과 함께 배포된 파일을 브라우저에서 읽습니다.
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
