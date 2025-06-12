import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import * as React from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Badge,
  useColorMode,
  useToast,
  Spinner,
  Center,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Image,
  SimpleGrid,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagLeftIcon,
  Skeleton,
  SkeletonText,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Stack,
  Avatar,
  Heading,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FaBookmark,
  FaHeart,
  FaComment,
  FaClock,
  FaTags,
  FaTrash,
} from 'react-icons/fa';
import {
  FiUser,
  FiChevronRight,
  FiArrowLeft
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import useFavoriteBookmarkStore from '../../../store/useFollowBookmarkStore';
import { blogConfig } from '../../../config';
import { getHistoryData } from '../../../utils/indexedDBUtils';
import type { User, BlogPost, FavoritePost, MangaBookmark } from '../../../types/global';

// Import new tab components
import FavoritePostsTab from './FavoritePostsTab';
import BookmarkedMangaTab from './BookmarkedMangaTab';
import UserCommentsTab from '../../Settings/Profile/UserCommentsTab';

interface UserDashboardProps {
  user: User;
  accessToken: string | null;
}

interface UserDashboardTab {
  id: string;
  label: string;
  icon: any;
  description: string;
  color: string;
  component: React.ComponentType<{ cardBg: string; textColor: string; mutedColor: string; accentColor: string; isDark: boolean; favoritesPosts: FavoritePost[]; bookmarkedPosts: MangaBookmark[]; }>;
}

const USER_DASHBOARD_TABS: UserDashboardTab[] = [
  {
    id: 'favorite-posts',
    label: 'favorites',
    icon: FaHeart,
    description: 'danh sách bài viết đã thích',
    color: '#ff6347', // Tomato
    component: FavoritePostsTab,
  },
  {
    id: 'bookmarked-manga',
    label: 'bookmark',
    icon: FaBookmark,
    description: 'quản lý các truyện đã bookmark',
    color: '#20b2aa', // LightSeaGreen
    component: BookmarkedMangaTab,
  },
  {
    id: 'user-comments',
    label: 'comments',
    icon: FaComment,
    description: 'quản lý các bình luận đã đăng',
    color: '#3182ce', // Blue
    component: UserCommentsTab,
  },
];

interface TabComponentProps {
  cardBg: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  isDark: boolean;
  favoritesPosts?: FavoritePost[];
  bookmarkedPosts?: MangaBookmark[];
}

// Split into smaller components
const DashboardHeader = React.memo(({ 
  user, 
  textColor, 
  mutedColor 
}: { 
  user: User; 
  textColor: string; 
  mutedColor: string; 
}) => (
  <Box>
    <Heading size="xl" color={textColor} mb={2}>
      Bảng điều khiển
    </Heading>
    <Text color={mutedColor} fontSize="md">
      Quản lý các thông tin cá nhân và dữ liệu của bạn
    </Text>
  </Box>
));

const DashboardTab = React.memo(({ 
  tab, 
  isActive, 
  onClick, 
  textColor, 
  mutedColor, 
  hoverBg 
}: { 
  tab: UserDashboardTab; 
  isActive: boolean; 
  onClick: () => void; 
  textColor: string; 
  mutedColor: string; 
  hoverBg: string; 
}) => (
  <Button
    variant="ghost"
    justifyContent="flex-start"
    leftIcon={<Icon as={tab.icon} color={isActive ? tab.color : mutedColor} w={5} h={5} />}
    color={isActive ? tab.color : textColor}
    bg={isActive ? `${tab.color}15` : 'transparent'}
    _hover={{
      bg: isActive ? `${tab.color}25` : hoverBg,
      transform: 'translateX(4px)'
    }}
    onClick={onClick}
    transition="all 0.2s ease"
    size="lg"
    fontWeight="medium"
    borderRadius="md"
    h="auto"
    py={3}
    px={4}
  >
    <VStack align="start" spacing={0}>
      <Text fontWeight="semibold" fontSize="md">{tab.label}</Text>
      <Text fontSize="sm" color={mutedColor}>
        {tab.description}
      </Text>
    </VStack>
  </Button>
));

const LoadingState = React.memo(({ 
  bgColor, 
  textColor, 
  mutedColor, 
  accentColor 
}: { 
  bgColor: string; 
  textColor: string; 
  mutedColor: string; 
  accentColor: string; 
}) => (
  <Box bg={bgColor} minH="100vh" color={textColor}>
    <Container maxW="1200px" py={8}>
      <Center h="50vh">
        <VStack spacing={4}>
          <Spinner size="xl" color={accentColor} />
          <Text color={mutedColor}>Đang tải bảng điều khiển...</Text>
        </VStack>
      </Center>
    </Container>
  </Box>
));

const ErrorState = React.memo(({ 
  bgColor, 
  textColor, 
  error 
}: { 
  bgColor: string; 
  textColor: string; 
  error: string; 
}) => (
  <Box bg={bgColor} minH="100vh" color={textColor}>
    <Container maxW="1200px" py={8}>
      <Alert status="error">
        <AlertIcon />
        <AlertTitle mr={2}>Lỗi tải dữ liệu!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </Container>
  </Box>
));

const UserDashboard: React.FC<UserDashboardProps> = ({ user, accessToken }) => {
  // 1. All hooks must be at the top level
  const { colorMode } = useColorMode();
  const toast = useToast();
  const isDark = colorMode === 'dark';
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  
  // 2. Store hooks
  const {
    bookmarks,
    favorites,
    initialize: initializeStore,
    loading: storeLoading,
    error: storeError,
    syncData,
  } = useFavoriteBookmarkStore();

  // 3. Refs
  const renderCountRef = useRef(0);
  const initRef = useRef(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 4. State
  const [activeTab, setActiveTab] = useState(USER_DASHBOARD_TABS[0].id);

  // 5. Memoized values - move theme values here
  const theme = useMemo(() => ({
    bgColor: isDark ? '#000000' : '#ffffff',
    cardBg: isDark ? '#131313' : '#ffffff',
    textColor: isDark ? '#ffffff' : '#000000',
    mutedColor: isDark ? '#cccccc' : '#666666',
    borderColor: isDark ? '#333333' : '#e5e5e5',
    accentColor: '#00d4ff',
    hoverBg
  }), [isDark, hoverBg]);

  const isMobile = useBreakpointValue({ base: true, lg: false });
  const currentTab = useMemo(() => 
    USER_DASHBOARD_TABS.find(tab => tab.id === activeTab),
    [activeTab]
  );

  // 6. Callbacks
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  // 7. Effects
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
    return <LoadingState {...theme} />;
  }

  if (storeError) {
    return <ErrorState bgColor={theme.bgColor} textColor={theme.textColor} error={storeError} />;
  }

  // Mobile view
  if (isMobile && !activeTab) {
    return (
      <Container maxW="container.md" py={4}>
        <VStack spacing={6} align="stretch">
          <DashboardHeader user={user} textColor={theme.textColor} mutedColor={theme.mutedColor} />
          <VStack spacing={3} align="stretch">
            {USER_DASHBOARD_TABS.map(tab => (
              <Card
                key={tab.id}
                variant="outline"
                cursor="pointer"
                onClick={() => handleTabChange(tab.id)}
                _hover={{
                  bg: theme.hoverBg,
                  transform: 'translateY(-2px)',
                  boxShadow: 'md'
                }}
                transition="all 0.2s ease"
              >
                <CardBody py={4}>
                  <HStack spacing={4} justify="space-between">
                    <HStack spacing={4}>
                      <Box p={2} borderRadius="lg" bg={`${tab.color}15`}>
                        <Icon as={tab.icon} color={tab.color} w={5} h={5} />
                      </Box>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold" fontSize="md" color={theme.textColor}>
                          {tab.label}
                        </Text>
                        <Text fontSize="sm" color={theme.mutedColor}>
                          {tab.description}
                        </Text>
                      </VStack>
                    </HStack>
                    <Icon as={FiChevronRight} color={theme.mutedColor} w={4} h={4} />
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        </VStack>
      </Container>
    );
  }

  // Mobile tab view
  if (isMobile && activeTab) {
    const TabComponent = currentTab?.component;
    return (
      <Container maxW="container.md" py={4}>
        <VStack spacing={6} align="stretch">
          <HStack spacing={4}>
            <Button
              variant="ghost"
              leftIcon={<FiArrowLeft />}
              onClick={() => handleTabChange('')}
              size="sm"
            >
              Bảng điều khiển
            </Button>
          </HStack>

          <Box>
            <HStack spacing={3} mb={2}>
              <Icon as={currentTab?.icon} color={currentTab?.color} w={6} h={6} />
              <Heading size="lg" color={theme.textColor}>
                {currentTab?.label}
              </Heading>
            </HStack>
            <Text color={theme.mutedColor} fontSize="md">
              {currentTab?.description}
            </Text>
          </Box>

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
        </VStack>
      </Container>
    );
  }

  // Desktop view
  const TabComponent = currentTab?.component;
  return (
    <Container maxW="container.xl" pb={6}>
      <Box display="flex" gap={4}>
        {/* Sidebar */}
        <Box
          ref={sidebarRef}
          width="270px"
          flexShrink={0}
          position="sticky"
          top={0}
          mt="35vh"
          height="max-content"
          alignSelf="flex-start"
        >
          <VStack align="stretch" spacing={3}>
            {USER_DASHBOARD_TABS.map(tab => (
              <DashboardTab
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={() => handleTabChange(tab.id)}
                textColor={theme.textColor}
                mutedColor={theme.mutedColor}
                hoverBg={theme.hoverBg}
              />
            ))}
          </VStack>
        </Box>

        {/* Content */}
        <Box ref={contentRef} flex={1} py={8}>
          <Heading size="lg" mb={2} color={theme.textColor}>
            {currentTab?.label}
          </Heading>
          <Text color={theme.mutedColor} mb={6}>
            {currentTab?.description}
          </Text>
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
        </Box>
      </Box>
    </Container>
  );
};

export default React.memo(UserDashboard); 