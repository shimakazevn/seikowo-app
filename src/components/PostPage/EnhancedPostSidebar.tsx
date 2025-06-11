import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  Button,
  Avatar,
  Flex,
  useColorModeValue,
  Progress,
  CircularProgress,
  CircularProgressLabel,
  Tooltip,
  IconButton,
} from '@chakra-ui/react';
import { 
  FaBookmark, 
  FaHeart, 
  FaShare, 
  FaEye, 
  FaClock, 
  FaCalendarAlt,
  FaTag,
  FaUser,
  FaChartLine,
  FaThumbsUp,
  FaComment
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const MotionBox = motion(Box);

interface PostStats {
  likes: number;
  comments: number;
  bookmarks: number;
  readingTime: number;
  publishedDate: string;
}

interface EnhancedPostSidebarProps {
  stats: PostStats;
  tags: string[];
  author: string;
  relatedPosts?: any[];
  onBookmark?: () => void;
  onShare?: () => void;
  isBookmarked?: boolean;
}

const EnhancedPostSidebar: React.FC<EnhancedPostSidebarProps> = ({
  stats,
  tags,
  author,
  relatedPosts = [],
  onBookmark,
  onShare,
  isBookmarked = false,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('rgba(255,255,255,0.8)', 'rgba(26,32,44,0.8)');

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // Calculate engagement rate (mock calculation)
  const engagementRate = Math.round(((stats.likes + stats.comments) / Math.max(stats.views, 1)) * 100);

  return (
    <VStack spacing={6} align="stretch">
      {/* Quick Actions */}
      <MotionBox
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box
          bg={bgColor}
          borderRadius="xl"
          p={6}
          border="1px solid"
          borderColor={borderColor}
          boxShadow="lg"
        >
          <Text fontWeight="700" mb={4} color={textColor}>
            Tương tác
          </Text>
          <VStack spacing={3}>
            <Button
              leftIcon={<FaBookmark />}
              colorScheme={isBookmarked ? "orange" : "gray"}
              variant={isBookmarked ? "solid" : "outline"}
              size="lg"
              w="100%"
              onClick={onBookmark}
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}
              transition="all 0.2s"
            >
              {isBookmarked ? 'Đã lưu' : 'Lưu bài'}
            </Button>

            <Button
              leftIcon={<FaShare />}
              colorScheme="blue"
              variant="outline"
              size="lg"
              w="100%"
              onClick={onShare}
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}
              transition="all 0.2s"
            >
              Chia sẻ
            </Button>
          </VStack>
        </Box>
      </MotionBox>

      {/* Post Statistics */}
      <MotionBox
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Box
          bg={bgColor}
          borderRadius="xl"
          p={6}
          border="1px solid"
          borderColor={borderColor}
          boxShadow="lg"
        >
          <HStack justify="space-between" mb={4}>
            <Text fontWeight="700" color={textColor}>
              Thống kê
            </Text>
            <CircularProgress
              value={engagementRate}
              size="40px"
              color="blue.400"
              thickness="8px"
            >
              <CircularProgressLabel fontSize="xs" fontWeight="bold">
                {engagementRate}%
              </CircularProgressLabel>
            </CircularProgress>
          </HStack>

          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <HStack spacing={2}>
                <FaThumbsUp color={mutedColor} />
                <Text fontSize="sm" color={mutedColor}>Lượt thích</Text>
              </HStack>
              <Badge colorScheme="red" variant="subtle" px={3} py={1} borderRadius="full">
                {formatNumber(stats.likes)}
              </Badge>
            </HStack>

            <HStack justify="space-between">
              <HStack spacing={2}>
                <FaComment color={mutedColor} />
                <Text fontSize="sm" color={mutedColor}>Bình luận</Text>
              </HStack>
              <Badge colorScheme="green" variant="subtle" px={3} py={1} borderRadius="full">
                {formatNumber(stats.comments)}
              </Badge>
            </HStack>

            <HStack justify="space-between">
              <HStack spacing={2}>
                <FaClock color={mutedColor} />
                <Text fontSize="sm" color={mutedColor}>Thời gian đọc</Text>
              </HStack>
              <Badge colorScheme="purple" variant="subtle" px={3} py={1} borderRadius="full">
                {stats.readingTime} phút
              </Badge>
            </HStack>

            <Divider />

            <HStack justify="space-between">
              <HStack spacing={2}>
                <FaCalendarAlt color={mutedColor} />
                <Text fontSize="sm" color={mutedColor}>Ngày đăng</Text>
              </HStack>
              <Text fontSize="sm" fontWeight="600" color={textColor}>
                {formatDate(stats.publishedDate)}
              </Text>
            </HStack>
          </VStack>
        </Box>
      </MotionBox>

      {/* Author Info */}
      <MotionBox
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Box
          bg={bgColor}
          borderRadius="xl"
          p={6}
          border="1px solid"
          borderColor={borderColor}
          boxShadow="lg"
        >
          <Text fontWeight="700" mb={4} color={textColor}>
            Tác giả
          </Text>
          <VStack spacing={4}>
            <Avatar
              size="xl"
              name={author}
              bg="blue.500"
              color="white"
              icon={<FaUser />}
            />
            <VStack spacing={1}>
              <Text fontWeight="600" color={textColor}>
                {author}
              </Text>
              <Text fontSize="sm" color={mutedColor}>
                Content Creator
              </Text>
            </VStack>
            <Button
              size="sm"
              colorScheme="blue"
              variant="outline"
              w="100%"
              _hover={{
                transform: 'translateY(-1px)',
                boxShadow: 'md',
              }}
              transition="all 0.2s"
            >
              Theo dõi
            </Button>
          </VStack>
        </Box>
      </MotionBox>

      {/* Tags */}
      {tags.length > 0 && (
        <MotionBox
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Box
            bg={bgColor}
            borderRadius="xl"
            p={6}
            border="1px solid"
            borderColor={borderColor}
            boxShadow="lg"
          >
            <HStack spacing={2} mb={4}>
              <FaTag color={mutedColor} />
              <Text fontWeight="700" color={textColor}>
                Thẻ
              </Text>
            </HStack>
            <Flex flexWrap="wrap" gap={2}>
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  colorScheme="blue"
                  variant="subtle"
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="600"
                  cursor="pointer"
                  _hover={{
                    transform: 'scale(1.05)',
                    bg: 'blue.500',
                    color: 'white',
                  }}
                  transition="all 0.2s"
                  as={Link}
                  to={`/tag/${encodeURIComponent(tag)}`}
                >
                  {tag}
                </Badge>
              ))}
            </Flex>
          </Box>
        </MotionBox>
      )}

      {/* Reading Progress */}
      <MotionBox
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <Box
          bg={bgColor}
          borderRadius="xl"
          p={6}
          border="1px solid"
          borderColor={borderColor}
          boxShadow="lg"
          position="sticky"
          top="20px"
        >
          <HStack spacing={2} mb={3}>
            <FaChartLine color={mutedColor} />
            <Text fontWeight="700" color={textColor}>
              Tiến độ đọc
            </Text>
          </HStack>
          <Progress
            value={75}
            colorScheme="blue"
            size="lg"
            borderRadius="full"
            bg={useColorModeValue('gray.100', 'gray.700')}
          />
          <Text fontSize="sm" color={mutedColor} mt={2} textAlign="center">
            75% hoàn thành
          </Text>
        </Box>
      </MotionBox>
    </VStack>
  );
};

export default EnhancedPostSidebar;
