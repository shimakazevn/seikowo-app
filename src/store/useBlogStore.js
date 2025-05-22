import {create} from 'zustand';
import axios from 'axios';
import { blogConfig } from '../config'; // Import blogConfig

const CACHE_KEY = 'cachedPosts';
const CACHE_TIME_KEY = 'cacheTime';
const CACHE_EXPIRATION = 10 * 60 * 1000; // 10 minutes

const useBlogStore = create((set, get) => ({
  posts: [],
  loading: false,
  error: null,
  lastRefreshTime: 0,
  fetchPosts: async (forceRefresh = false) => {
    set({ loading: true, error: null });

    const cachedData = localStorage.getItem(CACHE_KEY);
    const cacheTime = localStorage.getItem(CACHE_TIME_KEY);

    if (
      !forceRefresh &&
      cachedData &&
      cacheTime &&
      Date.now() - parseInt(cacheTime) < CACHE_EXPIRATION
    ) {
      set({
        posts: JSON.parse(cachedData),
        loading: false,
        lastRefreshTime: parseInt(cacheTime),
      });
      return;
    }

    try {
      const response = await axios.get(
        `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/posts?key=${blogConfig.apiKey}&maxResults=200`
      );
      const now = Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify(response.data.items || []));
      localStorage.setItem(CACHE_TIME_KEY, now.toString());
      set({
        posts: response.data.items || [],
        loading: false,
        lastRefreshTime: now,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  refreshPosts: async () => {
    const { lastRefreshTime } = get();
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
    await get().fetchPosts(true); // Call fetchPosts with forceRefresh = true
    return {
        shouldToast: true,
        toastMessage: 'Đã cập nhật dữ liệu mới nhất',
        toastStatus: 'success',
      };
  },
  // Add other actions for CRUD operations (create, update, delete) if needed
}));

export default useBlogStore; 