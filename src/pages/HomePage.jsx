import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  useColorModeValue,
  Button,
  VStack,
  IconButton,
  Flex,
  Tooltip,
  GridItem,
  SimpleGrid,
  useBreakpointValue,
  useToast,
  Skeleton,
  Tag,
  TagLabel,
  TagCloseButton,
  Fade,
  Spinner,
  Select
} from '@chakra-ui/react';
import { ChevronDownIcon, RepeatIcon } from '@chakra-ui/icons';
import { motion, isValidMotionProp } from 'framer-motion';
import 'react-lazy-load-image-component/src/effects/blur.css';
import 'react-lazy-load-image-component/src/effects/opacity.css';
import PostCard from '../components/HomePage/PostCard';
import SkeletonCard from '../components/HomePage/SkeletonCard';
import { gridConfig } from '../utils/blogUtils';
import useBlogStore from '../store/useBlogStore';
import InfiniteScroll from 'react-infinite-scroll-component';
import TagFilter from '../components/TagFilter';

const MotionBox = motion.create(Box, {
  shouldInheritVariant: true,
  filterProps: (prop) => !isValidMotionProp(prop)
});

function HomePage() {
  // All hooks at the top
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const toast = useToast();

  const {
    posts,
    loading,
    error,
    fetchPosts,
    refreshPosts,
    getFilteredPosts,
    selectedTag,
    setSelectedTag,
    nextPageToken,
  } = useBlogStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [isTagLoading, setIsTagLoading] = useState(false);
  const [orderBy, setOrderBy] = useState('published');

  const itemsPerPage = useBreakpointValue({
    base: 2,   // Mobile
    sm: 3,     // Small tablet
    md: 4,     // Tablet
    lg: 6,     // Desktop
    xl: 8,     // Large desktop
    '2xl': 10  // Extra large
  }) || 2;

  const skeletonCount = useBreakpointValue({
    base: gridConfig.base.items,
    sm: gridConfig.sm.items,
    md: gridConfig.md.items,
    lg: gridConfig.lg.items,
    xl: gridConfig.xl.items,
    '2xl': gridConfig['2xl'].items,
  }) || gridConfig.base.items;

  // Derived values (not hooks)
  const filteredPosts = getFilteredPosts();
  const currentPosts = filteredPosts.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(20);
    setIsTagLoading(true);
    const timeout = setTimeout(() => setIsTagLoading(false), 250);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => clearTimeout(timeout);
  }, [selectedTag]);

  useEffect(() => {
    fetchPosts({ orderBy });
  }, [fetchPosts, orderBy]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const result = await refreshPosts();
    if (result && result.shouldToast) {
      toast({
        title: result.toastStatus === 'success' ? 'Thành công' : 'Vui lòng đợi',
        description: result.toastMessage,
        status: result.toastStatus,
        duration: 3000,
        isClosable: true,
      });
    }
    setIsRefreshing(false);
  }, [refreshPosts, toast]);

  useEffect(() => {
    document.title = selectedTag ? `Tag: ${selectedTag}` : "Trang chủ";
  }, [selectedTag]);

  const handleLoadMore = useCallback(() => {
    if (nextPageToken) {
      fetchPosts({ pageToken: nextPageToken, orderBy });
    }
  }, [nextPageToken, fetchPosts, orderBy]);

  const handleOrderByChange = (value) => {
    setOrderBy(value);
  };

  if (loading && posts.length === 0) {
    return (
      <Container
        maxW={{
          base: "container.sm",
          sm: "container.md",
          md: "container.lg",
          lg: "container.xl",
          xl: "1400px"
        }}
        py={4}
        px={{ base: 3, md: 4 }}
      >
        <Fade in={true}>
          <Flex justify="space-between" align="center" mb={4}>
            <Skeleton height="32px" width="200px" />
          </Flex>
          <SimpleGrid
            columns={{
              base: 2,
              sm: 3,
              md: 3,
              lg: 4,
              xl: 5
            }}
            spacing={{
              base: 2,
              sm: 3,
              md: 4,
              lg: 5
            }}
            mx="auto"
          >
            {Array.from({ length: skeletonCount }).map((_, index) => (
              <GridItem key={index}>
                <SkeletonCard />
              </GridItem>
            ))}
          </SimpleGrid>
        </Fade>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Fade in={true}>
          <VStack spacing={4} align="center">
            <Text color="red.500" fontSize="xl">Lỗi: {error}</Text>
            <Button
              colorScheme="blue"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              leftIcon={<RepeatIcon />}
            >
              Thử lại
            </Button>
          </VStack>
        </Fade>
      </Container>
    );
  }

  return (
    <Container
      maxW={{
        base: "container.sm",
        sm: "container.md",
        md: "container.lg",
        lg: "container.xl",
        xl: "1400px"
      }}
      py={4}
      px={{ base: 3, md: 4 }}
      minH="100vh"
      position="relative"
    >
      
      <Fade in={true}>


        <Flex
          justify="space-between"
          align="center"
          mb={6}
          flexDirection={{ base: "column", sm: "row" }}
          gap={{ base: 4, sm: 0 }}
        >
          <Heading
            as="h3"
            size={{ base: "md", md: "lg" }}
            fontWeight="bold"
            display="flex"
            alignItems="center"
            gap={2}
          >
            {selectedTag ? `Tag: ${selectedTag}` : 'Bài viết mới nhất'}
            <Tooltip label="Làm mới dữ liệu" placement="right">
              <IconButton
                icon={<RepeatIcon />}
                isLoading={isRefreshing}
                onClick={handleRefresh}
                variant="ghost"
                size="sm"
                aria-label="Refresh posts"
                _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
              />
            </Tooltip>
          </Heading>
          <Select
            value={orderBy}
            onChange={e => setOrderBy(e.target.value)}
            width={{ base: "120px", sm: "150px" }}
            variant="filled"
            bg="transparent"
            _hover={{ bg: "transparent" }}
            borderRadius="full"
            icon={<ChevronDownIcon />}
            flexShrink={0}
            aria-label="Sort posts by"
          >
            <option value="newest">Newest</option>
            <option value="updated">Updated</option>
          </Select>
        </Flex>

        <Box
          zIndex="1"
        >
          <TagFilter posts={posts} selectedTag={selectedTag} setSelectedTag={setSelectedTag} onOrderByChange={handleOrderByChange} />
          <InfiniteScroll
            style={{ overflow: 'visible' }}
            dataLength={posts.length}
            next={handleLoadMore}
            hasMore={!!nextPageToken}
            loader={
              <Flex justify="center" py={6} align="center">
                <Spinner size="md" thickness="3px" color="blue.400" />
              </Flex>
            }
          >
            {isTagLoading ? (
              <SimpleGrid
                columns={{
                  base: 2,
                  sm: 3,
                  md: 3,
                  lg: 4,
                  xl: 5
                }}
                spacing={{
                  base: 2,
                  sm: 3,
                  md: 4,
                  lg: 5
                }}
                mx="auto"
              >
                {Array.from({ length: itemsPerPage }).map((_, idx) => (
                  <GridItem key={idx}>
                    <SkeletonCard />
                  </GridItem>
                ))}
              </SimpleGrid>
            ) : (
              <SimpleGrid
                columns={{
                  base: 2,
                  sm: 3,
                  md: 3,
                  lg: 4,
                  xl: 5
                }}
                spacing={{
                  base: 2,
                  sm: 3,
                  md: 4,
                  lg: 5
                }}
                mx="auto"
              >
                {filteredPosts.map((post, index) => (
                  <GridItem key={post.id || index}>
                    <PostCard post={post} index={index} />
                  </GridItem>
                ))}
              </SimpleGrid>
            )}
          </InfiniteScroll>
        </Box>

        {filteredPosts.length === 0 && (
          <Fade in={true}>
            <Text
              color={mutedTextColor}
              textAlign="center"
              py={8}
              fontSize="lg"
            >
              {selectedTag ? `Không có bài viết nào với tag "${selectedTag}"` : 'Không có bài viết nào'}
            </Text>
          </Fade>
        )}
      </Fade>
    </Container>
  );
}

export default HomePage;
