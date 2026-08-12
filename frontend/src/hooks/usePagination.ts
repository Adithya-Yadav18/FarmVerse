import { useState, useCallback, useMemo } from 'react';

interface UsePaginationProps {
  total: number;
  initialPage?: number;
  pageSize?: number;
}

export function usePagination({ total, initialPage = 1, pageSize = 10 }: UsePaginationProps) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(pageSize);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => goToPage(page + 1), [page, goToPage]);
  const prevPage = useCallback(() => goToPage(page - 1), [page, goToPage]);

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | '...')[] = [];
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }
    if (page - delta > 2) rangeWithDots.push(1, '...');
    else rangeWithDots.push(1);
    rangeWithDots.push(...range);
    if (page + delta < totalPages - 1) rangeWithDots.push('...', totalPages);
    else if (totalPages > 1) rangeWithDots.push(totalPages);
    return rangeWithDots;
  }, [page, totalPages]);

  return {
    page, limit, totalPages,
    goToPage, nextPage, prevPage, changeLimit,
    pageNumbers,
    canPrev: page > 1,
    canNext: page < totalPages,
    offset: (page - 1) * limit,
  };
}
