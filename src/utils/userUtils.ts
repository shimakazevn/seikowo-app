import { withTransaction, saveDataToDB, getDataFromDB } from './indexedDBUtils';
import type { User } from '../types/global';
import type { TokenData, UserInfoData } from '../types/auth';

// Constants
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_INFO_KEY = 'user_info';
export const USER_INFO_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
export const TOKEN_CACHE_DURATION = 1 * 60 * 60 * 1000; // 1 hour (This is for Access Token, now handled by securityUtils)

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await withTransaction(['userData'], 'readonly', async () => {
      const data: TokenData | undefined = await getDataFromDB('userData', REFRESH_TOKEN_KEY);
      return data?.value || null;
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error getting refresh token:', error.message);
    } else {
      console.error('Error getting refresh token: Unknown error', error);
    }
    throw error;
  }
};

export const setRefreshToken = async (token: string): Promise<void> => {
  if (!token) {
    throw new Error('Refresh token is required');
  }

  try {
    await withTransaction(['userData'], 'readwrite', async () => {
      await saveDataToDB('userData', REFRESH_TOKEN_KEY, {
        value: token,
        timestamp: Date.now()
      });
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error setting refresh token:', error.message);
    } else {
      console.error('Error setting refresh token: Unknown error', error);
    }
    throw error;
  }
};

export const clearTokens = async (): Promise<void> => {
  try {
    await withTransaction(['userData'], 'readwrite', async (tx: IDBTransaction) => {
      await Promise.all([
        tx.objectStore('userData').delete(REFRESH_TOKEN_KEY)
      ]);
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error clearing tokens:', error.message);
    } else {
      console.error('Error clearing tokens: Unknown error', error);
    }
    throw error;
  }
};

// User info management with improved error handling
export const getUserInfo = async (): Promise<UserInfoData | null> => {
  try {
    return await withTransaction(['userData'], 'readonly', async () => {
      const data: UserInfoData | undefined = await getDataFromDB('userData', USER_INFO_KEY);

      if (data && data.timestamp) {
        const isCacheValid = (Date.now() - data.timestamp) < USER_INFO_CACHE_DURATION;
        return isCacheValid ? data : null;
      }
      return null;
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error getting user info:', error.message);
    } else {
      console.error('Error getting user info: Unknown error', error);
    }
    throw error;
  }
};

export const setUserInfo = async (userInfo: User): Promise<void> => {
  if (!userInfo) {
    throw new Error('User info is required');
  }

  try {
    await withTransaction(['userData'], 'readwrite', async () => {
      await saveDataToDB('userData', USER_INFO_KEY, {
        ...userInfo,
        timestamp: Date.now()
      });
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error setting user info:', error.message);
    } else {
      console.error('Error setting user info: Unknown error', error);
    }
    throw error;
  }
};

export const clearUserInfo = async (): Promise<void> => {
  try {
    await withTransaction(['userData'], 'readwrite', async (tx: IDBTransaction) => {
      await tx.objectStore('userData').delete(USER_INFO_KEY);
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error clearing user info:', error.message);
    } else {
      console.error('Error clearing user info: Unknown error', error);
    }
    throw error;
  }
};

// User data management
export const getUserData = async (userId: string): Promise<User | null> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    return await withTransaction(['userData'], 'readonly', async () => {
      const data: User | undefined = await getDataFromDB('userData', userId);
      return data || null;
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error getting user data:', error.message);
    } else {
      console.error('Error getting user data: Unknown error', error);
    }
    throw error;
  }
};

export const saveUserData = async (userId: string, userData: User): Promise<void> => {
  if (!userId || !userData) {
    throw new Error('User ID and data are required');
  }

  try {
    await withTransaction(['userData'], 'readwrite', async () => {
      await saveDataToDB('userData', userId, {
        ...userData,
        timestamp: Date.now()
      });
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error saving user data:', error.message);
    } else {
      console.error('Error saving user data: Unknown error', error);
    }
    throw error;
  }
};

export const deleteUserData = async (userId: string): Promise<void> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    await withTransaction(['userData'], 'readwrite', async (tx: IDBTransaction) => {
      await tx.objectStore('userData').delete(userId);
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error deleting user data:', error.message);
    } else {
      console.error('Error deleting user data: Unknown error', error);
    }
    throw error;
  }
};

// User session management
export const clearUserSession = async (): Promise<void> => {
  try {
    await withTransaction(['userData'], 'readwrite', async (tx: IDBTransaction) => {
      await Promise.all([
        tx.objectStore('userData').delete(REFRESH_TOKEN_KEY),
        tx.objectStore('userData').delete(USER_INFO_KEY)
      ]);
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error clearing user session:', error.message);
    } else {
      console.error('Error clearing user session: Unknown error', error);
    }
    throw error;
  }
};

export const FOLLOW_KEY = 'follows';
export const MANGA_KEY = 'bookmarks';