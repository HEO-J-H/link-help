import { Link, useParams } from 'react-router-dom';
import { useWelfare } from '@/context/WelfareContext';

export function BenefitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { list, loading } = useWelfare();
  const w = list.find((x) => x.id === id);

  if (loading) return <p className="muted">불러오는 중…</p>;
  if (!w) {
    return (
      <div>
        <p>항목을 찾을 수 없습니다.</p>
        <Link to="/benefits">혜택 목록</Link>
      </div>
    );
  }

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link to="/benefits">← 혜택 목록</Link>
      </p>
      <h1 className="page-title">{w.title}</h1>
      <div className="card">
        <p>{w.description}</p>
        <p style={{ marginTop: 12 }}>
          <strong>혜택</strong> {w.benefit}
        </p>
        <p>
          <strong>기간</strong> {w.period}
        </p>
        <p>
          <strong>지역</strong> {w.region.join(', ')}
        </p>
        <p>
          <strong>태그</strong> {w.tags.join(', ')}
        </p>
        <p className="muted" style={{ marginTop: 12 }}>
          출처: {w.source}
        </p>
        {w.apply_url && (
          <p style={{ marginTop: 16 }}>
            <a href={w.apply_url} target="_blank" rel="noreferrer">
              신청·안내 링크
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
