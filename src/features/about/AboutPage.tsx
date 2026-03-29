import { Link } from 'react-router-dom';

export function AboutPage() {
  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link to="/settings">← 설정</Link>
      </p>
      <h1 className="page-title">서비스 안내</h1>

      <div className="card" style={{ marginBottom: 14 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Link-Help가 하는 일</h2>
        <p style={{ marginBottom: 0 }}>
          가족 프로필과 태그를 바탕으로 복지·혜택 목록을 보여 주고, 알림·추천·타임라인으로 놓치기
          쉬운 정보를 <strong>참고용</strong>으로 모아 두는 도구입니다.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>내 데이터는 어디에 있나요?</h2>
        <ul style={{ marginBottom: 0, paddingLeft: '1.2rem' }}>
          <li>
            <strong>가족·알림·설정</strong> → 대부분 <strong>이 기기 브라우저 안(IndexedDB)</strong>에만
            있습니다.
          </li>
          <li>
            <strong>복지 목록(JSON)</strong> → 앱과 함께 배포되거나, 설정한 주소의 서버에서 추가로
            불러와 합쳐 집니다.
          </li>
          <li>
            <strong>Web Push</strong>를 켜고 서버 주소를 넣은 경우 → 푸시 구독 정보가{' '}
            <strong>그 서버</strong>로 전송될 수 있습니다.
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
          <li>운영용 백엔드 DB·관리자 화면(현재 데모 서버는 테스트용)</li>
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
