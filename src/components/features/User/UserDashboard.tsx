import React, { useEffect, useState, useRef } from 'react';
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
  FiBookmark,
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
    label: 'Bài viết yêu thích',
    icon: FaHeart,
    description: 'Quản lý các bài viết đã yêu thích',
    color: '#ff6347', // Tomato
    component: FavoritePostsTab,
  },
  {
    id: 'bookmarked-manga',
    label: 'Bookmark truyện',
    icon: FiBookmark,
    description: 'Quản lý các truyện đã bookmark',
    color: '#20b2aa', // LightSeaGreen
    component: BookmarkedMangaTab,
  },
  {
    id: 'user-comments',
    label: 'Bình luận của bạn',
    icon: FaComment,
    description: 'Quản lý các bình luận đã đăng',
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

const UserDashboard: React.FC<UserDashboardProps> = ({ user, accessToken }) => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const isDark = colorMode === 'dark';
  const bgColor = isDark ? '#000000' : '#ffffff';
  const cardBg = isDark ? '#131313' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const mutedColor = isDark ? '#cccccc' : '#666666';
  const borderColor = isDark ? '#333333' : '#e5e5e5';
  const accentColor = '#00d4ff';
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  const {
    bookmarks,
    favorites,
    initialize: initializeStore,
    loading: storeLoading,
    error: storeError,
  } = useFavoriteBookmarkStore();

  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [favoritesPosts, setFavoritesPosts] = useState<FavoritePost[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<MangaBookmark[]>([]);
  const [activeTab, setActiveTab] = useState(USER_DASHBOARD_TABS[0].id);

  // Responsive layout
  const isMobile = useBreakpointValue({ base: true, lg: false });

  // Refs for sticky sidebar (similar to SettingsPage)
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Function to handle avatar load errors
  const handleAvatarError = () => {
    console.warn('User avatar failed to load.');
  };

  // Initialize dashboard data
  useEffect(() => {
    const initDashboard = async () => {
      try {
        setIsLoading(true);
        console.log('🚀 Starting dashboard initialization...', {
          userId: user.id,
          hasToken: !!accessToken
        });

        if (!user.id || !accessToken) {
          console.log('❌ Missing user ID or token, skipping initialization');
          return;
        }

        await initializeStore(user.id);
        console.log('✅ Store initialized');

      } catch (error) {
        console.error('Error initializing dashboard:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    initDashboard();
  }, [user.id, accessToken, initializeStore]);

  // Update local states when store favorites/bookmarks change
  useEffect(() => {
    setFavoritesPosts(favorites);
  }, [favorites]);

  useEffect(() => {
    setBookmarkedPosts(bookmarks);
  }, [bookmarks]);

  // Handle overall loading state
  if (isLoading || storeLoading) {
    return (
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
    );
  }

  if (storeError) {
    return (
      <Box bg={bgColor} minH="100vh" color={textColor}>
        <Container maxW="1200px" py={8}>
          <Alert status="error">
            <AlertIcon />
            <AlertTitle mr={2}>Lỗi tải dữ liệu!</AlertTitle>
            <AlertDescription>{storeError}</AlertDescription>
          </Alert>
        </Container>
      </Box>
    );
  }

  // Get current tab component
  const currentTab = USER_DASHBOARD_TABS.find(tab => tab.id === activeTab);
  const TabComponent = currentTab?.component;

  // Mobile: Show settings list when no tab selected (similar to SettingsPage)
  if (isMobile && !activeTab) {
    return (
      <Container maxW="container.md" py={4}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="xl" color={textColor} mb={2}>
              Bảng điều khiển
            </Heading>
            <Text color={mutedColor} fontSize="md">
              Quản lý các thông tin cá nhân và dữ liệu của bạn
            </Text>
          </Box>

          {/* Dashboard List */}
          <VStack spacing={3} align="stretch">
            {USER_DASHBOARD_TABS.map(tab => (
              <Card
                key={tab.id}
                variant="outline"
                cursor="pointer"
                onClick={() => setActiveTab(tab.id)}
                _hover={{
                  bg: hoverBg,
                  transform: 'translateY(-2px)',
                  boxShadow: 'md'
                }}
                transition="all 0.2s ease"
              >
                <CardBody py={4}>
                  <HStack spacing={4} justify="space-between">
                    <HStack spacing={4}>
                      <Box
                        p={2}
                        borderRadius="lg"
                        bg={`${tab.color}15`}
                      >
                        <Icon as={tab.icon} color={tab.color} w={5} h={5} />
                      </Box>
                      <VStack align="start" spacing={0}>
                        <HStack spacing={2}>
                          <Text fontWeight="semibold" fontSize="md" color={textColor}>
                            {tab.label}
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color={mutedColor}>
                          {tab.description}
                        </Text>
                      </VStack>
                    </HStack>
                    <Icon as={FiChevronRight} color={mutedColor} w={4} h={4} />
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        </VStack>
      </Container>
    );
  }

  // Mobile: Show individual tab content
  if (isMobile && activeTab) {
    return (
      <Container maxW="container.md" py={4}>
        <VStack spacing={6} align="stretch">
          <HStack spacing={4}>
            <Button
              variant="ghost"
              leftIcon={<FiArrowLeft />}
              onClick={() => setActiveTab('')}
              size="sm"
            >
              Bảng điều khiển
            </Button>
          </HStack>

          <Box>
            <HStack spacing={3} mb={2}>
              <Icon as={currentTab?.icon} color={currentTab?.color} w={6} h={6} />
              <Heading size="lg" color={textColor}>
                {currentTab?.label}
              </Heading>
            </HStack>
            <Text color={mutedColor} fontSize="md">
              {currentTab?.description}
            </Text>
          </Box>

          <Box>
            {TabComponent && (
              <TabComponent
                favoritesPosts={favoritesPosts}
                bookmarkedPosts={bookmarkedPosts}
                cardBg={cardBg}
                textColor={textColor}
                mutedColor={mutedColor}
                accentColor={accentColor}
                isDark={isDark}
              />
            )}
          </Box>
        </VStack>
      </Container>
    );
  }

  // Desktop: Show sidebar + content layout
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
              <Button
                key={tab.id}
                variant="ghost"
                justifyContent="flex-start"
                leftIcon={<Icon as={tab.icon} color={activeTab === tab.id ? tab.color : mutedColor} w={5} h={5} />}
                color={activeTab === tab.id ? tab.color : textColor}
                bg={activeTab === tab.id ? `${tab.color}15` : 'transparent'}
                _hover={{
                  bg: activeTab === tab.id ? `${tab.color}25` : hoverBg,
                  transform: 'translateX(4px)'
                }}
                onClick={() => setActiveTab(tab.id)}
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
            ))}
          </VStack>
        </Box>

        {/* Content */}
        <Box ref={contentRef} flex={1} py={8}>
          <Heading size="lg" mb={2} color={textColor}>
            {currentTab?.label}
          </Heading>
          <Text color="gray.500" mb={6}>
            {currentTab?.description}
          </Text>
          <Box>
            {TabComponent && (
              <TabComponent
                favoritesPosts={favoritesPosts}
                bookmarkedPosts={bookmarkedPosts}
                cardBg={cardBg}
                textColor={textColor}
                mutedColor={mutedColor}
                accentColor={accentColor}
                isDark={isDark}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default UserDashboard; 