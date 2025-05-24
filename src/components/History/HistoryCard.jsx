import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Text, Image, Skeleton, Badge, HStack, VStack, Progress } from '@chakra-ui/react';
import { optimizeThumbnail, getThumbnailBySlug, extractImage, getSlugFromUrl } from '../../utils/blogUtils';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const HistoryCard = ({ 
  post, 
  item, 
  index, 
  cardBg, 
  textColor, 
  mutedTextColor, 
  actionButton,
  timestamp,
  timestampLabel,
  currentPage,
  totalPages,
  isUpdated,
  formatTime
}) => {
  // Handle both post and item props
  const data = post || item;
  if (!data) return null;

  const { title, content, labels = [], slug, url } = data;
  
  // Get cached posts from localStorage
  const cachedPosts = JSON.parse(localStorage.getItem('cachedPosts') || '[]');

  // Try different methods to get thumbnail
  let thumbnailUrl = null;
  
  // 1. Try to get from cached posts by ID
  if (data.id) {
    const cachedPost = cachedPosts.find(cp => cp.id === data.id);
    if (cachedPost?.thumbnail) {
      thumbnailUrl = cachedPost.thumbnail;
    }
  }

  // 2. Try to get from cached posts by slug
  if (!thumbnailUrl && slug) {
    const cachedPost = cachedPosts.find(cp => cp.slug === slug);
    if (cachedPost?.thumbnail) {
      thumbnailUrl = cachedPost.thumbnail;
    }
  }

  // 3. Try to get from cached posts by URL
  if (!thumbnailUrl && url) {
    const urlSlug = getSlugFromUrl(url);
    const cachedPost = cachedPosts.find(cp => cp.slug === urlSlug);
    if (cachedPost?.thumbnail) {
      thumbnailUrl = cachedPost.thumbnail;
    }
  }

  // 4. Try to get from content
  if (!thumbnailUrl && content) {
    thumbnailUrl = extractImage(content);
  }

  // 5. Try to get from data directly
  if (!thumbnailUrl && data.thumbnail) {
    thumbnailUrl = data.thumbnail;
  }

  const optimizedThumbnail = thumbnailUrl ? optimizeThumbnail(thumbnailUrl, 600) : null;

  // Format bookmark page info
  const pageInfo = data.currentPage !== undefined && data.totalPages !== undefined
    ? `Tiến độ ${data.currentPage + 1}/${data.totalPages}`
    : null;

  // Format timestamp
  const displayTime = timestamp || (data.followAt || data.timestamp);
  const timeLabel = timestampLabel || 'Theo dõi';

  // Get the correct URL for the link
  const getPostUrl = () => {
    if (url) return url;
    if (slug) return `/${slug}`;
    if (data.id) {
      const cachedPost = cachedPosts.find(cp => cp.id === data.id);
      if (cachedPost?.url) return cachedPost.url;
      if (cachedPost?.slug) return `/${cachedPost.slug}`;
    }
    return '/';
  };

  return (
    <MotionBox
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={getPostUrl()}>
        <Box
          bg={cardBg}
          p={4}
          rounded="lg"
          shadow="sm"
          height="100%"
          display="flex"
          flexDirection="column"
        >
          {optimizedThumbnail ? (
            <Image
              src={optimizedThumbnail}
              alt={title}
              borderRadius="md"
              objectFit="cover"
              width="100%"
              height="200px"
              fallback={<Skeleton height="200px" />}
            />
          ) : (
            <Skeleton height="200px" />
          )}

          <VStack align="stretch" mt={4} spacing={2} flex={1}>
            <Text
              fontSize="lg"
              fontWeight="semibold"
              color={textColor}
              noOfLines={2}
              lineHeight="1.4"
            >
              {title || 'Không có tiêu đề'}
            </Text>

            {labels && labels.length > 0 && (
              <HStack spacing={2} wrap="wrap">
                {labels.map((label, index) => (
                  <Badge key={index} colorScheme="blue" variant="subtle">
                    {label}
                  </Badge>
                ))}
              </HStack>
            )}

            {pageInfo && (
              <Box>
                <Text fontSize="sm" color={mutedTextColor} mb={1}>
                  {pageInfo}
                </Text>
                <Progress
                  value={(data.currentPage / data.totalPages) * 100}
                  size="sm"
                  colorScheme="blue"
                  borderRadius="full"
                />
              </Box>
            )}

            {displayTime && (
              <Text fontSize="sm" color={mutedTextColor}>
                {timeLabel}: {formatTime ? formatTime(displayTime) : new Date(displayTime).toLocaleDateString()}
              </Text>
            )}

            {isUpdated && (
              <Badge colorScheme="green" alignSelf="flex-start">
                Có cập nhật mới
              </Badge>
            )}

            {actionButton}
          </VStack>
        </Box>
      </Link>
    </MotionBox>
  );
};

export default HistoryCard; 