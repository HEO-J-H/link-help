import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWelfare } from '@/context/WelfareContext';
import { filterWelfareByText } from '@/core/filter/filterEngine';

export function BenefitListPage() {
  const { list, loading, error } = useWelfare();
  const [q, setQ] = useState('');
  const [sortPopular, setSortPopular] = useState(false);
  const filtered = useMemo(() => {
    const base = filterWelfareByText(list, q);
    if (!sortPopular) return base;
    return [...base].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  }, [list, q, sortPopular]);

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
      <div className="field-row" style={{ marginBottom: 12 }}>
        <input
          id="sort-pop"
          type="checkbox"
          checked={sortPopular}
          onChange={(e) => setSortPopular(e.target.checked)}
        />
        <label htmlFor="sort-pop">인기도(샘플) 순 정렬</label>
      </div>
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
                {typeof w.popularity === 'number' && (
                  <span className="score-pill" style={{ marginLeft: 8 }}>
                    인기 {w.popularity}
                  </span>
                )}
              </p>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="muted">검색 결과가 없습니다.</p>}
    </div>
  );
}
