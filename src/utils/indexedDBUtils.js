import { fetchPosts } from '../api/blogger';

const DB_NAME = 'mangaReaderDB';
const DB_VERSION = 1;
const STORE_NAMES = ['posts', 'bookmarks', 'favorites', 'search', 'pages'];

let db = null;

const openDatabase = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create all required stores
      const stores = [
        'history',
        'userData',
        'posts',
        'bookmarks',
        'favorites',
        'search',
        'pages'
      ];

      stores.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      });
    };
  });
};

// Generic get/set/clear
export const getDataFromDB = async (storeName, key) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.errorCode);
  });
};

export const saveDataToDB = async (storeName, key, data) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data, key);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.errorCode);
  });
};

export const clearDataFromDB = async (storeName, key) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    let request;
    if (key) request = store.delete(key);
    else request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.errorCode);
  });
};

// Các hàm đặc thù cho posts vẫn giữ lại để không ảnh hưởng code cũ
export const getPostsFromDB = async (orderBy) => getDataFromDB('posts', orderBy);
export const savePostsToDB = async (orderBy, data) => saveDataToDB('posts', orderBy, data);
export const clearPostsFromDB = async (orderBy) => clearDataFromDB('posts', orderBy);

// Helper: lấy userId hiện tại
function getCurrentUserId() {
  try {
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    return userInfo?.sub || 'guest';
  } catch {
    return 'guest';
  }
}

// Chuẩn hóa key lưu trữ cho từng user
export const getHistoryKey = (type, userId) => {
  const id = userId || getCurrentUserId();
  return `${type}_${id}`;
};

// Map type to store name
const getStoreName = (type) => {
  switch (type) {
    case 'favorites':
      return 'favorites';
    case 'bookmarks':
      return 'bookmarks';
    case 'read':
      return 'history';
    case 'search':
      return 'search';
    case 'pages':
      return 'pages';
    default:
      return 'history';
  }
};

// Lấy dữ liệu lịch sử (bookmark/favorite/search/pages) cho user
export async function getHistoryData(type, userId) {
  const storeName = getStoreName(type);
  const key = getHistoryKey(type, userId);
  return (await getDataFromDB(storeName, key)) || [];
}

// Lưu dữ liệu lịch sử (bookmark/favorite/search/pages) cho user
export async function saveHistoryData(type, userId, data) {
  const storeName = getStoreName(type);
  const key = getHistoryKey(type, userId);
  return saveDataToDB(storeName, key, data);
}

// Lấy một bài viết dựa trên slug (async)
export async function loadPost(fullPath) {
  // Check IndexedDB first (using fullPath as key)
  const cachedPost = await getDataFromDB('posts', fullPath);
  if (cachedPost) {
    const now = Date.now();
    const CACHE_EXPIRATION = 10 * 60 * 1000; // 10 minutes (consistent with useBlogStore)
    if (cachedPost.timestamp && (now - cachedPost.timestamp < CACHE_EXPIRATION)) {
      console.log('Loaded post from IndexedDB cache:', fullPath);
      return cachedPost.data;
    } else {
      // Cache expired, clear it
      console.log('IndexedDB cache expired for post:', fullPath);
      await clearDataFromDB('posts', fullPath);
    }
  }

  // If not in cache or expired, fetch all posts from API and find the one
  console.log('Fetching all posts from API to find:', fullPath);
  try {
    // Assuming fetchPosts fetches all posts and returns an array in response.data.items
    // It might be better to fetch posts with a relevant query if API supports it.
    // For now, stick to fetching all and finding.
    const response = await fetchPosts(); // Needs fetchPosts imported from '../api/blogger'
    const posts = response?.items || [];

    // Find the post by comparing the full path
    const foundPost = posts.find(post => {
      // Construct the path from post.url, excluding origin
      const postPath = post.url ? new URL(post.url).pathname.replace(/^\/|\/$/g, '') : '';
      // Compare with the fullPath from useParams
      return postPath === fullPath.replace(/^\/|\/$/g, '');
    });

    if (foundPost) {
      // Cache the fetched post individually (using fullPath as key)
      const dataToCache = { data: foundPost, timestamp: Date.now() };
      await saveDataToDB('posts', fullPath, dataToCache);
      console.log('Saved post to IndexedDB cache:', fullPath);
      return foundPost;
    }

    // If not found after fetching all, it might not exist or is not yet published
    return null; 

  } catch (error) {
    console.error('Error in loadPost (fetching from API):', error);
    // Don't re-throw here, let the component handle the null case
    return null; 
  }
}

// User data store
export const saveUserData = async (userId, userData) => {
  const db = await openDatabase();
  const tx = db.transaction('userData', 'readwrite');
  const store = tx.objectStore('userData');
  await store.put(userData, userId);
  await tx.done;
};

export const getUserData = async (userId) => {
  const db = await openDatabase();
  const tx = db.transaction('userData', 'readonly');
  const store = tx.objectStore('userData');
  const data = await store.get(userId);
  await tx.done;
  return data || null;
};

export const deleteUserData = async (userId) => {
  const db = await openDatabase();
  const tx = db.transaction('userData', 'readwrite');
  const store = tx.objectStore('userData');
  await store.delete(userId);
  await tx.done;
}; 