'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  lang: 'kz' | 'ru';
}

export function Pagination({ currentPage, totalPages, baseUrl, lang }: PaginationProps) {
  if (totalPages <= 1) return null;

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2; // Number of pages to show on each side of current page

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    let rangeStart = Math.max(2, currentPage - delta);
    let rangeEnd = Math.min(totalPages - 1, currentPage + delta);

    // Add ellipsis after first page if needed
    if (rangeStart > 2) {
      pages.push('...');
    }

    // Add pages in range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    // Add ellipsis before last page if needed
    if (rangeEnd < totalPages - 1) {
      pages.push('...');
    }

    // Always show last page if there is more than one page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = generatePageNumbers();

  const getPageUrl = (page: number) => {
    return `${baseUrl}?page=${page}`;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8 mb-8">
      {/* Previous Button */}
      {currentPage > 1 && (
        <a
          href={getPageUrl(currentPage - 1)}
          className="flex items-center justify-center w-10 h-10 rounded border border-gray-300 hover:bg-gray-100 transition"
          aria-label={lang === 'kz' ? 'Алдыңғы бет' : 'Предыдущая страница'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </a>
      )}

      {/* Page Numbers */}
      {pages.map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="flex items-center justify-center w-10 h-10 text-gray-500"
            >
              ...
            </span>
          );
        }

        const pageNumber = page as number;
        const isActive = pageNumber === currentPage;

        return (
          <a
            key={pageNumber}
            href={getPageUrl(pageNumber)}
            className={`flex items-center justify-center w-10 h-10 rounded border transition ${
              isActive
                ? 'bg-green-600 text-white border-green-600 font-semibold'
                : 'border-gray-300 hover:bg-gray-100'
            }`}
          >
            {pageNumber}
          </a>
        );
      })}

      {/* Next Button */}
      {currentPage < totalPages && (
        <a
          href={getPageUrl(currentPage + 1)}
          className="flex items-center justify-center w-10 h-10 rounded border border-gray-300 hover:bg-gray-100 transition"
          aria-label={lang === 'kz' ? 'Келесі бет' : 'Следующая страница'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      )}

      {/* Page Info */}
      <div className="ml-4 text-sm text-gray-600">
        {lang === 'kz' ? 'Бет' : 'Страница'} {currentPage} {lang === 'kz' ? 'из' : 'из'} {totalPages}
      </div>
    </div>
  );
}
