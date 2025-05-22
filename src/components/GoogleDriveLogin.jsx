import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { IconButton } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { MdLogin, MdLogout } from 'react-icons/md';

// Update scopes to include drive.file and userinfo.profile
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile';

// Cache for file IDs
const fileIdCache = new Map();

export function LoginButton({ onLogin, onLogout, accessToken }) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const login = useGoogleLogin({
    scope: DRIVE_SCOPE,
    onSuccess: async tokenResponse => {
      try {
        setIsLoggingIn(true);
        const accessToken = tokenResponse.access_token;
        
        // Get userId from Google
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: 'Bearer ' + accessToken }
        });
        
        if (!res.ok) throw new Error('Failed to get user info');
        
        const profile = await res.json();
        const userId = profile.sub;

        // Get guest data first
        const guestReadPosts = JSON.parse(localStorage.getItem(`history_read_posts_guest`) || '[]');
        const guestFollowPosts = JSON.parse(localStorage.getItem(`history_follow_posts_guest`) || '[]');
        const guestMangaBookmarks = JSON.parse(localStorage.getItem(`history_manga_bookmarks_guest`) || '[]');

        console.log('Guest data found:', {
          readPosts: guestReadPosts.length,
          followPosts: guestFollowPosts.length,
          mangaBookmarks: guestMangaBookmarks.length
        });
        
        // Try to get drive data
        let driveData;
        try {
          driveData = await restoreUserData(accessToken, userId);
          console.log('Drive data retrieved:', !!driveData);
        } catch (error) {
          console.error('Error getting drive data:', error);
          driveData = null;
        }

        // Merge guest data with drive data
        const mergedData = {
          userId,
          timestamp: Date.now(),
          readPosts: [],
          followPosts: [],
          mangaBookmarks: []
        };

        // Merge read posts
        const readPostsMap = new Map();
        [...guestReadPosts, ...(driveData?.readPosts || [])].forEach(post => {
          const existing = readPostsMap.get(post.id);
          if (!existing || (post.readAt > existing.readAt)) {
            readPostsMap.set(post.id, post);
          }
        });
        mergedData.readPosts = Array.from(readPostsMap.values());

        // Merge follow posts
        const followPostsMap = new Map();
        [...guestFollowPosts, ...(driveData?.followPosts || [])].forEach(post => {
          const existing = followPostsMap.get(post.id);
          if (!existing || (post.followAt > existing.followAt)) {
            followPostsMap.set(post.id, post);
          }
        });
        mergedData.followPosts = Array.from(followPostsMap.values());

        // Merge manga bookmarks
        const bookmarksMap = new Map();
        [...guestMangaBookmarks, ...(driveData?.mangaBookmarks || [])].forEach(bookmark => {
          const key = `${bookmark.id}_${bookmark.currentPage}`;
          const existing = bookmarksMap.get(key);
          if (!existing || (bookmark.timestamp > existing.timestamp)) {
            bookmarksMap.set(key, bookmark);
          }
        });
        mergedData.mangaBookmarks = Array.from(bookmarksMap.values());

        // Save merged data to local storage
        localStorage.setItem(`history_read_posts_${userId}`, JSON.stringify(mergedData.readPosts));
        localStorage.setItem(`history_follow_posts_${userId}`, JSON.stringify(mergedData.followPosts));
        localStorage.setItem(`history_manga_bookmarks_${userId}`, JSON.stringify(mergedData.mangaBookmarks));

        // Save both userId and token
        localStorage.setItem('google_user_id', userId);
        localStorage.setItem('furina_water', accessToken);

        // Backup merged data to drive
        try {
          await backupUserData(accessToken, userId, mergedData);
          console.log('Initial backup successful');
        } catch (backupError) {
          console.error('Error during initial backup:', backupError);
        }

        // Clear guest data
        localStorage.removeItem(`history_read_posts_guest`);
        localStorage.removeItem(`history_follow_posts_guest`);
        localStorage.removeItem(`history_manga_bookmarks_guest`);
        
        // Notify parent component
        onLogin(accessToken);

        // Navigate to user history page
        navigate(`/u/${userId}`);
        
      } catch (error) {
        console.error('Login error:', error);
        alert('Đăng nhập thất bại: ' + error.message);
        // Clean up on error
        localStorage.removeItem('google_user_id');
        localStorage.removeItem('furina_water');
      } finally {
        setIsLoggingIn(false);
      }
    },
    onError: error => {
      console.error('Login error:', error);
      alert('Đăng nhập thất bại. Vui lòng thử lại.');
      // Clean up on error
      localStorage.removeItem('google_user_id');
      localStorage.removeItem('furina_water');
      setIsLoggingIn(false);
    }
  });

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    try {
      setIsLoggingOut(true);
      const userId = localStorage.getItem('google_user_id');
      const accessToken = localStorage.getItem('furina_water');

      if (userId && accessToken) {
        // Get current data
        const readPosts = JSON.parse(localStorage.getItem(`history_read_posts_${userId}`) || '[]');
        const followPosts = JSON.parse(localStorage.getItem(`history_follow_posts_${userId}`) || '[]');
        const mangaBookmarks = JSON.parse(localStorage.getItem(`history_manga_bookmarks_${userId}`) || '[]');

        // Prepare backup data
        const backupData = {
          userId,
          timestamp: Date.now(),
          readPosts,
          followPosts,
          mangaBookmarks
        };

        // Backup data before logout
        try {
          console.log('Backing up data before logout...');
          await backupUserData(accessToken, userId, backupData);
          console.log('Backup successful before logout');
        } catch (error) {
          console.error('Error backing up before logout:', error);
          // Ask user if they want to continue logout despite backup failure
          if (!window.confirm('Không thể sao lưu dữ liệu trước khi đăng xuất. Bạn có muốn tiếp tục đăng xuất không?')) {
            setIsLoggingOut(false);
            return;
          }
        }
      }

      // Clean up storage
      localStorage.removeItem('google_user_id');
      localStorage.removeItem('furina_water');
      
      // Navigate to home page
      navigate('/');
      
      // Notify parent
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      alert('Đăng xuất thất bại: ' + error.message);
    } finally {
      setIsLoggingOut(false);
    }
  };

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
}

export async function findFile(accessToken, fileName) {
  try {
    // Check cache first
    const cachedId = fileIdCache.get(fileName);
    if (cachedId) {
      return { id: cachedId, name: fileName };
    }

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and trashed=false&fields=files(id,name)`,
      {
        headers: { 
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        }
      }
    );
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to find file');
    }
    const data = await res.json();
    const file = data.files && data.files.length > 0 ? data.files[0] : null;
    
    // Cache the file ID if found
    if (file) {
      fileIdCache.set(fileName, file.id);
    }
    
    return file;
  } catch (error) {
    console.error('Find file error:', error);
    throw error;
  }
}

export async function createFile(accessToken, fileName, jsonData) {
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

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer ' + accessToken
        },
        body: form
      }
    );
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to create file');
    }
    const file = await res.json();
    
    // Cache the new file ID
    if (file.id) {
      fileIdCache.set(fileName, file.id);
    }
    
    return file;
  } catch (error) {
    console.error('Create file error:', error);
    throw error;
  }
}

export async function updateFile(accessToken, fileId, jsonData) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: { 
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
      }
    );
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to update file');
    }
    return await res.json();
  } catch (error) {
    console.error('Update file error:', error);
    throw error;
  }
}

export async function saveOrUpdateJson(accessToken, fileName, jsonData) {
  try {
    const file = await findFile(accessToken, fileName);
    if (file) {
      // Update existing file
      return await updateFile(accessToken, file.id, jsonData);
    } else {
      // Create new file
      return await createFile(accessToken, fileName, jsonData);
    }
  } catch (error) {
    console.error('Save/Update error:', error);
    throw error;
  }
}

export async function downloadFile(accessToken, fileId) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { 
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        }
      }
    );
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to download file');
    }
    return await res.json();
  } catch (error) {
    console.error('Download file error:', error);
    throw error;
  }
}

export async function backupUserData(accessToken, userId, data) {
  if (!accessToken || !userId) {
    console.error('Missing required parameters:', { accessToken: !!accessToken, userId });
    throw new Error('Thiếu thông tin xác thực');
  }

  try {
    // Validate data
    if (!data || typeof data !== 'object') {
      console.error('Invalid data format:', data);
      throw new Error('Dữ liệu không hợp lệ');
    }

    // Ensure required fields
    const backupData = {
      userId,
      timestamp: Date.now(),
      readPosts: data.readPosts || [],
      followPosts: data.followPosts || [],
      mangaBookmarks: data.mangaBookmarks || []
    };

    console.log('Backing up data:', {
      userId,
      readPosts: backupData.readPosts.length,
      followPosts: backupData.followPosts.length,
      mangaBookmarks: backupData.mangaBookmarks.length
    });

    const fileName = `blogger_backup_${userId}.json`;
    const result = await saveOrUpdateJson(accessToken, fileName, backupData);
    
    console.log('Backup successful:', result);
    return result;
  } catch (error) {
    console.error('Backup error:', error);
    throw new Error(`Lỗi sao lưu: ${error.message}`);
  }
}

export async function restoreUserData(accessToken, userId) {
  if (!accessToken || !userId) {
    console.error('Missing required parameters:', { accessToken: !!accessToken, userId });
    throw new Error('Thiếu thông tin xác thực');
  }

  try {
    const fileName = `blogger_backup_${userId}.json`;
    const file = await findFile(accessToken, fileName);
    
    if (!file) {
      console.log('No backup file found for user:', userId);
      return null;
    }

    console.log('Found backup file:', file);
    const data = await downloadFile(accessToken, file.id);
    
    // Validate restored data
    if (!data || typeof data !== 'object') {
      console.error('Invalid restored data format:', data);
      throw new Error('Dữ liệu khôi phục không hợp lệ');
    }

    console.log('Restored data:', {
      userId: data.userId,
      readPosts: data.readPosts?.length || 0,
      followPosts: data.followPosts?.length || 0,
      mangaBookmarks: data.mangaBookmarks?.length || 0
    });

    return data;
  } catch (error) {
    console.error('Restore error:', error);
    throw new Error(`Lỗi khôi phục: ${error.message}`);
  }
}

export async function deleteUserData(accessToken, userId) {
  if (!accessToken || !userId) {
    console.error('Missing required parameters:', { accessToken: !!accessToken, userId });
    throw new Error('Thiếu thông tin xác thực');
  }

  try {
    const fileName = `blogger_backup_${userId}.json`;
    const file = await findFile(accessToken, fileName);
    
    if (!file) {
      console.log('No backup file found to delete for user:', userId);
      return null;
    }

    console.log('Deleting backup file:', file);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}`,
      {
        method: 'DELETE',
        headers: { 
          'Authorization': 'Bearer ' + accessToken
        }
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to delete file');
    }

    // Clear cache
    fileIdCache.delete(fileName);
    console.log('Backup file deleted successfully');
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error(`Lỗi xóa dữ liệu: ${error.message}`);
  }
} 