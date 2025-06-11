import { getSlugFromUrl, extractImage, Post } from './blogUtils';
import { getHistoryData, saveHistoryData, getHistoryKey, openDatabase, getDataFromDB, saveDataToDB, withTransaction } from './indexedDBUtils';
import { getUserInfo } from './userUtils';

// Interfaces
export interface PostData {
  id: string;
  title?: string;
  url?: string;
  content?: string;
  published?: string;
  updated?: string;
  labels?: string[];
  thumbnail?: string | null;
  slug?: string;
  timestamp?: number;
  data?: PostData;
}

export interface MangaBookmark extends PostData {
  currentPage: number;
  bookmarkId?: string;
}

export interface FavoritePost extends PostData {
  favoriteAt: number;
}

// Keep old interface for backward compatibility
export interface FollowedPost extends PostData {
  followAt: number;
}

export interface SyncResult {
  followCount: number;
  bookmarkCount: number;
  synced: boolean;
  changes: {
    follows: number;
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

// Sync guest data to user account with improved error handling
export const syncGuestData = async (userId: string): Promise<SyncResult> => {
  if (!userId) {
    throw new Error('User ID is required for sync');
  }

  try {
    // Get local data
    const [follows, bookmarks] = await Promise.all([
      getHistoryData('favorites', 'guest'),
      getHistoryData('bookmarks', 'guest')
    ]);

    // Get user data
    const [userFollows, userBookmarks] = await Promise.all([
      getHistoryData('favorites', userId),
      getHistoryData('bookmarks', userId)
    ]);

    // Merge data
    const mergedFollowPosts = mergeArrays<FollowedPost>(
      Array.isArray(userFollows) ? userFollows : [],
      Array.isArray(follows) ? follows : [],
      'followAt'
    );
    const mergedBookmarks = mergeArrays<MangaBookmark>(
      Array.isArray(userBookmarks) ? userBookmarks : [],
      Array.isArray(bookmarks) ? bookmarks : [],
      'timestamp'
    );

    // Save merged data in parallel
    await Promise.all([
      saveHistoryData('follows', userId, mergedFollowPosts),
      saveHistoryData('bookmarks', userId, mergedBookmarks)
    ]);

    // Clear guest data after successful sync
    await Promise.all([
      saveHistoryData('follows', 'guest', []),
      saveHistoryData('bookmarks', 'guest', [])
    ]);

    return {
      followCount: mergedFollowPosts.length,
      bookmarkCount: mergedBookmarks.length,
      synced: true,
      changes: {
        follows: mergedFollowPosts.length - (Array.isArray(userFollows) ? userFollows.length : 0),
        bookmarks: mergedBookmarks.length - (Array.isArray(userBookmarks) ? userBookmarks.length : 0)
      }
    };
  } catch (error: any) {
    console.error('Error syncing guest data:', error);
    throw error;
  }
};

// Helper function to check if a post is followed with improved error handling
export const isFollowed = async (post: PostData | { data: PostData }, userId: string = 'guest'): Promise<boolean> => {
  if (!post) {
    throw new Error('Post data is required');
  }

  const realPost = (post as { data: PostData })?.data ? (post as { data: PostData }).data : (post as PostData);
  if (!realPost || !realPost.id) {
    throw new Error('Invalid post data structure');
  }

  try {
    const followedPosts = userId ? await getHistoryData('follows', userId) : [];
    return Array.isArray(followedPosts) && followedPosts.some((item: FollowedPost) => item.id === realPost.id);
  } catch (error: any) {
    console.error('Error checking if post is followed:', error);
    throw error;
  }
};

// Helper function to save a post as followed with improved error handling
export const saveFollow = async (post: PostData | { data: PostData }, userId: string = 'guest'): Promise<boolean> => {
  if (!post) {
    throw new Error('Post data is required');
  }

  const realPost = (post as { data: PostData })?.data ? (post as { data: PostData }).data : (post as PostData);
  if (!realPost || !realPost.id) {
    throw new Error('Invalid post data structure');
  }

  try {
    const followedPosts = userId ? await getHistoryData('follows', userId) : [];
    const filteredPosts: any[] = Array.isArray(followedPosts) ? followedPosts.filter((item: FollowedPost) => item.id !== realPost.id) : [];

    const thumbnail = realPost.thumbnail || (realPost.content ? extractImage(realPost.content) : null);
    const newFollow: FollowedPost = {
      id: realPost.id,
      title: realPost.title,
      url: realPost.url,
      published: realPost.published,
      updated: realPost.updated,
      labels: realPost.labels,
      thumbnail,
      followAt: Date.now(),
    };

    const updatedPosts = [newFollow, ...filteredPosts].slice(0, MAX_FAVORITES);
    userId ? await saveHistoryData('favorites', userId, updatedPosts) : Promise.resolve();
    return true;
  } catch (error: any) {
    console.error('Error saving follow:', error);
    throw error;
  }
};

// Helper function to remove a post from followed with improved error handling
export const removeFollow = async (post: PostData | { data: PostData }, userId: string = 'guest'): Promise<boolean> => {
  if (!post) {
    throw new Error('Post data is required');
  }

  const realPost = (post as { data: PostData })?.data ? (post as { data: PostData }).data : (post as PostData);
  if (!realPost || !realPost.id) {
    throw new Error('Invalid post data structure');
  }

  try {
    const followedPosts = userId ? await getHistoryData('favorites', userId) : [];
    if (!Array.isArray(followedPosts)) {
      return true;
    }

    const updatedPosts = followedPosts.filter((item: FollowedPost) => item.id !== realPost.id);
    userId ? await saveHistoryData('favorites', userId, updatedPosts) : Promise.resolve();
    return true;
  } catch (error: any) {
    console.error('Error removing follow:', error);
    throw error;
  }
};

// Post cache functions removed - using cache service instead

export const clearPostCache = async (): Promise<void> => {
  try {
    await withTransaction(['posts'], 'readwrite', async (tx) => {
      const store = tx.objectStore('posts');
      await store.clear();
    });
  } catch (error: any) {
    console.error('Error clearing post cache:', error);
    throw error;
  }
};

// Admin-specific utility functions

/**
 * Extract the first image URL from HTML content for admin
 */
export const extractFirstImageFromContent = (htmlContent: string): string | null => {
  if (!htmlContent) return null;

  try {
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Look for img tags
    const imgElements = tempDiv.querySelectorAll('img');

    for (const img of imgElements) {
      const src = img.getAttribute('src');
      if (src && src.trim()) {
        // Skip small images (likely icons or decorative elements)
        const width = img.getAttribute('width');
        const height = img.getAttribute('height');

        if (width && height) {
          const w = parseInt(width);
          const h = parseInt(height);
          if (w < 100 || h < 100) continue;
        }

        // Skip data URLs and very small images
        if (src.startsWith('data:') && src.length < 1000) continue;

        return src;
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting image from content:', error);
    return null;
  }
};

/**
 * Get cover image for a post - prioritize featured image, fallback to first content image
 */
export const getPostCoverImage = (post: any): string | null => {
  // Try to get featured image from post.images
  if (post.images && post.images.length > 0) {
    return post.images[0].url;
  }

  // Fallback to first image in content
  if (post.content) {
    return extractFirstImageFromContent(post.content);
  }

  return null;
};

/**
 * Optimize image URL for thumbnail display
 */
export const optimizeImageForThumbnail = (imageUrl: string, size: number = 200): string => {
  if (!imageUrl) return '';

  try {
    // Handle Blogger/Blogspot images
    if (imageUrl.includes('blogspot.com') || imageUrl.includes('blogger.com')) {
      // Remove existing size parameters
      let optimizedUrl = imageUrl.replace(/\/s\d+-c\//, '/').replace(/=s\d+/, '');

      // Add thumbnail size parameter
      if (optimizedUrl.includes('=')) {
        optimizedUrl += `&s=${size}`;
      } else {
        optimizedUrl += `=s${size}`;
      }

      return optimizedUrl;
    }

    // Handle Google Drive images
    if (imageUrl.includes('drive.google.com')) {
      const fileIdMatch = imageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=s${size}`;
      }
    }

    // For other URLs, return as-is
    return imageUrl;
  } catch (error) {
    console.error('Error optimizing image URL:', error);
    return imageUrl;
  }
};

/**
 * Extract text content from HTML (for preview)
 */
export const extractTextFromHtml = (htmlContent: string, maxLength: number = 150): string => {
  if (!htmlContent) return '';

  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Remove script and style elements
    const scripts = tempDiv.querySelectorAll('script, style');
    scripts.forEach(el => el.remove());

    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    if (textContent.length <= maxLength) {
      return textContent.trim();
    }

    return textContent.substring(0, maxLength).trim() + '...';
  } catch (error) {
    console.error('Error extracting text from HTML:', error);
    return '';
  }
};

/**
 * Get post by slug from cache
 */
export const getPostBySlug = async (slug: string): Promise<any | null> => {
  try {
    console.log('[postUtils] Getting post by slug:', slug);

    // Get all cached posts
    const posts = await getDataFromDB('posts', 'all');

    if (!Array.isArray(posts) || posts.length === 0) {
      console.log('[postUtils] No cached posts found');
      return null;
    }

    // Find post by slug
    const post = posts.find(p => {
      if (!p || !p.url) return false;

      // Extract slug from URL
      const urlParts = p.url.split('/');
      const postSlug = urlParts[urlParts.length - 1].replace('.html', '');

      return postSlug === slug;
    });

    if (post) {
      console.log('[postUtils] Found post:', post.title);
      return post;
    }

    console.log('[postUtils] Post not found for slug:', slug);
    return null;
  } catch (error) {
    console.error('[postUtils] Error getting post by slug:', error);
    return null;
  }
};

/**
 * Generate manga reader URL
 */
export const generateMangaReaderUrl = (slug: string, page: number = 1): string => {
  return `/read/${slug}/${page}`;
};

/**
 * Check if current URL is manga reader
 */
export const isMangaReaderUrl = (pathname: string): boolean => {
  return pathname.startsWith('/read/');
};

/**
 * Parse manga reader URL
 */
export const parseMangaReaderUrl = (pathname: string): { slug: string; page: number } | null => {
  const match = pathname.match(/^\/read\/([^\/]+)\/(\d+)$/);

  if (match) {
    return {
      slug: match[1],
      page: parseInt(match[2])
    };
  }

  return null;
};

