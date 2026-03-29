import { LegalLayout } from './LegalLayout';

export function PrivacyPage() {
  return (
    <LegalLayout title="개인정보 처리 안내">
      <section>
        <h2>1. 총칙</h2>
        <p>
          Link-Help는 기본적으로 <strong>로그인 없이</strong> 동작하며, 가족 구성원·프로필·알림 등
          민감할 수 있는 정보는 <strong>이용자 기기의 브라우저(IndexedDB 등) 안에만</strong>{' '}
          저장됩니다. 운영자가 별도의 &quot;회원 서버&quot;에 위 데이터를 자동으로 모으는 구조는
          기본 설계에 포함되어 있지 않습니다.
        </p>
      </section>
      <section>
        <h2>2. 수집·저장되는 정보</h2>
        <ul>
          <li>
            <strong>로컬 저장:</strong> 이름(표시용), 생년월일, 지역, 소득 구간, 태그, 알림 예약 등
            이용자가 입력한 내용
          </li>
          <li>
            <strong>선택 기능:</strong> API 베이스 URL을 설정한 경우, 앱이 해당 주소로 원격 복지
            목록을 요청하거나 Web Push 구독 정보를 전송할 수 있습니다. 이 경우 해당 서버 운영자의
            정책이 추가로 적용됩니다.
          </li>
        </ul>
      </section>
      <section>
        <h2>3. 이용 목적</h2>
        <p>맞춤형 혜택 추천, 알림, 데이터 백업(보내기/불러오기) 기능 제공.</p>
      </section>
      <section>
        <h2>4. 보관 및 삭제</h2>
        <ul>
          <li>브라우저 데이터 삭제·앱 데이터 초기화 시 로컬 정보가 삭제될 수 있습니다.</li>
          <li>설정의 &quot;데이터 초기화&quot; 및 JSON 백업으로 이용자가 직접 관리할 수 있습니다.</li>
        </ul>
      </section>
      <section>
        <h2>5. 문의</h2>
        <p>
          상용 서비스 시 실제 운영 주체의 연락처·개인정보 보호책임자 정보를 이 항목에 기재하는 것이
          좋습니다.
        </p>
      </section>
    </LegalLayout>
  );
}
