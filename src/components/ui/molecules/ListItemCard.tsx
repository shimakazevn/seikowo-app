import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Text, Image, Skeleton, Badge, HStack, VStack, Progress } from '@chakra-ui/react';
import { optimizeThumbnail, getThumbnailBySlug, extractImage, getSlugFromUrl } from '../utils/blogUtils';
import { motion } from 'framer-motion';
import { getDataFromDB } from '../utils/indexedDBUtils';
import { Post } from '../types/global';

const MotionBox = motion(Box);

interface LocalHistoryItem {
  id?: string;
  title?: string;
  url?: string;
  currentPage?: number;
  totalPages?: number;
  followAt?: string;
  timestamp?: string | number;
  thumbnail?: string;
  labels?: string[];
  content?: string;
  slug?: string;
}

interface HistoryCardProps {
  post?: LocalHistoryItem;
  item?: LocalHistoryItem;
  index?: number;
  cardBg: string;
  textColor: string;
  mutedTextColor: string;
  actionButton?: React.ReactNode;
  timestamp?: string;
  timestampLabel?: string;
  currentPage?: number;
  totalPages?: number;
  isUpdated?: boolean;
  formatTime?: (timestamp: string | number) => string;
}

const HistoryCard: React.FC<HistoryCardProps> = ({
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
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cachedPosts, setCachedPosts] = useState<Post[]>([]);

  // Handle both post and item props
  const data = post || item;
  if (!data) return null;

  const { title, content, labels = [], slug, url } = data;

  useEffect(() => {
    const loadCachedPosts = async () => {
      try {
        const posts = await getDataFromDB('cache', 'posts') || [];
        setCachedPosts(posts as any);
      } catch (error: any) {
        console.error('Error loading cached posts:', error);
        setCachedPosts([]);
      }
    };
    loadCachedPosts();
  }, []);

  const getThumbnail = (): string => {
    // 1. Try to get from data directly first (highest priority)
    if (data.thumbnail) {
      const optimized = optimizeThumbnail(data.thumbnail, 600);
      if (optimized) return optimized;
    }

    // 2. Try to extract from content
    if (content) {
      const extractedImage = extractImage(content);
      if (extractedImage) {
        const optimized = optimizeThumbnail(extractedImage, 600);
        if (optimized) return optimized;
      }
    }

    // 3. Try to get from URL directly
    if (url) {
      // Try to get thumbnail from Blogger URL
      const blogUrl = new URL(url);
      const pathParts = blogUrl.pathname.split('/');
      const postId = pathParts[pathParts.length - 1];

      // Try to construct Blogger image URL
      const possibleThumbnail = `https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsE${postId}/s600`;
      const optimized = optimizeThumbnail(possibleThumbnail, 600);
      if (optimized) return optimized;
    }

    // 4. Try to get from cached posts using multiple identifiers
    if (cachedPosts.length > 0) {
      const cachedPost = cachedPosts.find(cp =>
        (data.id && cp.id === data.id) ||
        (slug && cp.slug === slug) ||
        (url && cp.slug === getSlugFromUrl(url))
      );

      if ((cachedPost as any)?.thumbnail) {
        const optimized = optimizeThumbnail((cachedPost as any).thumbnail, 600);
        if (optimized) return optimized;
      }
    }

    // 5. Try to get thumbnail using the utility function
    if ((slug || url) && cachedPosts.length > 0) {
      const targetSlug = slug || (url ? getSlugFromUrl(url) : '');
      if (targetSlug) {
        const thumbnailFromSlug = getThumbnailBySlug(cachedPosts, targetSlug);
        if (thumbnailFromSlug) {
          const optimized = optimizeThumbnail(thumbnailFromSlug, 600);
          if (optimized) return optimized;
        }
      }
    }

    // 6. Return a default image if nothing else works
    return 'https://source.unsplash.com/600x400/?anime';
  };

  useEffect(() => {
    const thumbnail = getThumbnail();
    setThumbnailUrl(thumbnail);
    setIsLoading(false);
  }, [data, content, url, slug, cachedPosts]);

  // Format bookmark page info
  const pageInfo = data.currentPage !== undefined && data.totalPages !== undefined
    ? `Tiến độ ${data.currentPage + 1}/${data.totalPages}`
    : null;

  // Format timestamp
  const displayTime = timestamp || (data.followAt || data.timestamp);
  const timeLabel = timestampLabel || 'Theo dõi';

  // Get the correct URL for the link
  const getPostUrl = (): string => {
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
          {isLoading ? (
            <Skeleton height="200px" />
          ) : thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title || 'No title'}
              borderRadius="md"
              objectFit="cover"
              width="100%"
              height="200px"
              fallback={<Skeleton height="200px" />}
              onError={(e) => {
                // If image fails to load, try to get a new one
                const newThumbnail = getThumbnail();
                if (newThumbnail !== thumbnailUrl) {
                  setThumbnailUrl(newThumbnail);
                }
              }}
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
                {labels.map((label, index: number) => (
                  <Badge key={index} colorScheme="blue" variant="subtle">
                    {label}
                  </Badge>
                ))} </HStack>
            )}

            {pageInfo && (
              <Box>
                <Text fontSize="sm" color={mutedTextColor} mb={1}>
                  {pageInfo}
                </Text>
                <Progress
                  value={(data.currentPage || 0) / (data.totalPages || 1) * 100}
                  size="sm"
                  colorScheme="blue"
                  borderRadius="full"
                />
              </Box>
            )}

            {displayTime && (
              <Text fontSize="sm" color={mutedTextColor}>
                {timeLabel}: {formatTime ? formatTime(displayTime) : new Date(displayTime).toLocaleDateString()} </Text>
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