import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, Text, Skeleton, useColorModeValue, Tag } from '@chakra-ui/react';
import { extractImage, optimizeThumbnail, getSlugFromUrl, getThumbnailBySlug } from '../../utils/blogUtils';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/opacity.css';

// Màu pastel cố định cho tag
const pastelColors = [
  '#BEE3F8', '#FED7E2', '#FEFCBF', '#C6F6D5', '#FEEBC8',
  '#B2F5EA', '#FED7D7', '#E9D8FD', '#FFF5F7', '#C6F6D5'
];

const PostCard = ({ post, index, cardBg, textColor, mutedTextColor, extraInfo, actionButton }) => {
  // Get cached posts from localStorage
  const cachedPosts = JSON.parse(localStorage.getItem('cachedPosts') || '[]');
  const slug = post.slug || getSlugFromUrl(post.url);
  // Use getThumbnailBySlug with fallback to existing logic
  const thumbnail = getThumbnailBySlug(cachedPosts, slug) || 
                   (post.thumbnail || (post.content ? extractImage(post.content) : null));

  // Color mode values (chỉ dùng cho card, không dùng cho tag)
  const cardBgColor = useColorModeValue('#f7f7fa', 'gray.800');
  const cardBorder = useColorModeValue('1.5px solid #e2e8f0', '1.5px solid #23272A');
  const cardShadow = useColorModeValue('0 2px 12px 0 rgba(0,0,0,0.08)', '0 4px 24px 0 rgba(0,0,0,0.25)');
  const titleColor = useColorModeValue('#23272A', '#fff');
  const mutedColor = useColorModeValue('#6B7280', '#b0b0b0');
  const gradientOverlay = useColorModeValue(
    'linear-gradient(to top, rgba(247,247,250,0.95) 0%, rgba(247,247,250,0.0) 100%)',
    'linear-gradient(to top, rgba(24,26,27,0.95) 0%, rgba(24,26,27,0.0) 100%)'
  );

  const thumb400 = thumbnail ? optimizeThumbnail(thumbnail, 400) : undefined;

  return (
    <Box
      my={4}
      borderWidth="0"
      borderRadius="2xl"
      boxShadow={cardShadow}
      bg={cardBg || cardBgColor}
      border={cardBorder}
      _hover={{
        boxShadow: '0 12px 32px 0 rgba(44, 132, 255, 0.18)',
        transform: 'scale(1.01)',
        zIndex: 2,
      }}
      style={{
        transition: 'all 0.25s cubic-bezier(.4,2,.6,1)',
        cursor: 'pointer',
      }}
    >
      <Link to={`/${slug}`} style={{ display: 'block' }}>
        <Box
          position="relative"
          paddingBottom="150%"
          overflow="hidden"
          borderTopLeftRadius="2xl"
          borderTopRightRadius="2xl"
          borderBottomLeftRadius="0"
          borderBottomRightRadius="0"
          mb={0}
        >
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            borderTopLeftRadius="2xl"
            borderTopRightRadius="2xl"
            overflow="hidden"
          >
            {!thumb400 && (
              <Skeleton width="100%" height="100%" borderTopLeftRadius="2xl" borderTopRightRadius="2xl" />
            )}
            <LazyLoadImage
              src={thumb400 || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjkwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iIzY2NiI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'}
              alt={post.title}
              width="100%"
              height="100%"
              effect="opacity"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'fill',
                objectPosition: 'center top',
                borderTopLeftRadius: '1rem',
                borderTopRightRadius: '1rem',
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
              wrapperClassName="chakra-image"
              placeholderSrc={undefined}
            />
            {post.labels && post.labels[0] && (
              <Tag
                position="absolute"
                top={3}
                left={3}
                zIndex={2}
                bg={pastelColors[index % pastelColors.length]}
                color="#23272A"
                borderRadius="full"
                fontWeight="bold"
                px={3}
                py={1}
                fontSize="sm"
                textTransform="uppercase"
                letterSpacing="wider"
                boxShadow="0 2px 8px 0 rgba(0,0,0,0.10)"
                style={{ borderRadius: '999px' }}
              >
                {post.labels[0]}
              </Tag>
            )}
            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              height="80px"
              background={gradientOverlay}
              pointerEvents="none"
              zIndex={1}
              borderBottomLeftRadius="0"
              borderBottomRightRadius="0"
            />
          </Box>
        </Box>
        <Box
          p={{ base: 2, sm: 3 }}
          h="auto"
          position="relative"
          borderBottomLeftRadius="2xl"
          borderBottomRightRadius="2xl"
          bg={cardBg || cardBgColor}
        >
          <Text
            className="content-heading"
            height="3rem"
            noOfLines={2}
            letterSpacing="tight"
            fontSize="md"
            fontWeight="medium"
            color={textColor || titleColor}
          >
            {post.title}
          </Text>
          {extraInfo && (
            <Text
              fontSize="xs"
              color={mutedTextColor || mutedColor}
              mt={1}
            >
              {extraInfo}
            </Text>
          )}
        </Box>
      </Link>
      {actionButton && (
        <Box px={{ base: 2, sm: 3 }} pb={{ base: 2, sm: 3 }}>
          {actionButton}
        </Box>
      )}
    </Box>
  );
};

export default PostCard; 