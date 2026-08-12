export const FOOTER_AUTHOR = 'Golla Ganesh';
export const APP_VERSION = '1.0.0';

export interface FooterLink {
  label: string;
  to: string;
  anchor?: boolean;
}

export const FOOTER_SERVICE_LINKS: FooterLink[] = [
  { label: 'Soil Analysis', to: '/soil' },
  { label: 'Irrigation', to: '/irrigation' },
  { label: 'Weather', to: '/weather' },
  { label: 'Disease Detection', to: '/disease' },
  { label: 'AI Recommendations', to: '/ai-recommendations' },
];

export const FOOTER_MODULE_LINKS: FooterLink[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Farms', to: '/farms' },
  { label: 'Crops', to: '/crops' },
  { label: 'Reports', to: '/reports' },
  { label: 'Notifications', to: '/notifications' },
];

export const FOOTER_MAIN_PAGE_LINKS: FooterLink[] = [
  { label: 'Home', to: '/', anchor: false },
  { label: 'Features', to: '#features', anchor: true },
  { label: 'Platform Stats', to: '#stats', anchor: true },
  { label: 'Contact', to: '#contact', anchor: true },
];

export const FOOTER_ACCOUNT_LINKS: FooterLink[] = [
  { label: 'Sign In', to: '/login' },
  { label: 'Get Started', to: '/register' },
  { label: 'Profile', to: '/profile' },
  { label: 'Settings', to: '/settings' },
];
