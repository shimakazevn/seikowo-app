import { blogConfig } from '../config';
import { ErrorTypes, AppError, handleError } from '../api';

// Cache for file IDs
const fileIdCache = new Map();

// Token management
export const getStoredToken = () => {
  return localStorage.getItem('furina_water');
};

export const getStoredRefreshToken = () => {
  return localStorage.getItem('google_refresh_token');
};

export const setStoredTokens = (accessToken, refreshToken) => {
  if (!accessToken) {
    throw new AppError(
      ErrorTypes.VALIDATION_ERROR,
      'Access token is required'
    );
  }
  localStorage.setItem('furina_water', accessToken);
  if (refreshToken) {
    localStorage.setItem('google_refresh_token', refreshToken);
  }
};

export const clearStoredTokens = () => {
  localStorage.removeItem('furina_water');
  localStorage.removeItem('google_refresh_token');
};

// Add login function
export const login = async (code) => {
  try {
    const tokenResponse = await exchangeCodeForToken(code);
    if (!tokenResponse.access_token) {
      throw new AppError(
        ErrorTypes.AUTH_ERROR,
        'Không nhận được access token'
      );
    }

    const userInfo = await getUserInfo(tokenResponse.access_token);
    if (!userInfo.sub) {
      throw new AppError(
        ErrorTypes.AUTH_ERROR,
        'Không nhận được thông tin người dùng'
      );
    }

    // Save tokens and user info
    setStoredTokens(tokenResponse.access_token, tokenResponse.refresh_token);
    localStorage.setItem('user_info', JSON.stringify({
      sub: userInfo.sub,
      name: userInfo.name,
      given_name: userInfo.given_name,
      family_name: userInfo.family_name,
      picture: userInfo.picture,
      email: userInfo.email,
      email_verified: userInfo.email_verified
    }));

    return userInfo;
  } catch (error) {
    clearStoredTokens();
    localStorage.removeItem('user_info');
    throw handleError(error);
  }
};

// Add logout function
export const logout = () => {
  clearStoredTokens();
  localStorage.removeItem('user_info');
  // Không refresh trang nữa
  // window.location.href = '/';
};

// Token validation
export const isTokenValid = async (token) => {
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
export const refreshToken = async (refreshToken) => {
  if (!refreshToken) {
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
        client_id: blogConfig.clientId,
        client_secret: blogConfig.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      // Chỉ xóa token nếu nhận được lỗi invalid_grant hoặc invalid_token
      if (error.error === 'invalid_grant' || error.error === 'invalid_token') {
        clearStoredTokens();
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
    // Chỉ cập nhật access token, giữ nguyên refresh token
    localStorage.setItem('furina_water', data.access_token);
    return data.access_token;
  } catch (error) {
    // Chỉ xóa token nếu là lỗi invalid_grant hoặc invalid_token
    if (error.message?.includes('invalid_grant') || error.message?.includes('invalid_token')) {
      clearStoredTokens();
    }
    throw handleError(error);
  }
};

// Exchange code for token
export const exchangeCodeForToken = async (code) => {
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
        client_id: blogConfig.clientId,
        client_secret: blogConfig.clientSecret,
        redirect_uri: blogConfig.redirectUri || window.location.origin,
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
  } catch (error) {
    throw handleError(error);
  }
};

// Get user info
export const getUserInfo = async (token) => {
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
  } catch (error) {
    throw handleError(error);
  }
};

// Check if user is authenticated
export const isAuthenticated = async () => {
  const token = getStoredToken();
  if (!token) return false;
  
  try {
    return await isTokenValid(token);
  } catch {
    return false;
  }
};

// Get valid token (refreshes if needed)
export const getValidToken = async () => {
  const token = getStoredToken();
  if (!token) {
    throw new AppError(
      ErrorTypes.AUTH_ERROR,
      'No access token found'
    );
  }

  if (await isTokenValid(token)) {
    return token;
  }

  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw new AppError(
      ErrorTypes.AUTH_ERROR,
      'No refresh token found'
    );
  }

  return await refreshToken(refreshToken);
};

// Google Drive API functions
export const findFile = async (accessToken, fileName) => {
  try {
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
  } catch (error) {
    throw handleError(error);
  }
};

export const createFile = async (accessToken, fileName, jsonData) => {
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
  } catch (error) {
    throw handleError(error);
  }
};

export const updateFile = async (accessToken, fileId, jsonData) => {
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
  } catch (error) {
    throw handleError(error);
  }
};

export const saveOrUpdateJson = async (accessToken, fileName, jsonData) => {
  try {
    const file = await findFile(accessToken, fileName);
    if (file) {
      return await updateFile(accessToken, file.id, jsonData);
    } else {
      return await createFile(accessToken, fileName, jsonData);
    }
  } catch (error) {
    throw handleError(error);
  }
};

export const downloadFile = async (accessToken, fileId) => {
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
  } catch (error) {
    throw handleError(error);
  }
};

export const backupUserData = async (accessToken, userId, data) => {
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
      followPosts: data.followPosts || [],
      mangaBookmarks: data.mangaBookmarks || []
    };

    const fileName = `blogger_backup_${userId}.json`;
    return await saveOrUpdateJson(accessToken, fileName, backupData);
  } catch (error) {
    throw handleError(error);
  }
};

export const restoreUserData = async (accessToken, userId) => {
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
  } catch (error) {
    throw handleError(error);
  }
};

export const deleteUserData = async (accessToken, userId) => {
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
  } catch (error) {
    throw handleError(error);
  }
}; 