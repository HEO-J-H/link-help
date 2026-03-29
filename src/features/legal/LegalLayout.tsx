import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link to="/settings">← 설정</Link>
      </p>
      <h1 className="page-title">{title}</h1>
      <article className="legal-article">{children}</article>
      <p className="muted" style={{ marginTop: 20, fontSize: '0.82rem' }}>
        본 문서는 이용 안내 목적이며 법률 자문을 대체하지 않습니다. 상용 서비스 전 법무 검토를 권장합니다.
      </p>
    </div>
  );
}
