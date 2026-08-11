import React from 'react';
import { Link } from 'react-router-dom';
import { GiWheat } from 'react-icons/gi';
import { APP_NAME, APP_TAGLINE } from '../../constants';
import {
  APP_VERSION,
  FOOTER_ACCOUNT_LINKS,
  FOOTER_AUTHOR,
  FOOTER_MAIN_PAGE_LINKS,
  FOOTER_MODULE_LINKS,
  FOOTER_SERVICE_LINKS,
  type FooterLink,
} from '../../constants/footerLinks';
import { cn } from '../../utils';
import styles from './Footer.module.css';

interface FooterProps {
  variant?: 'public' | 'dashboard';
}

interface FooterColumnProps {
  title: string;
  links: FooterLink[];
  variant: 'public' | 'dashboard';
}

function FooterLinkItem({ link, variant }: { link: FooterLink; variant: 'public' | 'dashboard' }) {
  const className = cn(styles.link, variant === 'public' ? styles.linkPublic : styles.linkDashboard);

  if (link.anchor) {
    return (
      <li>
        <a href={link.to} className={className}>
          <span className={styles.linkDot} />
          {link.label}
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link to={link.to} className={className}>
        <span className={styles.linkDot} />
        {link.label}
      </Link>
    </li>
  );
}

function FooterColumn({ title, links, variant }: FooterColumnProps) {
  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <span
          className={cn(
            styles.columnTitle,
            variant === 'public' ? styles.columnTitlePublic : styles.columnTitleDashboard,
          )}
        >
          {title}
        </span>
      </div>
      <ul className={styles.linkList}>
        {links.map(link => (
          <FooterLinkItem key={link.label} link={link} variant={variant} />
        ))}
      </ul>
    </div>
  );
}

export function Footer({ variant = 'dashboard' }: FooterProps) {
  const year = new Date().getFullYear();
  const isPublic = variant === 'public';

  return (
    <footer
      id={isPublic ? 'contact' : undefined}
      className={cn(styles.footer, isPublic ? styles.footerPublic : styles.footerDashboard)}
    >
      <div className={styles.inner}>
        <div className={cn(styles.grid, !isPublic && styles.gridDashboard)}>
          <div className={styles.brand}>
            <Link to="/" className={styles.logoRow}>
              <div className={styles.logoIcon}>
                <GiWheat size={20} color="#1B4332" />
              </div>
              <span
                className={cn(
                  styles.logoText,
                  isPublic ? styles.logoTextPublic : styles.logoTextDashboard,
                )}
              >
                {APP_NAME}
              </span>
            </Link>
            <p
              className={cn(
                styles.tagline,
                isPublic ? styles.taglinePublic : styles.taglineDashboard,
              )}
            >
              {isPublic
                ? 'Enterprise-grade smart agriculture management for the modern farmer.'
                : APP_TAGLINE}
            </p>
            <div className={styles.brandMeta}>
              <span
                className={cn(
                  styles.versionBadge,
                  isPublic ? styles.versionBadgePublic : styles.versionBadgeDashboard,
                )}
              >
                v{APP_VERSION}
              </span>
            </div>
          </div>

          <FooterColumn
            title="Services"
            links={FOOTER_SERVICE_LINKS}
            variant={variant}
          />
          <FooterColumn
            title="Modules"
            links={FOOTER_MODULE_LINKS}
            variant={variant}
          />
          <FooterColumn
            title="Main Pages"
            links={FOOTER_MAIN_PAGE_LINKS}
            variant={variant}
          />
          <FooterColumn
            title="Account"
            links={FOOTER_ACCOUNT_LINKS}
            variant={variant}
          />
        </div>

        <div className={cn(styles.bottom, isPublic ? styles.bottomPublic : styles.bottomDashboard)}>
          <p className={cn(styles.copyright, isPublic ? styles.copyrightPublic : styles.copyrightDashboard)}>
            © {year} <strong>{APP_NAME}</strong>. All rights reserved to {FOOTER_AUTHOR}.
          </p>
          <p className={cn(styles.bottomNote, isPublic ? styles.bottomNotePublic : styles.bottomNoteDashboard)}>
            Smart Agriculture Management Platform
          </p>
        </div>
      </div>
    </footer>
  );
}
