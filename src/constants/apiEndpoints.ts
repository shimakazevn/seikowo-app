// API related constants
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout'
  },
  BLOG: {
    POSTS: '/posts',
    COMMENTS: '/comments',
    TAGS: '/tags',
    CATEGORIES: '/categories'
  },
  USER: {
    PROFILE: '/user/profile',
    SETTINGS: '/user/settings',
    BOOKMARKS: '/user/bookmarks',
    HISTORY: '/user/history'
  }
} as const;
