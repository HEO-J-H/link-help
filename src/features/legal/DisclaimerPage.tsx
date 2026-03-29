import { LegalLayout } from './LegalLayout';

export function DisclaimerPage() {
  return (
    <LegalLayout title="면책 · 정보 정확성 안내">
      <section>
        <h2>정보의 성격</h2>
        <p>
          본 서비스에 표시되는 복지·혜택·지원 정보는 <strong>참고·학습용 샘플 및 비공식 정리</strong>
          에 해당할 수 있습니다. 실제 지원 대상, 금액, 신청 기한, 서류, 담당 기관은{' '}
          <strong>정부24, 지자체 공고, 해당 부서 안내</strong> 등 공식 출처를 기준으로 하십시오.
        </p>
      </section>
      <section>
        <h2>책임의 한계</h2>
        <ul>
          <li>본 정보에 의존하여 발생한 불이익(지원 미신청, 오신청, 기한 경과 등)에 대해 운영자는 책임을 지지 않습니다.</li>
          <li>AI·자동 태그·추천 점수는 보조 도구이며, 최종 판단은 이용자와 공식 기관의 확인에 따릅니다.</li>
        </ul>
      </section>
      <section>
        <h2>건강·법률 관련</h2>
        <p>
          의료·세무·법률 등 전문 판단이 필요한 사항은 반드시 해당 분야 전문가 또는 공식 기관에
          문의하십시오.
        </p>
      </section>
    </LegalLayout>
  );
}
