import React from 'react';
import { motion } from 'framer-motion';
import styles from './Card.module.css';
import { cn } from '../../../utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hoverable?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Card({ children, className, style, hoverable, header, footer }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(styles.card, hoverable ? styles.hoverable : '', className)}
      style={style}
    >
      {header && <div className={styles.header}>{header}</div>}
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}

export function StatCard({ label, value, change, icon, iconBg = '#D8F3DC', iconColor = '#0F5E3A' }: StatCardProps) {
  const changeType = change === undefined ? 'neutral' : change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={styles.statCard}
    >
      <div className={styles.statIconWrapper} style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div className={styles.statContent}>
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statValue}>{value}</p>
        {change !== undefined && (
          <span className={cn(styles.statChange, styles[changeType])}>
            {change > 0 ? '↑' : change < 0 ? '↓' : '–'} {Math.abs(change)}%
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> vs last month</span>
          </span>
        )}
      </div>
    </motion.div>
  );
}
