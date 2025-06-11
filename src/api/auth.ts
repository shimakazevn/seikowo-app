import { blogConfig } from '../config';
import { ErrorTypes, AppError, handleError } from '../api';
import {
  openDatabase,
  saveDataToDB,
  getDataFromDB,
  clearDataFromDB,
  saveUserData,
  getHistoryData,
  saveHistoryData,
  deleteUserData as deleteUserDataFromDB
} from '../utils/indexedDBUtils';
import type { FavoritePost, MangaBookmark } from '../types/global';
import { getAndDecryptToken, encryptAndStoreToken, clearEncryptedData } from '../utils/securityUtils';
import { getRefreshToken, setRefreshToken, clearTokens } from '../utils/userUtils';
import { fetchWithAuth } from '../utils/apiUtils';
import useUserStore from '../store/useUserStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Interfaces
interface LoginParams {
  response: any;
  setUser: (userData: any, accessToken: string) => Promise<boolean>;
  setGuestMode?: () => void;
  initializeUser: () => Promise<void>;
  navigate: (path: string) => void;
  toast: (props: any) => void;
  onClose?: () => void;
}

interface LogoutParams {
  userId: string;
  navigate: (path: string, options?: any) => void;
  toast: (props: any) => void;
  onClose?: () => void;
}

// Cache for file IDs
const fileIdCache = new Map();

// Login flow
export const handleLogin = async (params: LoginParams): Promise<void> => {
  const {
    response,
    setUser,
    setGuestMode,
    initializeUser,
    navigate,
    toast,
    onClose
  } = params;
  try {
    console.log('=== Starting Login Process ===');
    if (onClose) onClose();

    // Get user info using fetchWithAuth
    const userInfo = await getUserInfo(response.access_token);
    if (!userInfo || !userInfo.sub) {
      throw new Error('Không thể lấy thông tin người dùng');
    }

    // Clear any existing guest data
    await clearTokens();
    await deleteUserDataFromDB('guest');

    // Create initial user data structure
    const initialUserData = {
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
      syncStatus: 'idle'
    };

    // Save to IndexedDB
    try {
      await saveUserData(userInfo.sub, initialUserData);
    } catch (saveError: any) {
      console.warn('Error saving initial user data to IndexedDB:', saveError);
    }

    // Update store
    const success = await setUser(initialUserData, response.access_token);
    if (!success) {
      throw new Error('Failed to update user state');
    }

    // Initialize or create Drive file
    try {
      console.log('[auth.ts] Checking for existing Drive file...');
      const fileName = `blogger_data_${userInfo.sub}.json`;
      const file = await findFile(fileName);
      
      if (!file) {
        console.log('[auth.ts] No existing file found, creating new file...');
        // Create empty data structure
        const emptyData = {
          readPosts: [],
          favoritePosts: [],
          mangaBookmarks: []
        };
        await createFile(fileName, emptyData);
        console.log('[auth.ts] Created new empty file in Drive');
      } else {
        console.log('[auth.ts] Found existing file, attempting to restore data...');
        // Try to restore data from Drive
        const restoredData = await restoreUserData(userInfo.sub);
        if (restoredData) {
          // Save restored data to IndexedDB
          if (Array.isArray(restoredData.readPosts)) {
            await saveHistoryData('reads', userInfo.sub, restoredData.readPosts);
          }
          if (Array.isArray(restoredData.favoritePosts)) {
            await saveHistoryData('favorites', userInfo.sub, restoredData.favoritePosts);
          }
          if (Array.isArray(restoredData.mangaBookmarks)) {
            await saveHistoryData('bookmarks', userInfo.sub, restoredData.mangaBookmarks);
          }
          console.log('[auth.ts] Successfully restored data from Drive');
        }
      }
    } catch (driveError: any) {
      console.error('[auth.ts] Error handling Drive file:', driveError);
      toast({
        title: "Cảnh báo",
        description: "Không thể đồng bộ với Google Drive. Một số tính năng có thể không hoạt động.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
    }

    // Re-initialize store
    await initializeUser();

    toast({
      title: "Đăng nhập thành công",
      description: `Chào mừng ${userInfo.name}!`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    navigate('/settings');
  } catch (error: any) {
    console.error('Login error:', error);
    toast({
      title: "Lỗi đăng nhập",
      description: error?.message || "Không thể đăng nhập",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
    await clearTokens();
    if (setGuestMode) {
      await setGuestMode();
    }
  }
};

// Logout flow
export const handleLogout = async (params: LogoutParams): Promise<void> => {
  const { userId, navigate, toast, onClose } = params;
  try {
    if (onClose) onClose();

    // Backup data before logout using fetchWithAuth
    if (userId) { // Access token will be retrieved internally by fetchWithAuth
      try {
        const favoritePosts = await getHistoryData('favorites', userId) || [];
        const readPosts = await getHistoryData('reads', userId) || [];
        const mangaBookmarks = await getHistoryData('bookmarks', userId) || [];
        
        // The accessToken parameter for backupUserData is now optional as fetchWithAuth handles it.
        // We pass the userId here for context, though backupUserData itself might not need it if only using accessToken
        await backupUserData(userId, { readPosts, favoritePosts, mangaBookmarks });
        toast({ title: "Đã sao lưu dữ liệu", description: "Dữ liệu của bạn đã được sao lưu lên Google Drive", status: "success", duration: 2000 });
      } catch (error: any) {
        console.error('Error backing up data:', error);
        toast({ title: "Cảnh báo", description: "Không thể sao lưu dữ liệu trước khi đăng xuất", status: "warning", duration: 3000, isClosable: true });
      }
    }
    userId ? await saveHistoryData('bookmarks', userId, []) : Promise.resolve();
    userId ? await saveHistoryData('favorites', userId, []) : Promise.resolve();
    userId ? await saveHistoryData('reads', userId, []) : Promise.resolve();
    await deleteUserDataFromDB(userId);
    await clearTokens(); // Clear refresh token as well
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

// Refresh token (still needed, but getValidAccessToken calls it)
export const refreshToken = async (refreshTokenValue: string): Promise<string> => {
  try {
    console.log('[refreshToken] Starting token refresh process...');
    console.log('[refreshToken] Using refresh token:', refreshTokenValue.substring(0, 10) + '...');
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: blogConfig.clientId || '',
        client_secret: blogConfig.clientSecret || '',
        refresh_token: refreshTokenValue,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[refreshToken] Error refreshing token:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(errorData.error_description || 'Failed to refresh token');
    }

    const data = await response.json();
    console.log('[refreshToken] Token refresh response:', {
      hasAccessToken: !!data.access_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope
    });

    if (!data.access_token) {
      throw new Error('No new access token in refresh response');
    }

    console.log('[refreshToken] Token refresh successful');
    return data.access_token;
  } catch (error: any) {
    console.error('[refreshToken] Token refresh failed:', error);
    throw error;
  }
};

// Exchange code for token (used in initial OAuth flow)
export const exchangeCodeForToken = async (code: string): Promise<any> => {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: blogConfig.clientId || '',
        client_secret: blogConfig.clientSecret || '',
        code: code,
        redirect_uri: blogConfig.redirectUri || '',
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error_description || 'Failed to exchange code for token');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Exchange code for token failed:', error);
    throw error;
  }
};

// Get user info (now uses fetchWithAuth)
export const getUserInfo = async (token: string): Promise<any> => {
  try {
    // fetchWithAuth will handle token validity and refresh internally
    const response = await fetchWithAuth('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}` // Initial token provided
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error getting user info:', error);
    throw error;
  }
};

// File operations (using fetchWithAuth)
export const findFile = async (fileName: string): Promise<any> => {
  try {
    if (fileIdCache.has(fileName)) {
      return fileIdCache.get(fileName);
    }

    const response = await fetchWithAuth(`https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and trashed=false&spaces=appDataFolder`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to find file: ${response.statusText}`);
    }

    const data = await response.json();
    const file = data.files.length > 0 ? data.files[0] : null;
    if (file) {
      fileIdCache.set(fileName, file.id);
    }
    return file;
  } catch (error: any) {
    console.error('Error finding file:', error);
    throw error;
  }
};

export const createFile = async (fileName: string, jsonData: any): Promise<any> => {
  try {
    const metadata = {
      name: fileName,
      parents: ['appDataFolder'],
      mimeType: 'application/json'
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(jsonData)], { type: 'application/json' }));

    const response = await fetchWithAuth('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      body: form
    });

    if (!response.ok) {
      throw new Error(`Failed to create file: ${response.statusText}`);
    }
    const data = await response.json();
    fileIdCache.set(fileName, data.id);
    return data;
  } catch (error: any) {
    console.error('Error creating file:', error);
    throw error;
  }
};

export const updateFile = async (fileId: string, jsonData: any): Promise<any> => {
  try {
    const response = await fetchWithAuth(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update file: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error updating file:', error);
    throw error;
  }
};

export const saveOrUpdateJson = async (fileName: string, jsonData: any): Promise<any> => {
  try {
    console.log('[auth.ts] Attempting to save/update file:', fileName);
    const file = await findFile(fileName);
    
    if (file && file.id) {
      console.log('[auth.ts] Found existing file, updating:', file.id);
      return await updateFile(file.id, jsonData);
    } else {
      console.log('[auth.ts] File not found, creating new file');
      return await createFile(fileName, jsonData);
    }
  } catch (error: any) {
    console.error('[auth.ts] Error in saveOrUpdateJson:', error);
    // Thử tạo file mới nếu có lỗi
    try {
      console.log('[auth.ts] Attempting to create new file after error');
      return await createFile(fileName, jsonData);
    } catch (createError: any) {
      console.error('[auth.ts] Failed to create new file:', createError);
      throw new Error(`Failed to save or update file: ${createError.message || 'Unknown error'}`);
    }
  }
};

export const downloadFile = async (fileId: string): Promise<any> => {
  try {
    const response = await fetchWithAuth(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

export const backupUserData = async (userId: string, data: any): Promise<any> => {
  try {
    console.log('[auth.ts] backupUserData called with userId:', userId, 'data:', data);
    
    // Ensure data is an object
    if (!data || typeof data !== 'object') {
      console.warn('[auth.ts] Invalid data provided to backupUserData, using empty data');
      data = {};
    }

    // Create safe mapped data with default empty arrays
    const mappedData = {
      readPosts: Array.isArray(data.readPosts) 
        ? data.readPosts.map((post: any) => ({
            At: post?.At || Date.now(),
            postId: post?.postId || '',
            thumbnailUrl: post?.thumbnailUrl || ''
          }))
        : [],
      favoritePosts: Array.isArray(data.favoritePosts)
        ? data.favoritePosts.map((post: any) => ({
            At: post?.At || Date.now(),
            postId: post?.postId || '',
            thumbnailUrl: post?.thumbnailUrl || ''
          }))
        : [],
      mangaBookmarks: Array.isArray(data.mangaBookmarks)
        ? data.mangaBookmarks.map((bookmark: any) => ({
            At: bookmark?.At || Date.now(),
            postId: bookmark?.postId || '',
            thumbnailUrl: bookmark?.thumbnailUrl || ''
          }))
        : []
    };

    console.log('[auth.ts] Mapped data for backup:', mappedData);
    const fileName = `blogger_data_${userId}.json`;
    return await saveOrUpdateJson(fileName, mappedData);
  } catch (error: any) {
    console.error('[auth.ts] Error backing up user data:', error);
    throw error;
  }
};

export const restoreUserData = async (userId: string): Promise<any> => {
  try {
    console.log('[auth.ts] restoreUserData called with userId:', userId);
    const fileName = `blogger_data_${userId}.json`;
    const file = await findFile(fileName);
    if (file) {
      return await downloadFile(file.id);
    } else {
      console.log(`File ${fileName} not found in Google Drive.`);
      return null;
    }
  } catch (error: any) {
    console.error('Error restoring user data:', error);
    throw error;
  }
};

export const deleteUserData = async (userId: string): Promise<void> => {
  try {
    const fileName = `blogger_data_${userId}.json`;
    const file = await findFile(fileName);
    if (file) {
      const response = await fetchWithAuth(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }
      fileIdCache.delete(fileName);
      console.log(`File ${fileName} deleted from Google Drive.`);
    } else {
      console.log(`File ${fileName} not found, nothing to delete.`);
    }
  } catch (error: any) {
    console.error('Error deleting user data from Drive:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to logout');
    }

    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Re-export getValidToken for backward compatibility
export const getValidToken = async (): Promise<string | null> => {
  return useUserStore.getState().getValidAccessToken();
};