import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  HStack,
  Tag,
  TagLabel,
  useColorModeValue,
  useColorMode,
  Skeleton,
  IconButton,
  Flex,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import useBlogStore from '../../store/useBlogStore';

// Gradient color combinations for tags
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

const TAGS_CACHE_KEY = 'cachedTags';
const POSTS_CACHE_KEY = 'cachedPosts'; // Matches useBlogStore
const SHARED_CACHE_TIME_KEY = 'cacheTime'; // Matches useBlogStore

const TAGS_CACHE_EXPIRATION = 30 * 60 * 1000; // 30 minutes
const POSTS_CACHE_EXPIRATION = 10 * 60 * 1000; // 10 minutes, consistent with useBlogStore

const deriveTagsFromPosts = (postsData) => {
  if (!postsData || postsData.length === 0) return [];
  const tagsCount = {};
  postsData.forEach(post => {
    if (post.labels) {
      post.labels.forEach(label => {
        tagsCount[label] = (tagsCount[label] || 0) + 1;
      });
    }
  });
  return Object.entries(tagsCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
};

const TagsList = () => {
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const { posts, selectedTag, setSelectedTag } = useBlogStore();

  const { colorMode } = useColorMode();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const iconHoverBg = useColorModeValue('gray.100', 'gray.700');
  const scrollButtonBg = useColorModeValue('whiteAlpha.700', 'gray.800Alpha.700');
  const tagTextColor = 'white';

  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  const updateFadeVisibility = useCallback(() => {
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

  // Get unique tags from posts with counts
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

  useEffect(() => {
    if (tags.length > 0) {
      setLoading(false);
      setTimeout(updateFadeVisibility, 0);
    }
  }, [tags, updateFadeVisibility]);

  useEffect(() => {
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
  }, [loading, updateFadeVisibility]);

  if (loading) {
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
      bg={bgColor}
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
        <HStack spacing={4}>
          {tags.map((tag, index) => (
            <Tag
              key={tag.name}
              size="lg"
              borderRadius="full"
              variant="subtle"
              bgGradient={gradients[index % gradients.length]}
              color={tagTextColor}
              transition="all 0.2s"
              cursor="pointer"
              position="relative"
              my="2"
              px={6}
              py={2}
              onClick={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}
              opacity={selectedTag && selectedTag !== tag.name ? 0.6 : 1}
              transform={selectedTag === tag.name ? 'scale(1.05)' : 'scale(1)'}
            >
              <TagLabel
                fontSize="md"
                fontWeight="medium"
                pr="1.35rem"
                textTransform="uppercase"
              >
                {tag.name}
              </TagLabel>
              <Box
                as="span"
                display="block"
                alignItems="center"
                justifyContent="center"
                px="8px"
                py="4px"
                borderRadius="full"
                bg="whiteAlpha.400"
                fontSize="sm"
                lineHeight="1.5"
                fontWeight="small"
                position="absolute"
                right="0"
                height="100%"
                top="50%"
                transform="translateY(-50%)"
              >
                {tag.count}
              </Box>
            </Tag>
          ))}
        </HStack>
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
};

export default TagsList; 