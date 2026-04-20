export default function Pagination({ page, totalPages, total, limit, onFirst, onPrev, onNext, onLast }) {
  if (!total) return null;
  const rangeStart = page * limit + 1;
  const rangeEnd = Math.min((page + 1) * limit, total);
  const isFirst = page === 0;
  const isLast = totalPages !== null && page >= totalPages - 1;

  return (
    <div className="pagination-bar">
      <button className="pagination-btn" onClick={onFirst} disabled={isFirst} aria-label="First page">&#171;</button>
      <button className="pagination-btn" onClick={onPrev} disabled={isFirst} aria-label="Previous page">&#8249;</button>
      <span className="pagination-range">{rangeStart}–{rangeEnd} of {total.toLocaleString()}</span>
      <button className="pagination-btn" onClick={onNext} disabled={isLast} aria-label="Next page">&#8250;</button>
      <button className="pagination-btn" onClick={onLast} disabled={isLast} aria-label="Last page">&#187;</button>
    </div>
  );
}
