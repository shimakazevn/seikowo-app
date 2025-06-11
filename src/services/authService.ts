// Auth Service with persistent login - tokens remain valid until explicit logout
import { blogConfig } from '../config';
import {
  saveUserData,
  getUserData,
  deleteUserData,
  getHistoryData,
  saveHistoryData,
  clearDataFromDB
} from '../utils/indexedDBUtils';

// Types
export interface UserInfo {
  sub: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email_verified: boolean;
}

export interface UserData extends UserInfo {
  id: string;
  timestamp: number;
  lastSyncTime: number;
  syncStatus: {
    totalFollows: number;
    totalBookmarks: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

// Constants
const TOKEN_STORAGE_KEY = 'auth_tokens';
const USER_STORAGE_KEY = 'user_data';

// Secure Token Management
export class TokenManager {
  private static instance: TokenManager;
  private tokens: AuthTokens | null = null;

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  async saveTokens(tokens: AuthTokens): Promise<void> {
    try {
      console.log('[TokenManager] Saving tokens securely...');

      // 1. Store in memory (primary)
      this.tokens = tokens;
      console.log('[TokenManager] Tokens stored in memory');

      // 2. Try secure storage first, fallback to localStorage if needed
      try {
        const { secureStorage } = await import('../utils/secureStorage');
        await secureStorage.setItem('auth_tokens', tokens, {
          keyName: 'auth',
          sessionKey: false // Use persistent localStorage-based encryption key for persistent login
        });
        console.log('[TokenManager] Tokens stored in secure storage');
      } catch (secureError) {
        console.warn('[TokenManager] Secure storage failed, falling back to localStorage:', secureError);

        // Fallback to localStorage (less secure but functional)
        localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
        console.log('[TokenManager] Tokens stored in localStorage (fallback)');
      }

      console.log('[TokenManager] Tokens saved successfully');
    } catch (error) {
      console.error('[TokenManager] Critical error saving tokens:', error);

      // Last resort: try localStorage directly
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
        this.tokens = tokens;
        console.log('[TokenManager] Tokens saved to localStorage as last resort');
      } catch (lastResortError) {
        console.error('[TokenManager] All storage methods failed:', lastResortError);
        throw new Error('Failed to save authentication tokens');
      }
    }
  }

  async getTokens(): Promise<AuthTokens | null> {
    try {
      console.log('[TokenManager] Getting tokens - checking all storage locations...');

      // 1. Check memory first (fastest)
      if (this.tokens) {
        console.log('[TokenManager] Returning cached tokens from memory');
        return this.tokens;
      }

      // 2. Try to restore from secure storage
      try {
        console.log('[TokenManager] Checking secure storage...');
        const { secureStorage } = await import('../utils/secureStorage');
        const storedTokens = await secureStorage.getItem<AuthTokens>('auth_tokens', {
          keyName: 'auth',
          sessionKey: false // Use persistent localStorage-based encryption key
        });

        if (storedTokens) {
          console.log('[TokenManager] Found persistent encrypted tokens, caching...');
          this.tokens = storedTokens;
          console.log('[TokenManager] Persistent tokens cached successfully');
          return this.tokens;
        }
      } catch (secureError) {
        console.warn('[TokenManager] Secure storage read failed:', secureError);
      }

      // 3. Fallback: Check localStorage
      const legacyStored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (legacyStored) {
        console.log('[TokenManager] Found tokens in localStorage...');
        this.tokens = JSON.parse(legacyStored);

        // Try to migrate to secure storage (optional)
        try {
          await this.saveTokens(this.tokens);
          console.log('[TokenManager] Tokens migrated to secure storage');
        } catch (migrationError) {
          console.warn('[TokenManager] Migration failed, keeping in localStorage:', migrationError);
        }

        return this.tokens;
      }

      console.log('[TokenManager] No tokens found in any storage location');
      console.log('[TokenManager] Storage check summary:', {
        memoryCache: !!this.tokens,
        secureStorageChecked: true,
        localStorageChecked: true,
        foundTokens: false
      });
      return null;
    } catch (error) {
      console.error('[TokenManager] Error getting tokens:', error);
      return null;
    }
  }

  async clearTokens(): Promise<void> {
    try {
      console.log('[TokenManager] ⚠️ CLEARING ALL TOKENS - this should only happen on logout or auth error');
      console.trace('[TokenManager] Token clear stack trace:');

      // 1. Clear memory
      this.tokens = null;

      // 2. Try to clear secure storage
      try {
        const { secureStorage } = await import('../utils/secureStorage');
        await secureStorage.removeItem('auth_tokens');
        await secureStorage.clearAllKeys();
        console.log('[TokenManager] Secure storage cleared');
      } catch (secureError) {
        console.warn('[TokenManager] Secure storage clear failed:', secureError);
      }

      // 3. Clear localStorage (always)
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      console.log('[TokenManager] localStorage cleared');

      console.log('[TokenManager] All tokens cleared successfully');
    } catch (error) {
      console.error('[TokenManager] Error clearing tokens:', error);
    }
  }

  async isTokenValid(): Promise<boolean> {
    try {
      const tokens = await this.getTokens();
      if (!tokens?.accessToken) {
        console.log('[TokenManager] No access token found');
        return false;
      }

      // Check if token has expiry and is expired
      if (tokens.expiresAt && Date.now() >= tokens.expiresAt) {
        console.log('[TokenManager] Token has expired, attempting refresh...');

        // Try to refresh token if we have refresh token
        if (tokens.refreshToken) {
          const refreshed = await this.refreshAccessToken(tokens.refreshToken);
          return refreshed;
        }

        console.log('[TokenManager] No refresh token available, token invalid');
        return false;
      }

      console.log('[TokenManager] Token is valid');
      return true;
    } catch (error) {
      console.error('[TokenManager] Error checking token validity:', error);
      return false;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<boolean> {
    try {
      console.log('[TokenManager] Refreshing access token...');

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[TokenManager] Failed to refresh token:', response.status, errorText);
        return false;
      }

      const data = await response.json();

      if (data.access_token) {
        // Update tokens with new access token
        const newTokens: AuthTokens = {
          accessToken: data.access_token,
          refreshToken: refreshToken, // Keep the same refresh token
          expiresAt: Date.now() + ((data.expires_in || 3600) * 1000), // Convert seconds to milliseconds
        };

        await this.saveTokens(newTokens);
        console.log('[TokenManager] Token refreshed successfully, expires in:', data.expires_in, 'seconds');
        return true;
      }

      console.error('[TokenManager] No access token in refresh response');
      return false;
    } catch (error) {
      console.error('[TokenManager] Error refreshing token:', error);
      return false;
    }
  }
}

// Auth Service
export class AuthService {
  private static instance: AuthService;
  public tokenManager: TokenManager;
  private currentUserPromise: Promise<UserData | null> | null = null;

  constructor() {
    this.tokenManager = TokenManager.getInstance();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async getUserInfo(accessToken: string): Promise<UserInfo> {
    try {
      console.log('Getting user info with token:', accessToken ? 'Token present' : 'No token');

      // Try the newer userinfo endpoint first
      let response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('User info response status (v3):', response.status);

      // If v3 fails, try v2 endpoint
      if (!response.ok) {
        console.log('v3 endpoint failed, trying v2...');
        response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        console.log('User info response status (v2):', response.status);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('User info error response:', errorText);
        throw new Error(`Failed to get user info: ${response.status} - ${errorText}`);
      }

      const userInfo = await response.json();
      console.log('User info received:', {
        sub: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        hasAllFields: !!(userInfo.sub && userInfo.email && userInfo.name)
      });

      if (!userInfo.sub) {
        throw new Error('Invalid user info received - missing sub field');
      }

      return userInfo;
    } catch (error) {
      console.error('Error getting user info:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get user information');
    }
  }

  async login(accessToken: string): Promise<UserData> {
    try {
      console.log('=== Starting AuthService Login ===');
      console.log('Access token provided:', accessToken ? 'Yes' : 'No');

      // Get user info from Google
      console.log('Step 1: Getting user info from Google...');
      const userInfo = await this.getUserInfo(accessToken);
      console.log('Step 1 completed: User info received');

      // Save tokens with expiry (1 hour default for Google OAuth)
      console.log('Step 2: Saving tokens...');
      await this.tokenManager.saveTokens({
        accessToken,
        expiresAt: Date.now() + (3600 * 1000) // 1 hour expiry
      });
      console.log('Step 2 completed: Tokens saved with 1 hour expiry');

      // Get existing user data (no more guest data merging)
      const existingUserData = await getUserData(userInfo.sub);
      const existingFollows = existingUserData ? await getHistoryData('follows', userInfo.sub) : null;
      const existingBookmarks = existingUserData ? await getHistoryData('bookmarks', userInfo.sub) : null;

      // Ensure arrays
      const mergedFollows = Array.isArray(existingFollows) ? existingFollows : [];
      const mergedBookmarks = Array.isArray(existingBookmarks) ? existingBookmarks : [];

      // Create user data
      const userData: UserData = {
        id: userInfo.sub,
        sub: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        given_name: userInfo.given_name,
        family_name: userInfo.family_name,
        picture: userInfo.picture,
        email_verified: userInfo.email_verified,

        timestamp: Date.now(),
        lastSyncTime: Date.now(),
        syncStatus: {
          totalFollows: mergedFollows.length,
          totalBookmarks: mergedBookmarks.length
        }
      };

      // Save user data and history
      await saveUserData(userInfo.sub, userData);
      await saveHistoryData('follows', userInfo.sub, mergedFollows);
      await saveHistoryData('bookmarks', userInfo.sub, mergedBookmarks);

      // No guest data to clear anymore

      return userData;
    } catch (error) {
      console.error('Login error:', error);
      await this.tokenManager.clearTokens();
      throw error;
    }
  }

  async logout(userId?: string): Promise<void> {
    try {
      // Clear tokens first
      await this.tokenManager.clearTokens();

      // Clear user data if userId provided
      if (userId) {
        await deleteUserData(userId);
        await clearDataFromDB('follows', userId);
        await clearDataFromDB('bookmarks', userId);
        await clearDataFromDB('reads', userId);
      }

      // No guest data to clear anymore
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getCurrentUser(retryCount = 0): Promise<UserData | null> {
    // Prevent multiple concurrent calls
    if (this.currentUserPromise && retryCount === 0) {
      console.log('[AuthService] Returning cached getCurrentUser promise');
      return this.currentUserPromise;
    }

    this.currentUserPromise = this._getCurrentUserInternal(retryCount);

    try {
      const result = await this.currentUserPromise;
      return result;
    } finally {
      // Clear the promise after completion
      if (retryCount === 0) {
        this.currentUserPromise = null;
      }
    }
  }

  private async _getCurrentUserInternal(retryCount = 0): Promise<UserData | null> {
    try {
      console.log(`[AuthService] Getting current user (attempt ${retryCount + 1})...`);

      const tokens = await this.tokenManager.getTokens();
      if (!tokens?.accessToken) {
        console.log('[AuthService] No access token found');
        return null;
      }
      console.log('[AuthService] Access token found');

      const isValid = await this.tokenManager.isTokenValid();
      if (!isValid) {
        console.log('[AuthService] Token is invalid, clearing tokens');
        await this.tokenManager.clearTokens();
        return null;
      }
      console.log('[AuthService] Token is valid (persistent)');

      // Try to get user info from token with timeout
      console.log('[AuthService] Getting user info...');
      const userInfo = await Promise.race([
        this.getUserInfo(tokens.accessToken),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('getUserInfo timeout')), 10000)
        )
      ]) as any;
      console.log('[AuthService] User info received, getting user data...');

      const userData = await getUserData(userInfo.sub);
      console.log('[AuthService] User data retrieved:', userData ? 'Found' : 'Not found');

      return userData;
    } catch (error) {
      console.error(`[AuthService] Error getting current user (attempt ${retryCount + 1}):`, error);

      // Retry disabled to prevent infinite loops
      // if (retryCount < 2 && (error.message?.includes('timeout') || error.message?.includes('network'))) {
      //   console.log(`[AuthService] Retrying getCurrentUser in ${(retryCount + 1) * 1000}ms...`);
      //   await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
      //   return this.getCurrentUser(retryCount + 1);
      // }

      // Only clear tokens on explicit auth errors, preserve persistent login
      if (error.message?.includes('401') || error.message?.includes('unauthorized') || error.message?.includes('invalid_token')) {
        console.log('[AuthService] Auth error detected, clearing tokens');
        await this.tokenManager.clearTokens();
      } else {
        console.log('[AuthService] Network/temporary error, keeping persistent token');
      }

      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch (error) {
      return false;
    }
  }

  async loginWithGoogle(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Lỗi kết nối với Google');
      }

      const data = await response.json();
      await this.tokenManager.saveTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in * 1000)
      });

      return true;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  private mergeArrays(arr1: any[], arr2: any[], keyField: string): any[] {
    // Ensure both inputs are arrays
    const safeArr1 = Array.isArray(arr1) ? arr1 : [];
    const safeArr2 = Array.isArray(arr2) ? arr2 : [];

    const merged = [...safeArr1];
    const existingIds = new Set(safeArr1.map(item => item && item[keyField]).filter(Boolean));

    safeArr2.forEach(item => {
      if (item && item[keyField] && !existingIds.has(item[keyField])) {
        merged.push(item);
      }
    });

    return merged;
  }


}

// Export singleton instance
export const authService = AuthService.getInstance();
