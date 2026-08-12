import { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '../constants';
import type { User } from '../types';

// ─── Token Storage ────────────────────────────────────────────────────────────
export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = (): void => localStorage.removeItem(TOKEN_KEY);

export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);
export const setRefreshToken = (token: string): void => localStorage.setItem(REFRESH_TOKEN_KEY, token);
export const removeRefreshToken = (): void => localStorage.removeItem(REFRESH_TOKEN_KEY);

// ─── User Storage ─────────────────────────────────────────────────────────────
export const getStoredUser = (): User | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as User; } catch { return null; }
};
export const setStoredUser = (user: User): void => localStorage.setItem(USER_KEY, JSON.stringify(user));
export const removeStoredUser = (): void => localStorage.removeItem(USER_KEY);

// ─── JWT Decode ───────────────────────────────────────────────────────────────
export const decodeToken = (token: string): Record<string, unknown> | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || typeof decoded.exp !== 'number') return true;
  return decoded.exp * 1000 < Date.now();
};

// ─── Date Helpers ─────────────────────────────────────────────────────────────
export const formatDate = (date: string | Date, opts?: Intl.DateTimeFormatOptions): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', opts ?? { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const timeAgo = (date: string | Date): string => {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
};

// ─── String Helpers ───────────────────────────────────────────────────────────
export const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export const initials = (name: string): string =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export const truncate = (s: string, max: number): string =>
  s.length > max ? s.slice(0, max) + '…' : s;

// ─── Number Helpers ───────────────────────────────────────────────────────────
export const formatNumber = (n: number): string =>
  new Intl.NumberFormat('en-IN').format(n);

export const formatCurrency = (n: number, currency = 'INR'): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(n);

export const clamp = (val: number, min: number, max: number): number =>
  Math.min(Math.max(val, min), max);

// ─── Class Names Helper ───────────────────────────────────────────────────────
export const cn = (...classes: (string | undefined | null | false)[]): string =>
  classes.filter(Boolean).join(' ');
