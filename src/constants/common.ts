// Storage related constants
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
