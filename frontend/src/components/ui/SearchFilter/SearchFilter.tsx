import React from 'react';
import { MdSearch, MdFilterList, MdClose } from 'react-icons/md';
import { Input } from '../Input/Input';

interface FilterOption { label: string; value: string; }

interface SearchFilterProps {
  searchValue: string;
  onSearchChange: (val: string) => void;
  placeholder?: string;
  filters?: Array<{ key: string; label: string; options: FilterOption[]; value: string; onChange: (val: string) => void }>;
  onClear?: () => void;
}

export function SearchFilter({
  searchValue, onSearchChange, placeholder = 'Search…', filters, onClear,
}: SearchFilterProps) {
  const hasFilters = !!searchValue || filters?.some(f => f.value);

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div style={{ flex: '1 1 220px', minWidth: 180 }}>
        <Input
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={placeholder}
          leftIcon={<MdSearch size={18} />}
          rightIcon={
            searchValue ? (
              <button
                onClick={() => onSearchChange('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
                aria-label="Clear search"
              >
                <MdClose size={16} />
              </button>
            ) : undefined
          }
        />
      </div>

      {filters?.map(f => (
        <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor={`filter-${f.key}`} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
            <MdFilterList size={16} /> {f.label}
          </label>
          <select
            id={`filter-${f.key}`}
            value={f.value}
            onChange={e => f.onChange(e.target.value)}
            style={{
              padding: '9px 12px',
              border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--border-radius)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">All</option>
            {f.options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      ))}

      {hasFilters && onClear && (
        <button
          onClick={onClear}
          style={{
            padding: '9px 14px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--border-radius)',
            background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <MdClose size={14} /> Clear
        </button>
      )}
    </div>
  );
}
