'use client';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  className?: string;
}

export default function Pagination({ page, totalPages, onPage, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageRange(page, totalPages);

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {/* Previous */}
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="inline-flex h-9 w-9 items-center justify-center text-slate-400 text-sm select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p as number)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors
              ${page === p
                ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-600'
              }`}
            aria-current={page === p ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

function buildPageRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '…')[] = [];
  const addPage = (n: number) => pages.push(n);
  const addEllipsis = () => {
    if (pages[pages.length - 1] !== '…') pages.push('…');
  };

  addPage(1);
  if (current > 3) addEllipsis();
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) addPage(p);
  if (current < total - 2) addEllipsis();
  addPage(total);

  return pages;
}
