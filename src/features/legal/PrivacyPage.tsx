import { LegalLayout } from './LegalLayout';

export function PrivacyPage() {
  return (
    <LegalLayout title="개인정보 처리 안내">
      <section>
        <h2>1. 총칙</h2>
        <p>
          Link-Help는 <strong>회원 가입 없이</strong> 동작합니다. 가족 구성원·프로필·알림 등
          이용자가 입력하는 민감 정보는 <strong>서버에 자동으로 모이지 않으며</strong>, 기본적으로{' '}
          <strong>브라우저 sessionStorage</strong>(탭·창 단위)에만 JSON 형태로 보관됩니다. 탭이나
          창을 닫으면 해당 데이터는 사라지고, 다시 열면 빈 화면에서 시작합니다. 지속하려면 이용자가
          직접 <strong>JSON 보내기/불러오기</strong>를 사용합니다.
        </p>
      </section>
      <section>
        <h2>2. 수집·저장되는 정보</h2>
        <ul>
          <li>
            <strong>탭·창이 열려 있는 동안(로컬):</strong> 이름(표시용), 생년월일, 지역, 소득 구간,
            태그, 알림 예약, 앱 설정 등 — sessionStorage에만 보관됩니다.
          </li>
          <li>
            <strong>운영 서버 DB(복지 목록):</strong> 서비스에서 제공하는 복지·혜택 항목 데이터는
            운영·<strong>AI 검색·큐레이션 파이프라인</strong> 등을 통해 DB에 적재·갱신하는 형태를
            전제로 하며, 이용자가 입력한 가족 프로필을 이 DB에 자동 저장하는 구조는 아닙니다.
          </li>
          <li>
            <strong>선택 기능:</strong> API 베이스 URL을 설정한 경우, 원격 복지 목록 조회·Web Push
            구독 전송이 가능합니다. 푸시 구독 시 엔드포인트 등 기술 정보가 해당 서버 DB에 남을 수
            있습니다.
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
          <li>탭·창을 닫으면 sessionStorage의 입력 데이터가 지워집니다.</li>
          <li>설정의 &quot;데이터 초기화&quot;로 같은 탭 안에서도 바로 비울 수 있습니다.</li>
          <li>JSON 보내기로 파일을 내려받아 두면, 나중에 불러오기로 같은 기기·다른 탭에서 복원할 수 있습니다.</li>
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
