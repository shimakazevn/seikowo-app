import React, { useEffect } from 'react';
import {
  Container,
  SimpleGrid,
  VStack,
  Skeleton,
  useColorModeValue,
  Text,
  Heading,
  Button,
  Center
} from '@chakra-ui/react';
import useBlogStore from '../store/useBlogStore';
import PostCard from '../components/HomePage/PostCard';
import InfinityLoading from '../components/ui/molecules/Pagination';
import { gridConfig } from '../utils/blogUtils';

const HomePage: React.FC = () => {
  // Get store instance first
  const store = useBlogStore();
  
  // Then destructure values
  const posts = store.posts || [];
  const loading = store.loading;
  const loadingMore = store.loadingMore;
  const error = store.error;
  const getFilteredPosts = store.getFilteredPosts;
  const fetchPosts = store.fetchPosts;
  const loadMorePosts = store.loadMorePosts;
  const selectedTag = store.selectedTag;
  const batchSize = store.batchSize;
  const hasMorePosts = store.hasMorePosts;

  // Dynamic theme colors using theme values
  const textColor = useColorModeValue('#000000', '#ffffff'); // Text color
  const mutedTextColor = useColorModeValue('#666666', '#b3b3b3'); // Muted text

  // Get filtered posts (now from current page only)
  const filteredPosts = getFilteredPosts?.() || [];

  // Always fetch fresh posts on mount (page reload)
  useEffect(() => {
    if (fetchPosts) {
      fetchPosts({ forceRefresh: false }); // Will fetch fresh due to initialLoad logic
    }
  }, [fetchPosts]); // Add fetchPosts to dependencies

  const handleLoadMore = async () => {
    if (loadMorePosts) {
      await loadMorePosts();
    }
    // Don't scroll to top for infinity loading - keep user's position
  };

  if (loading && posts.length === 0) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6}>
          <Skeleton height="60px" width="100%" />
          <SimpleGrid
            columns={{
              base: gridConfig.base.cols,
              sm: gridConfig.sm.cols,
              md: gridConfig.md.cols,
              lg: gridConfig.lg.cols,
              xl: gridConfig.xl.cols
            }}
            spacing={6}
            width="100%"
          >
            {Array.from({ length: gridConfig.xl.items }).map((_, index) => (
              <Skeleton key={index} height="300px" borderRadius="lg" />
            ))} </SimpleGrid>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Center>
          <VStack spacing={4}>
            <Text color="red.500" fontSize="lg">
              Có lỗi xảy ra: {error}
            </Text>
            <Button onClick={() => fetchPosts()} colorScheme="blue">
              Thử lại
            </Button>
          </VStack>
        </Center>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Note: TagFilter moved to PostPage for better UX */}

        {/* Simple Header */}
        <Heading size="lg" mb={6} textAlign="center">
          {selectedTag ? `Bài viết với tag: ${selectedTag}` : 'Bài viết mới nhất'}
        </Heading>

        {/* Posts Grid */}
        {filteredPosts.length > 0 ? (
          <>
            <SimpleGrid
              columns={{
                base: gridConfig.base.cols,
                sm: gridConfig.sm.cols,
                md: gridConfig.md.cols,
                lg: gridConfig.lg.cols,
                xl: gridConfig.xl.cols
              }}
              spacing={6}
            >
              {filteredPosts.map((post, index: number) => (
                <PostCard
                  key={post.id || `post-${index}`}
                  post={post}
                  index={index}
                  textColor={textColor}
                  mutedTextColor={mutedTextColor}
                />
              ))} </SimpleGrid>

            {/* Infinity Loading */}
            <InfinityLoading
              totalPosts={filteredPosts.length}
              hasMorePosts={hasMorePosts}
              loadingMore={loadingMore}
              batchSize={batchSize}
              onLoadMore={handleLoadMore}
            />
          </>
        ) : (
          <Center py={16}>
            <VStack spacing={4}>
              <Text fontSize="lg" color={mutedTextColor}>
                {selectedTag
                  ? `Không có bài viết nào với tag "${selectedTag}"`
                  : 'Không có bài viết nào'}
              </Text>
              {selectedTag && (
                <Button onClick={() => useBlogStore.getState().setSelectedTag(null)}>
                  Xem tất cả bài viết
                </Button>
              )}
            </VStack>
          </Center>
        )}
      </VStack>
    </Container>
  );
};

export default HomePage;