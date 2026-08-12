import React from 'react';
import styles from './Button.module.css';
import { cn } from '../../../utils';

export type ButtonVariant = 'primary' | 'gold' | 'outline' | 'outlineGold' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children, variant = 'primary', size = 'md', loading = false,
  leftIcon, rightIcon, fullWidth, className, disabled, style, ...props
}, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        styles.btn,
        styles[variant],
        styles[size],
        className
      )}
      disabled={disabled || loading}
      style={{ ...(fullWidth ? { width: '100%' } : {}), ...style }}
      {...props}
    >
      {loading ? (
        <span className={styles.spinner} />
      ) : (
        <>
          {leftIcon && <span>{leftIcon}</span>}
          {children}
          {rightIcon && <span>{rightIcon}</span>}
        </>
      )}
    </button>
  );
});
Button.displayName = 'Button';
