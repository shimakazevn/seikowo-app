import { create } from 'zustand';
import { getHistoryData, saveHistoryData } from '../utils/indexedDBUtils';
import { backupUserData } from '../api/auth';
import { MAX_BOOKMARKS, FavoritePost, MangaBookmark } from '../utils/postUtils';
import { extractImage, Post } from '../utils/blogUtils';

// Interfaces
interface ToastFunction {
  (options: {
    title: string;
    description: string;
    status: 'success' | 'error' | 'warning' | 'info';
    duration: number;
    isClosable: boolean;
  }): void;
}

interface SyncResult {
  favoriteCount: number;
  bookmarkCount: number;
  synced: boolean;
  changes: {
    favorites: number;
    bookmarks: number;
  };
}

interface FavoriteBookmarkStore {
  favorites: FavoritePost[];
  bookmarks: MangaBookmark[];
  loading: boolean;
  error: string | null;
  initialize: (userId: string) => Promise<void>;
  toggleFavorite: (post: Post, userId: string, accessToken: string | null, toast?: ToastFunction) => Promise<boolean>;
  removeFavorite: (postId: string, userId: string, toast?: ToastFunction) => Promise<boolean>;
  isFavorited: (postId: string) => boolean;
  toggleBookmark: (mangaData: MangaBookmark, userId: string, accessToken: string | null, toast?: ToastFunction) => Promise<boolean>;
  isBookmarked: (mangaId: string) => boolean;
  getBookmarkData: (mangaId: string) => MangaBookmark | undefined;
  syncGuestData: (userId: string, toast?: ToastFunction) => Promise<SyncResult | false>;
}

const useFavoriteBookmarkStore = create<FavoriteBookmarkStore>((set, get) => ({
  // State
  favorites: [],
  bookmarks: [],
  loading: false,
  error: null,

  // Actions
  initialize: async (userId: string): Promise<void> => {
    if (!userId) return;

    set({ loading: true, error: null });
    try {
      const [favorites, bookmarks] = await Promise.all([
        getHistoryData('favorites', userId),
        getHistoryData('bookmarks', userId)
      ]);

      set({
        favorites: Array.isArray(favorites) ? favorites : [],
        bookmarks: Array.isArray(bookmarks) ? bookmarks : [],
        loading: false
      });
    } catch (error: any) {
      console.error('Error initializing favorite/bookmark store:', error);
      set({ error: 'Failed to load data', loading: false });
    }
  },

  // Favorite actions
  toggleFavorite: async (post: Post, userId: string, accessToken: string | null, toast?: ToastFunction): Promise<boolean> => {
    if (!userId || userId === 'guest') {
      toast?.({
        title: 'Cần đăng nhập',
        description: 'Vui lòng đăng nhập để sử dụng tính năng favorite',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    const { favorites } = get();
    const isCurrentlyFavorited = favorites.some(item => item.id === post.id);

    try {
      let updatedFavorites: any[];
      if (isCurrentlyFavorited) {
        updatedFavorites = favorites.filter(item => item.id !== post.id);
      } else {
        const newFavorite: FavoritePost = {
          id: post.id!,
          title: post.title,
          url: post.url,
          published: post.published,
          updated: post.updated,
          labels: post.labels,
          thumbnail: post.thumbnail || (post.content ? extractImage(post.content) : null),
          favoriteAt: Date.now(),
        };
        updatedFavorites = [newFavorite, ...favorites].slice(0, 1000);
      }

      userId ? await saveHistoryData('favorites', userId, updatedFavorites) : Promise.resolve();
      set({ favorites: updatedFavorites });

      // Backup to Google Drive if logged in
      if (accessToken) {
        try {
          const backupData = {
            favoritePosts: updatedFavorites,
            mangaBookmarks: get().bookmarks,
            readPosts: userId ? await getHistoryData('reads', userId) : []
          };
          await backupUserData(accessToken, userId, backupData);
          console.log('Backup to Google Drive successful');
        } catch (error: any) {
          console.error('Error backing up to Google Drive:', error);
          toast?.({
            title: 'Lỗi sao lưu',
            description: 'Không thể sao lưu dữ liệu lên Google Drive',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      }

      toast?.({
        title: isCurrentlyFavorited ? 'Đã bỏ yêu thích' : 'Đã yêu thích',
        description: isCurrentlyFavorited ? 'Bạn đã bỏ yêu thích truyện này' : 'Bạn đã yêu thích truyện này',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      return !isCurrentlyFavorited;
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast?.({
        title: 'Lỗi',
        description: 'Không thể thực hiện thao tác yêu thích',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
  },

  removeFavorite: async (postId: string, userId: string, toast?: ToastFunction): Promise<boolean> => {
    if (!userId || userId === 'guest') {
      toast?.({
        title: 'Cần đăng nhập',
        description: 'Vui lòng đăng nhập để sử dụng tính năng yêu thích',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    try {
      const { favorites } = get();
      const updatedFavorites = favorites.filter(item => item.id !== postId);
      
      await saveHistoryData('favorites', userId, updatedFavorites);
      set({ favorites: updatedFavorites });

      toast?.({
        title: 'Đã xóa',
        description: 'Đã xóa bài viết khỏi danh sách yêu thích',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });

      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast?.({
        title: 'Lỗi',
        description: 'Không thể xóa bài viết khỏi danh sách yêu thích',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
  },

  isFavorited: (postId: string): boolean => {
    return get().favorites.some(item => item.id === postId);
  },

  // Bookmark actions
  toggleBookmark: async (mangaData: MangaBookmark, userId: string, accessToken: string | null, toast?: ToastFunction): Promise<boolean> => {
    if (!userId || userId === 'guest') {
      toast?.({
        title: 'Cần đăng nhập',
        description: 'Vui lòng đăng nhập để sử dụng tính năng bookmark',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    const { bookmarks } = get();
    const existingBookmark = bookmarks.find(b => b.id === mangaData.id);

    try {
      let updatedBookmarks: any[];
      if (existingBookmark) {
        updatedBookmarks = bookmarks.filter(b => b.id !== mangaData.id);
      } else {
        const newBookmark: MangaBookmark = {
          id: mangaData.id,
          title: mangaData.title,
          url: mangaData.url,
          currentPage: mangaData.currentPage,
          totalPages: (mangaData as any).totalPages,
          verticalMode: (mangaData as any).verticalMode,
          timestamp: Date.now(),
          bookmarkAt: Date.now()
        };
        updatedBookmarks = [newBookmark, ...bookmarks].slice(0, MAX_BOOKMARKS);
      }

      userId ? await saveHistoryData('bookmarks', userId, updatedBookmarks) : Promise.resolve();
      set({ bookmarks: updatedBookmarks });

      // Backup to Google Drive if logged in
      if (accessToken) {
        try {
          const backupData = {
            favoritePosts: get().favorites,
            mangaBookmarks: updatedBookmarks,
            readPosts: userId ? await getHistoryData('reads', userId) : []
          };
          await backupUserData(accessToken, userId, backupData);
        } catch (error: any) {
          console.error('Error backing up to Google Drive:', error);
        }
      }

      toast?.({
        title: existingBookmark ? 'Đã bỏ bookmark' : 'Đã bookmark',
        description: existingBookmark ? 'Bạn đã bỏ bookmark truyện này' : 'Bạn đã bookmark truyện này',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      return !existingBookmark;
    } catch (error: any) {
      console.error('Error toggling bookmark:', error);
      toast?.({
        title: 'Lỗi',
        description: 'Không thể thực hiện thao tác bookmark',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
  },

  isBookmarked: (mangaId: string): boolean => {
    return get().bookmarks.some(item => item.id === mangaId);
  },

  getBookmarkData: (mangaId: string): MangaBookmark | undefined => {
    return get().bookmarks.find(item => item.id === mangaId);
  },

  // Sync actions
  syncGuestData: async (userId: string, toast?: ToastFunction): Promise<SyncResult | false> => {
    if (!userId) return false;

    try {
      const [guestFavorites, guestBookmarks, userFavorites, userBookmarks] = await Promise.all([
        getHistoryData('favorites', 'guest'),
        getHistoryData('bookmarks', 'guest'),
        getHistoryData('favorites', userId),
        getHistoryData('bookmarks', userId)
      ]);

      const mergeArrays = <T extends { id: string; [key: string]: any }>(
        user: T[] | any,
        guest: T[] | any,
        timestampKey: string
      ): T[] => {
        const userArray = Array.isArray(user) ? user : [];
        const guestArray = Array.isArray(guest) ? guest : [];
        const merged = [...userArray, ...guestArray];
        const unique = Array.from(new Map(merged.map((item: any) => [item.id, item])).values());
        return unique.sort((a: any, b: any) => (b[timestampKey] || 0) - (a[timestampKey] || 0));
      };

      const mergedFavorites = mergeArrays<FavoritePost>(userFavorites, guestFavorites, 'favoriteAt');
      const mergedBookmarks = mergeArrays<MangaBookmark>(userBookmarks, guestBookmarks, 'timestamp');

      await Promise.all([
        saveHistoryData('favorites', userId, mergedFavorites),
        saveHistoryData('bookmarks', userId, mergedBookmarks),
        saveHistoryData('favorites', 'guest', []),
        saveHistoryData('bookmarks', 'guest', [])
      ]);

      set({
        favorites: mergedFavorites,
        bookmarks: mergedBookmarks
      });

      return {
        favoriteCount: mergedFavorites.length,
        bookmarkCount: mergedBookmarks.length,
        synced: true,
        changes: {
          favorites: mergedFavorites.length - (Array.isArray(userFavorites) ? userFavorites.length : 0),
          bookmarks: mergedBookmarks.length - (Array.isArray(userBookmarks) ? userBookmarks.length : 0)
        }
      };
    } catch (error: any) {
      console.error('Error syncing guest data:', error);
      toast?.({
        title: 'Lỗi',
        description: 'Không thể đồng bộ dữ liệu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
  }
}));

export default useFavoriteBookmarkStore;