import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import { debounce } from 'lodash';
import useUserStore from '../store/useUserStore';
import useFollowBookmarkStore from '../store/useFollowBookmarkStore';
import { getHistoryData, saveHistoryData } from '../utils/indexedDBUtils';
import { backupUserData } from '../api/auth';
import { MangaBookmark } from '../types/global';

interface UseMangaReaderProps {
  postId: string;
  postTitle: string;
  postSlug: string;
  images: string[];
  initialPage?: number;
}

export const useMangaReader = ({
  postId,
  postTitle,
  postSlug,
  images,
  initialPage = 0
}: UseMangaReaderProps) => {
  // Core state
  const [currentPage, setCurrentPage] = useState(0);
  const [isVerticalMode, setIsVerticalMode] = useState(false);
  const [isTwoPage, setIsTwoPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [brightness, setBrightness] = useState(100);
  const [autoScroll, setAutoScroll] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(1);
  const [showToolbar, setShowToolbar] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Touch handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Refs
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef(Date.now());
  const pagesRead = useRef(0);

  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { isAuthenticated, userId, accessToken } = useUserStore();
  const { initialize: initializeStore, getBookmarkData } = useFollowBookmarkStore();

  // Constants
  const minSwipeDistance = 50;

  // Page navigation
  const handlePrevPage = useCallback(() => {
    if (isTwoPage) {
      setCurrentPage(prev => Math.max(0, prev - 2));
    } else {
      setCurrentPage(prev => Math.max(0, prev - 1));
    }
  }, [isTwoPage]);

  const handleNextPage = useCallback(() => {
    if (isTwoPage) {
      setCurrentPage(prev => {
        if (prev + 2 >= images.length) {
          return images.length % 2 === 0 ? images.length - 2 : images.length - 1;
        }
        return prev + 2;
      });
    } else {
      setCurrentPage(prev => Math.min(images.length - 1, prev + 1));
    }
  }, [isTwoPage, images.length]);

  const goToPage = useCallback((page: number) => {
    const targetPage = Math.max(0, Math.min(images.length - 1, page));
    setCurrentPage(targetPage);
  }, [images.length]);

  // Touch handling
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isVerticalMode || isZoomed) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, [isVerticalMode, isZoomed]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (isVerticalMode || isZoomed) return;
    setTouchEnd(e.targetTouches[0].clientX);
  }, [isVerticalMode, isZoomed]);

  const onTouchEnd = useCallback(() => {
    if (isVerticalMode || isZoomed || !touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentPage < images.length - 1) {
      handleNextPage();
    }
    if (isRightSwipe && currentPage > 0) {
      handlePrevPage();
    }
  }, [isVerticalMode, isZoomed, touchStart, touchEnd, currentPage, images.length, handleNextPage, handlePrevPage]);

  // Keyboard handling
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!isVerticalMode) {
      if (e.key === 'ArrowLeft') handlePrevPage();
      if (e.key === 'ArrowRight') handleNextPage();
    }
  }, [handlePrevPage, handleNextPage, isVerticalMode]);

  // Auto-save bookmark
  const debouncedSave = useCallback(
    debounce(async (page: number) => {
      if (!userId || !isAuthenticated || !Array.isArray(images) || images.length === 0) {
        return;
      }

      try {
        const bookmark: MangaBookmark = {
          id: postId,
          currentPage: page,
          totalPages: images.length,
          verticalMode: isVerticalMode,
          title: postTitle,
          url: window.location.pathname,
          timestamp: Date.now(),
        };

        const bookmarksRaw = await getHistoryData('bookmarks', userId);
        const bookmarks = Array.isArray(bookmarksRaw) ? bookmarksRaw : [];
        const existingIndex = bookmarks.findIndex(b => b.id === postId);

        if (existingIndex !== -1) {
          bookmarks[existingIndex] = bookmark;
        } else {
          bookmarks.unshift(bookmark);
        }

        await saveHistoryData('bookmarks', userId, bookmarks);

        // Backup to Google Drive
        if (accessToken) {
          try {
            const backupData = {
              readPosts: await getHistoryData('reads', userId) || [],
              favoritePosts: await getHistoryData('favorites', userId) || [],
              mangaBookmarks: bookmarks
            };
            await backupUserData(accessToken, userId, backupData);
          } catch (error) {
            console.error('Error backing up to Google Drive:', error);
          }
        }
      } catch (error) {
        console.error('Error auto-saving bookmark:', error);
      }
    }, 3000),
    [postId, postTitle, images.length, isVerticalMode, userId, accessToken, isAuthenticated]
  );

  // Effects
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (userId && isAuthenticated) {
      initializeStore(userId);
    }
  }, [userId, isAuthenticated, initializeStore]);

  useEffect(() => {
    if (!Array.isArray(images) || images.length === 0) {
      setLoading(false);
      return;
    }

    if (!isAuthenticated || !userId) {
      setCurrentPage(initialPage);
      setIsVerticalMode(false);
      setLoading(false);
      return;
    }

    const bookmarkData = getBookmarkData(postId);
    if (bookmarkData) {
      const pageToLoad = Math.min(bookmarkData.currentPage, images.length - 1);
      setCurrentPage(pageToLoad);
      setIsVerticalMode((bookmarkData as any).verticalMode || false);
    } else {
      setCurrentPage(initialPage);
      setIsVerticalMode(false);
    }
    setLoading(false);
  }, [postId, initialPage, images, isAuthenticated, userId, getBookmarkData]);

  useEffect(() => {
    if (isAuthenticated && userId && images.length > 0) {
      debouncedSave(currentPage);
    }
    return () => debouncedSave.cancel();
  }, [currentPage, debouncedSave, isAuthenticated, userId, images.length]);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && isVerticalMode) {
      autoScrollInterval.current = setInterval(() => {
        window.scrollBy({
          top: autoScrollSpeed * 2,
          behavior: 'smooth'
        });
      }, 50);
    }
    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [autoScroll, isVerticalMode, autoScrollSpeed]);

  return {
    // State
    currentPage,
    isVerticalMode,
    isTwoPage,
    loading,
    error,
    brightness,
    autoScroll,
    autoScrollSpeed,
    showToolbar,
    fullscreen,
    isZoomed,
    zoomLevel,
    
    // Actions
    setCurrentPage,
    setIsVerticalMode,
    setIsTwoPage,
    setBrightness,
    setAutoScroll,
    setAutoScrollSpeed,
    setShowToolbar,
    setFullscreen,
    setIsZoomed,
    setZoomLevel,
    
    // Handlers
    handlePrevPage,
    handleNextPage,
    goToPage,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    
    // Utils
    totalPages: images.length,
  };
};

export default useMangaReader;
