import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { IconButton, useToast, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { MdLogin, MdLogout } from 'react-icons/md';
import { blogConfig } from '../config';
import { 
  getHistoryData,
  saveHistoryData,
  saveUserData,
  getUserData,
  deleteUserData as deleteUserDataFromDB
} from '../utils/indexedDBUtils';
import { FOLLOW_KEY, MANGA_KEY } from '../utils/userUtils';
import { syncGuestData } from '../utils/historyUtils';
import useUserStore from '../store/useUserStore';
import { AuthError } from './AuthError';
import { handleError, ErrorTypes, AppError } from '../api';
import {
  getUserInfo,
  backupUserData,
  restoreUserData,
  clearStoredTokens,
  isTokenValid
} from '../api/auth';

// Update scopes to include offline_access
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email offline_access';

// Simple Event Emitter
const Emitter = {
  events: {},
  subscribe: (event, callback) => {
    if (!Emitter.events[event]) Emitter.events[event] = [];
    Emitter.events[event].push(callback);
    return () => {
      Emitter.events[event] = Emitter.events[event].filter(cb => cb !== callback);
      if (Emitter.events[event].length === 0) delete Emitter.events[event];
    };
  },
  emit: (event, data) => {
    if (Emitter.events[event]) {
      Emitter.events[event].forEach(callback => callback(data));
    }
  }
};
export const GoogleAuthEvents = Emitter;

export const LoginButton = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { userId, accessToken, isGuest, setUser, setGuest } = useUserStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState(null);

  // Kiểm tra token khi component mount
  useEffect(() => {
    const checkToken = async () => {
      if (accessToken) {
        try {
          const isValid = await isTokenValid(accessToken);
          if (!isValid) {
            // Token không hợp lệ, đăng xuất
            handleLogout();
          }
        } catch (error) {
          console.error('Token validation error:', error);
          handleLogout();
        }
      }
    };
    checkToken();
  }, [accessToken]);

  const handleLoginSuccess = async (response) => {
    try {
      setIsLoggingIn(true);
      setError(null);

      console.log('Login response:', response);

      const accessToken = response.access_token || response.token;
      if (!accessToken) {
        throw new AppError(
          ErrorTypes.AUTH_ERROR,
          'Không nhận được access token'
        );
      }

      const userInfo = await getUserInfo(accessToken);
      console.log('User info:', userInfo);

      if (!userInfo.sub) {
        throw new AppError(
          ErrorTypes.AUTH_ERROR,
          'Không nhận được thông tin người dùng'
        );
      }

      // Update user state
      setUser(userInfo.sub, accessToken);
      
      // Save user info to IndexedDB
      const userInfoToStore = {
        userId: userInfo.sub,
        name: userInfo.name,
        given_name: userInfo.given_name,
        family_name: userInfo.family_name,
        picture: userInfo.picture,
        email: userInfo.email,
        email_verified: userInfo.email_verified,
        accessToken
      };
      
      await saveUserData(userInfo.sub, userInfoToStore);
      console.log('Stored user info:', userInfoToStore);

      // Restore data from Google Drive
      const driveData = await restoreUserData(accessToken, userInfo.sub);
      console.log('Restored data from Drive:', driveData);

      let syncStatus = {
        driveRestored: false,
        guestDataMerged: false,
        totalFollows: 0,
        totalBookmarks: 0,
        totalRead: 0
      };

      if (driveData) {
        // Save restored data to IndexedDB
        await saveHistoryData('favorites', userInfo.sub, driveData.followPosts || []);
        await saveHistoryData('bookmarks', userInfo.sub, driveData.mangaBookmarks || []);
        await saveHistoryData('read', userInfo.sub, driveData.readPosts || []);
        
        syncStatus.driveRestored = true;
        syncStatus.totalFollows = driveData.followPosts?.length || 0;
        syncStatus.totalBookmarks = driveData.mangaBookmarks?.length || 0;
        syncStatus.totalRead = driveData.readPosts?.length || 0;
      }
      
      // Get guest data
      const guestData = {
        [FOLLOW_KEY]: await getHistoryData('favorites', 'guest'),
        [MANGA_KEY]: await getHistoryData('bookmarks', 'guest')
      };

      // Merge guest data with drive data
      const mergedData = await syncGuestData(userInfo.sub);
      
      // Save merged data to IndexedDB
      await saveHistoryData('favorites', userInfo.sub, mergedData[FOLLOW_KEY] || []);
      await saveHistoryData('bookmarks', userInfo.sub, mergedData[MANGA_KEY] || []);

      syncStatus.guestDataMerged = true;
      syncStatus.totalFollows = mergedData[FOLLOW_KEY]?.length || 0;
      syncStatus.totalBookmarks = mergedData[MANGA_KEY]?.length || 0;

      // Backup merged data to drive
      await backupUserData(accessToken, userInfo.sub, {
        readPosts: await getHistoryData('read', userInfo.sub),
        followPosts: mergedData[FOLLOW_KEY] || [],
        mangaBookmarks: mergedData[MANGA_KEY] || []
      });

      // Prepare sync status message
      let syncMessage = "Đã đồng bộ dữ liệu:";
      if (syncStatus.driveRestored) {
        syncMessage += `\n- Khôi phục ${syncStatus.totalFollows} bài viết đã follow`;
        syncMessage += `\n- Khôi phục ${syncStatus.totalBookmarks} bookmark manga`;
        syncMessage += `\n- Khôi phục ${syncStatus.totalRead} bài viết đã đọc`;
      }
      if (syncStatus.guestDataMerged) {
        syncMessage += `\n- Đã merge dữ liệu từ chế độ guest`;
      }

      toast({
        title: "Đăng nhập thành công",
        description: (
          <>
            <Text>Chào mừng {userInfo.name}!</Text>
            <Text mt={2} fontSize="sm" color="gray.500">
              {syncMessage}
            </Text>
          </>
        ),
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      GoogleAuthEvents.emit('LOGIN_SUCCESS', {
        userId: userInfo.sub,
        accessToken: accessToken
      });

    } catch (error) {
      console.error('Login error:', error);
      const handledError = handleError(error);
      setError(handledError);
      
      // Clean up on error
      clearStoredTokens();
      await deleteUserDataFromDB(userInfo?.sub);
      setGuest();
      
      toast({
        title: "Lỗi đăng nhập",
        description: handledError.message || "Có lỗi xảy ra khi đăng nhập",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: handleLoginSuccess,
    onError: (error) => {
      console.error('Google login error:', error); // Debug log
      const handledError = handleError(error);
      setError(handledError);
      toast({
        title: "Lỗi đăng nhập",
        description: handledError.message || "Không thể đăng nhập bằng Google",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
    flow: 'implicit',
    scope: DRIVE_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    redirect_uri: blogConfig.redirectUri || window.location.origin,
    popup: true,
    popup_width: 500,
    popup_height: 600,
    popup_position: 'center',
    popup_type: 'window',
    popup_features: 'width=500,height=600,left=0,top=0,resizable=yes,scrollbars=yes,status=yes'
  });

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      setError(null);

      const userData = await getUserData(userId);
      const accessToken = userData?.accessToken;

      if (accessToken && userId) {
        try {
          // Backup data before logout
          const followPosts = await getHistoryData('favorites', userId);
          const readPosts = await getHistoryData('read', userId);
          const mangaBookmarks = await getHistoryData('bookmarks', userId);
          
          await backupUserData(accessToken, userId, {
            readPosts,
            followPosts,
            mangaBookmarks
          });

          toast({
            title: "Đã sao lưu dữ liệu",
            description: "Dữ liệu của bạn đã được sao lưu lên Google Drive",
            status: "success",
            duration: 2000,
            isClosable: true,
          });
        } catch (error) {
          console.error('Error backing up data before logout:', error);
          // Continue with logout even if backup fails
        }
      }

      // Clear all stored data
      clearStoredTokens();
      await deleteUserDataFromDB(userId);
      setGuest();

      toast({
        title: "Đăng xuất thành công",
        description: "Đang chuyển về trang chủ...",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      GoogleAuthEvents.emit('LOGOUT_SUCCESS');

      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1000);

    } catch (error) {
      const handledError = handleError(error);
      setError(handledError);
      
      toast({
        title: "Lỗi đăng xuất",
        description: handledError.message || "Có lỗi xảy ra khi đăng xuất",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (error) {
    return (
      <AuthError 
        error={error} 
        onRetry={() => {
          setError(null);
          if (accessToken) {
            handleLogout();
          } else {
            login();
          }
        }} 
      />
    );
  }

  return accessToken ? (
    <IconButton
      icon={<MdLogout />}
      colorScheme="red"
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      isLoading={isLoggingOut}
      aria-label="Đăng xuất"
    />
  ) : (
    <IconButton
      icon={<MdLogin />}
      colorScheme="blue"
      variant="ghost"
      size="sm"
      onClick={() => login()}
      isLoading={isLoggingIn}
      aria-label="Đăng nhập"
    />
  );
}; 