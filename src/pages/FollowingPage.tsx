import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/useUserStore';
import useFollowBookmarkStore from '../store/useFollowBookmarkStore';
import PostCard from '../components/HomePage/PostCard';
import { getHistoryData } from '../utils/indexedDBUtils';

interface Post {
  id: string;
  data?: any;
  followAt: number;
  [key: string]: any;
}

interface CachedPosts {
  [key: string]: any;
}

const FollowingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [cachedPosts, setCachedPosts] = useState<CachedPosts>({});
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const {
    hasUserId,
    hasAccessToken,
    userId,
    accessToken,
    initializeUser
  } = useUserStore();

  const {
    follows,
    loading: storeLoading,
    initialize: initializeStore,
    syncGuestData
  } = useFollowBookmarkStore();

  useEffect(() => {
    console.log('Initializing FollowingPage...');
    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        // First initialize the user store
        const storeResult = await initializeUser();
        console.log('Store initialization result:', storeResult);

        if (!storeResult) {
          setError('Không thể khởi tạo ứng dụng. Vui lòng thử lại sau.');
          return;
        }

        // Get current store state after initialization
        const currentState = {
          hasUserId: !!userId,
          hasAccessToken: !!accessToken,
          isAuthenticated: useUserStore.getState().isAuthenticated,
          userId: useUserStore.getState().userId
        };

        console.log('Current store state after initialization:', currentState);

        // Check authentication with current state
        if (!currentState.isAuthenticated || !currentState.userId) {
          console.log('Not authenticated, redirecting to login...');
          setError('Vui lòng đăng nhập để xem danh sách theo dõi');
          return;
        }

        console.log('Store ready, initializing follow store...');
        await initializeStore(currentState.userId);
        console.log('Follow store initialized');

        // Load followed posts after store is initialized
        console.log('Loading followed posts for:', currentState.userId);
        const followedData = await getHistoryData('follows', currentState.userId);
        console.log('Followed data loaded:', followedData?.length || 0);

        if (!Array.isArray(followedData) || followedData.length === 0) {
          setPosts([]);
          return;
        }

        // Load cached posts
        const cachedData = await getHistoryData('posts', 'cache');
        console.log('Cached posts loaded:', cachedData?.length || 0);
        setCachedPosts(cachedData || {});

        // Match followed posts with cached data
        const matchedPosts = followedData
          .map((follow: any) => {
            const post = cachedData?.[follow.id];
            if (post) {
              return {
                ...post,
                followAt: follow.followAt
              };
            }
            return null;
          })
          .filter(Boolean)
          .sort((a: any, b: any) => b.followAt - a.followAt);

        console.log('Sorted posts:', matchedPosts.length);
        setPosts(matchedPosts);
      } catch (error: any) {
        console.error('Error in FollowingPage initialization:', error);
        setError('Không thể tải danh sách theo dõi');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [initializeUser, initializeStore]);

  const handleSync = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const result = await syncGuestData(userId);
      if (result) {
        // Reload the page to show synced data
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error syncing data:', error);
      setError('Không thể đồng bộ dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="lg"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Lỗi
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {error}
          </AlertDescription>
          {error.includes('đăng nhập') && (
            <Button
              colorScheme="blue"
              mt={4}
              onClick={() => navigate('/login')}
            >
              Đăng nhập
            </Button>
          )}
        </Alert>
      </Container>
    );
  }

  if (loading || storeLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="60vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color="gray.500">Đang tải danh sách theo dõi...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box
          p={6}
          bg={bgColor}
          borderRadius="lg"
          boxShadow="sm"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <Heading size="lg" mb={4}>Danh sách theo dõi</Heading>
          <Text color="gray.500" mb={4}>
            {posts.length > 0
              ? `Bạn đang theo dõi ${posts.length} truyện`
              : 'Bạn chưa theo dõi truyện nào'}
          </Text>
          {posts.length === 0 && (
            <Button
              colorScheme="blue"
              onClick={() => navigate('/')}
            >
              Khám phá truyện
            </Button>
          )}
        </Box>

        {posts.length > 0 && (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing={6}>
            {posts.map((post: any) => (
              <PostCard
                key={post.id}
                post={post.data ? post.data : post}
                cachedPost={cachedPosts[post.id]}
              />
            ))}
          </SimpleGrid>
        )}
        </VStack>
    </Container>
  );
};

export default FollowingPage;