import { useEffect, useRef, useMemo } from 'react';
import * as React from 'react';
import { useColorMode, useToast, Spinner, Center } from '@chakra-ui/react';
import useFavoriteBookmarkStore from '../../../store/useFollowBookmarkStore';
import type { UserDashboardProps } from '../../../types/dashboard';
import { USER_DASHBOARD_TABS } from '../../../constants/dashboard';
import TabLayout from '../../layouts/TabLayout';

// Import new tab components
import FavoritePostsTab from './FavoritePostsTab';
import BookmarkedMangaTab from './BookmarkedMangaTab';
import UserCommentsTab from './UserCommentsTab';
import PostsManagement from './PostsManagement';

// Main component
const UserDashboard: React.FC<UserDashboardProps> = ({ user, accessToken }) => {
  // Hooks
  const { colorMode } = useColorMode();
  const toast = useToast();
  const isDark = colorMode === 'dark';
  
  // Store hooks
  const {
    bookmarks,
    favorites,
    initialize: initializeStore,
    loading: storeLoading,
    error: storeError,
    syncData,
  } = useFavoriteBookmarkStore();

  // Refs
  const renderCountRef = useRef(0);
  const initRef = useRef(false);

  // State
  const [activeTab, setActiveTab] = React.useState('');

  // Memoized values
  const theme = useMemo(() => ({
    cardBg: isDark ? '#131313' : '#ffffff',
    textColor: isDark ? '#ffffff' : '#000000',
    mutedColor: isDark ? '#cccccc' : '#666666',
    accentColor: '#00d4ff',
  }), [isDark]);

  // Effects
  useEffect(() => {
    renderCountRef.current += 1;
    console.log('🔄 UserDashboard render #' + renderCountRef.current, {
      userId: user.id,
      hasToken: !!accessToken,
      storeLoading,
      favoritesCount: favorites.length,
      bookmarksCount: bookmarks.length,
      timestamp: new Date().toISOString()
    });

    return () => {
      console.log('🧹 UserDashboard cleanup', {
        renderCount: renderCountRef.current,
        timestamp: new Date().toISOString()
      });
    };
  });

  // Initialize dashboard data
  useEffect(() => {
    if (initRef.current || !user.id || !accessToken) return;

    let isMounted = true;
    initRef.current = true;

    const initDashboard = async () => {
      try {
        console.log('🚀 Starting dashboard initialization...', {
          userId: user.id,
          hasToken: !!accessToken,
          timestamp: new Date().toISOString()
        });

        await initializeStore(user.id);
        
        if (!isMounted) return;

        console.log('🔄 Checking if sync is needed...');
        const result = await syncData(user.id, accessToken, toast);
        console.log(result ? '✅ Sync completed or skipped (recent)' : '❌ Sync failed');

      } catch (error) {
        if (!isMounted) return;
        console.error('Error initializing dashboard:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    initDashboard();

    return () => {
      isMounted = false;
    };
  }, [user.id, accessToken, initializeStore, syncData, toast]);

  // Reset initialization when user changes
  useEffect(() => {
    return () => {
      initRef.current = false;
    };
  }, [user.id]);

  // Handle loading and error states
  if (storeLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color={theme.accentColor} />
      </Center>
    );
  }

  if (storeError) {
    return (
      <Center h="100vh" color={theme.textColor}>
        {storeError}
      </Center>
    );
  }

  const TabComponent = USER_DASHBOARD_TABS.find(tab => tab.id === activeTab)?.component;

  return (
    <TabLayout
      title="Bảng điều khiển"
      description="Quản lý các thông tin cá nhân và dữ liệu của bạn"
      tabs={USER_DASHBOARD_TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onBackToList={() => setActiveTab('')}
      isLoading={storeLoading}
    >
      {TabComponent && (
        <TabComponent
          favoritesPosts={favorites}
          bookmarkedPosts={bookmarks}
          cardBg={theme.cardBg}
          textColor={theme.textColor}
          mutedColor={theme.mutedColor}
          accentColor={theme.accentColor}
          isDark={isDark}
        />
      )}
    </TabLayout>
  );
};

export default React.memo(UserDashboard); 