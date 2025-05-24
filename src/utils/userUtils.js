// Token management
const TOKEN_KEY = 'furina_water';
const REFRESH_TOKEN_KEY = 'google_refresh_token';
const USER_INFO_KEY = 'user_info';
export const USER_INFO_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const getStoredRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const setStoredTokens = (accessToken, refreshToken) => {
  if (!accessToken) throw new Error('Access token is required');
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};
export const removeStoredTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// User info management
export const getUserInfo = () => {
  try {
    const userInfoString = localStorage.getItem(USER_INFO_KEY);
    if (userInfoString) {
      const parsed = JSON.parse(userInfoString);
      if (parsed && parsed.timestamp) {
        const isCacheValid = (Date.now() - parsed.timestamp) < USER_INFO_CACHE_DURATION;
        return isCacheValid ? parsed : null;
      }
    }
  } catch (e) {
    console.error('Failed to load or parse user_info from localStorage', e);
  }
  return null;
};

export const setUserInfo = (userInfo) => {
  const userInfoWithTimestamp = { ...userInfo, timestamp: Date.now() };
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfoWithTimestamp));
};

export const removeUserInfo = () => {
  localStorage.removeItem(USER_INFO_KEY);
};

export const FOLLOW_KEY = 'favorites';
export const MANGA_KEY = 'bookmarks'; 