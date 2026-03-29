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
          창을 닫으면 해당 데이터는 사라지기 쉽습니다. 이용자가 <strong>가족 탭</strong>에서 JSON
          보내기/불러오기를 하거나, 선택 시 <strong>localStorage</strong>에 남기는 브라우저 백업으로 새 탭에서
          복원을 제안받을 수 있습니다.
        </p>
      </section>
      <section>
        <h2>2. 수집·저장되는 정보</h2>
        <ul>
          <li>
            <strong>탭·창이 열려 있는 동안(로컬):</strong> 이름(표시용), 생년월일, 가구 기본(지역·소득),
            구성원별 프로필, 태그, 알림 예약, 앱 설정 등 — sessionStorage에만 보관됩니다.
          </li>
          <li>
            <strong>앱에 포함된 복지 안내 JSON:</strong> 전국·지역 복지 요약을 브라우저에서 읽어 옵니다. 가족
            프로필이 그 파일이나 외부 서버로 자동 전송되지는 않습니다.
          </li>
          <li>
            <strong>복지 카탈로그 누적(IndexedDB):</strong> 숨은 복지·혜택찾기 등으로 이 기기에 쌓인 복지 메타(
            <code>WelfareRecord</code>)가 <code>link-help-welfare-cache</code>에 저장되어 번들 JSON과
            합쳐집니다. 브라우저에서 사이트 데이터를 지우면 누적은 함께 삭제될 수 있습니다.
          </li>
          <li>
            <strong>자가 호스팅·개발 빌드(선택):</strong> 배포 시 환경 변수 등으로 API 주소가 붙은 빌드만
            공용 서버와 분석·기여 요청을 주고받을 수 있습니다. 일반 웹 배포본은 가족 프로필을 외부로 보내지
            않습니다.
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
          <li>가족 탭의 &quot;가족 데이터 초기화&quot;로 같은 탭 안에서도 가족 데이터와 브라우저 백업을 비울 수 있습니다.</li>
          <li>브라우저 설정에서 사이트 데이터·저장소를 지우면 IndexedDB 누적도 함께 없어질 수 있습니다(번들 JSON은 앱과 함께 다시 제공됩니다).</li>
          <li>JSON 보내기로 파일을 내려받아 두면, 나중에 불러오기로 같은 기기·다른 탭에서 복원할 수 있습니다.</li>
        </ul>
      </section>
      <section>
        <h2>5. 문의</h2>
        <p>
          개인정보 관련 문의·열람·정정·삭제 요청은 <strong>실제 운영 주체의 공식 연락처</strong> 및{' '}
          <strong>개인정보 보호책임자</strong> 안내를 따르는 것이 좋습니다. (현재 본 화면은 참고용
          견본입니다.)
        </p>
        <p className="muted" style={{ marginBottom: 0 }}>
          오픈소스 저장소 관련 기술 이슈는 GitHub{' '}
          <a href="https://github.com/HEO-J-H/link-help/issues" rel="noopener noreferrer">
            Issues
          </a>
          를 이용할 수 있습니다. 민감한 개인정보는 이슈에 올리지 마세요.
        </p>
      </section>
    </LegalLayout>
  );
}
