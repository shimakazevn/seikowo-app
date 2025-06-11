import { useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import useUserStore from '../store/useUserStore';
import useFavoriteBookmarkStore from '../store/useFollowBookmarkStore';

export interface MangaData {
  id: string;
  title: string;
  url: string;
  currentPage: number;
  totalPages: number;
  verticalMode: boolean;
}

interface UseBookmarkReturn {
  isBookmarked: (postId: string) => boolean;
  toggleBookmark: (mangaData: MangaData) => Promise<boolean>;
  isLoading: boolean;
}

export const useBookmark = (): UseBookmarkReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const { userId, accessToken, isAuthenticated } = useUserStore();
  const {
    toggleBookmark: storeToggleBookmark,
    isBookmarked: storeIsBookmarked
  } = useFavoriteBookmarkStore();

  const isBookmarked = useCallback((postId: string): boolean => {
    return storeIsBookmarked(postId);
  }, [storeIsBookmarked]);

  const toggleBookmark = useCallback(async (mangaData: MangaData): Promise<boolean> => {
    // Check authentication first
    if (!isAuthenticated || !userId) {
      toast({
        title: 'Cần đăng nhập',
        description: 'Vui lòng đăng nhập để sử dụng tính năng bookmark',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (!mangaData || !mangaData.id) {
      toast({
        title: 'Lỗi',
        description: 'Không thể bookmark manga này',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    setIsLoading(true);
    
    try {
      const success = await storeToggleBookmark(mangaData, userId, accessToken, toast);
      
      if (success !== undefined) {
        const action = success ? 'đã bookmark' : 'đã bỏ bookmark';
        toast({
          title: 'Thành công',
          description: `Bạn ${action} "${mangaData.title}"`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        return success;
      }
      
      return false;
    } catch (error: any) {
      console.error('Bookmark error:', error);
      toast({
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi thực hiện thao tác',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userId, accessToken, storeToggleBookmark, toast]);

  return {
    isBookmarked,
    toggleBookmark,
    isLoading
  };
};

export default useBookmark;
