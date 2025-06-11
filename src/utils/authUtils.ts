import {
  getUserInfo,
  backupUserData,
  clearStoredTokens,
  isTokenValid
} from '../api/auth';
import {
  getHistoryData,
  saveHistoryData,
  saveUserData,
  getUserData,
  deleteUserData as deleteUserDataFromDB
} from './indexedDBUtils';
import { handleError } from '../api';
import { useNavigate } from 'react-router-dom';
import { UseToastOptions } from '@chakra-ui/react';

interface UserData {
  id: string;
  sub: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email_verified: boolean;

  timestamp: number;
  lastSyncTime: number;
  syncStatus: {
    totalFollows: number;
    totalBookmarks: number;
  };
  accessToken?: string;
}

interface LogoutParams {
  userId: string;
  navigate: ReturnType<typeof useNavigate>;
  toast: (options: UseToastOptions) => void;
  onClose?: () => void;
}

interface LoginParams {
  response: {
    access_token: string;
    refresh_token: string;
  };
  setUser: (userData: UserData, accessToken: string, refreshToken: string) => Promise<boolean>;
  initializeUser: () => void;
  navigate: ReturnType<typeof useNavigate>;
  toast: (options: UseToastOptions) => void;
  onClose?: () => void;
}

export const handleLogout = async ({ userId, navigate, toast, onClose }: LogoutParams): Promise<void> => {
  try {
    if (onClose) onClose();
    const userData = userId ? await getUserData(userId) : null;
    const accessToken = userData?.accessToken;
    if (accessToken && userId) {
      try {
        const favoritePosts = userId ? await getHistoryData('favorites', userId) : [];
        const readPosts = userId ? await getHistoryData('reads', userId) : [];
        const mangaBookmarks = userId ? await getHistoryData('bookmarks', userId) : [];
        await backupUserData(accessToken, userId, { readPosts, favoritePosts, mangaBookmarks });
        toast({ title: "Đã sao lưu dữ liệu", description: "Dữ liệu của bạn đã được sao lưu lên Google Drive", status: "success", duration: 2000 });
      } catch (error: any) {
        console.error('Error backing up data:', error);
        toast({ title: "Cảnh báo", description: "Không thể sao lưu dữ liệu trước khi đăng xuất", status: "warning", duration: 3000, isClosable: true });
      }
    }
    userId ? await saveHistoryData('bookmarks', userId, []) : Promise.resolve();
    userId ? await saveHistoryData('follows', userId, []) : Promise.resolve();
    userId ? await saveHistoryData('reads', userId, []) : Promise.resolve();
    await deleteUserDataFromDB(userId);
    await clearStoredTokens();
    // Toast is handled by useAuthNew to avoid duplicates
    // toast({ title: "Đăng xuất thành công", description: "Đang chuyển về trang chủ...", status: "success", duration: 2000, isClosable: true });
    navigate('/', { replace: true });
  } catch (error: any) {
    console.error('Logout error:', error);
    const handledError = handleError(error);
    toast({ title: "Lỗi đăng xuất", description: handledError.message || "Có lỗi xảy ra khi đăng xuất", status: "error", duration: 5000, isClosable: true });
    navigate('/', { replace: true });
  }
};

export const handleLogin = async ({
  response,
  setUser,
  initializeUser,
  navigate,
  toast,
  onClose
}: LoginParams): Promise<void> => {
  try {
    console.log('=== Starting Login Process ===');
    if (onClose) onClose();
    const userInfo = await getUserInfo(response.access_token);
    if (!userInfo || !userInfo.sub) {
      throw new Error('Không thể lấy thông tin người dùng');
    }
    await clearStoredTokens();
    await deleteUserDataFromDB('guest');
    const mergedData = {
      follows: await getHistoryData('follows', 'guest'),
      bookmarks: await getHistoryData('bookmarks', 'guest')
    };
    await saveHistoryData('follows', userInfo.sub, mergedData.follows || []);
    await saveHistoryData('bookmarks', userInfo.sub, mergedData.bookmarks || []);
    const userData: UserData = {
      id: userInfo.sub,
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      given_name: userInfo.given_name,
      family_name: userInfo.family_name,
      picture: userInfo.picture,
      email_verified: userInfo.email_verified,

      timestamp: Date.now(),
      lastSyncTime: Date.now(),
      syncStatus: {
        totalFollows: mergedData.follows?.length || 0,
        totalBookmarks: mergedData.bookmarks?.length || 0
      }
    };
    await saveUserData(userInfo.sub, userData);
    const success = await setUser(
      userData,
      response.access_token,
      response.refresh_token
    );
    if (!success) {
      throw new Error('Failed to update user state');
    }
    toast({
      title: "Đăng nhập thành công",
      description: `Chào mừng ${userInfo.name}!`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    // No automatic redirect - let components handle their own navigation
    console.log('✅ Login successful via authUtils, staying on current page');
  } catch (error: any) {
    console.error('Login error:', error);
    toast({
      title: "Lỗi đăng nhập",
      description: error instanceof Error ? error?.message : "Không thể đăng nhập",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
    await clearStoredTokens();
  }
};