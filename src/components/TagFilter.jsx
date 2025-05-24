import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Box, HStack, Tag, TagLabel, Skeleton, IconButton, useColorModeValue, Flex } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '@chakra-ui/icons';

const TagFilter = ({ posts, selectedTag, setSelectedTag, onOrderByChange }) => {
  const [orderBy, setOrderBy] = useState('published');

  const handleOrderByChange = (e) => {
    const value = e.target.value;
    setOrderBy(value);
    onOrderByChange(value);
  };

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
  const scrollRef = useRef(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);
  const bgColor = useColorModeValue('rgba(255,255,255,0.75)', 'rgba(26,32,44,0.75)');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const scrollButtonBg = useColorModeValue('whiteAlpha.700', 'gray.800Alpha.700');
  const tagTextColor = 'white';
  const [loadingTags, setLoadingTags] = useState(true);
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
  const tags = useMemo(() => {
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
      setLoadingTags(false);
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
      w="100%"
      p={4}
      mb={4}
      borderRadius="full"
      shadow="sm"
      position="sticky"
      top="70px"
      zIndex={10}
      bg={bgColor}
      borderBottomWidth="1px"
      borderColor={borderColor}
      boxShadow="sm"
      overflowX="auto"
      className="tags-list-container"
      style={{
        transition: 'box-shadow 0.2s',
        backdropFilter: 'blur(16px)',
      }}
      display="flex"
      alignItems="center"
      gap={4}
      _hover={{
        '.scroll-button': { opacity: 1, visibility: 'visible' }
      }}
    >
      <Box
        ref={scrollRef}
        overflowX="auto"
        whiteSpace="nowrap"
        borderRadius="full"
        css={{
          '&::-webkit-scrollbar': { display: 'none' },
          'scrollbarWidth': 'none',
          'willChange': 'scroll-position'
        }}
        zIndex={1}
        gap={3}
      >

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
            px={4}
            py={1}
            mr={2}
            onClick={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}
            opacity={selectedTag && selectedTag !== tag.name ? 0.6 : 1}
            transform={selectedTag === tag.name ? 'scale(1.03)' : 'scale(1)'}
          >
            <TagLabel
              fontSize="md"
              fontWeight="medium"
              pr="1.2rem"
              textTransform="uppercase"
              lineHeight="24px"
              height="24px"
            >
              {tag.name}
            </TagLabel>
            <Box
              height="32px"
              minWidth="32px"
              lineHeight="32px"
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
        left={0}
        top={0}
        bottom={0}
        width="120px"
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
        left={4}
        top="50%"
        transform="translateY(-50%)"
        zIndex={2}
        bg={scrollButtonBg}
        className="scroll-button"
        opacity={showLeftFade ? 1 : 0}
        visibility={showLeftFade ? 'visible' : 'hidden'}
        transition="opacity 0.2s ease-in-out, visibility 0.2s ease-in-out"
        borderRadius="full"
      />


      <Box
        position="absolute"
        right={0}
        top={0}
        bottom={0}
        width="120px"
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
        right={4}
        top="50%"
        transform="translateY(-50%)"
        zIndex={2}
        bg={scrollButtonBg}
        className="scroll-button"
        opacity={showRightFade ? 1 : 0}
        visibility={showRightFade ? 'visible' : 'hidden'}
        transition="opacity 0.2s ease-in-out, visibility 0.2s ease-in-out"
        borderRadius="full"
      />
    </Box>
  );
};

export default TagFilter; 