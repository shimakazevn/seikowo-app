import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Text, Image, Skeleton, Badge, HStack, VStack, Progress } from '@chakra-ui/react';
import { optimizeThumbnail, getThumbnailBySlug, extractImage } from '../../utils/blogUtils';
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
  totalPages
}) => {
  // Handle both post and item props
  const data = post || item;
  if (!data) return null;

  const { title, content, labels = [], slug } = data;
  
  // Get cached posts from localStorage
  const cachedPosts = JSON.parse(localStorage.getItem('cachedPosts') || '[]');

  // Try different methods to get thumbnail
  const thumbnailUrl = getThumbnailBySlug(cachedPosts, slug) || 
                      (content && extractImage(content)) ||
                      data.thumbnail; // Add direct thumbnail check
  const optimizedThumbnail = optimizeThumbnail(thumbnailUrl, 600);

  // Format bookmark page info
  const pageInfo = data.currentPage !== undefined && data.totalPages !== undefined
    ? `Trang ${data.currentPage + 1}/${data.totalPages}`
    : null;

  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={cardBg}
      _hover={{ 
        transform: 'translateY(-4px)',
        boxShadow: 'lg',
      }}
      style={{
        transition: 'all 0.3s ease'
      }}
    >
      <Link to={`/${slug}${data.currentPage !== undefined ? `?p=${data.currentPage + 1}` : ''}`}>
        <HStack spacing={4} p={4} align="start">
          {/* Thumbnail */}
          <Box 
            flexShrink={0}
            width="120px"
            height="160px"
            position="relative"
            overflow="hidden"
            borderRadius="md"
            bg="gray.100"
          >
            <Image
              src={optimizedThumbnail}
              alt={title}
              width="100%"
              height="100%"
              objectFit="cover"
              transition="transform 0.3s ease"
              _groupHover={{ transform: 'scale(1.05)' }}
              fallback={<Skeleton height="100%" width="100%" />}
            />
            {/* Labels */}
            {labels.length > 0 && (
              <Badge
                position="absolute"
                top={2}
                left={2}
                colorScheme="pink"
                variant="solid"
                fontSize="xs"
                textTransform="uppercase"
                px={2}
                py={1}
                borderRadius="full"
                opacity={0.9}
              >
                {labels[0]}
              </Badge>
            )}
          </Box>

          {/* Content */}
          <VStack 
            flex={1} 
            spacing={2} 
            align="start"
          >
            <Text
              fontSize="md"
              fontWeight="semibold"
              color={textColor}
              noOfLines={2}
            >
              {title}
            </Text>

            {/* Time Info */}
            {timestamp && timestampLabel && (
              <Text fontSize="sm" color={mutedTextColor}>
                {timestampLabel}: {new Date(timestamp).toLocaleString('vi-VN')}
              </Text>
            )}

            {/* Reading Progress */}
            {pageInfo && (
              <Box width="100%">
                <Text fontSize="sm" color={mutedTextColor} mb={1}>
                  {pageInfo}
                </Text>
                <Progress 
                  value={(data.currentPage + 1) / data.totalPages * 100} 
                  size="sm" 
                  colorScheme="pink" 
                  borderRadius="full"
                />
              </Box>
            )}

            {/* Legacy Time Info */}
            {data.readAt && !timestamp && (
              <Text fontSize="sm" color={mutedTextColor}>
                Đọc lúc: {new Date(data.readAt).toLocaleString('vi-VN')}
              </Text>
            )}
            {data.followAt && !timestamp && (
              <Text fontSize="sm" color={mutedTextColor}>
                Follow lúc: {new Date(data.followAt).toLocaleString('vi-VN')}
              </Text>
            )}

            {/* Action Button */}
            {actionButton && (
              <Box mt={2} width="100%">
                {actionButton}
              </Box>
            )}
          </VStack>
        </HStack>
      </Link>
    </MotionBox>
  );
};

export default HistoryCard; 