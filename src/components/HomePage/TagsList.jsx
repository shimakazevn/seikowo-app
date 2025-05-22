import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  HStack,
  Tag,
  TagLabel,
  TagRightIcon,
  useColorModeValue,
  useColorMode,
  Skeleton,
  IconButton,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import useBlogStore from '../../store/useBlogStore'; // Import the store

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
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const { colorMode } = useColorMode(); // Get current color mode
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const iconHoverBg = useColorModeValue('gray.100', 'gray.700');
  const scrollButtonBg = useColorModeValue('whiteAlpha.700', 'gray.800Alpha.700');
  const tagTextColor = 'white'; // Set to white for both modes


  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  const { fetchPosts: fetchPostsFromStore } = useBlogStore();

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

  useEffect(() => {
    const fetchAndSetTags = async () => {
      setLoading(true);
      let derivedTags = [];

      // Try loading tags from their own cache first
      const cachedTagsData = localStorage.getItem(TAGS_CACHE_KEY);
      const cacheTimestamp = localStorage.getItem(SHARED_CACHE_TIME_KEY);
      let cacheTime = cacheTimestamp ? parseInt(cacheTimestamp) : 0;

      if (cachedTagsData && cacheTime && (Date.now() - cacheTime < TAGS_CACHE_EXPIRATION)) {
        try {
          derivedTags = JSON.parse(cachedTagsData);
        } catch (e) {
          console.error("Failed to parse cached tags", e);
          localStorage.removeItem(TAGS_CACHE_KEY); // Clear corrupted cache
        }
      }

      // If tags cache is not valid, try deriving from posts cache
      if (derivedTags.length === 0) {
        const cachedPostsData = localStorage.getItem(POSTS_CACHE_KEY);
        // Use POSTS_CACHE_EXPIRATION for posts cache check
        if (cachedPostsData && cacheTime && (Date.now() - cacheTime < POSTS_CACHE_EXPIRATION)) {
          try {
            const posts = JSON.parse(cachedPostsData);
            derivedTags = deriveTagsFromPosts(posts);
            if (derivedTags.length > 0) {
              localStorage.setItem(TAGS_CACHE_KEY, JSON.stringify(derivedTags));
              // No need to update SHARED_CACHE_TIME_KEY here, posts cache is still the source of truth for its timestamp
            }
          } catch (e) {
            console.error("Failed to parse cached posts for tags", e);
            localStorage.removeItem(POSTS_CACHE_KEY); // Clear corrupted cache
          }
        }
      }

      // If still no tags, fetch posts from store, then derive
      if (derivedTags.length === 0) {
        await fetchPostsFromStore(); // This will update localStorage for posts
        const updatedPostsData = localStorage.getItem(POSTS_CACHE_KEY); // Read fresh posts
        if (updatedPostsData) {
          try {
            const posts = JSON.parse(updatedPostsData);
            derivedTags = deriveTagsFromPosts(posts);
            if (derivedTags.length > 0) {
              localStorage.setItem(TAGS_CACHE_KEY, JSON.stringify(derivedTags));
              localStorage.setItem(SHARED_CACHE_TIME_KEY, Date.now().toString()); // Update timestamp as we've "refreshed" tags based on new posts
            }
          } catch (e) {
            console.error("Failed to parse newly fetched posts for tags", e);
          }
        }
      }
      
      setTags(derivedTags);
      setLoading(false);
      setTimeout(updateFadeVisibility, 0);
    };

    fetchAndSetTags();
  }, [updateFadeVisibility, fetchPostsFromStore]);

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

    let timerId; // Declare timerId here to be accessible in cleanup

    if (scrollableElement) {
      scrollableElement.scrollLeft = 0; // Explicitly set initial scrollLeft
      scrollableElement.addEventListener('wheel', handleWheelScroll, { passive: false });
      scrollableElement.addEventListener('scroll', handleScrollEvent);
      timerId = setTimeout(updateFadeVisibility, 0);
    }
    return () => {
      if (scrollableElement) {
        scrollableElement.removeEventListener('wheel', handleWheelScroll);
        scrollableElement.removeEventListener('scroll', handleScrollEvent);
      }
      if (typeof timerId !== 'undefined') {
        clearTimeout(timerId);
      }
    };
  }, [loading, updateFadeVisibility]);

  if (loading && tags.length === 0) { // Show skeleton only if really loading and no tags yet
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
  
  if (!loading && tags.length === 0) { // If not loading and no tags, maybe show a message or nothing
    return null; // Or <Text>No tags available</Text>
  }

  const fadeCommonStyles = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '60px',
    pointerEvents: 'none',
    transition: 'opacity 0.1s ease-in-out',
    zIndex: 1,
  };

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
        sx={fadeCommonStyles}
        left={0}
        opacity={showLeftFade ? 1 : 0}
        bgGradient={`linear(to-r, ${bgColor}, transparent)`}
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
        <HStack spacing={3} >
          {tags.map((tag, index) => (
            <Link key={tag.name} to={`/tag/${encodeURIComponent(tag.name)}`}>
              <Tag
                size="md"
                borderRadius="full"
                variant="subtle"
                bgGradient={gradients[index % gradients.length]}
                color={tagTextColor}
                transition="all 0.2s"
                cursor="pointer"
                position="relative"
                my="1"
              >
                <TagLabel 
                  fontSize="sm" 
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
                  px="6px"
                  py="3px"
                  borderRadius="full" 
                  bg="whiteAlpha.400"
                  fontSize="xs" 
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
            </Link>
          ))}
        </HStack>
      </Box>
      <Box
        sx={fadeCommonStyles}
        right={0}
        opacity={showRightFade ? 1 : 0}
        bgGradient={`linear(to-l, ${bgColor}, transparent)`}
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