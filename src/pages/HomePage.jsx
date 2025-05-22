import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  useToast
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import { motion, isValidMotionProp } from 'framer-motion';
import 'react-lazy-load-image-component/src/effects/blur.css';
import 'react-lazy-load-image-component/src/effects/opacity.css';
import PostCard from '../components/HomePage/PostCard';
import SkeletonCard from '../components/HomePage/SkeletonCard';
import Pagination from '../components/HomePage/Pagination';
import { gridConfig } from '../utils/blogUtils';
import TagsList from '../components/HomePage/TagsList';
import useBlogStore from '../store/useBlogStore';

const MotionBox = motion.create(Box, {
  shouldInheritVariant: true,
  filterProps: (prop) => !isValidMotionProp(prop)
});

function HomePage() {
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
  } = useBlogStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const itemsPerPage = useBreakpointValue({
    base: gridConfig.base.items,
    sm: gridConfig.sm.items,
    md: gridConfig.md.items,
    lg: gridConfig.lg.items,
    xl: gridConfig.xl.items,
    '2xl': gridConfig['2xl'].items,
  }) || gridConfig.base.items;

  const skeletonCount = useBreakpointValue({
    base: gridConfig.base.items,
    sm: gridConfig.sm.items,
    md: gridConfig.md.items,
    lg: gridConfig.lg.items,
    xl: gridConfig.xl.items,
    '2xl': gridConfig['2xl'].items,
  }) || gridConfig.base.items;

  const totalPages = Math.ceil(posts.length / itemsPerPage);
  const currentPosts = posts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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
    if (result && result.toastStatus === 'success') {
        setCurrentPage(1);
    }
    setIsRefreshing(false);
  }, [refreshPosts, toast]);

  useEffect(() => {
    if (!currentPosts.length || loading) return;

    let isMounted = true;
    const preloadContainer = document.createElement('div');
    preloadContainer.style.display = 'none';
    document.body.appendChild(preloadContainer);

    const imageLoadingMap = new Map();

    const checkAllImagesLoaded = () => {
      if (!isMounted) return;
      const allLoaded = Array.from(imageLoadingMap.values()).every(status => status);
      if (allLoaded && preloadContainer.parentNode) {
        preloadContainer.parentNode.removeChild(preloadContainer);
      }
    };

    currentPosts.forEach(post => {
      const imgSrc = post.content ? post.content.match(/<img[^>]+src="([^"]+)"/)?.[1] : null;
      if (imgSrc) {
        imageLoadingMap.set(imgSrc, false);
        const img = new window.Image();
        img.src = imgSrc;
        img.onload = () => {
          if (isMounted) {
            imageLoadingMap.set(imgSrc, true);
            checkAllImagesLoaded();
          }
        };
        img.onerror = () => {
          if (isMounted) {
            imageLoadingMap.set(imgSrc, true);
            checkAllImagesLoaded();
          }
        };
        preloadContainer.appendChild(img);
      } else {
        
      }
    });
    
    if (imageLoadingMap.size === 0 && preloadContainer.parentNode) {
        preloadContainer.parentNode.removeChild(preloadContainer);
    }

    return () => {
      isMounted = false;
      if (preloadContainer.parentNode) {
        preloadContainer.parentNode.removeChild(preloadContainer);
      }
    };
  }, [currentPosts, loading]);

  useEffect(() => {
    document.title = "Trang chủ";
  }, []);

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
        <Flex justify="space-between" align="center" mb={4}>
          <Heading as="h3" size={{ base: "sm", md: "md" }} fontWeight="medium">
            Bài viết mới nhất
          </Heading>
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
          minH="auto"
          h="auto"
        >
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <GridItem
              key={index}
              w="100%"
              h="100%"
            >
              <SkeletonCard />
            </GridItem>
          ))}
        </SimpleGrid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4} align="center">
          <Text color="red.500" fontSize="xl">Lỗi: {error}</Text>
          <Button colorScheme="blue" onClick={handleRefresh} isLoading={isRefreshing}>
            Thử lại
          </Button>
        </VStack>
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
      id="swipe-area"
      minH="auto"
      h="auto"
    >
      <TagsList />
      <Flex justify="space-between" align="center" mb={4}>
        <Heading as="h3" size={{ base: "sm", md: "md" }} display="flex" alignItems="center" fontWeight="medium">
          Bài viết mới nhất
          <Tooltip label="Làm mới dữ liệu" placement="right">
            <IconButton
              icon={<RepeatIcon />}
              isLoading={isRefreshing}
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              ml={2}
              aria-label="Refresh posts"
            />
          </Tooltip>
        </Heading>
      </Flex>

      <SimpleGrid
        columns={{
          base: 2,
          sm: 2,
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
        minH="auto"
        h="auto"
      >
        {currentPosts.map((post, index) => (
          <GridItem
            key={post.id}
            w="100%"
            h="100%"
          >
            <PostCard
              post={post}
              index={index}
              cardBg={cardBg}
              textColor={textColor}
              mutedTextColor={mutedTextColor}
            />
          </GridItem>
        ))}
      </SimpleGrid>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo(0, 0);
          }}
          mutedTextColor={mutedTextColor}
        />
      )}
    </Container>
  );
}

export default HomePage;
