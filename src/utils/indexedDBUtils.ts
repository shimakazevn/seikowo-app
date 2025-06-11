import { fetchPosts, BloggerResponse } from '../api/blogger';
import { blogConfig } from '../config';
import { getSlugFromUrl } from './blogUtils';
import {
  IDBDatabaseExtended,
  IDBTransactionExtended,
  Post,
  UserData,
  HistoryData,
  CacheConfigs
} from './indexedDBUtils.d';

const DB_NAME = 'seikowo_app';
const DB_VERSION = 1;
const STORE_NAMES = ['bookmarks', 'favorites', 'reads', 'search', 'history', 'userData', 'cache', 'secureStorage'] as const;

// Cache configuration
const CACHE_CONFIG: CacheConfigs = {
  POSTS: { duration: 10 * 60 * 1000, maxSize: 100, maxAge: 10 },
  USER_DATA: { duration: 24 * 60 * 60 * 1000, maxSize: 50, maxAge: 24 },
  SEARCH: { duration: 5 * 60 * 1000, maxSize: 20, maxAge: 5 },
  BOOKMARKS: { duration: 30 * 24 * 60 * 60 * 1000, maxSize: 100, maxAge: 30 },
  FOLLOWS: { duration: 30 * 24 * 60 * 60 * 1000, maxSize: 100, maxAge: 30 }
};





// Initialize database on app startup
export const initializeDatabase = async (): Promise<boolean> => {
  try {
    await openDatabase();
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
};

// Transaction management
export const withTransaction = async <T>(
  storeNames: string[],
  mode: IDBTransactionMode,
  callback: (tx: IDBTransactionExtended) => Promise<T>
): Promise<T> => {
  const db = await openDatabase();
  const tx = db.transaction(storeNames, mode);

  return new Promise((resolve, reject) => {
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

// Database management
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

// Cache management
export const manageCache = async (storeName: keyof CacheConfigs): Promise<void> => {
  try {
    const config = CACHE_CONFIG[storeName];
    if (!config) return;

    await withTransaction([String(storeName)], 'readwrite', async (tx) => {
      const store = tx.objectStore(String(storeName));

      return new Promise<void>((resolve, reject) => {
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          const allData = getAllRequest.result;
          const now = Date.now();
          const validData = allData.filter((item: any) =>
            item.timestamp && (now - item.timestamp < config.duration)
          );

          if (validData.length > config.maxSize) {
            const sortedData = validData.sort((a: any, b: any) =>
              b.timestamp - a.timestamp
            );
            const dataToKeep = sortedData.slice(0, config.maxSize);

            const clearRequest = store.clear();
            clearRequest.onsuccess = () => {
              let putCount = 0;
              dataToKeep.forEach((item: any) => {
                const putRequest = store.put(item);
                putRequest.onsuccess = () => {
                  putCount++;
                  if (putCount === dataToKeep.length) {
                    resolve();
                  }
                };
                putRequest.onerror = () => reject(putRequest.error);
              });
              if (dataToKeep.length === 0) resolve();
            };
            clearRequest.onerror = () => reject(clearRequest.error);
          } else {
            resolve();
          }
        };

        getAllRequest.onerror = () => reject(getAllRequest.error);
      });
    });
  } catch (error: any) {
    console.error(`Error managing cache for ${String(storeName)}:`, error);
  }
};

// Generic data operations with improved error handling
export const getDataFromDB = async <T>(storeName: string, key?: string): Promise<T> => {
  if (!storeName) {
    throw new Error('Store name is required');
  }

  try {
    // Check if store exists before trying to access it
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
    // Check if store exists before trying to save
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
          ...(typeof data === 'object' && data !== null ? data : { value: data }),
          timestamp: Date.now()
        };

        const request = store.put(dataToSave);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  } catch (error: any) {
    console.error(`Error saving data to ${storeName}:`, error);
    throw error;
  }
};

export const clearDataFromDB = async (storeName: string, key?: string): Promise<void> => {
  if (!storeName) {
    throw new Error('Store name is required');
  }

  try {
    // Check if store exists before trying to clear
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
    // Don't throw error for missing stores, just log warning
    if (error.name === 'NotFoundError') {
      console.warn(`Object store '${storeName}' not found, operation skipped`);
      return;
    }
    throw error;
  }
};

// Post-specific operations removed - using cache service instead

// User data operations
export const getCurrentUserId = async (): Promise<string> => {
  try {
    const userData = await getDataFromDB<UserData>('userData', 'currentUser');
    return userData?.id || '';
  } catch (error: any) {
    console.error('Error getting current user ID:', error);
    return '';
  }
};

export const shouldSync = async (): Promise<boolean> => {
  try {
    const lastSync = await getDataFromDB<{ timestamp: number }>('userData', 'lastSync');
    if (!lastSync) return true;
    return Date.now() - lastSync.timestamp > 5 * 60 * 1000; // 5 minutes
  } catch (error: any) {
    console.error('Error checking sync status:', error);
    return true;
  }
};

// History operations
export const getHistoryKey = (type: string, userId: string): string => {
  // Map old 'follows' to new 'favorites' in key names
  const keyType = type === 'follows' ? 'favorites' : type;
  return `${keyType}_${userId}`;
};

const getStoreName = (type: string): string => {
  switch (type) {
    case 'read':
    case 'reads':
      return 'reads';
    case 'bookmark':
    case 'bookmarks':
      return 'bookmarks';
    case 'favorite':
    case 'favorites':
      return 'favorites';
    case 'follow':
    case 'follows':
      return 'favorites'; // Map old 'follows' to new 'favorites'
    default:
      return 'history';
  }
};

export const getHistoryData = async (type: string, userId: string): Promise<HistoryData[]> => {
  try {
    const storeName = getStoreName(type);
    const key = getHistoryKey(type, userId);

    // Check if store exists and repair if needed
    try {
      const result = await getDataFromDB<{ data: HistoryData[] }>(storeName, key);

      // Handle different data structures
      if (!result) {
        return [];
      }

      // If result has a 'data' property (new structure), use it
      if (result && typeof result === 'object' && 'data' in result && Array.isArray(result.data)) {
        return result.data;
      }

      // If result is directly an array (old structure), use it
      if (Array.isArray(result)) {
        return result;
      }

      // Default to empty array
      return [];
    } catch (storeError: any) {
      if (storeError.message?.includes('not found')) {
        console.warn(`Store '${storeName}' not found, returning empty array`);
        return [];
      }
      throw storeError;
    }
  } catch (error: any) {
    console.error(`Error getting ${type} history:`, error);
    return [];
  }
};

export const saveHistoryData = async (type: string, userId: string, data: any, itemTimestamp?: number): Promise<void> => {
  try {
    const storeName = getStoreName(type);
    const key = getHistoryKey(type, userId);

    // If data is an array, save it directly (for bulk operations)
    // If data is a single item, add it to existing data
    let finalData: any;

    if (Array.isArray(data)) {
      finalData = {
        id: key,
        data: data,
        timestamp: itemTimestamp || Date.now() // Use provided timestamp or current time for array
      };
    } else {
      const existingData = await getHistoryData(type, userId);
      const existingArray = Array.isArray(existingData) ? existingData : [];

      const newTimestamp = itemTimestamp || data.timestamp || Date.now(); // Use provided timestamp, or data.timestamp, or current time

      finalData = {
        id: key,
        data: [...existingArray, { ...data, timestamp: newTimestamp }],
        timestamp: Date.now() // Timestamp for the container object, always current time
      };
    }

    await saveDataToDB(storeName, key, finalData);
  } catch (error: any) {
    console.error(`Error saving ${type} history:`, error);
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
    // Don't throw error for missing stores during cleanup
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

// loadPost function removed - using cache service instead

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

export const getUserData = async (userId?: string): Promise<UserData | null> => {
  try {
    // If no userId provided, use 'currentUser' as default
    const key = userId || 'currentUser';
    const data = await getDataFromDB<UserData>('userData', key);
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
    await openDatabase(); // Ensure database is open
    const storeNames = ['userData', 'history', 'bookmarks', 'favorites', 'reads', 'cache', 'secureStorage'];

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
        // Continue with other stores even if one fails
      }
    }
  } catch (error: any) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};