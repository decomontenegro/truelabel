import { memo } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination = memo(({ 
  currentPage = 1, 
  totalPages = 1, 
  totalItems = 0, 
  itemsPerPage = 10, 
  onPageChange 
}: PaginationProps) => {
  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = totalItems > 0 ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 7;
    const halfRange = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis
      if (currentPage <= halfRange + 1) {
        // Near start
        for (let i = 1; i <= maxPagesToShow - 2; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - halfRange) {
        // Near end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - (maxPagesToShow - 3); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="bg-white px-4 py-3 border-t border-neutral-200 sm:px-6">
      <div className="flex items-center justify-between">
        {/* Mobile pagination */}
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn-outline btn-sm"
          >
            Anterior
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn-outline btn-sm"
          >
            Próximo
          </button>
        </div>

        {/* Desktop pagination */}
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-neutral-700">
              {totalItems > 0 ? (
                <>
                  Mostrando{' '}
                  <span className="font-medium">{startItem}</span>{' '}
                  até{' '}
                  <span className="font-medium">{endItem}</span>{' '}
                  de{' '}
                  <span className="font-medium">{totalItems}</span>{' '}
                  resultados
                </>
              ) : (
                'Nenhum resultado encontrado'
              )}
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-item rounded-l-md border border-neutral-300 bg-white text-neutral-600"
              >
                <span className="sr-only">Anterior</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              {getPageNumbers().map((pageNum, idx) => (
                pageNum === '...' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="relative inline-flex items-center px-4 py-2 border border-neutral-300 bg-white text-sm font-medium text-neutral-700"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum as number)}
                    className={`pagination-item border text-sm font-medium ${
                      pageNum === currentPage ? 'pagination-item-active' : 'border-neutral-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              ))}

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-item rounded-r-md border border-neutral-300 bg-white text-neutral-600"
              >
                <span className="sr-only">Próximo</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
});

Pagination.displayName = 'Pagination';

export default Pagination;