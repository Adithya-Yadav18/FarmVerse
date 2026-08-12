import React from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import styles from './Pagination.module.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  canPrev: boolean;
  canNext: boolean;
  pageNumbers: (number | '...')[];
  total?: number;
  limit?: number;
}

export function Pagination({
  page, totalPages, onPageChange,
  canPrev, canNext, pageNumbers, total, limit,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={styles.wrapper}>
      {total !== undefined && limit !== undefined && (
        <span className={styles.info}>
          Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
        </span>
      )}
      <nav className={styles.nav} aria-label="Pagination">
        <button
          className={styles.btn}
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label="Previous page"
        >
          <MdChevronLeft />
        </button>
        {pageNumbers.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className={styles.dots}>…</span>
          ) : (
            <button
              key={p}
              className={`${styles.btn} ${p === page ? styles.active : ''}`}
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
        <button
          className={styles.btn}
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          aria-label="Next page"
        >
          <MdChevronRight />
        </button>
      </nav>
    </div>
  );
}
