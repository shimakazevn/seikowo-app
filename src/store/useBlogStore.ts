import { create } from 'zustand';
import axios from 'axios';
import { blogConfig } from '../config';
// Removed IndexedDB posts storage - using only cache service now
import { getSlugFromUrl } from '../utils/blogUtils';
import { fetchPostsSecurely, fetchNextBatch, fetchInitialBatch } from '../services/proxyService';
import { getCachedData, setCachedData, clearCachedData, CACHE_KEYS } from '../utils/cache';
import { Post, BlogPost as GlobalBlogPost, CachedData as GlobalCachedData } from '../types/global';

const CACHE_EXPIRATION = 60 * 60 * 1000; // 1 hour
const INITIAL_LOAD_KEY = 'initialLoadState';

// Local interfaces
interface BlogPost extends GlobalBlogPost {
  // Extend global BlogPost if needed
}

interface CachedData extends GlobalCachedData {
  items: BlogPost[];
  nextPageToken?: string | null;
}

interface FetchPostsParams {
  forceRefresh?: boolean;
  pageToken?: string;
  orderBy?: string;
  view?: string;
  maxResults?: number;
  selectedTag?: string | null;
}

interface RefreshResult {
  shouldToast: boolean;
  toastMessage: string;
  toastStatus: 'success' | 'warning' | 'error';
}

interface BlogStore {
  posts: BlogPost[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  lastRefreshTime: number;
  selectedTag: string | null;
  nextPageToken: string | null;
  initialLoad: boolean;
  currentStartIndex: number;
  batchSize: number;
  hasMorePosts: boolean;
  // New fields for progressive loading
  allCachedPosts: BlogPost[]; // All posts from multiple batch fetches
  displayedPostsCount: number; // Number of posts currently displayed (20, 40, 60, etc.)
  initialBatchSize: number; // Size of initial fetch (40)
  subsequentBatchSize: number; // Size of subsequent fetches (80)
  currentFetchIndex: number; // Track current fetch position
  isAllPostsFetched: boolean; // Whether we've fetched all available posts
  isFetchingMore: boolean; // Whether currently fetching more posts
  setSelectedTag: (tag: string | null) => void;
  getFilteredPosts: () => BlogPost[];
  getDisplayedPosts: () => BlogPost[];
  fetchInitialBatch: () => Promise<BlogPost[]>;
  fetchMorePosts: () => Promise<BlogPost[]>;
  fetchPosts: (params?: FetchPostsParams) => Promise<void>;
  loadMorePosts: () => Promise<void>;
  refreshPosts: () => Promise<RefreshResult>;
}

const useBlogStore = create<BlogStore>((set, get) => ({
  posts: [],
  loading: false,
  loadingMore: false,
  error: null,
  lastRefreshTime: 0,
  selectedTag: null,
  nextPageToken: null,
  initialLoad: false,
  currentStartIndex: 1,
  batchSize: 20,
  hasMorePosts: true,
  // New fields for progressive loading
  allCachedPosts: [],
  displayedPostsCount: 20, // Start with 20 posts displayed
  initialBatchSize: 40, // Fetch 40 posts initially for fast loading
  subsequentBatchSize: 80, // Fetch 80 posts per batch for subsequent loads
  currentFetchIndex: 1, // Track current fetch position
  isAllPostsFetched: false, // Whether we've fetched all available posts
  isFetchingMore: false, // Whether currently fetching more posts

  setSelectedTag: (tag: string | null) => set({ selectedTag: tag }),

  getFilteredPosts: (): BlogPost[] => {
    const { posts, selectedTag } = get();
    if (!selectedTag) return posts;
    return posts.filter(post =>
      post.labels && post.labels.includes(selectedTag)
    );
  },

  // Get currently displayed posts (for infinite loading display)
  getDisplayedPosts: (): BlogPost[] => {
    const { allCachedPosts, displayedPostsCount, selectedTag } = get();
    let postsToShow = allCachedPosts;

    // Apply tag filter if selected
    if (selectedTag) {
      postsToShow = allCachedPosts.filter(post =>
        post.labels && post.labels.includes(selectedTag)
      );
    }

    // Return only the number of posts that should be displayed
    return postsToShow.slice(0, displayedPostsCount);
  },

  // Store initialization removed - using cache service instead

  // Fetch initial batch (40 posts for fast loading)
  fetchInitialBatch: async (): Promise<BlogPost[]> => {
    const { initialBatchSize } = get();

    try {
      const response = await fetchPostsSecurely({
        maxResults: initialBatchSize,
        startIndex: 1,
        useCache: false
      });

      const posts = response.items || [];
      set({ currentFetchIndex: initialBatchSize + 1 });
      return posts;
    } catch (error: any) {
      console.error('Error fetching initial batch:', error);
      throw error;
    }
  },

  // Fetch more posts when needed (80 posts per batch)
  fetchMorePosts: async (): Promise<BlogPost[]> => {
    const { subsequentBatchSize, currentFetchIndex, isFetchingMore, isAllPostsFetched } = get();

    if (isFetchingMore || isAllPostsFetched) {
      return [];
    }

    set({ isFetchingMore: true });

    try {
      const response = await fetchPostsSecurely({
        maxResults: subsequentBatchSize,
        startIndex: currentFetchIndex,
        useCache: false
      });

      const newPosts = response.items || [];
      const nextIndex = currentFetchIndex + subsequentBatchSize;
      const allPostsFetched = newPosts.length < subsequentBatchSize;

      set({
        currentFetchIndex: nextIndex,
        isAllPostsFetched: allPostsFetched,
        isFetchingMore: false
      });

      return newPosts;
    } catch (error: any) {
      console.error('Error fetching more posts:', error);
      set({ isFetchingMore: false });
      throw error;
    }
  },

  fetchPosts: async (params: FetchPostsParams = {}): Promise<void> => {
    const { forceRefresh = false, pageToken, orderBy = 'published', view = 'READER' } = params;
    const { allCachedPosts, displayedPostsCount } = get();
    const currentInitialLoad = get().initialLoad;
    const shouldFetchFresh = !currentInitialLoad || forceRefresh;

    if (!shouldFetchFresh && allCachedPosts.length > 0) {
      const displayedPosts = get().getDisplayedPosts();
      set({
        posts: displayedPosts,
        loading: false,
        lastRefreshTime: Date.now(),
        initialLoad: true,
        hasMorePosts: allCachedPosts.length > displayedPostsCount
      });
      return;
    }

    set({ loading: true, error: null });

    try {
      if (shouldFetchFresh) {
        const cacheKey = `${CACHE_KEYS.ATOM_POSTS}_progressive`;
        await clearCachedData(cacheKey as any);
      }

      const initialPosts = await get().fetchInitialBatch();
      const displayedPosts = initialPosts.slice(0, displayedPostsCount);
      const now = Date.now();

      const cacheKey = `${CACHE_KEYS.ATOM_POSTS}_progressive`;
      setCachedData(cacheKey as any, { items: initialPosts });

      set({
        allCachedPosts: initialPosts,
        posts: displayedPosts,
        nextPageToken: null,
        hasMorePosts: true,
        loading: false,
        lastRefreshTime: now,
        initialLoad: true,
        isAllPostsFetched: false
      });

    } catch (error: any) {
      console.error('Error fetching posts:', error);

      if (!shouldFetchFresh) {
        try {
          const fallbackCacheKey = `${CACHE_KEYS.ATOM_POSTS}_progressive`;
          const fallbackData = await getCachedData(fallbackCacheKey as any);
          if (fallbackData && (fallbackData as any).items) {
            const fallbackPosts = (fallbackData as any).items;
            const displayedPosts = fallbackPosts.slice(0, displayedPostsCount);

            set({
              allCachedPosts: fallbackPosts,
              posts: displayedPosts,
              loading: false,
              hasMorePosts: true,
              error: null,
              initialLoad: true
            });
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback cache also failed:', fallbackError);
        }
      }

      set({
        error: error?.message,
        loading: false
      });
    }
  },

  loadMorePosts: async (): Promise<void> => {
    const { allCachedPosts, displayedPostsCount, batchSize, hasMorePosts, loading, loadingMore, selectedTag, isAllPostsFetched } = get();

    if (loading || loadingMore || !hasMorePosts) {
      return;
    }

    set({ loadingMore: true });

    try {
      const newDisplayedCount = displayedPostsCount + batchSize;
      let postsToShow = allCachedPosts;
      
      if (selectedTag) {
        postsToShow = allCachedPosts.filter(post =>
          post.labels && post.labels.includes(selectedTag)
        );
      }

      const needMorePosts = newDisplayedCount > postsToShow.length && !isAllPostsFetched;

      if (needMorePosts) {
        try {
          const newPosts = await get().fetchMorePosts();

          if (newPosts.length > 0) {
            const existingIds = new Set(allCachedPosts.map(p => p.id));
            const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
            const updatedAllPosts = [...allCachedPosts, ...uniqueNewPosts];

            const cacheKey = `${CACHE_KEYS.ATOM_POSTS}_progressive`;
            setCachedData(cacheKey as any, { items: updatedAllPosts });

            postsToShow = selectedTag
              ? updatedAllPosts.filter(post => post.labels && post.labels.includes(selectedTag))
              : updatedAllPosts;

            set({ allCachedPosts: updatedAllPosts });
          }
        } catch (fetchError: any) {
          console.error('Error fetching more posts:', fetchError);
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const displayedPosts = postsToShow.slice(0, newDisplayedCount);
      const hasMore = postsToShow.length > newDisplayedCount || !isAllPostsFetched;

      set({
        posts: displayedPosts,
        displayedPostsCount: newDisplayedCount,
        hasMorePosts: hasMore,
        loadingMore: false
      });

    } catch (error: any) {
      console.error('Error loading more posts:', error);
      set({
        loadingMore: false,
        error: error?.message
      });
    }
  },

  refreshPosts: async (): Promise<RefreshResult> => {
    const { lastRefreshTime, selectedTag, initialBatchSize } = get();
    const orderBy = 'published';
    const REFRESH_COOLDOWN = 60000;
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;

    if (timeSinceLastRefresh < REFRESH_COOLDOWN && !selectedTag) {
      const remainingTime = Math.ceil((REFRESH_COOLDOWN - timeSinceLastRefresh) / 1000);
      return {
        shouldToast: true,
        toastMessage: `Bạn cần đợi ${remainingTime} giây nữa để làm mới dữ liệu`,
        toastStatus: 'warning',
      };
    }

    try {
      const cacheKeys = [
        `${CACHE_KEYS.ATOM_POSTS}_progressive`,
        CACHE_KEYS.ATOM_POSTS
      ];

      for (const key of cacheKeys) {
        await clearCachedData(key as any);
      }

      set({
        initialLoad: false,
        displayedPostsCount: 20,
        hasMorePosts: true,
        posts: [],
        allCachedPosts: [],
        currentFetchIndex: 1,
        isAllPostsFetched: false,
        isFetchingMore: false
      });

      await get().fetchPosts({ forceRefresh: true, orderBy, selectedTag });

      return {
        shouldToast: true,
        toastMessage: 'Đã cập nhật dữ liệu mới nhất',
        toastStatus: 'success',
      };
    } catch (error: any) {
      console.error('Error in refreshPosts:', error);
      return {
        shouldToast: true,
        toastMessage: 'Có lỗi xảy ra khi làm mới dữ liệu',
        toastStatus: 'error',
      };
    }
  },
  // Add other actions for CRUD operations (create, update, delete) if needed
}));

export default useBlogStore;
export type { Post };