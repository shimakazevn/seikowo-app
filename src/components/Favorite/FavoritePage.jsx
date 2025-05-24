import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  useToast,
  SimpleGrid,
  GridItem,
  Flex,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../../store/useUserStore';
import { getHistoryData } from '../../utils/indexedDBUtils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import HistoryCard from '../History/HistoryCard';
import Pagination from '../HomePage/Pagination';
import { getSlugFromUrl } from '../../utils/blogUtils';

const FavoritePage = () => {
  const { userId, accessToken, isGuest } = useUserStore();
  const [followedPosts, setFollowedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');

  // Pagination state
  const PAGE_SIZE = 9;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadFollowedPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get followed posts from IndexedDB
        const followedData = await getHistoryData('favorites', userId);
        console.log('Followed data:', followedData); // Debug log

        if (!followedData || !Array.isArray(followedData)) {
          console.log('No followed data found'); // Debug log
          setFollowedPosts([]);
          return;
        }

        // Get cached posts from localStorage
        const cachedPosts = JSON.parse(localStorage.getItem('cachedPosts') || '[]');

        // Enrich followed posts with cached post data
        const enrichedPosts = followedData
          .map(post => {
            const cachedPost = cachedPosts.find(cp => cp.slug === post.slug || cp.id === post.id);
            if (cachedPost) {
              return { ...post, ...cachedPost };
            }
            return post;
          })
          .filter(Boolean);

        // Sort by follow time
        const sortedPosts = enrichedPosts.sort((a, b) => {
          const timeA = a.followAt || a.timestamp || 0;
          const timeB = b.followAt || b.timestamp || 0;
          return timeB - timeA;
        });

        console.log('Sorted posts:', sortedPosts); // Debug log
        setFollowedPosts(sortedPosts);
      } catch (err) {
        console.error('Error loading followed posts:', err);
        setError('Không thể tải danh sách bài viết đã theo dõi');
        toast({
          title: 'Lỗi',
          description: 'Không thể tải danh sách bài viết đã theo dõi',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadFollowedPosts();
  }, [userId, toast]);

  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: vi
      });
    } catch (err) {
      return 'Không xác định';
    }
  };

  const isUpdated = (post) => {
    const lastRead = post.lastRead || 0;
    const lastUpdated = post.lastUpdated || post.timestamp || 0;
    return lastUpdated > lastRead;
  };

  // Calculate pagination
  const totalPages = Math.ceil(followedPosts.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const currentPosts = followedPosts.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading size="lg" color={textColor}>
            Bài viết đã theo dõi
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {Array.from({ length: 6 }).map((_, i) => (
              <GridItem key={i}>
                <Box bg={cardBg} p={4} rounded="lg" shadow="sm">
                  <Spinner />
                </Box>
              </GridItem>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="200px" rounded="lg">
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Đã xảy ra lỗi!
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {error}
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  if (followedPosts.length === 0) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading size="lg" color={textColor}>
            Bài viết đã theo dõi
          </Heading>
          <Alert status="info" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="200px" rounded="lg">
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Chưa có bài viết nào
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              Bạn chưa theo dõi bài viết nào. Hãy theo dõi một số bài viết để xem chúng ở đây.
            </AlertDescription>
          </Alert>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg" color={textColor}>
          Bài viết đã theo dõi
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {currentPosts.map((post) => (
            <GridItem key={post.id}>
              <HistoryCard
                post={post}
                bg={cardBg}
                textColor={textColor}
                mutedTextColor={mutedTextColor}
                isUpdated={isUpdated(post)}
                formatTime={formatTime}
              />
            </GridItem>
          ))}
        </SimpleGrid>

        {totalPages > 1 && (
          <Box mt={8}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default FavoritePage; 