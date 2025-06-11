import { useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { backupUserData, deleteUserData } from '../api/auth';
import { getHistoryData, saveHistoryData } from '../utils/indexedDBUtils';
import { handleError } from '../api';
import useUserStore from '../store/useUserStore';
import type { UserSettings } from '../types/settings';

export const useUserDataManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { userId, hasAccessToken, accessToken } = useUserStore();
  const toast = useToast();

  const backupToGoogleDrive = useCallback(async () => {
    if (!hasAccessToken || !userId || userId === 'guest') {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập để sử dụng tính năng này",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      const readPosts = await getHistoryData('reads', userId);
      const favoritePosts = await getHistoryData('favorites', userId);
      const mangaBookmarks = await getHistoryData('bookmarks', userId);
      
      const userData: UserSettings = {
        readPosts,
        favoritePosts,
        mangaBookmarks
      };

      await backupUserData(accessToken, userId, userData);
      
      toast({
        title: "Thành công",
        description: "Đã sao lưu dữ liệu lên Google Drive",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [hasAccessToken, userId, toast, accessToken]);

  const clearAllUserData = useCallback(async () => {
    if (!hasAccessToken || !userId || userId === 'guest') {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập để sử dụng tính năng này",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      await deleteUserData(accessToken, userId);

      const clearOperations = [
        saveHistoryData('favorites', userId, []),
        saveHistoryData('bookmarks', userId, []),
        saveHistoryData('reads', userId, []),
        saveHistoryData('userData', userId, null)
      ];

      await Promise.all(clearOperations);

      toast({
        title: "Thành công",
        description: "Đã xóa toàn bộ dữ liệu",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [hasAccessToken, userId, toast, accessToken]);

  return {
    isLoading,
    backupToGoogleDrive,
    clearAllUserData
  };
};
