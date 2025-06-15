import { create } from 'zustand';
import { persist, StorageValue } from 'zustand/middleware';
import {
  encryptAndStoreToken,
  getAndDecryptToken,
  encryptAndStoreUserData,
  getAndDecryptUserData,
  clearEncryptedData,
  createSecureSession,
  validateSession,
  generateTOTP,
  verifyTOTP,
  decryptData
} from '../utils/securityUtils';
import { clearUserInfo, setUserInfo, getRefreshToken } from '../utils/userUtils';
import {
  clearHistoryData,
  getHistoryData,
  saveHistoryData,
  deleteUserData,
  getUserData,
  saveUserData,
  getDataFromDB,
  initializeDatabase
} from '../utils/indexedDBUtils';
import { clearCachedData, CACHE_KEYS } from '../utils/cache';
import { backupUserData, refreshToken, restoreUserData } from '../api/auth';
import type { User, UserData } from '../types/global';
import useFavoriteBookmarkStore from './useFavoriteBookmarkStore';

console.log('[useUserStore.ts] File loaded. Initial localStorage value for store-key:', localStorage.getItem('user-storage'));

const STORE_KEY = 'user-storage';

// Separate function to initialize IndexedDB and validate persisted state
export const initializePersistedState = async (): Promise<{ hasValidToken: boolean; accessToken: string | null; expiresIn: number | null }> => {
  try {
    // Initialize IndexedDB first
    await initializeDatabase();
    
    // Then validate the persisted state
    const str = localStorage.getItem(STORE_KEY);
    if (!str) {
      console.log('[useUserStore] No persisted state found.');
      return { hasValidToken: false, accessToken: null, expiresIn: null };
    }

    let token = await getAndDecryptToken();
    let expiresIn: number | null = null;

    if (!token) {
      console.log('[useUserStore] No valid token found in encrypted storage, attempting to refresh...');
      const refreshTokenValue = await getRefreshToken();
      if (refreshTokenValue) {
        try {
          const newTokenData = await refreshToken(refreshTokenValue); // Assuming refreshToken returns { accessToken, expiresIn }
          if (newTokenData && newTokenData.accessToken) {
            console.log('[useUserStore] Successfully refreshed token.');
            await encryptAndStoreToken(newTokenData.accessToken);
            token = newTokenData.accessToken;
            expiresIn = newTokenData.expiresIn; // Store expiresIn
          }
        } catch (error) {
          console.error('[useUserStore] Error refreshing token during initializePersistedState:', error);
        }
      }
      if (!token) {
        console.log('[useUserStore] No valid token and refresh failed.');
        return { hasValidToken: false, accessToken: null, expiresIn: null };
      }
    }

    // Validate token with Google API (if token exists)
    if (token) {
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      
        if (!response.ok) {
          console.log('[useUserStore] Token validation failed with Google API, attempting to refresh...');
          const refreshTokenValue = await getRefreshToken();
          if (refreshTokenValue) {
            try {
              const newTokenData = await refreshToken(refreshTokenValue);
              if (newTokenData && newTokenData.accessToken) {
                console.log('[useUserStore] Successfully refreshed token after API validation failure.');
                await encryptAndStoreToken(newTokenData.accessToken);
                token = newTokenData.accessToken;
                expiresIn = newTokenData.expiresIn;
                return { hasValidToken: true, accessToken: token, expiresIn };
              }
            } catch (error) {
              console.error('[useUserStore] Error refreshing token after API validation:', error);
            }
          }
          console.log('[useUserStore] Token validation failed and refresh failed.');
          return { hasValidToken: false, accessToken: null, expiresIn: null };
        } else {
          const tokenInfo = await response.json();
          expiresIn = tokenInfo.expires_in; // Get expiresIn from tokeninfo
          console.log('[useUserStore] Token successfully validated with Google API. Expires in:', expiresIn);
          return { hasValidToken: true, accessToken: token, expiresIn };
        }
      } catch (error) {
        console.error('[useUserStore] Error validating token with Google API:', error);
        return { hasValidToken: false, accessToken: null, expiresIn: null };
      }
    }
    return { hasValidToken: false, accessToken: null, expiresIn: null }; // Should not reach here if token is null
  } catch (error) {
    console.error('[useUserStore] Unexpected error during initializePersistedState:', error);
    return { hasValidToken: false, accessToken: null, expiresIn: null };
  }
};

// Initial state
const initialState = {
  user: null as User | null,
  isAuthenticated: false,
  accessToken: null as string | null,
  accessTokenExpiresAt: null as number | null,
  accessTokenIssuedAt: null as number | null,
  is2FAEnabled: false,
  is2FAVerified: false,
  lastSyncTime: null as number | null,
  syncStatus: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  syncError: null as string | null,
  isOffline: false,
  userId: null as string | null,
  storeReady: false,
  temp2FASecret: null as string | null,
  temp2FACode: null as string | null,
  hasAccessToken: false,
  hasUserId: false,
  isRestoringData: false,
  restoreProgress: 0,
  restoreStatus: '',
};

// Store state type
type UserStoreState = {
  user: User | null;
  isAuthenticated: boolean;
  is2FAEnabled: boolean;
  is2FAVerified: boolean;
  lastSyncTime: number | null;
  syncStatus: 'idle' | 'loading' | 'success' | 'error';
  syncError: string | null;
  isOffline: boolean;
  userId: string | null;
  storeReady: boolean;
  hasUserId: boolean;
  accessToken: string | null;
  accessTokenExpiresAt: number | null;
  accessTokenIssuedAt: number | null;
  hasAccessToken: boolean;
  temp2FASecret: string | null;
  temp2FACode: string | null;
  isRestoringData: boolean;
  restoreProgress: number;
  restoreStatus: string;
};

interface PersistedUserStoreState {
  user: User | null;
  isAuthenticated: boolean;
  is2FAEnabled: boolean;
  is2FAVerified: boolean;
  lastSyncTime: number | null;
  syncStatus: 'idle' | 'loading' | 'success' | 'error';
  syncError: string | null;
  isOffline: boolean;
  userId: string | null;
  storeReady: boolean;
  hasUserId: boolean;
  temp2FASecret: string | null;
  temp2FACode: string | null;
  isRestoringData: boolean;
  restoreProgress: number;
  restoreStatus: string;
}

// Store state interface
type UserStore = typeof initialState & {
  // Actions
  initializeUser: () => Promise<boolean>;
  setUser: (userData: User | null, accessToken: string | null) => Promise<boolean>;
  setAccessToken: (token: string | null) => Promise<boolean>;
  getAccessToken: () => Promise<string | null>;
  enable2FA: () => Promise<{ secret: string | null; code: string | null } | null>;
  verifyAndEnable2FA: (code: string) => Promise<boolean>;
  verify2FA: (code: string) => Promise<boolean>;
  disable2FA: (code: string) => Promise<boolean>;
  syncUserData: (accessToken: string, userId: string) => Promise<boolean>;
  setOfflineStatus: (isOffline: boolean) => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  clearUserData: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
  getValidAccessToken: () => Promise<string | null>;
  logout: () => Promise<void>;
  restoreAndSaveUserData: (accessToken: string, userId: string) => Promise<boolean>;
};

interface StorageData {
  state: PersistedUserStoreState; // Use the new interface here
  version: number;
  timestamp: number;
}

const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      initializeUser: async () => {
        const currentStoreState = get();
        console.log('[useUserStore] initializeUser called. Current storeReady:', currentStoreState.storeReady);

        try {
          console.log('[useUserStore] Initializing persisted state for user...');
          const { hasValidToken, accessToken: initialAccessToken, expiresIn: initialExpiresIn } = await initializePersistedState();
          console.log('[useUserStore] Persisted state initialized. Has valid token:', hasValidToken);

          if (!hasValidToken || !initialAccessToken) {
            console.log('[useUserStore] No valid token after persistence initialization, logging out.');
            await get().logout();
            set({ storeReady: true, accessToken: null, accessTokenExpiresAt: null, accessTokenIssuedAt: null, hasAccessToken: false });
            return false;
          }

          // Load user data from encrypted storage
          const userData = await getAndDecryptUserData<UserData>();

          console.log('[useUserStore] initializeUser - decrypted data:', {
            hasUserData: !!userData,
            hasToken: !!initialAccessToken
          });

          if (userData && initialAccessToken) {
            console.log('[useUserStore] Both user data and token found, setting authenticated state.');
            const user: User = {
              sub: userData.sub,
              name: userData.name,
              given_name: userData.given_name,
              family_name: userData.family_name,
              picture: userData.picture,
              email: userData.email,
              email_verified: userData.email_verified,
              locale: userData.locale,
              is2FAEnabled: userData.is2FAEnabled,
              twoFactorSecret: userData.twoFactorSecret,
              isAuthenticated: true,
              id: userData.id || userData.sub,
              updatedAt: userData.updatedAt,
              timestamp: Number(Date.now()), // This is user data timestamp
              lastSyncTime: userData.lastSyncTime || null,
              syncStatus: userData.syncStatus || 'idle',
            };

            const userId = user.sub || user.id;
            const issuedAt = Date.now();
            const expiresAt = issuedAt + (initialExpiresIn ? initialExpiresIn * 1000 : 3600 * 1000); // Calculate actual expiry

            set({
              user,
              isAuthenticated: true,
              accessToken: initialAccessToken,
              accessTokenExpiresAt: expiresAt,
              accessTokenIssuedAt: issuedAt,
              storeReady: true,
              hasUserId: true,
              userId,
              hasAccessToken: true,
            });
            return true;
          } else {
            console.log('[useUserStore] User data or initial access token missing after persistence. Logging out.');
            await get().logout();
            set({ storeReady: true, accessToken: null, accessTokenExpiresAt: null, accessTokenIssuedAt: null, hasAccessToken: false });
            return false;
          }
        } catch (error) {
          console.error('[useUserStore] Error during initializeUser:', error);
          await get().logout();
          set({ storeReady: true, accessToken: null, accessTokenExpiresAt: null, accessTokenIssuedAt: null, hasAccessToken: false });
          return false;
        }
      },

      setUser: async (userData: User | null, accessToken: string | null) => {
        if (!userData || !accessToken) {
          await get().logout();
          return false;
        }

        const issuedAt = Date.now();
        // We don't have expiresIn here, so we'll rely on getValidAccessToken to refresh if needed
        // or assume a default very long expiry if not explicitly given
        const expiresAt = issuedAt + (3600 * 1000); // Default 1 hour expiry if not known

        set({
          user: userData,
          isAuthenticated: true,
          accessToken,
          accessTokenExpiresAt: expiresAt,
          accessTokenIssuedAt: issuedAt,
          userId: userData.sub || userData.id,
          hasUserId: true,
          hasAccessToken: true,
        });

        try {
          await encryptAndStoreUserData(userData);
          await encryptAndStoreToken(accessToken);
          console.log('[useUserStore] User and token data set and encrypted.');
          return true;
        } catch (error) {
          console.error('[useUserStore] Error setting user and token data:', error);
          return false;
        }
      },

      setAccessToken: async (token: string | null) => {
        if (!token) {
          set({
            accessToken: null,
            accessTokenExpiresAt: null,
            accessTokenIssuedAt: null,
            hasAccessToken: false
          });
          await clearEncryptedData();
          return false;
        }

        const issuedAt = Date.now();
        // Again, no expiresIn here. getValidAccessToken will revalidate and update.
        const expiresAt = issuedAt + (3600 * 1000); // Default 1 hour expiry if not known

        set({
          accessToken: token,
          accessTokenExpiresAt: expiresAt,
          accessTokenIssuedAt: issuedAt,
          hasAccessToken: true,
        });

        try {
          await encryptAndStoreToken(token);
          console.log('[useUserStore] Access token set and encrypted.');
          return true;
        } catch (error) {
          console.error('[useUserStore] Error setting access token:', error);
          return false;
        }
      },

      getAccessToken: async () => {
        const token = await getAndDecryptToken();
        set({ hasAccessToken: !!token });
        return token;
      },

      getValidAccessToken: async () => {
        const { accessToken, accessTokenExpiresAt, accessTokenIssuedAt, user } = get();
        const now = Date.now();

        if (accessToken && accessTokenExpiresAt && accessTokenIssuedAt && now < accessTokenExpiresAt) {
          console.log('[useUserStore] Existing access token is still valid. Expires in:', Math.floor((accessTokenExpiresAt - now) / 1000), 'seconds.');
          return accessToken;
        }

        console.log('[useUserStore] Access token expired or not available. Attempting to refresh...');
        const refreshTokenValue = await getRefreshToken();

        if (!refreshTokenValue) {
          console.warn('[useUserStore] No refresh token available. User needs to re-authenticate.');
          await get().logout();
          return null;
        }

        try {
          const newTokenData = await refreshToken(refreshTokenValue); // Assuming this returns { accessToken, expiresIn }
          if (newTokenData && newTokenData.accessToken) {
            console.log('[useUserStore] Token refreshed successfully. New token expires in:', newTokenData.expiresIn, 'seconds.');
            await encryptAndStoreToken(newTokenData.accessToken);

            const newIssuedAt = Date.now();
            const newExpiresAt = newIssuedAt + (newTokenData.expiresIn * 1000 || 3600 * 1000);

            set({
              accessToken: newTokenData.accessToken,
              accessTokenExpiresAt: newExpiresAt,
              accessTokenIssuedAt: newIssuedAt,
              isAuthenticated: true,
              hasAccessToken: true,
            });
            return newTokenData.accessToken;
          } else {
            console.error('[useUserStore] Refresh token failed to return a new access token.');
            await get().logout();
            return null;
          }
        } catch (refreshError: any) {
          console.error('[useUserStore] Error refreshing token:', refreshError);
          if (refreshError.message.includes('invalid_grant')) {
            console.error('[useUserStore] Invalid refresh token. Logging out.');
            await get().logout();
          }
          return null;
        }
      },

      logout: async () => {
        console.log('[useUserStore] Logging out user...');
        await get().clearUserData();
        console.log('[useUserStore] User logged out.');
      },

      // Add other actions (enable2FA, verify2FA, disable2FA, etc.) as needed
      enable2FA: async () => {
        try {
          const secretResult = await generateTOTP();
          set({ temp2FASecret: secretResult?.secret || null });
          return { secret: secretResult?.secret || null, code: secretResult?.code || null };
        } catch (error) {
          console.error('Error enabling 2FA:', error);
          return null;
        }
      },

      verifyAndEnable2FA: async (code: string) => {
        const { temp2FASecret, userId, accessToken } = get();
        if (!temp2FASecret || !userId || !accessToken) {
          console.error('Missing 2FA secret, userId, or accessToken for verification');
          return false;
        }
        if (temp2FASecret && await verifyTOTP(temp2FASecret, code)) {
          // Save 2FA status to user data and backup
          const user = get().user;
          if (user) {
            const updatedUser = { ...user, is2FAEnabled: true, twoFactorSecret: temp2FASecret };
            set({ user: updatedUser, is2FAEnabled: true });
            await encryptAndStoreUserData(updatedUser);
            await backupUserData(userId, updatedUser);
            console.log('[useUserStore] 2FA enabled and backed up.');
            set({ temp2FASecret: null, temp2FACode: null });
            return true;
          }
        }
        return false;
      },

      verify2FA: async (code: string) => {
        const { user } = get();
        if (!user || !user.is2FAEnabled || !user.twoFactorSecret) {
          console.error('2FA not enabled or secret missing for verification');
          return false;
        }
        const isValid = await verifyTOTP(user.twoFactorSecret, code);
        set({ is2FAVerified: isValid });
        return isValid;
      },

      disable2FA: async (code: string) => {
        const { user, userId, accessToken } = get();
        if (!user || !userId || !accessToken) {
          console.error('Missing user, userId, or accessToken for disabling 2FA');
          return false;
        }
        if (user.twoFactorSecret && await verifyTOTP(user.twoFactorSecret, code)) {
          const updatedUser = { ...user, is2FAEnabled: false, twoFactorSecret: null };
          set({ user: updatedUser, is2FAEnabled: false, is2FAVerified: false });
          await encryptAndStoreUserData(updatedUser);
          await backupUserData(userId, updatedUser);
          console.log('[useUserStore] 2FA disabled and backed up.');
          return true;
        }
        return false;
      },

      syncUserData: async (accessToken: string, userId: string) => {
        set({ syncStatus: 'loading' });
        try {
          const favoriteStore = useFavoriteBookmarkStore.getState();
          const { favorites, bookmarks, reads } = favoriteStore; // Assuming these are arrays

          const dataToBackup: UserData = {
            sub: userId,
            email: get().user?.email || '',
            name: get().user?.name || '',
            given_name: get().user?.given_name || '',
            family_name: get().user?.family_name || '',
            picture: get().user?.picture || '',
            email_verified: get().user?.email_verified || false,
            locale: get().user?.locale || 'en',
            is2FAEnabled: get().user?.is2FAEnabled || false,
            twoFactorSecret: get().user?.twoFactorSecret || null,
            id: userId,
            updatedAt: new Date().toISOString(),
            timestamp: Date.now(),
            lastSyncTime: Date.now(),
            syncStatus: 'success',
            favoritePosts: favorites,
            mangaBookmarks: bookmarks,
            readPosts: reads.map((r: any) => ({ id: r.id, readAt: r.readAt }))
          };

          await backupUserData(userId, dataToBackup);
          set({ syncStatus: 'success', lastSyncTime: Date.now(), syncError: null });
          console.log('[useUserStore] User data synced successfully.');
          return true;
        } catch (error: any) {
          set({ syncStatus: 'error', syncError: error.message });
          console.error('[useUserStore] Error syncing user data:', error);
          return false;
        }
      },

      setOfflineStatus: (isOffline: boolean) => {
        set({ isOffline });
      },

      updateProfile: async (updates: Partial<User>) => {
        const currentUser = get().user;
        if (!currentUser) {
          console.error('[useUserStore] No user to update profile for.');
          return false;
        }
        const updatedUser = { ...currentUser, ...updates, updatedAt: new Date().toISOString() };
        set({ user: updatedUser });
        try {
          // Also update in encrypted storage
          await encryptAndStoreUserData(updatedUser);
          // And backup to drive if authenticated
          const { userId } = get();
          if (userId) {
            await backupUserData(userId, updatedUser);
          }
          return true;
        } catch (error) {
          console.error('[useUserStore] Error updating profile:', error);
          return false;
        }
      },

      restoreAndSaveUserData: async (accessToken: string, userId: string) => {
        set({ isRestoringData: true, restoreProgress: 0, restoreStatus: 'Đang khôi phục...' });
        try {
          const restoredData = await restoreUserData(userId);
          if (restoredData) {
            // Update user info in store
            const userToSet: User = {
              sub: restoredData.sub,
              name: restoredData.name,
              given_name: restoredData.given_name,
              family_name: restoredData.family_name,
              picture: restoredData.picture,
              email: restoredData.email,
              email_verified: restoredData.email_verified || false,
              locale: restoredData.locale || 'en',
              is2FAEnabled: restoredData.is2FAEnabled || false,
              twoFactorSecret: restoredData.twoFactorSecret || null,
              isAuthenticated: true,
              id: restoredData.id || restoredData.sub,
              updatedAt: restoredData.updatedAt || new Date().toISOString(),
              timestamp: restoredData.timestamp || Date.now(),
              lastSyncTime: restoredData.lastSyncTime || null,
              syncStatus: restoredData.syncStatus || 'idle',
            };
            set({ user: userToSet, userId: userToSet.id, isAuthenticated: true });

            // Update favorites, bookmarks, reads stores
            const favoriteStore = useFavoriteBookmarkStore.getState();
            await favoriteStore.setFavorites(restoredData.favoritePosts || []);
            await favoriteStore.setBookmarks(restoredData.mangaBookmarks || []);
            await favoriteStore.setReads(restoredData.readPosts || []);

            // Save to encrypted storage
            await encryptAndStoreUserData(restoredData);

            set({ isRestoringData: false, restoreProgress: 100, restoreStatus: 'Khôi phục thành công!' });
            console.log('[useUserStore] User data restored and saved successfully.');
            return true;
          }
          set({ isRestoringData: false, restoreProgress: 0, restoreStatus: 'Không tìm thấy dữ liệu để khôi phục.' });
          return false;
        } catch (error: any) {
          console.error('[useUserStore] Error restoring user data:', error);
          set({ isRestoringData: false, restoreProgress: 0, restoreStatus: `Khôi phục thất bại: ${error.message}` });
          return false;
        }
      },

      clearUserData: async () => {
        try {
          console.log('[useUserStore] Clearing all user data...');
          await clearEncryptedData();
          const currentUserId = get().userId;
          if (currentUserId) {
            await clearHistoryData('favorites', currentUserId);
            await clearHistoryData('reads', currentUserId);
            await clearHistoryData('bookmarks', currentUserId);
            await deleteUserData(currentUserId);
          }
          clearUserInfo();
          clearCachedData(CACHE_KEYS.ATOM_POSTS);

          set({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            is2FAEnabled: false,
            is2FAVerified: false,
            lastSyncTime: null,
            syncStatus: 'idle',
            syncError: null,
            isOffline: false,
            userId: null,
            storeReady: true,
            temp2FASecret: null,
            temp2FACode: null,
            hasAccessToken: false,
            hasUserId: false,
            isRestoringData: false,
            restoreProgress: 0,
            restoreStatus: '',
          });
          console.log('[useUserStore] All user data cleared successfully.');
        } catch (error) {
          console.error('[useUserStore] Error clearing user data:', error);
        }
      },

      checkAuthStatus: async () => {
        try {
          const token = await get().getValidAccessToken();
          const user = get().user;
          return !!token && !!user; // Simple check
        } catch (error) {
          console.error('[useUserStore] Error checking auth status:', error);
          return false;
        }
      },
    }),
    {
      name: STORE_KEY, // unique name
      storage: { // Changed from getStorage
        getItem: async (name: string): Promise<StorageValue<UserStoreState> | null> => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            const data: StorageValue<UserStoreState> = JSON.parse(str);
            // Ensure nullable fields are null if they are undefined from parsing
            const state = data.state;
            const sanitizedState: UserStoreState = {
              ...state, // Spread the parsed state
              user: state.user !== undefined ? state.user : null,
              temp2FASecret: state.temp2FASecret !== undefined ? state.temp2FASecret : null, // Fix typo: changed temp2FACode to temp2FASecret
              temp2FACode: state.temp2FACode !== undefined ? state.temp2FACode : null,
              // Ensure non-persisted sensitive data is reset or re-derived if needed
              accessToken: null, 
              accessTokenExpiresAt: null, 
              accessTokenIssuedAt: null, 
              hasAccessToken: false, 
            };
            return { state: sanitizedState, version: data.version };
          } catch (error) {
            console.error('[useUserStore] Error parsing persisted state:', error);
            return null;
          }
        },
        setItem: (name: string, value: StorageValue<UserStoreState>) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name: string) => localStorage.removeItem(name),
      },
      // Define which parts of the state to persist
      partialize: (state): UserStoreState => ({ // Explicitly type as UserStoreState
        user: state.user || null, // Ensure user is User | null
        isAuthenticated: state.isAuthenticated,
        is2FAEnabled: state.is2FAEnabled,
        is2FAVerified: state.is2FAVerified,
        lastSyncTime: state.lastSyncTime,
        syncStatus: state.syncStatus,
        syncError: state.syncError,
        isOffline: state.isOffline,
        userId: state.userId,
        storeReady: state.storeReady,
        hasUserId: state.hasUserId,
        temp2FASecret: state.temp2FASecret || null,
        temp2FACode: state.temp2FACode || null,
        isRestoringData: state.isRestoringData,
        restoreProgress: state.restoreProgress,
        restoreStatus: state.restoreStatus,
        // Properties not persisted in localStorage but required by UserStoreState
        accessToken: null, 
        accessTokenExpiresAt: null, 
        accessTokenIssuedAt: null, 
        hasAccessToken: false,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.storeReady = true; // Mark as ready after rehydration
        }
      },
      version: 1,
    }
  )
);

export default useUserStore;