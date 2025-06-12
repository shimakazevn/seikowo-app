import { getSlugFromUrl, extractImage, Post } from './blogUtils';
import { getHistoryData, saveHistoryData, openDatabase, getDataFromDB, saveDataToDB, withTransaction } from './indexedDBUtils';
import { getUserInfo } from './userUtils';
import type { FavoritePost, MangaBookmark } from '../types/global';

// Interfaces
export interface PostData {
  id: string;
  title: string;
  url: string;
  content?: string;
  published: string;
  updated: string;
  labels: string[];
  thumbnail?: string | null;
  slug?: string;
  timestamp?: number;
  data?: PostData;
}

// export interface MangaBookmark extends PostData {
//   currentPage: number;
//   bookmarkId?: string;
// }

// export interface FavoritePost extends PostData {
//   favoriteAt: number;
// }

export interface SyncResult {
  bookmarkCount: number;
  synced: boolean;
  changes: {
    bookmarks: number;
  };
}

// Constants
export const LAST_SYNC_KEY = 'last_sync_time';
export const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
export const MAX_BOOKMARKS = 50;
export const MAX_FAVORITES = 100;

// Helper function to extract post data with validation
export const extractPostData = (post: PostData | { data: PostData }): PostData => {
  if (!post) {
    throw new Error('Post data is required');
  }

  const realPost = (post as { data: PostData })?.data ? (post as { data: PostData }).data : (post as PostData);
  if (!realPost) {
    throw new Error('Invalid post data structure');
  }

  return {
    ...realPost,
    id: realPost.id || Date.now().toString(),
    slug: realPost.slug || (realPost.url ? getSlugFromUrl(realPost.url) : ''),
    thumbnail: realPost.thumbnail || (realPost.content ? extractImage(realPost.content) : null),
    timestamp: Date.now()
  };
};

// Helper function to merge arrays without duplicates with improved error handling
const mergeArrays = <T extends { id: string; [key: string]: any }>(
  userItems: T[],
  guestItems: T[],
  timeKey: string
): T[] => {
  if (!Array.isArray(userItems) || !Array.isArray(guestItems)) {
    throw new Error('Both userItems and guestItems must be arrays');
  }

  const itemMap = new Map<string, T>();

  // Process user items first
  userItems.forEach(item => {
    if (!item || !item.id) {
      console.warn('Invalid item in userItems:', item);
      return;
    }
    const key = (item as any).currentPage !== undefined ? `${item.id}_p${(item as any).currentPage}` : item.id;
    itemMap.set(key, item);
  });

  // Process guest items
  guestItems.forEach(item => {
    if (!item || !item.id) {
      console.warn('Invalid item in guestItems:', item);
      return;
    }
    const key = (item as any).currentPage !== undefined ? `${item.id}_p${(item as any).currentPage}` : item.id;
    const existingItem = itemMap.get(key);
    const guestTime = parseInt(item[timeKey] as string) || 0;
    const existingTime = existingItem ? (parseInt(existingItem[timeKey] as string) || 0) : 0;

    if (!existingItem || guestTime > existingTime) {
      itemMap.set(key, { ...item, [timeKey]: guestTime });
    }
  });

  return Array.from(itemMap.values())
    .sort((a, b) => (parseInt(b[timeKey] as string) || 0) - (parseInt(a[timeKey] as string) || 0));
};

// Save manga bookmark with improved error handling
export const saveMangaBookmark = async (bookmark: MangaBookmark): Promise<boolean> => {
  if (!bookmark || !bookmark.id) {
    throw new Error('Invalid bookmark data');
  }

  let userId = 'guest';
  try {
    const userInfo = await getUserInfo();
    if (userInfo?.sub) userId = userInfo.sub;
  } catch (error: any) {
    console.error('Error getting user info:', error);
  }

  try {
    const bookmarksRaw = userId ? await getHistoryData('bookmarks', userId) : [];
    const bookmarks: any[] = Array.isArray(bookmarksRaw) ? bookmarksRaw : [];
    const bookmarkId = `${bookmark.id}_p${bookmark.currentPage + 1}`;

    // Remove existing bookmark if exists
    const filteredBookmarks = bookmarks.filter(b =>
      !(b.id === bookmark.id && b.currentPage === bookmark.currentPage)
    );

    // Add new bookmark
    const updatedBookmarks = [
      { ...bookmark, bookmarkId, timestamp: Date.now() },
      ...filteredBookmarks
    ].slice(0, MAX_BOOKMARKS);

    userId ? await saveHistoryData('bookmarks', userId, updatedBookmarks) : Promise.resolve();
    return true;
  } catch (error: any) {
    console.error('Error saving manga bookmark:', error);
    throw error;
  }
};

// Clear post cache
export const clearPostCache = async (): Promise<void> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['cache'], 'readwrite');
    const objectStore = transaction.objectStore('cache');
    objectStore.clear();
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  } catch (error) {
    console.error('Error clearing post cache:', error);
    throw error;
  }
};

export const extractFirstImageFromContent = (htmlContent: string): string | null => {
  if (!htmlContent) return null;
  const imgMatch = htmlContent.match(/<img[^>]+src\s*=\s*"([^"]+)"/);
  return imgMatch ? imgMatch[1] : null;
};

export const getPostCoverImage = (post: any): string | null => {
  if (post.thumbnail) return post.thumbnail;
  if (post.content) return extractFirstImageFromContent(post.content);
  return null;
};

export const optimizeImageForThumbnail = (imageUrl: string, size: number = 200): string => {
  if (!imageUrl) return '';

  // Check if it's a Blogger image URL
  const bloggerImageRegex = /^(https?:\/\/\d\.bp\.blogspot\.com\/.+?)(?:\/[swck]?\d+)?(\/[^\/]+)$/;
  const match = imageUrl.match(bloggerImageRegex);

  if (match && match[1] && match[2]) {
    // Reconstruct the URL with the desired size
    return `${match[1]}/s${size}${match[2]}`;
  }

  // For other image URLs, return as is (or handle other services)
  return imageUrl;
};

export const extractTextFromHtml = (htmlContent: string, maxLength: number = 150): string => {
  if (!htmlContent) return '';
  const div = document.createElement('div');
  div.innerHTML = htmlContent;
  const text = div.textContent || div.innerText || '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

export const getPostBySlug = async (slug: string): Promise<any | null> => {
  if (!slug) return null;

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['cache'], 'readonly');
    const objectStore = transaction.objectStore('cache');
    const request = objectStore.get(`post-${slug}`);

    request.onsuccess = () => {
      if (request.result && request.result.data) {
        resolve(request.result.data);
      } else {
        resolve(null);
      }
    };
    request.onerror = (event) => {
      console.error('Error getting cached post:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
};

export const generateMangaReaderUrl = (slug: string, page: number = 1): string => {
  return `/manga/${slug}/${page}`;
};

export const isMangaReaderUrl = (pathname: string): boolean => {
  return /^\/manga\/[^\/]+\/?\d*\/?$/.test(pathname);
};

export const parseMangaReaderUrl = (pathname: string): { slug: string; page: number } | null => {
  const match = pathname.match(/^\/manga\/([^\/]+)(?:\/(\d+))?\/?$/);
  if (match) {
    const slug = match[1];
    const page = match[2] ? parseInt(match[2], 10) : 1;
    return { slug, page };
  }
  return null;
};

