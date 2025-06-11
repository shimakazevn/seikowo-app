import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Text, Skeleton, useColorModeValue, Tag, useColorMode } from '@chakra-ui/react';
import { extractImage, optimizeThumbnail, getSlugFromUrl } from '../../utils/blogUtils';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/opacity.css';
// Removed IndexedDB dependency - using only cache service now

// Using theme secondary colors for consistent design

interface Post {
  slug?: string;
  url?: string;
  title: string;
  content?: string;
  thumbnail?: string;
  labels?: string[];
}

interface PostCardProps {
  post: Post;
  index: number;
  textColor?: string;
  mutedTextColor?: string;
  extraInfo?: string;
}

const PostCard: React.FC<PostCardProps> = ({ post, textColor, mutedTextColor, extraInfo }) => {
  const slug = post.slug || getSlugFromUrl(post.url || "");

  // Debug logging (commented out for production)
  // console.log('PostCard Debug:', { postTitle: post.title, postSlug: post.slug, finalSlug: slug });

  // Use simple thumbnail logic
  const thumbnail = post.thumbnail || (post.content ? extractImage(post.content) : null);



  // Dynamic colors based on theme - using secondary colors
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Theme-based colors using secondary colors
  const cardBorder = isDark ? '1px solid #333333' : '1px solid #e5e5e5';
  const cardShadow = isDark ? '0 4px 24px 0 rgba(0,0,0,0.4)' : '0 4px 24px 0 rgba(0,0,0,0.1)';
  const titleColor = isDark ? '#ffffff' : '#000000';
  const mutedColor = isDark ? '#b3b3b3' : '#666666';
  const gradientOverlay = isDark
    ? 'linear-gradient(to top, rgba(19,19,19,0.95) 0%, rgba(19,19,19,0.0) 100%)' // Updated to use #131313
    : 'linear-gradient(to top, rgba(244,244,244,0.95) 0%, rgba(244,244,244,0.0) 100%)'; // Updated to use #f4f4f4

  const thumb400 = thumbnail ? optimizeThumbnail(thumbnail, 400) : undefined;

  return (
    <Box
      borderWidth="0"
      borderRadius="2xl"
      boxShadow={cardShadow}
      bg={isDark ? 'secondary.dark' : 'secondary.light'}
      border={cardBorder}
      _hover={{
        boxShadow: isDark
          ? '0 12px 32px 0 rgba(0, 0, 0, 0.4)'
          : '0 12px 32px 0 rgba(0, 0, 0, 0.15)',
        transform: 'translateY(-4px)',
        borderColor: isDark ? '#404040' : '#c0c0c0',
        zIndex: 2,
      }}
      style={{
        transition: 'all 0.25s cubic-bezier(.4,2,.6,1)',
        cursor: 'pointer',
      }}
    >
      <Link to={`/${slug}.html`} style={{ display: 'block' }}>
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
            />
            {post.labels && post.labels[0] && (
              <Tag
                position="absolute"
                top={3}
                left={3}
                zIndex={2}
                bg={isDark ? 'secondary.dark' : 'secondary.light'}
                color={isDark ? '#ffffff' : '#000000'}
                border="1px solid"
                borderColor={isDark ? '#404040' : '#d0d0d0'}
                borderRadius="6px"
                fontWeight="500"
                px={3}
                py={1}
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wider"
                boxShadow={isDark ? '0 4px 12px 0 rgba(0,0,0,0.4)' : '0 4px 12px 0 rgba(0,0,0,0.1)'}
                _hover={{
                  bg: isDark ? '#404040' : '#d0d0d0',
                  color: isDark ? '#ffffff' : '#000000',
                  borderColor: isDark ? '#505050' : '#c0c0c0',
                }}
                transition="all 0.2s ease"
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
          bg={isDark ? 'secondary.dark' : 'secondary.light'}
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
            {post.title || 'Untitled'}
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
    </Box>
  );
};

export default PostCard;