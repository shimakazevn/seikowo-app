import { openDatabase, withTransaction, saveDataToDB, getDataFromDB } from './indexedDBUtils';

// Import User interface from the store
import type { User } from '../types/global';

// Constants
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_INFO_KEY = 'user_info';
export const USER_INFO_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
export const TOKEN_CACHE_DURATION = 1 * 60 * 60 * 1000; // 1 hour (This is for Access Token, now handled by securityUtils)

interface TokenData {
  id: string;
  value: string;
  timestamp: number;
}

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await withTransaction(['userData'], 'readonly', async (tx: IDBTransaction) => {
      const store = tx.objectStore('userData');
      const data: TokenData | undefined = await getDataFromDB('userData', REFRESH_TOKEN_KEY);
      return data?.value || null;
    });
  } catch (error: any) {
    console.error('Error getting refresh token:', error);
    throw error;
  }
};

export const setRefreshToken = async (token: string): Promise<void> => {
  if (!token) {
    throw new Error('Refresh token is required');
  }

  try {
    await withTransaction(['userData'], 'readwrite', async (tx: IDBTransaction) => {
      const store = tx.objectStore('userData');
      await saveDataToDB('userData', REFRESH_TOKEN_KEY, {
        value: token,
        timestamp: Date.now()
      });
    });
  } catch (error: any) {
    console.error('Error setting refresh token:', error);
    throw error;
  }
};

export const clearTokens = async (): Promise<void> => {
  try {
    await withTransaction(['userData'], 'readwrite', async (tx: IDBTransaction) => {
      const store = tx.objectStore('userData');
      await Promise.all([
        store.delete(REFRESH_TOKEN_KEY)
      ]);
    });
  } catch (error: any) {
    console.error('Error clearing tokens:', error);
    throw error;
  }
};

interface UserInfoData extends User {
  id: string;
  timestamp: number;
}

// User info management with improved error handling
export const getUserInfo = async (): Promise<UserInfoData | null> => {
  try {
    return await withTransaction(['userData'], 'readonly', async (tx: IDBTransaction) => {
      const store = tx.objectStore('userData');
      const data: UserInfoData | undefined = await getDataFromDB('userData', USER_INFO_KEY);

      if (data && data.timestamp) {
        const isCacheValid = (Date.now() - data.timestamp) < USER_INFO_CACHE_DURATION;
        return isCacheValid ? data : null;
      }
      return null;
    });
  } catch (error: any) {
    console.error('Error getting user info:', error);
    throw error;
  }
};

export const setUserInfo = async (userInfo: User): Promise<void> => {
  if (!userInfo) {
    throw new Error('User info is required');
  }

  try {
    await withTransaction(['userData'], 'readwrite', async (tx: IDBTransaction) => {
      const store = tx.objectStore('userData');
      await saveDataToDB('userData', USER_INFO_KEY, {
        ...userInfo,
        timestamp: Date.now()
      });
    });
  } catch (error: any) {
    console.error('Error setting user info:', error);
    throw error;
  }
};

export const clearUserInfo = async (): Promise<void> => {
  try {
    await withTransaction(['userData'], 'readwrite', async (tx: IDBTransaction) => {
      const store = tx.objectStore('userData');
      await store.delete(USER_INFO_KEY);
    });
  } catch (error: any) {
    console.error('Error clearing user info:', error);
    throw error;
  }
};

// User data management
export const getUserData = async (userId: string): Promise<User | null> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    return await withTransaction(['userData'], 'readonly', async (tx: IDBTransaction) => {
      const store = tx.objectStore('userData');
      const data: User | undefined = await getDataFromDB('userData', userId);
      return data || null;
    });
  } catch (error: any) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

export const saveUserData = async (userId: string, userData: User): Promise<void> => {
  if (!userId || !userData) {
    throw new Error('User ID and data are required');
  }

  try {
    await withTransaction(['userData'], 'readwrite', async (tx: IDBTransaction) => {
      const store = tx.objectStore('userData');
      await saveDataToDB('userData', userId, {
        ...userData,
        timestamp: Date.now()
      });
    });
  } catch (error: any) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

export const deleteUserData = async (userId: string): Promise<void> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    await withTransaction(['userData'], 'readwrite', async (tx: IDBTransaction) => {
      const store = tx.objectStore('userData');
      await store.delete(userId);
    });
  } catch (error: any) {
    console.error('Error deleting user data:', error);
    throw error;
  }
};

// User session management
export const clearUserSession = async (): Promise<void> => {
  try {
    await withTransaction(['userData'], 'readwrite', async (tx: IDBTransaction) => {
      const store = tx.objectStore('userData');
      await Promise.all([
        store.delete(REFRESH_TOKEN_KEY),
        store.delete(USER_INFO_KEY)
      ]);
    });
  } catch (error: any) {
    console.error('Error clearing user session:', error);
    throw error;
  }
};

export const FOLLOW_KEY = 'follows';
export const MANGA_KEY = 'bookmarks';