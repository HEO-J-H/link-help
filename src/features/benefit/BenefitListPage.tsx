import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWelfare } from '@/context/WelfareContext';
import { filterWelfareByText } from '@/core/filter/filterEngine';
import { isWelfareEffectivelyExpired, sortWelfareForDiscovery } from '@/core/welfare/welfareLifecycle';

export function BenefitListPage() {
  const { list, loading, error } = useWelfare();
  const [q, setQ] = useState('');
  const [sortPopular, setSortPopular] = useState(false);
  const [showEnded, setShowEnded] = useState(false);
  const filtered = useMemo(() => {
    const textFiltered = filterWelfareByText(list, q);
    const visibility = showEnded
      ? textFiltered
      : textFiltered.filter((w) => !isWelfareEffectivelyExpired(w));
    const sorted = sortPopular
      ? [...visibility].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      : sortWelfareForDiscovery(visibility);
    return sorted;
  }, [list, q, sortPopular, showEnded]);

  if (loading) return <p className="muted">복지 데이터를 불러오는 중…</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div>
      <h1 className="page-title">혜택</h1>
      <p className="muted" style={{ marginTop: -8, marginBottom: 14, fontSize: '0.92rem', lineHeight: 1.55 }}>
        공식 API에만 의존하지 않고, 태그·프로필·앞으로 쌓이는 데이터로{' '}
        <strong>놓치기 쉬운 지원</strong>을 더 찾는 방향입니다. 아래는 로컬·원격 복지 목록입니다.
      </p>
      <input
        className="search-input"
        type="search"
        placeholder="제목·설명·태그 검색"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="혜택 검색"
      />
      <div className="field-row" style={{ marginBottom: 10, flexWrap: 'wrap', gap: '8px 16px' }}>
        <span className="field-row" style={{ marginBottom: 0 }}>
          <input
            id="sort-pop"
            type="checkbox"
            checked={sortPopular}
            onChange={(e) => setSortPopular(e.target.checked)}
          />
          <label htmlFor="sort-pop">인기도(참고) 순 정렬</label>
        </span>
        <span className="field-row" style={{ marginBottom: 0 }}>
          <input
            id="show-ended"
            type="checkbox"
            checked={showEnded}
            onChange={(e) => setShowEnded(e.target.checked)}
          />
          <label htmlFor="show-ended">종료·기간 만료 항목 보기</label>
        </span>
      </div>
      <div className="stack">
        {filtered.map((w) => (
          <Link key={w.id} to={`/benefits/${w.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card">
              <h3 style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                {w.title}
                {isWelfareEffectivelyExpired(w) && (
                  <span className="score-pill" title="기간 종료 또는 만료로 표시된 항목">
                    종료
                  </span>
                )}
              </h3>
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
