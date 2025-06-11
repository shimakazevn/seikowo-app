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
  getDataFromDB
} from '../utils/indexedDBUtils';
import { clearCachedData, CACHE_KEYS } from '../utils/cache';
import { backupUserData, isTokenValid, refreshToken, restoreUserData } from '../api/auth';
import type { User, UserData } from '../types/global';

// Initial state
const initialState = {
  user: null as User | null,
  isAuthenticated: false,
  accessToken: null as string | null,
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
};

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
  syncUserData: (accessToken?: string, userId?: string) => Promise<boolean>;
  setOfflineStatus: (isOffline: boolean) => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  clearUserData: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
  getValidAccessToken: () => Promise<string | null>;
  logout: () => Promise<void>;
  restoreAndSaveUserData: (accessToken: string, userId: string) => Promise<boolean>;
};

interface StorageData {
  state: UserStore;
  version: number;
  timestamp: number;
}

const STORE_KEY = 'user-storage';

const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      initializeUser: async () => {
        try {
          // Get current state before initialization
          const currentState = get();

          // Load user data with proper type
          const userData = await getAndDecryptUserData<UserData>();

          // Load access token
          const accessToken = await getAndDecryptToken();

          if (userData) {
            // Convert UserData to User
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
              isAuthenticated: userData.isAuthenticated,
              id: userData.id || userData.sub,
              updatedAt: userData.updatedAt,
              timestamp: userData.timestamp
            };

            const userId = user.sub || user.id;
            console.log('[useUserStore] Setting user data:', { 
              userId,
              hasSub: !!user.sub,
              hasId: !!user.id,
              hasToken: !!accessToken,
              userData
            });

            const newState = {
              user: user,
              isAuthenticated: true,
              accessToken: accessToken || null,
              storeReady: true,
              hasUserId: !!userId,
              userId: userId || null,
              hasAccessToken: !!accessToken
            };

            set(newState);
            return true;
          }

          set({
            storeReady: true,
            hasUserId: false,
            isAuthenticated: false,
            user: null,
            userId: null,
            accessToken: null,
            hasAccessToken: false
          });
          return false;
        } catch (error: any) {
          console.error('[useUserStore] Error initializing user:', error);
          set({
            storeReady: true,
            hasUserId: false,
            isAuthenticated: false,
            user: null,
            userId: null,
            accessToken: null,
            hasAccessToken: false
          });
          return false;
        }
      },

      setUser: async (userData: User | null, accessToken: string | null) => {
        try {
          if (userData) {
            const userId = userData.id || userData.sub;
            if (!userId) {
              console.error('[useUserStore] User ID is null or undefined.');
              return false;
            }

            const userDataToSave: UserData = {
              ...userData,
              id: userId,
              timestamp: Date.now(),
              is2FAEnabled: userData.is2FAEnabled || false,
              twoFactorSecret: userData.twoFactorSecret || null,
              lastSyncTime: userData.lastSyncTime || undefined,
              syncStatus: userData.syncStatus || 'idle',
            };

            await saveUserData(userId, userDataToSave);

            set({
              user: userDataToSave,
              isAuthenticated: true,
              userId: userId,
              hasUserId: true,
              is2FAEnabled: userDataToSave.is2FAEnabled,
              is2FAVerified: userDataToSave.is2FAEnabled, // Assume verified on login if enabled
              lastSyncTime: userDataToSave.lastSyncTime,
              syncStatus: userDataToSave.syncStatus,
            });

            if (accessToken) {
              await encryptAndStoreToken(accessToken);
              set({ accessToken: accessToken, hasAccessToken: true });
              // Attempt to restore user data from Google Drive
              await get().restoreAndSaveUserData(accessToken, userId);
            }

            return true;
          } else {
            set({ user: null, isAuthenticated: false, userId: null, hasUserId: false });
            if (accessToken) {
              await encryptAndStoreToken(accessToken);
              set({ accessToken: accessToken, hasAccessToken: true });
            }
            return false;
          }
        } catch (error) {
          console.error('[useUserStore] Error setting user:', error);
          return false;
        }
      },

      setAccessToken: async (token) => {
        try {
          if (token) {
            await encryptAndStoreToken(token);
          } else {
            await clearEncryptedData();
          }
          set({ accessToken: token, hasAccessToken: !!token });
          return true;
        } catch (error) {
          console.error('[useUserStore] Error setting access token:', error);
          return false;
        }
      },

      getAccessToken: async () => {
        try {
          return await getAndDecryptToken();
        } catch (error) {
          console.error('[useUserStore] Error getting access token:', error);
          return null;
        }
      },

      // 2FA functions
      enable2FA: async () => {
        try {
          if (!get().user?.email) throw new Error('User email not available');
          const result = await generateTOTP();
          if (!result) throw new Error('Failed to generate 2FA secret');
          set({
            temp2FASecret: result.secret,
            temp2FACode: result.code,
          });
          return { secret: result.secret, code: result.code };
        } catch (error) {
          console.error('Error enabling 2FA:', error);
          return null;
        }
      },

      verifyAndEnable2FA: async (code: string) => {
        try {
          const tempSecret = get().temp2FASecret;
          if (!tempSecret) throw new Error('2FA secret not found');

          const isValid = await verifyTOTP(tempSecret, code);
          if (isValid) {
            const user = get().user;
            if (!user) throw new Error('User not found');
            const userId = user.id || user.sub;
            if (!userId) throw new Error('User ID not found');
            const userData: UserData = {
              ...user,
              id: userId,
              timestamp: Date.now(),
              is2FAEnabled: true,
              twoFactorSecret: tempSecret,
              lastSyncTime: get().lastSyncTime || undefined,
              syncStatus: 'idle',
            };
            await saveUserData(userId, userData);
            set({
              is2FAEnabled: true,
              is2FAVerified: true,
              temp2FASecret: null,
              temp2FACode: null,
              user: userData
            });
            return true;
          } else {
            console.warn('Invalid 2FA code during enable');
            return false;
          }
        } catch (error) {
          console.error('Error verifying and enabling 2FA:', error);
          return false;
        }
      },

      verify2FA: async (code: string) => {
        try {
          const secret = get().user?.twoFactorSecret;
          if (!secret) throw new Error('2FA not enabled');

          const isValid = await verifyTOTP(secret, code);
          if (isValid) {
            set({ is2FAVerified: true });
            return true;
          } else {
            console.warn('Invalid 2FA code');
            set({ is2FAVerified: false });
            return false;
          }
        } catch (error) {
          console.error('Error verifying 2FA:', error);
          set({ is2FAVerified: false });
          return false;
        }
      },

      disable2FA: async (code: string) => {
        try {
          const secret = get().user?.twoFactorSecret;
          if (!secret) throw new Error('2FA not enabled');

          const isValid = await verifyTOTP(secret, code);
          if (isValid) {
            const user = get().user;
            if (!user) throw new Error('User not found');
            const userId = user.id || user.sub;
            if (!userId) throw new Error('User ID not found');
            const userData: UserData = {
              ...user,
              id: userId,
              timestamp: Date.now(),
              is2FAEnabled: false,
              twoFactorSecret: null,
              lastSyncTime: get().lastSyncTime || undefined,
              syncStatus: 'idle',
            };
            await saveUserData(userId, userData);
            set({
              is2FAEnabled: false,
              is2FAVerified: false,
              user: userData
            });
            return true;
          } else {
            console.warn('Invalid 2FA code during disable');
            return false;
          }
        } catch (error) {
          console.error('Error disabling 2FA:', error);
          return false;
        }
      },

      // Sync user data to cloud (e.g., Firebase, backend)
      syncUserData: async (passedAccessToken?: string, passedUserId?: string) => {
        set({ syncStatus: 'loading', syncError: null });
        try {
          const user = get().user;
          if (!user) throw new Error('User not authenticated for sync');
          const userId = passedUserId || user.id || user.sub;
          if (!userId) throw new Error('User ID not found');
          const accessToken = passedAccessToken || get().accessToken;
          if (!accessToken) throw new Error('Access token not found');

          // Get user data to backup
          const [readPosts, favoritePosts, mangaBookmarks] = await Promise.all([
            getHistoryData('reads', userId),
            getHistoryData('favorites', userId),
            getHistoryData('bookmarks', userId)
          ]);

          // Backup to Google Drive
          await backupUserData(accessToken, userId, {
            readPosts: Array.isArray(readPosts) ? readPosts : [],
            favoritePosts: Array.isArray(favoritePosts) ? favoritePosts : [],
            mangaBookmarks: Array.isArray(mangaBookmarks) ? mangaBookmarks : []
          });

          set({ lastSyncTime: Date.now(), syncStatus: 'success' });
          return true;
        } catch (error: any) {
          console.error('Sync user data error:', error);
          set({ syncStatus: 'error', syncError: error.message || 'Failed to sync data' });
          return false;
        }
      },

      setOfflineStatus: (isOffline) => {
        set({ isOffline });
      },

      updateProfile: async (updates) => {
        try {
          const currentUser = get().user;
          if (!currentUser) throw new Error('User not authenticated');
          const userId = currentUser.sub || currentUser.id;
          if (!userId) throw new Error('User ID not found');

          const updatedUser = { ...currentUser, ...updates };
          await saveUserData(userId, updatedUser);

          set({ user: updatedUser });
          return true;
        } catch (error) {
          console.error('Error updating profile:', error);
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

      getValidAccessToken: async () => {
        try {
          const storedAccessToken = await getAndDecryptToken();
          if (!storedAccessToken) {
            console.log('[useUserStore] No stored access token found.');
            return null;
          }

          const isValid = await isTokenValid(storedAccessToken);
          if (isValid) {
            console.log('[useUserStore] Stored access token is valid.');
            return storedAccessToken;
          }

          console.log('[useUserStore] Stored access token is expired, attempting refresh...');
          const refreshTokenValue = await getRefreshToken();
          if (!refreshTokenValue) {
            console.warn('[useUserStore] No refresh token available');
            return null;
          }
          const newAccessToken = await refreshToken(refreshTokenValue);
          if (newAccessToken) {
            await encryptAndStoreToken(newAccessToken);
            set({ accessToken: newAccessToken, hasAccessToken: true });
            console.log('[useUserStore] Token refreshed and stored.');
            return newAccessToken;
          } else {
            console.warn('[useUserStore] Could not refresh token. User needs to re-authenticate.');
            await get().logout();
            return null;
          }
        } catch (error) {
          console.error('[useUserStore] Error getting valid access token:', error);
          await get().logout();
          return null;
        }
      },

      logout: async () => {
        try {
          // Clear authentication tokens and user data
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
          });
        } catch (error) {
          console.error('[useUserStore] Error during logout:', error);
        }
      },

      // New action to restore and save user data
      restoreAndSaveUserData: async (accessToken: string, userId: string) => {
        set({ syncStatus: 'loading', syncError: null });
        try {
          const restoredData = await restoreUserData(accessToken, userId);

          if (restoredData) {
            console.log('[useUserStore] Restored data from Google Drive:', restoredData);

            // Save restored data to IndexedDB
            if (Array.isArray(restoredData.readPosts)) {
              await saveHistoryData('reads', userId, restoredData.readPosts);
            }
            if (Array.isArray(restoredData.favoritePosts)) {
              await saveHistoryData('favorites', userId, restoredData.favoritePosts);
            }
            if (Array.isArray(restoredData.mangaBookmarks)) {
              await saveHistoryData('bookmarks', userId, restoredData.mangaBookmarks);
            }
            
            // Optionally update user info in store if restored data has relevant fields
            const currentUser = get().user;
            if (currentUser) {
              const updatedUser = {
                ...currentUser,
                is2FAEnabled: restoredData.is2FAEnabled !== undefined ? restoredData.is2FAEnabled : currentUser.is2FAEnabled,
                twoFactorSecret: restoredData.twoFactorSecret !== undefined ? restoredData.twoFactorSecret : currentUser.twoFactorSecret,
                lastSyncTime: restoredData.timestamp || Date.now(),
              };
              set({ user: updatedUser });
              await saveUserData(userId, updatedUser);
            }

            set({ lastSyncTime: Date.now(), syncStatus: 'success' });
            // Call syncUserData to ensure data is pushed to Google Drive after restoration
            await get().syncUserData(accessToken, userId);
            return true;
          } else {
            console.log('[useUserStore] No data to restore from Google Drive or file not found.');
            set({ syncStatus: 'idle' });
            return false;
          }
        } catch (error: any) {
          console.error('[useUserStore] Error restoring and saving user data:', error);
          set({ syncStatus: 'error', syncError: error.message || 'Failed to restore data' });
          return false;
        }
      },

    }),
    {
      name: STORE_KEY,
      storage: {
        getItem: (name: string) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            const data = JSON.parse(str);
            // Only persist non-sensitive data
            const userToPersist = data.state.user;
            const serializedUser = userToPersist ? {
              sub: userToPersist.sub || '',
              name: userToPersist.name || '',
              given_name: userToPersist.given_name,
              family_name: userToPersist.family_name,
              picture: userToPersist.picture || '',
              email: userToPersist.email || '',
              email_verified: userToPersist.email_verified || false,
              locale: userToPersist.locale,
              id: userToPersist.id,
              updatedAt: userToPersist.updatedAt,
            } : null;

            return {
              state: {
                ...initialState,
                user: serializedUser,
                isAuthenticated: data.state.isAuthenticated,
                is2FAEnabled: data.state.is2FAEnabled,
                is2FAVerified: data.state.is2FAVerified,
                lastSyncTime: data.state.lastSyncTime,
                syncStatus: data.state.syncStatus,
                syncError: data.state.syncError,
                isOffline: data.state.isOffline,
                userId: data.state.userId,
                storeReady: data.state.storeReady,
                hasUserId: data.state.hasUserId,
              }
            };
          } catch {
            return null;
          }
        },
        setItem: (name: string, value: any) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name: string) => localStorage.removeItem(name),
      },
      version: 1,
      migrate: (persistedState: any, version) => {
        if (version === 0) {
          console.log('Migrating user store from version 0 to 1');
        }
        return persistedState;
      },
    }
  )
);

export default useUserStore;