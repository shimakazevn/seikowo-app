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

console.log('[useUserStore.ts] File loaded. Initial localStorage value for store-key:', localStorage.getItem('user-storage'));

const STORE_KEY = 'user-storage';

// Separate function to initialize IndexedDB and validate persisted state
export const initializePersistedState = async (): Promise<void> => {
  try {
    // Initialize IndexedDB first
    await initializeDatabase();
    
    // Then validate the persisted state
    const str = localStorage.getItem(STORE_KEY);
    if (!str) return;

    const data: StorageData = JSON.parse(str);
    
    // Check if we have a valid token
    const token = await getAndDecryptToken();
    if (!token) {
      console.log('[useUserStore] No valid token found, clearing persisted state');
      localStorage.removeItem(STORE_KEY);
      return;
    }

    // Validate token with Google API
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.log('[useUserStore] Token validation failed, clearing persisted state');
        localStorage.removeItem(STORE_KEY);
        return;
      }
    } catch (error) {
      console.error('[useUserStore] Error validating token:', error);
      localStorage.removeItem(STORE_KEY);
      return;
    }
  } catch (error) {
    console.error('[useUserStore] Error initializing persisted state:', error);
    localStorage.removeItem(STORE_KEY);
  }
};

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
  hasAccessToken: boolean;
  temp2FASecret: string | null;
  temp2FACode: string | null;
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
  state: {
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
  };
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

        // Only skip if store is already ready, authenticated, AND has an accessToken AND has user data
        if (currentStoreState.storeReady && 
            currentStoreState.isAuthenticated && 
            currentStoreState.hasAccessToken && 
            currentStoreState.user) {
          console.log('[useUserStore] Store already ready and fully authenticated. Skipping initialization.');
          return true;
        }

        try {
          // Initialize persisted state first
          console.log('[useUserStore] Initializing persisted state...');
          await initializePersistedState();
          console.log('[useUserStore] Persisted state initialized.');

          // Load user data and token
          const [userData, accessToken] = await Promise.all([
            getAndDecryptUserData<UserData>(),
            getAndDecryptToken()
          ]);
          
          console.log('[useUserStore] initializeUser - decrypted data:', {
            hasUserData: !!userData,
            hasToken: !!accessToken
          });

          // Case 1: Both user data and token exist
          if (userData && accessToken) {
            console.log('[useUserStore] Both user data and token found, setting authenticated state');
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
              timestamp: Number(Date.now()),
              lastSyncTime: userData.lastSyncTime || null,
              syncStatus: userData.syncStatus || 'idle',
            };

            const userId = user.sub || user.id;
            set({
              user,
              isAuthenticated: true,
              accessToken,
              storeReady: true,
              hasUserId: true,
              userId,
              hasAccessToken: true
            });
            return true;
          }

          // Case 2: Only token exists but no user data
          if (!userData && accessToken) {
            console.log('[useUserStore] Token exists but no user data found. Attempting to restore user data...');
            try {
              // Try to get user info from Google API
              const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
              });

              if (response.ok) {
                const userInfo = await response.json();
                console.log('[useUserStore] Retrieved user info from Google:', userInfo);

                const user: User = {
                  sub: userInfo.sub,
                  name: userInfo.name,
                  given_name: userInfo.given_name,
                  family_name: userInfo.family_name,
                  picture: userInfo.picture,
                  email: userInfo.email,
                  email_verified: userInfo.email_verified,
                  locale: userInfo.locale,
                  is2FAEnabled: false,
                  twoFactorSecret: null,
                  isAuthenticated: true,
                  id: userInfo.sub,
                  updatedAt: new Date().toISOString(),
                  timestamp: Number(Date.now()),
                  lastSyncTime: null, // Initialize
                  syncStatus: 'idle', // Initialize
                };

                // Save user data
                await encryptAndStoreUserData(user);
                
                const userId = user.sub;
                set({
                  user,
                  isAuthenticated: true,
                  accessToken,
                  storeReady: true,
                  hasUserId: true,
                  userId,
                  hasAccessToken: true
                });

                // Restore data from Drive
                await get().restoreAndSaveUserData(accessToken, userId);
                return true;
              } else {
                console.log('[useUserStore] Failed to get user info from Google, logging out...');
                await get().logout();
                return false;
              }
            } catch (error) {
              console.error('[useUserStore] Error restoring user data:', error);
              await get().logout();
              return false;
            }
          }

          // Case 3: Neither user data nor token exists
          console.log('[useUserStore] No user data or token found, setting unauthenticated state');
          set({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            storeReady: true,
            hasUserId: false,
            userId: null,
            hasAccessToken: false
          });
          return true;

        } catch (error) {
          console.error('[useUserStore] Error during initialization:', error);
          set({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            storeReady: true,
            hasUserId: false,
            userId: null,
            hasAccessToken: false
          });
          return false;
        }
      },

      setUser: async (userData: User | null, accessToken: string | null) => {
        console.log('[useUserStore] setUser called with userData:', userData, 'and accessToken:', accessToken ? 'exists' : 'not found');
        try {
          if (userData) {
            const userId = userData.id || userData.sub;
            console.log('[useUserStore] setUser - derived userId:', userId);
            if (!userId) {
              console.error('[useUserStore] User ID is null or undefined.');
              return false;
            }
            const validUserId: string = userId; // Ensure userId is a string

            // Prepare data for IndexedDB (UserData type, without isAuthenticated)
            const userDataToSaveDB: UserData = {
              id: userId,
              sub: userData.sub,
              email: userData.email,
              name: userData.name,
              given_name: userData.given_name,
              family_name: userData.family_name,
              picture: userData.picture,
              email_verified: userData.email_verified,
              locale: userData.locale,
              is2FAEnabled: userData.is2FAEnabled || false,
              twoFactorSecret: userData.twoFactorSecret || null,
              timestamp: Date.now(),
              lastSyncTime: userData.lastSyncTime || null,
              syncStatus: userData.syncStatus || 'idle',
              updatedAt: userData.updatedAt, // Pass updatedAt if available
            };

            console.log('[useUserStore] setUser - saving userData to DB for userId:', userId);
            await saveUserData(userId, userDataToSaveDB);

            // Prepare data for store state (User type, with isAuthenticated)
            const userForStore: User = {
              ...userDataToSaveDB,
              isAuthenticated: true,
            };

            set({
              user: userForStore,
              isAuthenticated: true,
              userId: userId,
              hasUserId: true,
              is2FAEnabled: userForStore.is2FAEnabled,
              is2FAVerified: userForStore.is2FAEnabled, // Assume verified on login if enabled
              lastSyncTime: userForStore.lastSyncTime,
              syncStatus: userForStore.syncStatus,
            });

            if (accessToken && typeof accessToken === 'string' && typeof validUserId === 'string') {
              const definiteAccessToken: string = accessToken!; // Explicitly capture the narrowed type with non-null assertion
              await encryptAndStoreToken(definiteAccessToken);
              set({ accessToken: definiteAccessToken, hasAccessToken: true });
              // Attempt to restore user data from Google Drive
              await get().restoreAndSaveUserData(definiteAccessToken, validUserId);
            }

            return true;
          } else {
            set({ user: null, isAuthenticated: false, userId: null, hasUserId: false });
            if (accessToken && typeof accessToken === 'string') {
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
            
            // Prepare data for IndexedDB (UserData type, without isAuthenticated)
            const userDataDB: UserData = {
              id: userId,
              sub: user.sub,
              email: user.email,
              name: user.name,
              given_name: user.given_name,
              family_name: user.family_name,
              picture: user.picture,
              email_verified: user.email_verified,
              locale: user.locale,
              is2FAEnabled: true,
              twoFactorSecret: tempSecret,
              timestamp: Date.now(),
              lastSyncTime: get().lastSyncTime || null,
              syncStatus: 'idle',
              updatedAt: user.updatedAt,
            };

            await saveUserData(userId, userDataDB);
            
            // Prepare data for store state (User type)
            const userForStore: User = {
              ...user,
              is2FAEnabled: true,
              twoFactorSecret: tempSecret,
              isAuthenticated: user.isAuthenticated, // Keep existing isAuthenticated
            };

            set({
              is2FAEnabled: true,
              is2FAVerified: true,
              temp2FASecret: null,
              temp2FACode: null,
              user: userForStore,
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
            
            // Prepare data for IndexedDB (UserData type, without isAuthenticated)
            const userDataDB: UserData = {
              id: userId,
              sub: user.sub,
              email: user.email,
              name: user.name,
              given_name: user.given_name,
              family_name: user.family_name,
              picture: user.picture,
              email_verified: user.email_verified,
              locale: user.locale,
              is2FAEnabled: false,
              twoFactorSecret: null,
              timestamp: Date.now(),
              lastSyncTime: get().lastSyncTime || null,
              syncStatus: 'idle',
              updatedAt: user.updatedAt,
            };

            await saveUserData(userId, userDataDB);
            
            // Prepare data for store state (User type)
            const userForStore: User = {
              ...user,
              is2FAEnabled: false,
              twoFactorSecret: null,
              isAuthenticated: user.isAuthenticated, // Keep existing isAuthenticated
            };

            set({
              is2FAEnabled: false,
              is2FAVerified: false,
              user: userForStore,
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
      syncUserData: async (accessToken: string, userId: string) => {
        set({ syncStatus: 'loading', syncError: null });
        try {
          const user = get().user;
          if (!user) throw new Error('User not authenticated for sync');

          // Get user data to backup
          const [readPosts, favoritePosts, mangaBookmarks] = await Promise.all([
            getHistoryData('reads', userId),
            getHistoryData('favorites', userId),
            getHistoryData('bookmarks', userId)
          ]);

          // Backup to Google Drive
          await backupUserData(userId, {
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
          console.log('[useUserStore] Starting getValidAccessToken...');
          const storedAccessToken = await getAndDecryptToken();
          
          if (!storedAccessToken) {
            console.log('[useUserStore] No stored access token found.');
            return null;
          }

          console.log('[useUserStore] Found stored access token:', {
            tokenPreview: storedAccessToken.substring(0, 10) + '...',
            tokenLength: storedAccessToken.length
          });

          // Try to validate token by making a test request
          try {
            const testResponse = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
              headers: { 'Authorization': `Bearer ${storedAccessToken}` }
            });
            
            if (testResponse.ok) {
              const tokenInfo = await testResponse.json();
              console.log('[useUserStore] Token validation successful:', {
                expiresIn: tokenInfo.expires_in,
                scope: tokenInfo.scope
              });
              return storedAccessToken;
            } else {
              console.log('[useUserStore] Token validation failed, attempting refresh...');
            }
          } catch (validationError) {
            console.log('[useUserStore] Token validation error, attempting refresh:', validationError);
          }

          const refreshTokenValue = await getRefreshToken();
          if (!refreshTokenValue) {
            console.warn('[useUserStore] No refresh token available');
            return null;
          }

          console.log('[useUserStore] Attempting to refresh token...');
          const newAccessToken = await refreshToken(refreshTokenValue);
          
          if (newAccessToken) {
            console.log('[useUserStore] Token refresh successful, storing new token...');
            await encryptAndStoreToken(newAccessToken);
            set({ accessToken: newAccessToken, hasAccessToken: true });
            return newAccessToken;
          }

          console.warn('[useUserStore] Could not refresh token. User needs to re-authenticate.');
          await get().logout();
          return null;
        } catch (error) {
          console.error('[useUserStore] Error in getValidAccessToken:', error);
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
          
          // Clear all persisted data
          localStorage.removeItem(STORE_KEY);
          localStorage.removeItem('refresh-token');
          localStorage.removeItem('user-info');
          
          // Reset store state
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
          // Even if there's an error, try to clear localStorage
          localStorage.removeItem(STORE_KEY);
          localStorage.removeItem('refresh-token');
          localStorage.removeItem('user-info');
        }
      },

      // New action to restore and save user data
      restoreAndSaveUserData: async (accessToken: string, userId: string) => {
        set({ syncStatus: 'loading', syncError: null });
        try {
          const restoredData = await restoreUserData(userId);

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
            // Create explicitly typed local variables to satisfy linter
            const syncAccessToken: string = accessToken;
            const syncUserId: string = userId;
            await get().syncUserData(syncAccessToken, syncUserId);
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
        getItem: async (name: string): Promise<StorageValue<UserStoreState> | null> => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            const data: StorageData = JSON.parse(str);
            
            // Only persist non-sensitive data
            const userToPersist = data.state.user;
            const serializedUser: User | null = userToPersist ? {
              id: userToPersist.id || userToPersist.sub || '',
              sub: userToPersist.sub || '',
              email: userToPersist.email || '',
              name: userToPersist.name || '',
              given_name: userToPersist.given_name || '',
              family_name: userToPersist.family_name || '',
              picture: userToPersist.picture || '',
              email_verified: userToPersist.email_verified || false,
              locale: userToPersist.locale || undefined,
              is2FAEnabled: data.state.is2FAEnabled || false,
              twoFactorSecret: userToPersist.twoFactorSecret || null,
              isAuthenticated: data.state.isAuthenticated || false,
              timestamp: data.state.user?.timestamp || Date.now(),
              lastSyncTime: data.state.lastSyncTime || null,
              syncStatus: data.state.syncStatus || 'idle',
              updatedAt: userToPersist.updatedAt || undefined,
            } : null;

            return {
              state: {
                ...initialState,
                user: serializedUser,
                isAuthenticated: data.state.isAuthenticated,
                is2FAEnabled: data.state.is2FAEnabled,
                is2FAVerified: data.state.is2FAVerified,
                lastSyncTime: typeof data.state.lastSyncTime === 'number' ? data.state.lastSyncTime : null,
                syncStatus: data.state.syncStatus,
                syncError: data.state.syncError,
                isOffline: data.state.isOffline,
                userId: data.state.userId,
                storeReady: data.state.storeReady,
                hasUserId: data.state.hasUserId,
              }
            };
          } catch (error) {
            console.error('[useUserStore] Error parsing persisted state:', error);
            localStorage.removeItem(name);
            return null;
          }
        },
        setItem: (name: string, value: StorageValue<UserStoreState>) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name: string) => localStorage.removeItem(name),
      },
      version: 1,
      migrate: (persistedState: unknown, version: number): UserStoreState => {
        if (version === 0) {
          console.log('Migrating user store from version 0 to 1');
          // Add any migration logic here if needed
          return {
            ...initialState,
            ...(persistedState as Partial<UserStoreState>)
          };
        }
        return persistedState as UserStoreState;
      },
    }
  )
);

export default useUserStore;