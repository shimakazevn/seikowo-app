import {create} from 'zustand';
import axios from 'axios';
import { blogConfig } from '../config'; // Import blogConfig
import { getPostsFromDB, savePostsToDB, clearPostsFromDB } from '../utils/indexedDBUtils';

const CACHE_EXPIRATION = 10 * 60 * 1000; // 10 minutes

const useBlogStore = create((set, get) => ({
  posts: [],
  loading: false,
  error: null,
  lastRefreshTime: 0,
  selectedTag: null,
  nextPageToken: null,

  setSelectedTag: (tag) => set({ selectedTag: tag }),

  getFilteredPosts: () => {
    const { posts, selectedTag } = get();
    if (!selectedTag) return posts;
    return posts.filter(post => 
      post.labels && post.labels.includes(selectedTag)
    );
  },

  fetchPosts: async (params = {}) => {
    const { forceRefresh = false, pageToken, orderBy = 'published', view = 'READER', maxResults = 100 } = params;
    set({ loading: true, error: null });

    // Cache key based on orderBy
    const cacheKey = `cachedPosts_${orderBy}`;

    // Try to get from IndexedDB first
    if (!pageToken && !forceRefresh) {
      const cachedData = await getPostsFromDB(cacheKey);
      if (cachedData) {
         // Check cache expiration time (if stored with data)
        if (cachedData.timestamp && Date.now() - cachedData.timestamp < CACHE_EXPIRATION) {
          set({
            posts: cachedData.items || [],
            loading: false,
            lastRefreshTime: cachedData.timestamp,
            nextPageToken: cachedData.nextPageToken || null, // Also load nextPageToken from cache
          });
          console.log('Loaded posts from IndexedDB cache', orderBy);
          return;
        } else {
           // Cache expired, clear it
          console.log('IndexedDB cache expired', orderBy);
          await clearPostsFromDB(cacheKey);
        }
      }
    }

    try {
      // Map orderBy UI value to Blogger API value
      let apiOrderBy = orderBy;
      if (orderBy === 'newest') apiOrderBy = 'published';
      if (orderBy === 'updated') apiOrderBy = 'updated';

      const response = await axios.get(
        `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/posts`,
        {
          params: {
            key: blogConfig.apiKey,
            maxResults,
            orderBy: apiOrderBy,
            view,
            pageToken
          }
        }
      );

      const newPosts = response.data.items || [];
      const now = Date.now();
      const newNextPageToken = response.data.nextPageToken || null;

      // If it's the first page, save to IndexedDB
      if (!pageToken) {
        const dataToCache = { items: newPosts, timestamp: now, nextPageToken: newNextPageToken };
        await savePostsToDB(cacheKey, dataToCache);
        console.log('Saved posts to IndexedDB cache', orderBy);
      }

      set(state => ({
        posts: pageToken ? [...state.posts, ...newPosts] : newPosts,
        nextPageToken: newNextPageToken,
        loading: false,
        lastRefreshTime: now,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  refreshPosts: async () => {
    const { lastRefreshTime, selectedTag, orderBy } = get();
    const REFRESH_COOLDOWN = 30000; // 30 seconds
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;

    if (timeSinceLastRefresh < REFRESH_COOLDOWN) {
      const remainingTime = Math.ceil(
        (REFRESH_COOLDOWN - timeSinceLastRefresh) / 1000
      );
      // We can't use toast here directly, the component should handle this
      console.warn(`Please wait ${remainingTime} seconds to refresh.`);
      return {
        shouldToast: true,
        toastMessage: `Bạn cần đợi ${remainingTime} giây nữa để làm mới dữ liệu`,
        toastStatus: 'warning',
      };
    }
    // Clear current cache in IndexedDB for the current orderBy before fetching
    const cacheKey = `cachedPosts_${orderBy}`;
    await clearPostsFromDB(cacheKey);
    
    await get().fetchPosts({ forceRefresh: true, orderBy, selectedTag }); // Call fetchPosts with forceRefresh = true
    return {
        shouldToast: true,
        toastMessage: 'Đã cập nhật dữ liệu mới nhất',
        toastStatus: 'success',
      };
  },
  // Add other actions for CRUD operations (create, update, delete) if needed
}));

export default useBlogStore; 