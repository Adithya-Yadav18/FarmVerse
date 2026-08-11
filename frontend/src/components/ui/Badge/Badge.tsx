import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'gold';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
}

const VARIANT_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  success: { background: 'var(--color-success-bg)', color: 'var(--color-success)' },
  warning: { background: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
  error:   { background: 'var(--color-error-bg)',   color: 'var(--color-error)'   },
  info:    { background: 'var(--color-info-bg)',     color: 'var(--color-info)'    },
  neutral: { background: 'var(--bg-tertiary)',       color: 'var(--text-muted)'    },
  gold:    { background: 'rgba(212,175,55,0.15)',    color: 'var(--color-gold)'    },
};

export function Badge({ children, variant = 'neutral', dot }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--font-semibold)',
        ...VARIANT_STYLES[variant],
      }}
    >
      {dot && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'currentColor', flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  );
}

// Helper to map common status strings to badge variants
export function statusVariant(status: string): BadgeVariant {
  const s = status.toLowerCase();
  if (['active', 'growing', 'completed', 'resolved', 'optimal'].some(v => s.includes(v))) return 'success';
  if (['warning', 'scheduled', 'pending', 'planted', 'treating', 'needs attention'].some(v => s.includes(v))) return 'warning';
  if (['error', 'failed', 'critical', 'inactive'].some(v => s.includes(v))) return 'error';
  if (['paused', 'harvested'].some(v => s.includes(v))) return 'neutral';
  return 'info';
}
