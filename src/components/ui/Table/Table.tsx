import React, { useState } from 'react';
import { MdKeyboardArrowUp, MdKeyboardArrowDown, MdUnfoldMore } from 'react-icons/md';
import styles from './Table.module.css';
import { cn } from '../../../utils';
import { Skeleton } from '../Skeleton/Skeleton';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

interface TableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  keyExtractor?: (row: T) => string;
  onSort?: (key: string, order: 'asc' | 'desc') => void;
}

export function Table<T extends Record<string, unknown>>({
  columns, data, loading, emptyMessage = 'No data found',
  emptyIcon, keyExtractor, onSort,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    const newOrder = sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortOrder(newOrder);
    onSort?.(key, newOrder);
  };

  return (
    <div className={styles.wrapper}>
      <table className={styles.table} role="table">
        <thead className={styles.thead}>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={col.sortable ? styles.sortable : ''}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                aria-sort={
                  sortKey === col.key
                    ? sortOrder === 'asc' ? 'ascending' : 'descending'
                    : 'none'
                }
              >
                {col.label}
                {col.sortable && (
                  <span className={styles.sortIcon}>
                    {sortKey === col.key
                      ? sortOrder === 'asc'
                        ? <MdKeyboardArrowUp />
                        : <MdKeyboardArrowDown />
                      : <MdUnfoldMore style={{ opacity: 0.4 }} />}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key}>
                    <Skeleton height={18} />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className={styles.empty}>
                  {emptyIcon && <div className={styles.emptyIcon}>{emptyIcon}</div>}
                  <p>{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={keyExtractor ? keyExtractor(row) : String(idx)}>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render
                      ? col.render(row[col.key], row, idx)
                      : String(row[col.key] ?? '–')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Action buttons for table rows ───────────────────────────────────────────
interface RowActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

export function RowActions({ onEdit, onDelete, onView }: RowActionsProps) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {onView && (
        <button
          onClick={onView}
          style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
        >
          View
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
        >
          Edit
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
        >
          Delete
        </button>
      )}
    </div>
  );
}

// re-export for convenience
export { cn };
