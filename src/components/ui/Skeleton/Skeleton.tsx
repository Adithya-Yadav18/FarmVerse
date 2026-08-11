import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 6,
  className,
  style,
}: SkeletonProps) {
  return (
    <span
      className={className}
      style={{
        display: 'block',
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s ease-in-out infinite',
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24 }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <Skeleton width={52} height={52} borderRadius={10} />
        <div style={{ flex: 1 }}>
          <Skeleton height={14} width="60%" style={{ marginBottom: 8 }} />
          <Skeleton height={24} width="40%" />
        </div>
      </div>
      <Skeleton height={12} width="90%" style={{ marginBottom: 6 }} />
      <Skeleton height={12} width="70%" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 16 }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={14} width={`${Math.floor(80 / cols)}%`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 16 }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} height={14} width={`${Math.floor(80 / cols)}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}
