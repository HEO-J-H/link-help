import { LegalLayout } from './LegalLayout';

export function TermsPage() {
  return (
    <LegalLayout title="이용약관">
      <section>
        <h2>제1조 (목적)</h2>
        <p>
          본 약관은 Link-Help(이하 &quot;서비스&quot;)의 이용 조건 및 절차, 이용자와 운영자 간 권리·의무를
          정합니다.
        </p>
      </section>
      <section>
        <h2>제2조 (서비스 성격)</h2>
        <p>
          서비스는 가족 단위로 복지·혜택 정보를 <strong>참고용</strong>으로 정리·추천하기 위한 웹
          애플리케이션입니다. 공공기관·지자체의 공식 신청 시스템이 아닙니다.
        </p>
      </section>
      <section>
        <h2>제3조 (이용자의 의무)</h2>
        <ul>
          <li>입력 정보의 정확성에 대한 책임은 이용자에게 있습니다.</li>
          <li>실제 지원 여부·금액·기한은 반드시 공식 공고 및 담당 기관을 통해 확인해야 합니다.</li>
          <li>불법적이거나 타인의 권리를 침해하는 방식으로 서비스를 이용해서는 안 됩니다.</li>
        </ul>
      </section>
      <section>
        <h2>제4조 (서비스 변경·중단)</h2>
        <p>
          운영상·기술상 필요 시 서비스 내용을 변경하거나 일시 중단할 수 있습니다. 가능한 범위에서
          사전 또는 사후 안내를 합니다.
        </p>
      </section>
      <section>
        <h2>제5조 (면책)</h2>
        <p>
          서비스에서 제공하는 복지·혜택 관련 정보의 정확성·완전성·최신성을 보장하지 않습니다. 자세한
          내용은 <strong>면책·정보 안내</strong> 화면을 참고하세요.
        </p>
      </section>
    </LegalLayout>
  );
}
