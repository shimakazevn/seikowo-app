import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  useToast,
  HStack,
  Skeleton,
  Tag,
  TagLabel,
  TagCloseButton
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, RepeatIcon, StarIcon } from '@chakra-ui/icons';
import { motion, isValidMotionProp, AnimatePresence } from 'framer-motion';
import 'react-lazy-load-image-component/src/effects/blur.css';
import 'react-lazy-load-image-component/src/effects/opacity.css';
import PostCard from '../components/HomePage/PostCard';
import SkeletonCard from '../components/HomePage/SkeletonCard';
import Pagination from '../components/HomePage/Pagination';
import { gridConfig, extractImage, optimizeThumbnail } from '../utils/blogUtils';
import useBlogStore from '../store/useBlogStore';
import { useSwipeable } from 'react-swipeable';

const MotionBox = motion.create(Box, {
  shouldInheritVariant: true,
  filterProps: (prop) => !isValidMotionProp(prop)
});

function TagList({ posts, selectedTag, setSelectedTag }) {
  const gradients = [
    'linear(to-r, teal.500, green.500)',
    'linear(to-r, blue.500, purple.500)',
    'linear(to-r, pink.500, red.500)',
    'linear(to-r, orange.500, red.500)',
    'linear(to-r, purple.500, pink.500)',
    'linear(to-r, yellow.500, orange.500)',
    'linear(to-r, cyan.500, blue.500)',
    'linear(to-r, green.500, teal.500)',
    'linear(to-r, red.500, pink.500)',
    'linear(to-r, blue.500, cyan.500)'
  ];
  const scrollRef = React.useRef(null);
  const [showLeftFade, setShowLeftFade] = React.useState(false);
  const [showRightFade, setShowRightFade] = React.useState(true);
  const bgColor = useColorModeValue('white', 'gray.800');
  const iconHoverBg = useColorModeValue('gray.100', 'gray.700');
  const scrollButtonBg = useColorModeValue('whiteAlpha.700', 'gray.800Alpha.700');
  const tagTextColor = 'white';
  const [loadingTags, setLoadingTags] = React.useState(true);
  const updateFadeVisibility = React.useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setShowLeftFade(scrollLeft > 5);
      setShowRightFade(scrollWidth - scrollLeft - clientWidth > 5);
    }
  }, []);
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  const tags = React.useMemo(() => {
    const tagsCount = {};
    posts.forEach(post => {
      if (post.labels) {
        post.labels.forEach(label => {
          tagsCount[label] = (tagsCount[label] || 0) + 1;
        });
      }
    });
    return Object.entries(tagsCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [posts]);
  React.useEffect(() => {
    if (tags.length > 0) {
      setLoadingTags(false);
      setTimeout(updateFadeVisibility, 0);
    }
  }, [tags, updateFadeVisibility]);
  React.useEffect(() => {
    const scrollableElement = scrollRef.current;
    const scrollMultiplier = 3;
    const handleWheelScroll = (event) => {
      if (scrollableElement && (event.deltaY !== 0 || event.deltaX !== 0)) {
        event.preventDefault();
        scrollableElement.scrollBy({
          left: (event.deltaY + event.deltaX) * scrollMultiplier,
          behavior: 'smooth'
        });
      }
    };
    const handleScrollEvent = () => {
      requestAnimationFrame(updateFadeVisibility);
    };
    if (scrollableElement) {
      scrollableElement.scrollLeft = 0;
      scrollableElement.addEventListener('wheel', handleWheelScroll, { passive: false });
      scrollableElement.addEventListener('scroll', handleScrollEvent);
    }
    return () => {
      if (scrollableElement) {
        scrollableElement.removeEventListener('wheel', handleWheelScroll);
        scrollableElement.removeEventListener('scroll', handleScrollEvent);
      }
    };
  }, [loadingTags, updateFadeVisibility]);
  if (loadingTags) {
    return (
      <Box py={3} px={4} mb={4} bg={bgColor} borderRadius="sm" shadow="sm">
        <HStack spacing={3}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height="24px" width="100px" borderRadius="full" />
          ))}
        </HStack>
      </Box>
    );
  }
  if (tags.length === 0) return null;
  return (
    <Box
      py={3}
      px={0}
      mb={4}
      borderRadius="lg"
      shadow="sm"
      position="relative"
      className="tags-list-container"
      overflow="hidden"
      _hover={{
        '.scroll-button': { opacity: 1, visibility: 'visible' }
      }}
    >
      <Box
        position="absolute"
        left={0}
        top={0}
        bottom={0}
        width="60px"
        pointerEvents="none"
        opacity={showLeftFade ? 1 : 0}
        bgGradient={`linear(to-r, ${bgColor}, transparent)`}
        transition="opacity 0.1s ease-in-out"
        zIndex={1}
      />
      <IconButton
        icon={<ChevronLeftIcon />}
        onClick={() => scroll('left')}
        variant="ghost"
        size="sm"
        position="absolute"
        left={1}
        top="50%"
        transform="translateY(-50%)"
        zIndex={2}
        bg={scrollButtonBg}
        _hover={{ bg: iconHoverBg }}
        className="scroll-button"
        opacity={0}
        visibility="hidden"
        transition="opacity 0.2s ease-in-out, visibility 0.2s ease-in-out"
      />
      <Box
        ref={scrollRef}
        overflowX="auto"
        whiteSpace="nowrap"
        css={{
          '&::-webkit-scrollbar': { display: 'none' },
          'scrollbarWidth': 'none',
          'willChange': 'scroll-position'
        }}
        px={10}
      >
        {tags.map((tag, index) => (
          <Tag
            key={tag.name}
            size="md"
            borderRadius="full"
            variant="subtle"
            bgGradient={gradients[index % gradients.length]}
            color={tagTextColor}
            transition="all 0.2s"
            cursor="pointer"
            position="relative"
            my="1"
            mx=".25rem"
            px={2.5}
            onClick={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}
            opacity={selectedTag && selectedTag !== tag.name ? 0.6 : 1}
            transform={selectedTag === tag.name ? 'scale(1.03)' : 'scale(1)'}
            overflow="hidden"
          >
            <TagLabel
              fontSize="sm"
              fontWeight="medium"
              pr="1.2rem"
              textTransform="uppercase"
              lineHeight="24px"
              height="24px"
            >
              {tag.name}
            </TagLabel>
            <Box
              height="24px"
              minWidth="25px"
              lineHeight="24px"
              textAlign="center"
              as="span"
              display="block"
              borderRadius="full"
              bg="whiteAlpha.300"
              fontSize="xs"
              fontWeight="small"
              position="absolute"
              right="0"
              top="50%"
              transform="translateY(-50%)"
            >
              {tag.count}
            </Box>
          </Tag>
        ))}
      </Box>
      <Box
        position="absolute"
        right={0}
        top={0}
        bottom={0}
        width="60px"
        pointerEvents="none"
        opacity={showRightFade ? 1 : 0}
        bgGradient={`linear(to-l, ${bgColor}, transparent)`}
        transition="opacity 0.1s ease-in-out"
        zIndex={1}
      />
      <IconButton
        icon={<ChevronRightIcon />}
        onClick={() => scroll('right')}
        variant="ghost"
        size="sm"
        position="absolute"
        right={1}
        top="50%"
        transform="translateY(-50%)"
        zIndex={2}
        bg={scrollButtonBg}
        _hover={{ bg: iconHoverBg }}
        className="scroll-button"
        opacity={0}
        visibility="hidden"
        transition="opacity 0.2s ease-in-out, visibility 0.2s ease-in-out"
      />
    </Box>
  );
}

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
    getFilteredPosts,
    selectedTag,
    setSelectedTag,
  } = useBlogStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);

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

  // Get filtered posts
  const filteredPosts = getFilteredPosts();
  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
  const currentPosts = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTag]);

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
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    const preloadImage = (src, priority = false, retryCount = 0) => {
      return new Promise((resolve) => {
        const img = new window.Image();
        
        if (priority) {
          img.fetchPriority = "high";
          img.loading = "eager";
        } else {
          img.loading = "lazy";
        }

        img.onload = () => {
          if (isMounted) {
            imageLoadingMap.set(src, true);
            resolve(true);
          }
        };

        img.onerror = () => {
          if (isMounted && retryCount < maxRetries) {
            // Retry loading after delay
            setTimeout(() => {
              preloadImage(src, priority, retryCount + 1);
            }, retryDelay * (retryCount + 1));
          } else {
            imageLoadingMap.set(src, true); // Mark as loaded even if failed
            resolve(false);
          }
        };

        img.src = src;
        preloadContainer.appendChild(img);
      });
    };

    const checkAllImagesLoaded = () => {
      if (!isMounted) return;
      const allLoaded = Array.from(imageLoadingMap.values()).every(status => status);
      if (allLoaded && preloadContainer.parentNode) {
        preloadContainer.parentNode.removeChild(preloadContainer);
      }
    };

    const preloadImages = async () => {
      const imagePromises = [];

      currentPosts.forEach((post, index) => {
        // Get both content image and optimized thumbnail
        const contentImage = post.content ? post.content.match(/<img[^>]+src="([^"]+)"/)?.[1] : null;
        const thumbnail = post.thumbnail || (post.content ? extractImage(post.content) : null);
        const optimizedThumbnail = thumbnail ? optimizeThumbnail(thumbnail, 600) : null;

        if (optimizedThumbnail) {
          imageLoadingMap.set(optimizedThumbnail, false);
          // First 6 images get high priority
          const isPriority = index < 6;
          imagePromises.push(preloadImage(optimizedThumbnail, isPriority));
        }

        if (contentImage && contentImage !== thumbnail) {
          imageLoadingMap.set(contentImage, false);
          imagePromises.push(preloadImage(contentImage, false));
        }
      });

      await Promise.all(imagePromises);
      checkAllImagesLoaded();
    };

    preloadImages();

    return () => {
      isMounted = false;
      if (preloadContainer.parentNode) {
        preloadContainer.parentNode.removeChild(preloadContainer);
      }
    };
  }, [currentPosts, loading]);

  useEffect(() => {
    document.title = selectedTag ? `Tag: ${selectedTag}` : "Trang chủ";
  }, [selectedTag]);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentPage < totalPages) {
        setSwipeDirection("left");
        setCurrentPage(prev => prev + 1);
        window.scrollTo(0, 0);
      }
    },
    onSwipedRight: () => {
      if (currentPage > 1) {
        setSwipeDirection("right");
        setCurrentPage(prev => prev - 1);
        window.scrollTo(0, 0);
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });

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
      <TagList posts={posts} selectedTag={selectedTag} setSelectedTag={setSelectedTag} />
      <Flex 
        justify="space-between"
        flexDirection="row"
        gap={{ base: 2, md: 0 }}
      >
        <Flex align="center" gap={2} justify="flex-start" w="auto" mb={4}>
          <Heading as="h3" size={{ base: "sm", md: "md" }} display="flex" alignItems="center" fontWeight="bold">
            {selectedTag ? `Tag: ${selectedTag}` : 'Bài viết mới nhất'}
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

        {totalPages > 1 && (
          <Flex align="center" gap={2} justify="flex-end" w="auto" mb={4}>
            <IconButton
              icon={<ChevronLeftIcon />}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              isDisabled={currentPage === 1}
              display={{ base: 'none', md: 'flex' }}
            />
            <Text fontSize="sm" mr={1} color={mutedTextColor}>
              Trang {currentPage}/{totalPages}
            </Text>
            <IconButton
              icon={<ChevronRightIcon />}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              isDisabled={currentPage === totalPages}
              display={{ base: 'none', md: 'flex' }}
            />
          </Flex>
        )}
      </Flex>

      <Box {...handlers}>
        <AnimatePresence initial={false} mode="wait">
          <MotionBox
            key={currentPage}
            initial={{ 
              opacity: 0,
              scale: 0.98
            }}
            animate={{ 
              opacity: 1,
              scale: 1
            }}
            exit={{ 
              opacity: 0,
              scale: 0.98
            }}
            transition={{ 
              duration: 0.15,
              ease: "easeOut"
            }}
            style={{
              width: "100%",
              willChange: "transform"
            }}
          >
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
          </MotionBox>
        </AnimatePresence>
      </Box>

      {currentPosts.length === 0 && (
        <Text color={mutedTextColor} textAlign="center" py={8}>
          {selectedTag ? `Không có bài viết nào với tag "${selectedTag}"` : 'Không có bài viết nào'}
        </Text>
      )}
    </Container>
  );
}

export default HomePage;
