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
import useFavoriteBookmarkStore from '../store/useFavoriteBookmarkStore';

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
    console.log('[handleLogin] User info received after getUserInfo:', userInfo);
    if (!userInfo || !userInfo.sub) {
      throw new Error('Không thể lấy thông tin người dùng');
    }

    // Clear any existing guest data
    void await clearTokens();
    void await deleteUserDataFromDB('guest');

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
      toast({
        title: "Đang khôi phục dữ liệu",
        description: "Đang tải bản sao lưu từ Google Drive...",
        status: "info",
        duration: 3000,
        isClosable: true,
      });

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
        toast({
          title: "Bản sao lưu mới đã được tạo",
          description: "Không tìm thấy bản sao lưu cũ, đã tạo bản mới trên Google Drive.",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
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
          toast({
            title: "Khôi phục dữ liệu thành công",
            description: "Đã khôi phục dữ liệu từ Google Drive.",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        } else {
          toast({
            title: "Không tìm thấy bản sao lưu",
            description: "Không có dữ liệu để khôi phục từ Google Drive.",
            status: "info",
            duration: 3000,
            isClosable: true,
          });
        }
      }
    } catch (driveError: any) {
      console.error('[auth.ts] Error handling Drive file:', driveError);
      toast({
        title: "Lỗi đồng bộ",
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

    console.log('[auth.ts] Starting logout process for user:', userId);

    // Backup data before logout
    if (userId) {
      try {
        console.log('[auth.ts] Backing up data before logout...');
        const favoritePosts = await getHistoryData('favorites', userId) || [];
        const readPosts = await getHistoryData('reads', userId) || [];
        const mangaBookmarks = await getHistoryData('bookmarks', userId) || [];
        
        await backupUserData(userId, { readPosts, favoritePosts, mangaBookmarks });
        console.log('[auth.ts] Data backup completed');
        toast({ 
          title: "Đã sao lưu dữ liệu", 
          description: "Dữ liệu của bạn đã được sao lưu lên Google Drive", 
          status: "success", 
          duration: 2000 
        });
      } catch (error: any) {
        console.error('[auth.ts] Error backing up data:', error);
        toast({ 
          title: "Cảnh báo", 
          description: "Không thể sao lưu dữ liệu trước khi đăng xuất", 
          status: "warning", 
          duration: 3000, 
          isClosable: true 
        });
      }
    }

    // Clear all user data from IndexedDB
    console.log('[auth.ts] Clearing user data from IndexedDB...');
    try {
      if (userId) {
        // Clear all history data
        await Promise.all([
          saveHistoryData('bookmarks', userId, []),
          saveHistoryData('favorites', userId, []),
          saveHistoryData('reads', userId, []),
          deleteUserDataFromDB(userId)
        ]);
        console.log('[auth.ts] IndexedDB data cleared successfully');
      }
    } catch (dbError: any) {
      console.error('[auth.ts] Error clearing IndexedDB data:', dbError);
      toast({
        title: "Cảnh báo",
        description: "Không thể xóa hoàn toàn dữ liệu cục bộ",
        status: "warning",
        duration: 3000,
        isClosable: true
      });
    }

    // Clear file ID cache
    console.log('[auth.ts] Clearing file ID cache...');
    fileIdCache.clear();

    // Clear all tokens and encrypted data
    console.log('[auth.ts] Clearing tokens and encrypted data...');
    await Promise.all([
      clearTokens(),
      clearEncryptedData()
    ]);

    // Clear any remaining localStorage items
    console.log('[auth.ts] Clearing localStorage...');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userData');
    localStorage.removeItem('lastSyncTime');
    localStorage.removeItem('syncStatus');

    // Reset favorite/bookmark store state
    useFavoriteBookmarkStore.getState().resetStore();

    console.log('[auth.ts] Logout process completed');
    navigate('/', { replace: true });
  } catch (error: any) {
    console.error('[auth.ts] Logout error:', error);
    const handledError = handleError(error);
    toast({ 
      title: "Lỗi đăng xuất", 
      description: handledError.message || "Có lỗi xảy ra khi đăng xuất", 
      status: "error", 
      duration: 5000, 
      isClosable: true 
    });
    // Force navigation even if there's an error
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
    const data = await response.json();
    console.log('[getUserInfo] Raw user info data from Google API:', data);
    return data;
  } catch (error: any) {
    console.error('Error getting user info:', error);
    throw error;
  }
};

// File operations (using fetchWithAuth)
export const findFile = async (fileName: string): Promise<any> => {
  try {
    if (fileIdCache.has(fileName)) {
      const cachedFile = fileIdCache.get(fileName);
      // Return cached file directly if it exists, assuming it's the latest
      return cachedFile;
    }

    const response = await fetchWithAuth(`https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and trashed=false&spaces=appDataFolder&fields=files(id,name,modifiedTime)`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to find file: ${response.statusText}`);
    }

    const data = await response.json();
    const files = data.files;

    if (files.length === 0) {
      return null; // No file found
    }

    // Sort files by modifiedTime in descending order to get the latest file
    files.sort((a: any, b: any) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());

    const latestFile = files[0];

    // Delete older duplicate files
    for (let i = 1; i < files.length; i++) {
      const oldFileId = files[i].id;
      console.log(`[auth.ts] Deleting old duplicate file: ${files[i].name} (ID: ${oldFileId})`);
      try {
        await fetchWithAuth(`https://www.googleapis.com/drive/v3/files/${oldFileId}`, {
          method: 'DELETE'
        });
        console.log(`[auth.ts] Successfully deleted old duplicate file: ${oldFileId}`);
      } catch (deleteError: any) {
        console.warn(`[auth.ts] Failed to delete old duplicate file ${oldFileId}:`, deleteError);
      }
    }

    fileIdCache.set(fileName, latestFile);
    return latestFile;
  } catch (error: any) {
    console.error('Error finding and cleaning files:', error);
    throw error;
  }
};

export const createFile = async (fileName: string, jsonData: any): Promise<any> => {
  try {
    console.log('[auth.ts] Creating file:', fileName);
    const metadata = {
      name: fileName,
      parents: ['appDataFolder'],
      mimeType: 'application/json'
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(jsonData)], { type: 'application/json' }));

    console.log('[auth.ts] Sending create file request to Drive API...');
    const response = await fetchWithAuth('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      body: form
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[auth.ts] Drive API error response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to create file: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[auth.ts] File created successfully:', {
      fileId: data.id,
      name: data.name,
      mimeType: data.mimeType
    });
    fileIdCache.set(fileName, data.id);
    return data;
  } catch (error: any) {
    console.error('[auth.ts] Error creating file:', {
      fileName,
      error: error.message,
      stack: error.stack
    });
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
      console.log('[auth.ts] Found existing file, updating:', {
        fileId: file.id,
        name: file.name
      });
      return await updateFile(file.id, jsonData);
    } else {
      console.log('[auth.ts] File not found, creating new file');
      try {
        const result = await createFile(fileName, jsonData);
        console.log('[auth.ts] New file created successfully:', {
          fileId: result.id,
          name: result.name
        });
        return result;
      } catch (createError: any) {
        console.error('[auth.ts] Failed to create new file:', {
          error: createError.message,
          stack: createError.stack,
          fileName
        });
        // Check if error is due to permissions
        if (createError.message?.includes('403') || createError.message?.toLowerCase().includes('permission')) {
          throw new Error('Không có quyền tạo file trên Google Drive. Vui lòng đăng nhập lại để cấp quyền.');
        }
        throw createError;
      }
    }
  } catch (error: any) {
    console.error('[auth.ts] Error in saveOrUpdateJson:', {
      error: error.message,
      stack: error.stack,
      fileName
    });
    throw error;
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
        ? data.readPosts
        : [],
      favoritePosts: Array.isArray(data.favoritePosts)
        ? data.favoritePosts
        : [],
      mangaBookmarks: Array.isArray(data.mangaBookmarks)
        ? data.mangaBookmarks
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