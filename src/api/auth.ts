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

// Token management (removed getStoredToken, setStoredTokens, clearStoredTokens)

// Hàm kiểm tra token có hợp lệ không
const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token);
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.expires_in > 0;
  } catch (error: any) {
    console.error('Error validating token:', error);
    return false;
  }
};

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
    // Close menu first if provided
    if (onClose) onClose();

    // Get user info
    const userInfo = await getUserInfo(response.access_token);
    if (!userInfo || !userInfo.sub) {
      throw new Error('Không thể lấy thông tin người dùng');
    }

    // Clear any existing guest data
    await clearTokens();
    await deleteUserDataFromDB('guest');

    // Merge guest data with error handling
    let mergedData: { follows: FavoritePost[]; bookmarks: MangaBookmark[]; } = { follows: [], bookmarks: [] };
    try {
      mergedData = {
        follows: await getHistoryData('favorites', 'guest') as FavoritePost[],
        bookmarks: await getHistoryData('bookmarks', 'guest') as MangaBookmark[]
      };
    } catch (dbError: any) {
      console.warn('Error accessing guest data, using empty data:', dbError);
      // Continue with empty data if there's an error
    }

    // Save merged data with error handling
    try {
      await saveHistoryData('favorites', userInfo.sub, mergedData.follows || []);
      await saveHistoryData('bookmarks', userInfo.sub, mergedData.bookmarks || []);
    } catch (saveError: any) {
      console.warn('Error saving merged data:', saveError);
      // Continue with login even if data merge fails
    }

    // Create user data
    const userData = {
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

    // Save to IndexedDB with error handling
    try {
      await saveUserData(userInfo.sub, userData);
    } catch (saveError: any) {
      console.warn('Error saving user data to IndexedDB:', saveError);
      // Continue with login even if user data save fails
    }

    // Update store
    const success = await setUser(userData, response.access_token);
    if (!success) {
      throw new Error('Failed to update user state');
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

    // Navigate to settings
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
    // Get current user data
    const userData = await getDataFromDB('userData', userId) as any;
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
    userId ? await saveHistoryData('favorites', userId, []) : Promise.resolve();
    userId ? await saveHistoryData('reads', userId, []) : Promise.resolve();
    await deleteUserDataFromDB(userId);
    await clearTokens();
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

// Token validation
export const isTokenValid = async (token: string): Promise<boolean> => {
  if (!token) return false;

  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Chỉ xóa token nếu nhận được lỗi 401 (Unauthorized)
    if (response.status === 401) {
      return false;
    }

    // Các lỗi khác có thể là tạm thời, không nên xóa token
    return response.ok;
  } catch {
    // Lỗi network có thể là tạm thời, không nên xóa token
    return true;
  }
};

// Token refresh
export const refreshToken = async (refreshTokenValue: string): Promise<string> => {
  if (!refreshTokenValue) {
    throw new AppError(
      ErrorTypes.AUTH_ERROR,
      'No refresh token provided'
    );
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: blogConfig.clientId || '',
        client_secret: blogConfig.clientSecret || '',
        refresh_token: refreshTokenValue,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      // Chỉ xóa token nếu nhận được lỗi invalid_grant hoặc invalid_token
      if (error.error === 'invalid_grant' || error.error === 'invalid_token') {
        await clearTokens();
        throw new AppError(
          ErrorTypes.AUTH_ERROR,
          error.error_description || 'Failed to refresh token'
        );
      }
      // Các lỗi khác có thể là tạm thời, không nên xóa token
      throw new AppError(
        ErrorTypes.AUTH_ERROR,
        error.error_description || 'Failed to refresh token'
      );
    }

    const data = await response.json();
    // Cập nhật access token được mã hóa
    await encryptAndStoreToken(data.access_token);
    // Cập nhật refresh token nếu có
    if (data.refresh_token) {
      await setRefreshToken(data.refresh_token);
    }
    return data.access_token;
  } catch (error: any) {
    // Chỉ xóa token nếu là lỗi invalid_grant hoặc invalid_token
    if (error?.message?.includes('invalid_grant') || error?.message?.includes('invalid_token')) {
      await clearTokens();
    }
    throw handleError(error);
  }
};

// Exchange code for token
export const exchangeCodeForToken = async (code: string): Promise<any> => {
  if (!code) {
    throw new AppError(
      ErrorTypes.VALIDATION_ERROR,
      'Authorization code is required'
    );
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: blogConfig.clientId || '',
        client_secret: blogConfig.clientSecret || '',
        redirect_uri: blogConfig.redirectUri || '',
        grant_type: 'authorization_code',
        access_type: 'offline',
        prompt: 'consent'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new AppError(
        ErrorTypes.AUTH_ERROR,
        errorData.error_description || 'Failed to exchange code for token'
      );
    }

    return await response.json();
  } catch (error: any) {
    throw handleError(error);
  }
};

// Get user info
export const getUserInfo = async (token: string): Promise<any> => {
  if (!token) {
    throw new AppError(
      ErrorTypes.VALIDATION_ERROR,
      'Access token is required'
    );
  }

  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new AppError(
        ErrorTypes.AUTH_ERROR,
        'Failed to fetch user info'
      );
    }

    return await response.json();
  } catch (error: any) {
    throw handleError(error);
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAndDecryptToken();
  if (!token) return false;

  try {
    return await isTokenValid(token);
  } catch {
    return false;
  }
};

// Get valid token (refreshes if needed)
export const getValidToken = async (): Promise<string> => {
  const token = await getAndDecryptToken();
  if (!token) {
    throw new AppError(
      ErrorTypes.AUTH_ERROR,
      'No access token found'
    );
  }

  if (await isTokenValid(token)) {
    return token;
  }

  const refreshTokenValue = await getRefreshToken();
  if (!refreshTokenValue) {
    throw new AppError(
      ErrorTypes.AUTH_ERROR,
      'No refresh token found'
    );
  }

  return await refreshToken(refreshTokenValue);
};

// Google Drive API functions
export const findFile = async (accessToken: string, fileName: string): Promise<any> => {
  try {
    // Validate token first
    const isValid = await isTokenValid(accessToken);
    if (!isValid) {
      // Try to refresh token
      const newToken = await getValidToken();
      if (!newToken) {
        throw new AppError(
          ErrorTypes.AUTH_ERROR,
          'Invalid or expired token'
        );
      }
      accessToken = newToken;
    }

    const cachedId = fileIdCache.get(fileName);
    if (cachedId) {
      return { id: cachedId, name: fileName };
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and trashed=false&fields=files(id,name)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      // If token is invalid, try to refresh and retry once
      if (response.status === 401) {
        const newToken = await getValidToken();
        if (newToken) {
          return findFile(newToken, fileName);
        }
      }
      throw new AppError(
        ErrorTypes.API_ERROR,
        error.error?.message || 'Failed to find file'
      );
    }

    const data = await response.json();
    const file = data.files && data.files.length > 0 ? data.files[0] : null;

    if (file) {
      fileIdCache.set(fileName, file.id);
    }

    return file;
  } catch (error: any) {
    throw handleError(error);
  }
};

export const createFile = async (accessToken: string, fileName: string, jsonData: any): Promise<any> => {
  try {
    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      description: 'Blogger React App User Data Backup'
    };
    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    form.append(
      'file',
      new Blob([JSON.stringify(jsonData)], { type: 'application/json' })
    );

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: form
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new AppError(
        ErrorTypes.API_ERROR,
        error.error?.message || 'Failed to create file'
      );
    }

    const file = await response.json();
    if (file.id) {
      fileIdCache.set(fileName, file.id);
    }

    return file;
  } catch (error: any) {
    throw handleError(error);
  }
};

export const updateFile = async (accessToken: string, fileId: string, jsonData: any): Promise<any> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new AppError(
        ErrorTypes.API_ERROR,
        error.error?.message || 'Failed to update file'
      );
    }

    return await response.json();
  } catch (error: any) {
    throw handleError(error);
  }
};

export const saveOrUpdateJson = async (accessToken: string, fileName: string, jsonData: any): Promise<any> => {
  try {
    const file = await findFile(accessToken, fileName);
    if (file) {
      return await updateFile(accessToken, file.id, jsonData);
    } else {
      return await createFile(accessToken, fileName, jsonData);
    }
  } catch (error: any) {
    throw handleError(error);
  }
};

export const downloadFile = async (accessToken: string, fileId: string): Promise<any> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new AppError(
        ErrorTypes.API_ERROR,
        error.error?.message || 'Failed to download file'
      );
    }

    return await response.json();
  } catch (error: any) {
    throw handleError(error);
  }
};

export const backupUserData = async (accessToken: string, userId: string, data: any): Promise<any> => {
  if (!accessToken || !userId) {
    throw new AppError(
      ErrorTypes.VALIDATION_ERROR,
      'Missing required parameters'
    );
  }

  try {
    if (!data || typeof data !== 'object') {
      throw new AppError(
        ErrorTypes.VALIDATION_ERROR,
        'Invalid data format'
      );
    }

    const backupData = {
      userId,
      timestamp: Date.now(),
      readPosts: data.readPosts || [],
      favoritePosts: Array.isArray(data.favoritePosts) ? data.favoritePosts.map((post: FavoritePost) => ({
        id: post.id,
        favoriteAt: post.favoriteAt,
        thumbnail: post.thumbnail || null,
      })) : [],
      mangaBookmarks: Array.isArray(data.mangaBookmarks) ? data.mangaBookmarks.map((bookmark: MangaBookmark) => ({
        id: bookmark.id,
        timestamp: bookmark.timestamp,
      })) : []
    };

    const fileName = `blogger_backup_${userId}.json`;
    return await saveOrUpdateJson(accessToken, fileName, backupData);
  } catch (error: any) {
    throw handleError(error);
  }
};

export const restoreUserData = async (accessToken: string, userId: string): Promise<any> => {
  if (!accessToken || !userId) {
    throw new AppError(
      ErrorTypes.VALIDATION_ERROR,
      'Missing required parameters'
    );
  }

  try {
    const fileName = `blogger_backup_${userId}.json`;
    const file = await findFile(accessToken, fileName);

    if (!file) {
      return null;
    }

    const data = await downloadFile(accessToken, file.id);

    if (!data || typeof data !== 'object') {
      throw new AppError(
        ErrorTypes.VALIDATION_ERROR,
        'Invalid restored data format'
      );
    }

    return data;
  } catch (error: any) {
    throw handleError(error);
  }
};

export const deleteUserData = async (accessToken: string, userId: string): Promise<any> => {
  if (!accessToken || !userId) {
    throw new AppError(
      ErrorTypes.VALIDATION_ERROR,
      'Missing required parameters'
    );
  }

  try {
    const fileName = `blogger_backup_${userId}.json`;
    const file = await findFile(accessToken, fileName);

    if (!file) {
      return null;
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new AppError(
        ErrorTypes.API_ERROR,
        error.error?.message || 'Failed to delete file'
      );
    }

    fileIdCache.delete(fileName);
    return true;
  } catch (error: any) {
    throw handleError(error);
  }
};