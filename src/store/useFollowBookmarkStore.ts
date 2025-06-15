import { create } from 'zustand';
import { getHistoryData, saveHistoryData } from '../utils/indexedDBUtils';
import { backupUserData, restoreUserData, deleteUserData } from '../api/auth';
import { MAX_BOOKMARKS } from '../utils/postUtils';
import { extractImage } from '../utils/blogUtils';
import type { FavoritePost, MangaBookmark, ToastFunction, Post } from '../types';

// Interfaces

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
  storeReady: boolean;
  initialize: (userId: string) => Promise<void>;
  toggleFavorite: (post: Post, userId: string, accessToken: string | null, toast?: ToastFunction) => Promise<boolean>;
  removeFavorite: (postId: string, userId: string, toast?: ToastFunction) => Promise<boolean>;
  isFavorited: (postId: string) => boolean;
  toggleBookmark: (mangaData: MangaBookmark, userId: string, accessToken: string | null, toast?: ToastFunction) => Promise<boolean>;
  isBookmarked: (mangaId: string) => boolean;
  getBookmarkData: (mangaId: string) => MangaBookmark | undefined;
  resetStore: () => void;
  syncData: (userId: string, accessToken: string | null, toast?: ToastFunction) => Promise<boolean>;
}

const useFavoriteBookmarkStore = create<FavoriteBookmarkStore>((set, get) => ({
  // State
  favorites: [],
  bookmarks: [],
  loading: false,
  error: null,
  storeReady: false,

  // Actions
  initialize: async (userId: string): Promise<void> => {
    if (!userId) return;

    set({ loading: true, error: null, storeReady: false });
    try {
      const [favoritesRaw, bookmarksRaw] = await Promise.all([
        getHistoryData('favorites', userId),
        getHistoryData('bookmarks', userId)
      ]);

      const favorites = favoritesRaw as FavoritePost[];
      const bookmarks = bookmarksRaw as MangaBookmark[];

      set({
        favorites: (Array.isArray(favorites) ? favorites : []) as FavoritePost[],
        bookmarks: (Array.isArray(bookmarks) ? bookmarks : []) as MangaBookmark[],
        loading: false,
        storeReady: true
      });
      console.log('[useFavoriteBookmarkStore] Favorites after initialization:', get().favorites);
    } catch (error: any) {
      console.error('Error initializing favorite/bookmark store:', error);
      set({ error: 'Failed to load data', loading: false, storeReady: true });
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
      let updatedFavorites: FavoritePost[];
      if (isCurrentlyFavorited) {
        updatedFavorites = favorites.filter(item => item.id !== post.id);
      } else {
        const newFavorite: FavoritePost = {
          id: post.id,
          title: post.title,
          url: post.url,
          published: post.published,
          updated: post.updated,
          labels: post.labels,
          thumbnail: post.thumbnail || (post.content ? extractImage(post.content) : null),
          favoriteAt: Date.now(),
          timestamp: Date.now(),
        };
        updatedFavorites = [newFavorite, ...favorites].slice(0, 1000);
      }
      console.log('[useFavoriteBookmarkStore] Before saving favorites, updatedFavorites:', updatedFavorites);

      userId ? await saveHistoryData('favorites', userId, updatedFavorites) : Promise.resolve();
      set({ favorites: updatedFavorites });
      console.log('[useFavoriteBookmarkStore] Favorites after toggleFavorite:', get().favorites);

      // Backup to Google Drive if logged in
      if (accessToken) {
        try {
          const backupData = {
            favoritePosts: updatedFavorites,
            mangaBookmarks: get().bookmarks,
            readPosts: userId ? await getHistoryData('reads', userId) : []
          };
          await backupUserData(userId, backupData);
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
      console.log('[useFavoriteBookmarkStore] Favorites after removeFavorite:', get().favorites);

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
      let updatedBookmarks: MangaBookmark[];
      if (existingBookmark) {
        updatedBookmarks = bookmarks.filter(b => b.id !== mangaData.id);
      } else {
        const newBookmark: MangaBookmark = {
          id: mangaData.id,
          title: mangaData.title,
          url: mangaData.url,
          currentPage: mangaData.currentPage,
          totalPages: mangaData.totalPages,
          verticalMode: mangaData.verticalMode,
          timestamp: Date.now(),
        };
        updatedBookmarks = [newBookmark, ...bookmarks].slice(0, MAX_BOOKMARKS);
      }
      console.log('[useFollowBookmarkStore] Before saving bookmarks, updatedBookmarks:', updatedBookmarks);

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
          await backupUserData(userId, backupData);
          console.log('Backup to Google Drive successful');
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
  syncData: async (userId: string, accessToken: string | null, toast?: ToastFunction): Promise<boolean> => {
    if (!userId || userId === 'guest') {
      toast?.({
        title: 'Cần đăng nhập',
        description: 'Vui lòng đăng nhập để đồng bộ dữ liệu',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    try {
      const [localFavoritesRaw, localBookmarksRaw, localReadsRaw] = await Promise.all([
        getHistoryData('favorites', userId),
        getHistoryData('bookmarks', userId),
        getHistoryData('reads', userId)
      ]);

      const localFavorites = localFavoritesRaw as FavoritePost[];
      const localBookmarks = localBookmarksRaw as MangaBookmark[];
      const localReads = localReadsRaw as any[];

      let driveData = null;
      try {
        driveData = await restoreUserData(userId);
      } catch (error: any) {
        console.warn('Error restoring from Drive, will use local data only:', error);
        // If file doesn't exist or access denied, create new file on Drive with local data
        if (error instanceof Error && 
            (error.message?.includes('Failed to fetch') || error.message?.includes('not found'))) {
          try {
            await backupUserData(userId, {
              favoritePosts: Array.isArray(localFavorites) ? localFavorites : [],
              mangaBookmarks: Array.isArray(localBookmarks) ? localBookmarks : [],
              readPosts: Array.isArray(localReads) ? localReads : []
            });
            toast?.({
              title: 'Đã tạo mới',
              description: 'Đã tạo mới file dữ liệu trên Google Drive',
              status: 'info',
              duration: 3000,
              isClosable: true,
            });
          } catch (backupError: unknown) {
            console.error('Error creating new Drive file:', backupError);
            toast?.({
              title: 'Lỗi',
              description: 'Không thể tạo file dữ liệu mới trên Google Drive',
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
          }
        }
      }

      const mergeArrays = <T extends { id: string; favoriteAt?: number; timestamp?: number }>(local: T[] | any, drive: T[] | any, timestampKey: 'favoriteAt' | 'timestamp'): T[] => {
        const localArray = Array.isArray(local) ? local : [];
        const driveArray = Array.isArray(drive) ? drive : [];
        const merged = [...localArray, ...driveArray];
        const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
        return unique.sort((a, b) => (b[timestampKey] || 0) - (a[timestampKey] || 0));
      };

      let mergedFavorites: FavoritePost[];
      let mergedBookmarks: MangaBookmark[];
      let mergedReads: any[];

      if (driveData) {
        mergedFavorites = mergeArrays<FavoritePost>(localFavorites, driveData.favoritePosts, 'favoriteAt');
        mergedBookmarks = mergeArrays<MangaBookmark>(localBookmarks, driveData.mangaBookmarks, 'timestamp');
        mergedReads = mergeArrays<any>(localReads, driveData.readPosts, 'timestamp'); // Assuming readPosts also have a timestamp
      } else {
        // If no drive data (either not found or error), use local data as merged data
        mergedFavorites = Array.isArray(localFavorites) ? localFavorites : [];
        mergedBookmarks = Array.isArray(localBookmarks) ? localBookmarks : [];
        mergedReads = Array.isArray(localReads) ? localReads : [];
      }

      // Save merged data to IndexedDB
      await Promise.all([
        saveHistoryData('favorites', userId, mergedFavorites),
        saveHistoryData('bookmarks', userId, mergedBookmarks),
        saveHistoryData('reads', userId, mergedReads),
      ]);

      set({
        favorites: mergedFavorites,
        bookmarks: mergedBookmarks,
      });

      // Always backup to Google Drive after merge (this is the key change for the new flow)
      try {
        await backupUserData(userId, {
          favoritePosts: mergedFavorites,
          mangaBookmarks: mergedBookmarks,
          readPosts: mergedReads
        });
        toast?.({
          title: 'Đồng bộ thành công',
          description: 'Dữ liệu đã được đồng bộ giữa thiết bị và Google Drive',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (backupError: unknown) {
        console.error('Error backing up merged data to Google Drive:', backupError);
        toast?.({
          title: 'Lỗi sao lưu',
          description: 'Không thể sao lưu dữ liệu đã đồng bộ lên Google Drive',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }

      return true;
    } catch (error: any) {
      console.error('Error syncing data:', error);
      set({ error: 'Failed to sync data', loading: false });
      toast?.({
        title: 'Lỗi đồng bộ',
        description: 'Không thể đồng bộ dữ liệu giữa thiết bị và Google Drive',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
  },

  // New reset action
  resetStore: () => set({ favorites: [], bookmarks: [], loading: false, error: null }),
}));

export default useFavoriteBookmarkStore;