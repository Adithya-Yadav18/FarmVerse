import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MdChevronRight, MdHome } from 'react-icons/md';

interface Crumb { label: string; path?: string; }

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Crumb[];
}

export function PageHeader({ title, subtitle, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 28 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <MdHome size={15} />
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              <MdChevronRight size={15} />
              {crumb.path && i < breadcrumbs.length - 1 ? (
                <Link to={crumb.path} style={{ color: 'var(--text-muted)' }}>{crumb.label}</Link>
              ) : (
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{subtitle}</p>
          )}
        </div>
        {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
      </div>
    </div>
  );
}
