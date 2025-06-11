import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleLogout } from '../utils/authUtils';
import { getHistoryData } from '../utils/indexedDBUtils';
import { FOLLOW_KEY } from '../utils/userUtils';
import type { UseNavActionsParams, UseNavActionsReturn, FollowedPost } from '../types/auth';
import { useGoogleAuth } from './useGoogleAuth';

export const useNavActions = ({
  setUser,
  initializeUser,
  userId,
  accessToken,
  toast,
  onClose,
  setUpdatedFollowCount
}: UseNavActionsParams): UseNavActionsReturn => {
  const navigate = useNavigate();
  
  const handleOpenSearch = useCallback((): void => {
    navigate('/search');
  }, [navigate]);

  const handleHistory = useCallback((): void => {
    navigate('/user');
  }, [navigate]);

  const handleProfile = useCallback((): void => {
    navigate('/settings');
  }, [navigate]);

  const handleViewMore = useCallback((): void => {
    navigate('/user');
  }, [navigate]);

  const login = useGoogleAuth({
    setUser,
    initializeUser,
    navigate,
    toast,
    onClose
  });

  const logout = useCallback((): void => {
    handleLogout({
      userId: userId || '',
      navigate,
      toast: toast as any,
      onClose
    });
  }, [userId, navigate, toast, onClose]);

  const checkUpdatedFollows = useCallback(async (): Promise<void> => {
    if (!userId || userId === 'guest' || !accessToken) {
      setUpdatedFollowCount(0);
      return;
    }

    try {
      const followedData = await getHistoryData(FOLLOW_KEY, userId);
      if (followedData && Array.isArray(followedData)) {
        const updatedCount = (followedData as FollowedPost[]).filter(post => {
          if (!post.updated || !post.published) return false;
          const updated = new Date(post.updated);
          const published = new Date(post.published);
          return updated > published;
        }).length;
        setUpdatedFollowCount(updatedCount);
      } else {
        setUpdatedFollowCount(0);
      }
    } catch (error: any) {
      console.error('Error checking updated follows:', error);
      setUpdatedFollowCount(0);
    }
  }, [accessToken, userId, setUpdatedFollowCount]);

  return {
    handleOpenSearch,
    handleHistory,
    handleProfile,
    handleViewMore,
    login,
    logout,
    checkUpdatedFollows
  };
};