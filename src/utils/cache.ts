import { openDatabase } from './indexedDBUtils';

// Cache management - Optimized for RSS method
const CACHE_DURATION = {
  RSS_POSTS: 10 * 60 * 1000,    // 10 minutes for RSS posts (longer since RSS is reliable)
  PAGES: 30 * 60 * 1000,        // 30 minutes for pages (rarely change)
  TAGS: 60 * 60 * 1000,         // 1 hour for tags (very stable)
  USER_DATA: 24 * 60 * 60 * 1000, // 24 hours for user data
  OFFLINE: 7 * 24 * 60 * 60 * 1000, // 7 days for offline fallback
  COMMENTS: 5 * 60 * 1000,      // 5 minutes for comments (frequently updated)
  USER_COMMENTS: 10 * 60 * 1000 // 10 minutes for user comments (less frequently updated)
} as const;

export const CACHE_KEYS = {
  POSTS: 'cached_posts',
  PAGES: 'cached_pages',
  TAGS: 'cached_tags',
  USER_DATA: 'cached_user_data',
  RSS: 'cached_rss',
  RSS_POSTS: 'cached_rss_posts',
  ATOM: 'cached_atom',
  ATOM_POSTS: 'cached_atom_posts',
  ATOM_POSTS_PROGRESSIVE: 'cached_atom_posts_progressive',
  OFFLINE_POSTS: 'offline_posts', // Long-term offline cache
  COMMENTS: 'cached_comments',    // Cache for post comments
  USER_COMMENTS: 'cached_user_comments' // Cache for user's comments
} as const;

export type CacheKey = typeof CACHE_KEYS[keyof typeof CACHE_KEYS];

interface CacheData<T> {
  value: T;
  timestamp: number;
}

// Initialize cache with default values
export const initializeCache = async () => {
  try {
    const db = await openDatabase();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');

    // Initialize ATOM_POSTS with empty array if not exists
    const atomPosts = await store.get(CACHE_KEYS.ATOM_POSTS);
    if (!atomPosts) {
      await store.put({
        id: CACHE_KEYS.ATOM_POSTS,
        value: { items: [] },
        timestamp: Date.now()
      });
    }

    // Initialize ATOM_POSTS_PROGRESSIVE with empty array if not exists
    const progressivePosts = await store.get(CACHE_KEYS.ATOM_POSTS_PROGRESSIVE);
    if (!progressivePosts) {
      await store.put({
        id: CACHE_KEYS.ATOM_POSTS_PROGRESSIVE,
        value: { items: [] },
        timestamp: Date.now()
      });
    }
  } catch (e) {
    console.error('[Cache] Failed to initialize cache:', e);
  }
};

// Call initializeCache when the module loads
// initializeCache(); // Removed automatic initialization

export const getCachedData = async <T>(key: CacheKey, customDuration?: number): Promise<T | null> => {
  try {
    const db = await openDatabase();
    const tx = db.transaction('cache', 'readonly');
    const store = tx.objectStore('cache');

    console.log(`[Cache] Attempting to get data for key: ${key}`);

    return new Promise<T | null>((resolve, reject) => {
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          console.log(`[Cache] No data found for key: ${key}`);
          resolve(null);
          return;
        }

        // Explicitly cast to unknown first, then to CacheData<T>
        const data = result as unknown as CacheData<T>;
        if (data && data.timestamp) {
          // Use custom duration or default based on cache key
          const duration = customDuration || getCacheDuration(key);
          const isCacheValid = (Date.now() - data.timestamp) < duration;

          if (isCacheValid) {
            console.log(`[Cache] Valid cache found for key: ${key}. Data:`, data.value);
            resolve(data.value);
          } else {
            console.log(`[Cache] Cache for key: ${key} is expired.`);
            resolve(null);
          }
        } else {
          console.log(`[Cache] Invalid cache structure for key: ${key}.`);
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('[Cache] Failed to load cache from IndexedDB', request.error);
        resolve(null);
      };
    });
  } catch (e) {
    console.error('[Cache] Failed to load cache from IndexedDB', e);
    return null;
  }
};

export const setCachedData = async <T>(key: CacheKey, data: T): Promise<void> => {
  try {
    const db = await openDatabase();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');

    console.log(`[Cache] Attempting to set data for key: ${key}. Data:`, data);

    await store.put({
      id: key,
      value: data,
      timestamp: Date.now()
    });
    console.log(`[Cache] Data successfully set for key: ${key}.`);
  } catch (e) {
    console.error('[Cache] Failed to save cache to IndexedDB', e);
  }
};

export const clearCache = async (key: CacheKey): Promise<void> => {
  try {
    const db = await openDatabase();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    console.log(`[Cache] Attempting to clear cache for key: ${key}`);
    await store.delete(key);
    console.log(`[Cache] Cache successfully cleared for key: ${key}.`);
  } catch (e) {
    console.error('[Cache] Failed to clear cache from IndexedDB', e);
  }
};

// Helper function to get cache duration based on key
const getCacheDuration = (key: CacheKey): number => {
  switch (key) {
    case CACHE_KEYS.RSS_POSTS:
    case CACHE_KEYS.POSTS:
    case CACHE_KEYS.ATOM:
    case CACHE_KEYS.ATOM_POSTS:
      return CACHE_DURATION.RSS_POSTS;
    case CACHE_KEYS.PAGES:
      return CACHE_DURATION.PAGES;
    case CACHE_KEYS.TAGS:
      return CACHE_DURATION.TAGS;
    case CACHE_KEYS.USER_DATA:
      return CACHE_DURATION.USER_DATA;
    case CACHE_KEYS.OFFLINE_POSTS:
      return CACHE_DURATION.OFFLINE;
    case CACHE_KEYS.COMMENTS:
      return CACHE_DURATION.COMMENTS;
    case CACHE_KEYS.USER_COMMENTS:
      return CACHE_DURATION.USER_COMMENTS;
    default:
      return CACHE_DURATION.RSS_POSTS;
  }
};

// Save data for offline use (long-term cache)
export const saveOfflineData = async <T>(key: CacheKey, data: T): Promise<void> => {
  try {
    const offlineKey = `${key}_offline`;
    const db = await openDatabase();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    await store.put({
      id: offlineKey,
      value: data,
      timestamp: Date.now()
    });
  } catch (e) {
    console.error('Failed to save offline data to IndexedDB', e);
  }
};

// Get offline data when network fails
export const getOfflineData = async <T>(key: CacheKey): Promise<T | null> => {
  try {
    const offlineKey = `${key}_offline`;
    const db = await openDatabase();
    const tx = db.transaction('cache', 'readonly');
    const store = tx.objectStore('cache');
    // Explicitly cast to unknown first, then to CacheData<T>
    const data = await store.get(offlineKey) as unknown as CacheData<T> | undefined;

    if (data && data.value) {
      console.log(`📱 Using offline data for ${key} (${Math.round((Date.now() - data.timestamp) / (24 * 60 * 60 * 1000))} days old)`);
      return data.value;
    }
  } catch (e) {
    console.error('Failed to load offline data from IndexedDB', e);
  }
  return null;
};

// Clear specific cached data
export const clearCachedData = async (key: CacheKey): Promise<void> => {
  try {
    // Validate key before proceeding
    if (!key || typeof key !== 'string') {
      console.warn('Invalid cache key provided:', key);
      return;
    }

    const db = await openDatabase();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    console.log(`[Cache] Attempting to clear cache for key: ${key}`);
    await store.delete(key);
    console.log(`[Cache] Cache successfully cleared for key: ${key}.`);
  } catch (e) {
    console.error('[Cache] Failed to clear cache from IndexedDB', e);
  }
};

// Normalize slug for consistent matching
const normalizeSlugForMatching = (slug: string): string => {
  return slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

// Extract slug from URL
const extractSlugFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part);

    if (pathParts.length >= 3) {
      // Format: /year/month/slug.html
      return `${pathParts[0]}/${pathParts[1]}/${pathParts[2].replace('.html', '')}`;
    } else if (pathParts.length === 1) {
      // Format: /slug.html
      return pathParts[0].replace('.html', '');
    }

    return '';
  } catch (e) {
    return '';
  }
};

// Find post by slug in cached data with comprehensive matching
export const findPostInCache = async (slug: string): Promise<any | null> => {
  try {
    // Normalize slug - remove .html extension if present
    const normalizedSlug = slug.replace(/\.html$/, '');

    // Extract slug part correctly - handle both full path and just slug
    let slugPart = '';
    if (normalizedSlug.includes('/')) {
      // Format: 2024/12/post-title -> get 'post-title'
      slugPart = normalizedSlug.split('/').pop() || '';
    } else {
      // Format: post-title -> use as is
      slugPart = normalizedSlug;
    }

    const normalizedSlugPart = normalizeSlugForMatching(slugPart);

    console.log('🔍 Searching for post in cache:', {
      originalSlug: slug,
      normalizedSlug,
      slugPart,
      normalizedSlugPart
    });

    // Try different cache keys where posts might be stored
    const cacheKeys = [
      CACHE_KEYS.ATOM_POSTS,  // Main cache from postLoader
      CACHE_KEYS.ATOM_POSTS + '_progressive',  // Progressive cache from HomePage
      CACHE_KEYS.ATOM_POSTS + '_batch_1',
      CACHE_KEYS.ATOM_POSTS + '_batch_21',
      CACHE_KEYS.ATOM_POSTS + '_batch_41',
      CACHE_KEYS.ATOM_POSTS + '_batch_61',
      CACHE_KEYS.ATOM_POSTS + '_batch_81',
      CACHE_KEYS.ATOM_POSTS + '_batch_101'
    ];

    for (const cacheKey of cacheKeys) {
      const cachedData = await getCachedData(cacheKey as CacheKey);

      if (cachedData && (cachedData as any).items && Array.isArray((cachedData as any).items)) {
        const posts = (cachedData as any).items;
        console.log(`🔍 Searching in cache ${cacheKey} with ${posts.length} posts`);

        // Debug: Show first few posts to understand the data structure
        if (posts.length > 0) {
          console.log('📊 Sample posts in cache:', posts.slice(0, 3).map((p: any) => ({
            title: p.title,
            slug: p.slug,
            url: p.url || p.link,
            id: p.id
          })));
        }

        // Search for post by slug with DATE-AWARE matching strategies
        const foundPost = posts.find((post: any) => {
          if (!post) return false;

          const postSlug = post.slug || '';
          const postUrl = post.url || post.link || '';
          const postTitle = post.title || '';

          // Extract search components
          const searchParts = normalizedSlug.split('/');
          const hasSearchDate = searchParts.length >= 3;
          const searchYear = hasSearchDate ? searchParts[0] : '';
          const searchMonth = hasSearchDate ? searchParts[1] : '';
          const searchSlugPart = hasSearchDate ? searchParts[2] : normalizedSlug;

          // Debug logging for each post
          console.log('🔍 Checking post:', {
            title: postTitle?.substring(0, 50) + '...',
            postSlug,
            postUrl,
            searchSlug: normalizedSlug,
            searchComponents: { searchYear, searchMonth, searchSlugPart }
          });

          // Strategy 1: EXACT full path matches (highest priority)
          if (postSlug === normalizedSlug || postSlug === slug) {
            console.log('✅ Found by EXACT slug match:', postTitle);
            return true;
          }

          // Strategy 2: URL-based EXACT matching with date validation
          if (postUrl) {
            const extractedSlug = extractSlugFromUrl(postUrl);
            console.log('🔍 Extracted slug from URL:', extractedSlug);

            // EXACT match including date
            if (extractedSlug === normalizedSlug || extractedSlug === slug) {
              console.log('✅ Found by EXACT URL slug match:', postTitle);
              return true;
            }

            // DATE-AWARE matching: validate year/month/slug all match
            if (hasSearchDate) {
              const urlParts = extractedSlug.split('/');
              if (urlParts.length >= 3) {
                const [urlYear, urlMonth, urlSlugPart] = urlParts;

                console.log('🔍 Date-aware comparison:', {
                  url: { urlYear, urlMonth, urlSlugPart },
                  search: { searchYear, searchMonth, searchSlugPart }
                });

                // All components must match for date-aware posts
                if (urlYear === searchYear &&
                    urlMonth === searchMonth &&
                    urlSlugPart.replace(/\.html$/, '') === searchSlugPart) {
                  console.log('✅ Found by DATE-AWARE URL match:', postTitle);
                  return true;
                }
              }
            }
          }

          // Strategy 3: PostSlug DATE-AWARE matching
          if (postSlug && hasSearchDate) {
            const postParts = postSlug.split('/');
            if (postParts.length >= 3) {
              const [postYear, postMonth, postSlugPart] = postParts;

              console.log('🔍 PostSlug date-aware comparison:', {
                post: { postYear, postMonth, postSlugPart: postSlugPart.replace(/\.html$/, '') },
                search: { searchYear, searchMonth, searchSlugPart }
              });

              if (postYear === searchYear &&
                  postMonth === searchMonth &&
                  postSlugPart.replace(/\.html$/, '') === searchSlugPart) {
                console.log('✅ Found by DATE-AWARE postSlug match:', postTitle);
                return true;
              }
            }
          }

          // Strategy 4: Fallback - slug part only (ONLY if no date info in search)
          if (!hasSearchDate) {
            const urlSlugPart = postUrl ? extractSlugFromUrl(postUrl).split('/').pop()?.replace(/\.html$/, '') : '';
            const postSlugPart = postSlug ? postSlug.split('/').pop()?.replace(/\.html$/, '') : '';

            console.log('🔍 Fallback slug part comparison (no date):', {
              urlSlugPart,
              postSlugPart,
              searchSlugPart
            });

            if ((urlSlugPart && urlSlugPart === searchSlugPart) ||
                (postSlugPart && postSlugPart === searchSlugPart)) {
              console.log('✅ Found by fallback slug part match (no date):', postTitle);
              return true;
            }
          }

          return false;
        });

        if (foundPost) {
          console.log('✅ Found post in cache:', cacheKey, foundPost.title);
          return foundPost;
        } else {
          console.log('❌ No match found in cache:', cacheKey);
        }
      } else {
        console.log('❌ No data in cache:', cacheKey);
      }
    }

    console.log('❌ Post not found in any cache');
    return null;
  } catch (error: any) {
    console.error('Error searching for post in cache:', error);
    return null;
  }
};