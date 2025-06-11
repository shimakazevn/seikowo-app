export * from './apiEndpoints';
export * from './routes';
export * from './common';
export * from './authScopes';

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  POST: '/post/:id',
  TAG: '/tag/:slug',
  CATEGORY: '/category/:slug',
  NOT_FOUND: '/404'
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language'
} as const;

// Default values
export const DEFAULTS = {
  ITEMS_PER_PAGE: 10,
  IMAGE_PLACEHOLDER: '/images/placeholder.jpg',
  AVATAR_PLACEHOLDER: '/images/avatar.jpg'
} as const;
