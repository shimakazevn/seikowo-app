import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getHistoryData, saveHistoryData } from '../utils/indexedDBUtils';
import { backupUserData, restoreUserData, deleteUserData } from '../api/auth';
import type { FavoritePost, MangaBookmark, Post, ToastFunction } from '../types';

interface SyncResult {
  favorites: FavoritePost[];
  bookmarks: MangaBookmark[];
  readPosts: any[];
}

interface FavoriteBookmarkStore {
  favorites: FavoritePost[];
  bookmarks: MangaBookmark[];
  loading: boolean;
  error: string | null;
  lastSyncTimestamp: number | null;
  initialize: (userId: string) => Promise<void>;
  toggleFavorite: (post: Post, userId: string, accessToken: string | null, toast?: ToastFunction) => Promise<boolean>;
  removeFavorite: (postId: string, userId: string, toast?: ToastFunction) => Promise<boolean>;
  isFavorited: (postId: string) => boolean;
  toggleBookmark: (mangaData: MangaBookmark, userId: string, accessToken: string | null, toast?: ToastFunction) => Promise<boolean>;
  isBookmarked: (mangaId: string) => boolean;
  getBookmarkData: (mangaId: string) => MangaBookmark | undefined;
  syncGuestData: (userId: string, toast?: ToastFunction) => Promise<SyncResult | false>;
  syncData: (userId: string, accessToken: string | null, toast?: ToastFunction) => Promise<boolean>;
  resetStore: () => void;
}

// Define the state type that will be persisted by zustand/middleware/persist
type PersistedState = {
  favorites: FavoritePost[];
  bookmarks: MangaBookmark[];
  lastSyncTimestamp: number | null;
};

const useFavoriteBookmarkStore = create<FavoriteBookmarkStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      bookmarks: [],
      loading: false,
      error: null,
      lastSyncTimestamp: null,

      initialize: async (userId: string) => {
        if (!userId || userId === 'guest') {
          set({ loading: false, error: 'Cần đăng nhập' });
          return;
        }

        set({ loading: true, error: null });
        try {
          const [localFavorites, localBookmarks] = await Promise.all([
            getHistoryData('favorites', userId),
            getHistoryData('bookmarks', userId)
          ]);

          set({
            favorites: Array.isArray(localFavorites) ? localFavorites as FavoritePost[] : [],
            bookmarks: Array.isArray(localBookmarks) ? localBookmarks as MangaBookmark[] : [],
            loading: false
          });
        } catch (error: any) {
          console.error('Error initializing:', error);
          set({ error: 'Failed to initialize', loading: false });
        }
      },

      toggleFavorite: async (post: Post, userId: string, accessToken: string | null, toast?: ToastFunction): Promise<boolean> => {
        if (!userId || userId === 'guest') {
          toast?.({
            title: 'Cần đăng nhập',
            description: 'Vui lòng đăng nhập để thêm vào danh sách yêu thích',
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
              id: post.id!,
              title: post.title,
              url: post.url,
              published: post.published,
              updated: post.updated || post.published,
              labels: post.labels || [],
              thumbnail: post.thumbnail || null,
              timestamp: Date.now(),
              favoriteAt: Date.now(),
            };
            updatedFavorites = [newFavorite, ...favorites];
          }

          await saveHistoryData('favorites', userId, updatedFavorites);
          set({ favorites: updatedFavorites });

          // Backup to Google Drive if logged in
          if (accessToken) {
            try {
              await backupUserData(userId, {
                favoritePosts: updatedFavorites,
                mangaBookmarks: get().bookmarks,
                readPosts: await getHistoryData('reads', userId) || []
              });
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
            description: isCurrentlyFavorited ? 'Bạn đã bỏ yêu thích bài viết này' : 'Bạn đã yêu thích bài viết này',
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
            description: 'Vui lòng đăng nhập để xóa khỏi danh sách yêu thích',
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
              ...mangaData,
              timestamp: Date.now()
            };
            updatedBookmarks = [newBookmark, ...bookmarks];
          }

          await saveHistoryData('bookmarks', userId, updatedBookmarks);
          set({ bookmarks: updatedBookmarks });

          // Backup to Google Drive if logged in
          if (accessToken) {
            try {
              await backupUserData(userId, {
                favoritePosts: get().favorites,
                mangaBookmarks: updatedBookmarks,
                readPosts: await getHistoryData('reads', userId) || []
              });
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

      syncGuestData: async (userId: string, toast?: ToastFunction): Promise<SyncResult | false> => {
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

        set({ loading: true, error: null });
        try {
          const [localFavorites, localBookmarks, driveData] = await Promise.all([
            getHistoryData('favorites', userId),
            getHistoryData('bookmarks', userId),
            restoreUserData(userId)
          ]);

          if (!driveData) {
            const result = {
              favorites: Array.isArray(localFavorites) ? localFavorites as FavoritePost[] : [],
              bookmarks: Array.isArray(localBookmarks) ? localBookmarks as MangaBookmark[] : [],
              readPosts: await getHistoryData('reads', userId) || []
            };
            set({
              favorites: result.favorites,
              bookmarks: result.bookmarks,
              loading: false
            });
            return result;
          }

          const mergeArrays = <T extends { id: string; favoriteAt?: number; timestamp?: number }>(
            local: T[] | any,
            drive: T[] | any,
            timestampKey: 'favoriteAt' | 'timestamp'
          ): T[] => {
            const localArray = Array.isArray(local) ? local : [];
            const driveArray = Array.isArray(drive) ? drive : [];
            const merged = [...localArray, ...driveArray];
            const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
            return unique.sort((a, b) => (b[timestampKey] || 0) - (a[timestampKey] || 0));
          };

          const mergedFavorites = mergeArrays<FavoritePost>(
            localFavorites,
            driveData.favoritePosts,
            'favoriteAt'
          );
          const mergedBookmarks = mergeArrays<MangaBookmark>(
            localBookmarks,
            driveData.mangaBookmarks,
            'timestamp'
          );

          await Promise.all([
            saveHistoryData('favorites', userId, mergedFavorites),
            saveHistoryData('bookmarks', userId, mergedBookmarks),
            backupUserData(userId, {
              favoritePosts: mergedFavorites,
              mangaBookmarks: mergedBookmarks,
              readPosts: await getHistoryData('reads', userId) || []
            })
          ]);

          const result = { 
            favorites: mergedFavorites,
            bookmarks: mergedBookmarks,
            readPosts: await getHistoryData('reads', userId) || []
          };

          set({
            favorites: result.favorites,
            bookmarks: result.bookmarks,
            loading: false
          });

          toast?.({
            title: 'Đồng bộ thành công',
            description: 'Dữ liệu đã được đồng bộ giữa thiết bị và Google Drive',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });

          return result;
        } catch (error: any) {
          console.error('Error syncing guest data:', error);
          set({ error: 'Failed to sync guest data', loading: false });
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

        const store = get();
        const MIN_SYNC_INTERVAL = 5 * 60 * 1000; // 5 phút

        console.log('[useFavoriteBookmarkStore] syncData called:', {
          lastSyncTimestamp: store.lastSyncTimestamp,
          currentTime: Date.now(),
          timeSinceLastSync: Date.now() - (store.lastSyncTimestamp || 0),
          storeState: store
        });

        if (store.lastSyncTimestamp && (Date.now() - store.lastSyncTimestamp < MIN_SYNC_INTERVAL)) {
          console.log('[useFavoriteBookmarkStore] Skipping sync:', {
            lastSync: new Date(store.lastSyncTimestamp).toLocaleString(),
            timeSinceLastSync: Date.now() - store.lastSyncTimestamp,
            minInterval: MIN_SYNC_INTERVAL
          });
          return true; // Already synced recently, no need to sync again
        }

        set({ loading: true, error: null });
        try {
          // Get local data first
          const [localFavorites, localBookmarks] = await Promise.all([
            getHistoryData('favorites', userId),
            getHistoryData('bookmarks', userId)
          ]);

          // Try to get data from Drive
          let driveData = null;
          try {
            driveData = await restoreUserData(userId);
          } catch (error: unknown) {
            console.warn('Error restoring from Drive, will use local data only:', error);
            // If file doesn't exist or access denied, create new file
            if (error instanceof Error && 
                (error.message?.includes('Failed to fetch') || error.message?.includes('not found'))) {
              try {
                // Delete old file if exists
                await deleteUserData(userId);
                // Create new file with local data
                await backupUserData(userId, {
                  favoritePosts: Array.isArray(localFavorites) ? localFavorites : [],
                  mangaBookmarks: Array.isArray(localBookmarks) ? localBookmarks : [],
                  readPosts: await getHistoryData('reads', userId) || []
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

          // If no drive data, use local data
          if (!driveData) {
            set({
              favorites: Array.isArray(localFavorites) ? localFavorites as FavoritePost[] : [],
              bookmarks: Array.isArray(localBookmarks) ? localBookmarks as MangaBookmark[] : [],
              loading: false,
              lastSyncTimestamp: Date.now() // Cập nhật timestamp khi đồng bộ thành công
            });
            return true;
          }

          // Merge local and drive data
          const mergeArrays = <T extends { id: string; favoriteAt?: number; timestamp?: number }>(
            local: T[] | any,
            drive: T[] | any,
            timestampKey: 'favoriteAt' | 'timestamp'
          ): T[] => {
            const localArray = Array.isArray(local) ? local : [];
            const driveArray = Array.isArray(drive) ? drive : [];
            const merged = [...localArray, ...driveArray];
            const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
            return unique.sort((a, b) => (b[timestampKey] || 0) - (a[timestampKey] || 0));
          };

          const mergedFavorites = mergeArrays<FavoritePost>(
            localFavorites,
            driveData.favoritePosts,
            'favoriteAt'
          );
          const mergedBookmarks = mergeArrays<MangaBookmark>(
            localBookmarks,
            driveData.mangaBookmarks,
            'timestamp'
          );

          // Save merged data to both IndexedDB and Drive
          await Promise.all([
            saveHistoryData('favorites', userId, mergedFavorites),
            saveHistoryData('bookmarks', userId, mergedBookmarks),
            backupUserData(userId, {
              favoritePosts: mergedFavorites,
              mangaBookmarks: mergedBookmarks,
              readPosts: await getHistoryData('reads', userId) || []
            })
          ]);

          set({
            favorites: mergedFavorites,
            bookmarks: mergedBookmarks,
            loading: false,
            lastSyncTimestamp: Date.now() // Cập nhật timestamp khi đồng bộ thành công
          });

          toast?.({
            title: 'Đồng bộ thành công',
            description: 'Dữ liệu đã được đồng bộ giữa thiết bị và Google Drive',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });

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

      resetStore: () => {
        set({
          favorites: [],
          bookmarks: [],
          loading: false,
          error: null,
          lastSyncTimestamp: null // Reset timestamp on store reset
        });
      },
    }),
    {
      name: 'favorite-bookmark-storage',
      partialize: (state) => ({
        favorites: state.favorites,
        bookmarks: state.bookmarks,
        lastSyncTimestamp: state.lastSyncTimestamp,
      } as PersistedState),
    }
  )
);

export default useFavoriteBookmarkStore; 