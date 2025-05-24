// Cache management
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

export const CACHE_KEYS = {
  POSTS: 'cached_posts',
  PAGES: 'cached_pages',
  TAGS: 'cached_tags',
  USER_DATA: 'cached_user_data'
};

export const getCachedData = (key) => {
  try {
    const cachedData = localStorage.getItem(key);
    const cacheTime = localStorage.getItem(`${key}_time`);
    const now = Date.now();

    if (cachedData && cacheTime && (now - parseInt(cacheTime) < CACHE_DURATION)) {
      return JSON.parse(cachedData);
    }
    return null;
  } catch (error) {
    console.warn('Cache parsing error:', error);
    return null;
  }
};

export const setCachedData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(`${key}_time`, Date.now().toString());
  } catch (error) {
    console.warn('Cache storage error:', error);
  }
};

export const clearCache = (key) => {
  localStorage.removeItem(key);
  localStorage.removeItem(`${key}_time`);
}; 