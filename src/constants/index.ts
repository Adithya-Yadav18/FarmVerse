export const APP_NAME = 'FarmVerse';
export const APP_TAGLINE = 'Smart Agriculture Management';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

export const TOKEN_KEY = 'farmverse_access_token';
export const REFRESH_TOKEN_KEY = 'farmverse_refresh_token';
export const USER_KEY = 'farmverse_user';
export const THEME_KEY = 'farmverse_theme';

export const ROLES = {
  ADMIN: 'Admin',
  FARMER: 'Farmer',
  AGRONOMIST: 'Agronomist',
} as const;

export const CROP_STATUSES = ['Planted', 'Growing', 'Flowering', 'Harvested', 'Failed'] as const;
export const FARM_STATUSES = ['Active', 'Inactive', 'Harvested'] as const;
export const IRRIGATION_STATUSES = ['Active', 'Scheduled', 'Completed', 'Paused'] as const;

export const ITEMS_PER_PAGE = 10;

export const COLORS = {
  emeraldGreen: '#0F5E3A',
  forestGreen: '#1B4332',
  gold: '#D4AF37',
  ivory: '#F8F5F0',
  charcoal: '#1F2937',
  lightGreen: '#52B788',
  paleGreen: '#D8F3DC',
  amber: '#F59E0B',
  red: '#EF4444',
  blue: '#3B82F6',
} as const;

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;
