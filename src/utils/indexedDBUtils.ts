import { fetchPosts, BloggerResponse } from '../api/blogger';
import { blogConfig } from '../config';
import { getSlugFromUrl } from './blogUtils';
import type { User, Post } from '../types/global';
import type { UserInfoData } from '../types/auth';

// Extended IndexedDB interfaces (defined locally)
export interface IDBDatabaseExtended extends IDBDatabase {
  // Add any custom properties if needed
}

export interface IDBTransactionExtended extends IDBTransaction {
  // Add any custom properties if needed
}

// Cache configuration
export interface CacheConfig {
  maxAge: number;
  maxSize: number;
  duration: number;
}

export interface CacheConfigs {
  [key: string]: CacheConfig;
}

// History Data Interface (defined locally)
export interface HistoryData {
  id: string;
  timestamp: number;
  [key: string]: any;
}

const DB_NAME = 'my-blogger-react';
const DB_VERSION = 1;
export const STORE_NAMES = ['bookmarks', 'favorites', 'reads', 'search', 'history', 'userData', 'cache', 'secureStorage'] as const;

// Cache configuration
const CACHE_CONFIG: CacheConfigs = {
  POSTS: { duration: 10 * 60 * 1000, maxSize: 100, maxAge: 10 },
  USER_DATA: { duration: 24 * 60 * 60 * 1000, maxSize: 50, maxAge: 24 },
  SEARCH: { duration: 5 * 60 * 1000, maxSize: 20, maxAge: 5 },
  BOOKMARKS: { duration: 30 * 24 * 60 * 60 * 1000, maxSize: 100, maxAge: 30 }
};

// Constants
export const STORES = {
  USER_DATA: 'userData',
  HISTORY: 'history',
  BOOKMARKS: 'bookmarks',
  FAVORITES: 'favorites',
  READS: 'reads',
  CACHE: 'cache',
  SECURE_STORAGE: 'secureStorage'
} as const;

// Helper functions
const getStoreName = (type: string): string => {
  switch (type) {
    case 'bookmarks':
      return STORES.BOOKMARKS;
    case 'favorites':
      return STORES.FAVORITES;
    case 'reads':
      return STORES.READS;
    default:
      return STORES.HISTORY;
  }
};

const getHistoryKey = (type: string, userId: string): string => {
  return `${type}_${userId}`;
};

// Database management (Core functions first)
export const openDatabase = async (): Promise<IDBDatabaseExtended> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', (event.target as IDBOpenDBRequest).error);
      reject(new Error(`Failed to open database: ${(event.target as IDBOpenDBRequest).error?.message}`));
    };

    request.onsuccess = (event) => {
      const dbResult = (event.target as IDBOpenDBRequest).result;
      const db = dbResult as unknown as IDBDatabaseExtended;

      // Add error handling for database
      db.onerror = (event: any) => {
        console.error('Database error:', (event.target as IDBRequest).error);
      };

      // Add version change handling
      db.onversionchange = () => {
        db.close();
      };

      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const newVersion = event.newVersion;

      try {
        // Create all required stores
        STORE_NAMES.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      } catch (error: any) {
        console.error('Database setup failed:', error);
        throw error;
      }
    };
  });
};

// Transaction management (Depends on openDatabase)
export const withTransaction = async <T>(
  storeNames: string[],
  mode: IDBTransactionMode,
  callback: (tx: IDBTransactionExtended) => Promise<T>
): Promise<T> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, mode);
    tx.oncomplete = () => {
      // Transaction completed successfully
    };

    tx.onerror = () => {
      console.error('Transaction error:', tx.error);
      reject(tx.error);
    };

    tx.onabort = () => {
      console.error('Transaction aborted');
      reject(new Error('Transaction aborted'));
    };

    try {
      callback(tx).then(resolve).catch(reject);
    } catch (error: any) {
      console.error('Transaction callback error:', error);
      tx.abort();
      reject(error);
    }
  });
};

// Generic data operations (Depend on openDatabase and withTransaction)
export const getDataFromDB = async <T>(storeName: string, key?: string): Promise<T> => {
  if (!storeName) {
    throw new Error('Store name is required');
  }

  try {
    const db = await openDatabase();
    if (!db.objectStoreNames.contains(storeName)) {
      console.warn(`Object store '${storeName}' does not exist`);
      throw new Error(`Object store '${storeName}' not found`);
    }

    return await withTransaction([storeName], 'readonly', async (tx) => {
      const store = tx.objectStore(storeName);
      return new Promise<T>((resolve, reject) => {
        let request: IDBRequest;
        if (key === undefined || key === null) {
          request = store.getAll();
        } else {
          request = store.get(key);
        }

        request.onsuccess = () => resolve(request.result as T);
        request.onerror = () => reject(request.error);
      });
    });
  } catch (error: any) {
    console.error(`Error getting data from ${storeName}:`, error);
    throw error;
  }
};

export const saveDataToDB = async <T>(storeName: string, key: string, data: T): Promise<void> => {
  if (!storeName || key === undefined) {
    throw new Error('Store name and key are required');
  }

  try {
    const db = await openDatabase();
    if (!db.objectStoreNames.contains(storeName)) {
      console.warn(`Object store '${storeName}' does not exist`);
      throw new Error(`Object store '${storeName}' not found`);
    }

    await withTransaction([storeName], 'readwrite', async (tx) => {
      const store = tx.objectStore(storeName);
      return new Promise<void>((resolve, reject) => {
        const dataToSave = {
          id: key,
          value: data,
          timestamp: Date.now()
        };

        const request = store.put(dataToSave);
        request.onsuccess = () => {
          console.log(`[saveDataToDB] put request successful for key: ${key}`);
          resolve();
        };
        request.onerror = () => {
          console.error(`[saveDataToDB] put request failed for key: ${key}`, request.error);
          reject(request.error);
        };
      });
    });
  } catch (error: any) {
    console.error(`Error saving data to ${storeName}:`, error);
    throw error;
  }
};

// Initialize database on app startup (Depends on openDatabase)
export const initializeDatabase = async (): Promise<boolean> => {
  try {
    await openDatabase();
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
};

// Other utility functions (can follow any order)
export const clearDataFromDB = async (storeName: string, key?: string): Promise<void> => {
  if (!storeName) {
    throw new Error('Store name is required');
  }

  try {
    const db = await openDatabase();
    if (!db.objectStoreNames.contains(storeName)) {
      console.warn(`Object store '${storeName}' does not exist, skipping clear operation`);
      return;
    }

    await withTransaction([storeName], 'readwrite', async (tx) => {
      const store = tx.objectStore(storeName);
      return new Promise<void>((resolve, reject) => {
        let request: IDBRequest;
        if (key) {
          request = store.delete(key);
        } else {
          request = store.clear();
        }

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  } catch (error: any) {
    console.error(`Error clearing data from ${storeName}:`, error);
    if (error.name === 'NotFoundError') {
      console.warn(`Object store '${storeName}' not found, operation skipped`);
      return;
    }
    throw error;
  }
};

// User data operations
export const saveUserData = async <T>(key: string, data: T): Promise<boolean> => {
  try {
    await saveDataToDB('userData', key, data);
    return true;
  } catch (error: any) {
    console.error('Error saving user data:', error);
    return false;
  }
};

export const getUserData = async (userId?: string): Promise<UserInfoData | null> => {
  try {
    const key = userId || 'currentUser';
    const data = await getDataFromDB<UserInfoData>('userData', key);
    return data || null;
  } catch (error: any) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const deleteUserData = async (userId: string): Promise<void> => {
  try {
    await clearDataFromDB('userData', userId);
  } catch (error: any) {
    console.error('Error deleting user data:', error);
    throw error;
  }
};

// Clear all user data
export const clearAllData = async (): Promise<void> => {
  try {
    await openDatabase();
    const storeNames = Object.values(STORES);

    for (const storeName of storeNames) {
      try {
        await withTransaction([storeName], 'readwrite', async (tx) => {
          const store = tx.objectStore(storeName);
          return new Promise<void>((resolve, reject) => {
            const clearRequest = store.clear();
            clearRequest.onsuccess = () => resolve();
            clearRequest.onerror = () => reject(clearRequest.error);
          });
        });
      } catch (error: any) {
        console.error(`Error clearing store ${storeName}:`, error);
      }
    }
  } catch (error: any) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};

// History operations
export const getHistoryData = async (type: string, userId: string): Promise<HistoryData[]> => {
  console.log(`[getHistoryData] Attempting to get ${type} history for userId: ${userId}`);
  try {
    const storeName = getStoreName(type);
    const key = getHistoryKey(type, userId);
    console.log(`[getHistoryData] Store: ${storeName}, Key: ${key}`);

    try {
      const result = await getDataFromDB<{ data: HistoryData[] }>(storeName, key);
      console.log(`[getHistoryData] Raw result for ${key}:`, result);

      if (!result) {
        console.log(`[getHistoryData] No result found for ${key}, returning empty array.`);
        return [];
      }

      if (result && typeof result === 'object' && 'value' in result) {
        const storedValue = result.value;
        
        if (Array.isArray(storedValue)) {
          console.log(`[getHistoryData] Found new 'value' structure data (direct array) for ${key}:`, storedValue);
          return storedValue;
        }
        if (typeof storedValue === 'object' && storedValue !== null && 'data' in storedValue && Array.isArray(storedValue.data)) {
          console.log(`[getHistoryData] Found new 'value.data' structure for ${key}:`, storedValue.data);
          return storedValue.data;
        }
      }

      if (result && typeof result === 'object' && 'data' in result && Array.isArray(result.data)) {
        console.log(`[getHistoryData] Found old 'data' structure data for ${key}:`, result.data);
        return result.data;
      }

      if (Array.isArray(result)) {
        console.log(`[getHistoryData] Found old structure data (array) for ${key}:`, result);
        return result;
      }

      console.warn(`[getHistoryData] Unexpected data structure for ${key}:`, result, `, returning empty array.`);
      return [];
    } catch (storeError: any) {
      if (storeError.message?.includes('not found')) {
        console.warn(`[getHistoryData] Store '${storeName}' not found for ${key}, returning empty array`);
        return [];
      }
      console.error(`[getHistoryData] Inner error getting ${type} history for ${key}:`, storeError);
      throw storeError;
    }
  } catch (error: any) {
    console.error(`[getHistoryData] Error getting ${type} history for userId ${userId}:`, error);
    return [];
  }
};

export const saveHistoryData = async (type: string, userId: string, data: any, itemTimestamp?: number): Promise<void> => {
  console.log(`[saveHistoryData] Attempting to save ${type} history for userId: ${userId}`);
  try {
    const storeName = getStoreName(type);
    const key = getHistoryKey(type, userId);
    console.log(`[saveHistoryData] Store: ${storeName}, Key: ${key}`);

    let finalData: any;

    if (Array.isArray(data)) {
      finalData = {
        id: key,
        data: data,
        timestamp: itemTimestamp || Date.now()
      };
      console.log(`[saveHistoryData] Saving array data for ${key}:`, finalData);
    } else {
      const existingData = await getHistoryData(type, userId);
      const existingArray = Array.isArray(existingData) ? existingData : [];

      const newTimestamp = itemTimestamp || data.timestamp || Date.now();

      finalData = {
        id: key,
        data: [...existingArray, { ...data, timestamp: newTimestamp }],
        timestamp: Date.now()
      };
      console.log(`[saveHistoryData] Appending single item data for ${key}:`, finalData);
    }

    await saveDataToDB(storeName, key, finalData);
    console.log(`[saveHistoryData] Successfully saved ${type} history for ${key}`);
  } catch (error: any) {
    console.error(`[saveHistoryData] Error saving ${type} history for userId ${userId}:`, error);
    throw error;
  }
};

export const clearHistoryData = async (type: string, userId: string): Promise<void> => {
  try {
    const storeName = getStoreName(type);
    const key = getHistoryKey(type, userId);
    await clearDataFromDB(storeName, key);
  } catch (error: any) {
    console.error(`Error clearing ${type} history:`, error);
    if (error.name === 'NotFoundError') {
      return;
    }
    throw error;
  }
};

// Post operations
export const fetchAllPosts = async (params: any = {}): Promise<Post[]> => {
  try {
    const response = await fetchPosts(params);
    return (response.items || []).map((post: any) => ({
      id: post.id || '',
      title: post.title || '',
      slug: post.slug || '',
      timestamp: post.timestamp || Date.now(),
      url: post.url || '',
      content: post.content || '',
      labels: post.labels || [],
      published: post.published || '',
      updated: post.updated || ''
    }));
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    return [];
  }
};