import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWelfare } from '@/context/WelfareContext';
import { filterWelfareByText } from '@/core/filter/filterEngine';

export function BenefitListPage() {
  const { list, loading, error } = useWelfare();
  const [q, setQ] = useState('');
  const filtered = useMemo(() => filterWelfareByText(list, q), [list, q]);

  if (loading) return <p className="muted">복지 데이터를 불러오는 중…</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div>
      <h1 className="page-title">혜택</h1>
      <input
        className="search-input"
        type="search"
        placeholder="제목·설명·태그 검색"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="혜택 검색"
      />
      <div className="stack">
        {filtered.map((w) => (
          <Link key={w.id} to={`/benefits/${w.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card">
              <h3>{w.title}</h3>
              <p>
                {w.region.join(', ')} · {w.benefit}
              </p>
              <p className="muted" style={{ marginTop: 6 }}>
                {w.tags.join(' · ')}
              </p>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="muted">검색 결과가 없습니다.</p>}
    </div>
  );
}
