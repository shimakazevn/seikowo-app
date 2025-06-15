import { create } from 'zustand';
import { getCachedData, setCachedData, clearCachedData, CACHE_KEYS } from '../utils/cache';
import { fetchWithAuth, getBloggerApiUrl } from '../utils/apiUtils';
import { blogConfig } from '../config';
import useUserStore from './useUserStore';

export interface Comment {
  id: string;
  postId: string;
  content: string;
  published: string;
  updated?: string;
  author: {
    displayName: string;
    id?: string;
    email?: string;
    image?: {
      url: string;
    };
  };
  parentId?: string;
}

export interface CommentStore {
  comments: Comment[];
  userComments: Comment[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  lastRefreshTime: number;
  hasMoreComments: boolean;
  nextPageToken: string | null;
  
  // Actions
  fetchComments: (postId: string, forceRefresh?: boolean) => Promise<void>;
  fetchUserComments: (forceRefresh?: boolean) => Promise<void>;
  addComment: (comment: Comment) => void;
  updateComment: (commentId: string, content: string) => void;
  deleteComment: (commentId: string) => void;
  clearComments: () => void;
}

const useCommentStore = create<CommentStore>((set, get) => ({
  comments: [],
  userComments: [],
  loading: false,
  loadingMore: false,
  error: null,
  lastRefreshTime: 0,
  hasMoreComments: true,
  nextPageToken: null,

  fetchComments: async (postId: string, forceRefresh = false) => {
    const { lastRefreshTime } = get();
    const now = Date.now();
    const REFRESH_COOLDOWN = 5000; // 5 seconds cooldown

    // Check if we should use cache
    if (!forceRefresh && now - lastRefreshTime < REFRESH_COOLDOWN) {
      console.log('⏳ Skipping fetch - cooldown period');
      return;
    }

    set({ loading: true, error: null });

    try {
      // Try to get from cache first
      const cacheKey = `${CACHE_KEYS.COMMENTS}_${postId}` as any;
      if (!forceRefresh) {
        const cachedData = await getCachedData(cacheKey);
        if (cachedData) {
          set({
            comments: (cachedData as any).items || [],
            loading: false,
            lastRefreshTime: now
          });
          return;
        }
      }

      // Fetch from API
      const commentsUrl = getBloggerApiUrl(
        `/blogs/${blogConfig.blogId}/posts/${postId}/comments`,
        { maxResults: 100 }
      );
      const response = await fetchWithAuth(commentsUrl);
      
      if (!response.ok) {
        throw new Error('Không thể tải bình luận');
      }

      const data = await response.json();
      const comments = data.items || [];

      // Cache the result
      setCachedData(cacheKey, { items: comments });

      set({
        comments,
        loading: false,
        lastRefreshTime: now,
        hasMoreComments: !!data.nextPageToken,
        nextPageToken: data.nextPageToken || null
      });
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      set({
        error: error.message || 'Có lỗi xảy ra khi tải bình luận',
        loading: false
      });
    }
  },

  fetchUserComments: async (forceRefresh = false) => {
    const { lastRefreshTime } = get();
    const now = Date.now();
    const REFRESH_COOLDOWN = 5000; // 5 seconds cooldown

    // Check if we should use cache
    if (!forceRefresh && now - lastRefreshTime < REFRESH_COOLDOWN) {
      console.log('⏳ Skipping fetch - cooldown period');
      return;
    }

    set({ loading: true, error: null });

    try {
      const userStore = useUserStore.getState();
      const currentUserId = userStore.user?.sub;
      const userEmail = userStore.user?.email;

      if (!currentUserId || !userEmail) {
        throw new Error('Vui lòng đăng nhập để xem bình luận của bạn');
      }

      // Try to get from cache first
      const cacheKey = `${CACHE_KEYS.USER_COMMENTS}_${currentUserId}` as any;
      if (!forceRefresh) {
        const cachedData = await getCachedData(cacheKey);
        if (cachedData) {
          set({
            userComments: (cachedData as any).items || [],
            loading: false,
            lastRefreshTime: now
          });
          return;
        }
      }

      // Fetch all comments and filter by email
      const commentsUrl = getBloggerApiUrl(
        `/blogs/${blogConfig.blogId}/comments`,
        { maxResults: 100 }
      );
      const response = await fetchWithAuth(commentsUrl);
      
      if (!response.ok) {
        throw new Error('Không thể tải danh sách bình luận');
      }

      const data = await response.json();
      const allComments = data.items || [];
      console.log('[fetchUserComments] All comments fetched from API:', allComments.length, allComments);

      // Cache the result (all comments)
      setCachedData(cacheKey, { items: allComments });

      set({
        userComments: allComments, // Store all comments here
        loading: false,
        lastRefreshTime: now,
        hasMoreComments: !!data.nextPageToken,
        nextPageToken: data.nextPageToken || null
      });
    } catch (error: any) {
      console.error('Error fetching user comments:', error);
      set({
        error: error.message || 'Có lỗi xảy ra khi tải bình luận của bạn',
        loading: false
      });
    }
  },

  addComment: (comment: Comment) => {
    set(state => ({
      comments: [comment, ...state.comments],
      userComments: [comment, ...state.userComments]
    }));
  },

  updateComment: (commentId: string, content: string) => {
    set(state => ({
      comments: state.comments.map(c => 
        c.id === commentId ? { ...c, content, updated: new Date().toISOString() } : c
      ),
      userComments: state.userComments.map(c => 
        c.id === commentId ? { ...c, content, updated: new Date().toISOString() } : c
      )
    }));
  },

  deleteComment: (commentId: string) => {
    set(state => ({
      comments: state.comments.filter(c => c.id !== commentId),
      userComments: state.userComments.filter(c => c.id !== commentId)
    }));
  },

  clearComments: () => {
    set({
      comments: [],
      userComments: [],
      loading: false,
      loadingMore: false,
      error: null,
      lastRefreshTime: 0,
      hasMoreComments: true,
      nextPageToken: null
    });
  }
}));

export default useCommentStore; 