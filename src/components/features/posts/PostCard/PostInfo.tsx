import React, { memo, useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Divider,
  Icon,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Flex,
  Progress,
  Circle,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { CalendarIcon, TimeIcon, ViewIcon, StarIcon } from '@chakra-ui/icons';
import { FaImages, FaLanguage, FaTag, FaHeart, FaDownload, FaClock } from 'react-icons/fa';

// Animations
const countUp = keyframes`
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

interface PostInfoProps {
  title: string;
  publishedDate: string;
  totalPages?: number;
  language?: string;
  category?: string;
  views?: number;
  rating?: number;
  size?: string;
  uploadedBy?: string;
}

const PostInfo: React.FC<PostInfoProps> = memo(({
  title,
  publishedDate,
  totalPages,
  language,
  category,
  views,
  rating,
  size,
  uploadedBy
}) => {
  const [animatedViews, setAnimatedViews] = useState(0);
  const [animatedRating, setAnimatedRating] = useState(0);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const gradientBg = useColorModeValue(
    'linear(to-br, blue.50, purple.50, pink.50)',
    'linear(to-br, gray.900, purple.900, blue.900)'
  );

  // Animate numbers on mount
  useEffect(() => {
    if (views) {
      const timer = setTimeout(() => {
        let start = 0;
        const increment = views / 50;
        const counter = setInterval(() => {
          start += increment;
          if (start >= views) {
            setAnimatedViews(views);
            clearInterval(counter);
          } else {
            setAnimatedViews(Math.floor(start));
          }
        }, 20);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [views]);

  useEffect(() => {
    if (rating) {
      const timer = setTimeout(() => {
        let start = 0;
        const increment = rating / 20;
        const counter = setInterval(() => {
          start += increment;
          if (start >= rating) {
            setAnimatedRating(rating);
            clearInterval(counter);
          } else {
            setAnimatedRating(start);
          }
        }, 50);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [rating]);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatViews = (viewCount?: number): string => {
    if (!viewCount) return '0';
    if (viewCount >= 1000000) return `${(viewCount / 1000000).toFixed(1)}M`;
    if (viewCount >= 1000) return `${(viewCount / 1000).toFixed(1)}K`;
    return viewCount.toString();
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Hero Section */}
      <Box
        bgGradient={gradientBg}
        borderRadius="2xl"
        p={8}
        shadow="2xl"
        position="relative"
        overflow="hidden"
        animation={`${slideUp} 0.6s ease-out`}
      >
        {/* Background Pattern */}
        <Box
          position="absolute"
          top={0}
          right={0}
          width="200px"
          height="200px"
          opacity={0.1}
          transform="rotate(45deg)"
          bg="whiteAlpha.200"
          borderRadius="lg"
        />

        <VStack spacing={4} align="stretch" position="relative">
          <Heading
            size="xl"
            lineHeight="1.2"
            color={accentColor}
            textAlign="center"
            animation={`${slideUp} 0.8s ease-out 0.2s both`}
          >
            {title}
          </Heading>

          {uploadedBy && (
            <Text
              fontSize="md"
              color={mutedColor}
              textAlign="center"
              animation={`${slideUp} 0.8s ease-out 0.4s both`}
            >
              Uploaded by <Text as="span" fontWeight="bold" color={accentColor}>{uploadedBy}</Text>
            </Text>
          )}
        </VStack>
      </Box>

      {/* Enhanced Stats Grid */}
      <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4}>
        <GridItem>
          <Box
            bg={bgColor}
            borderRadius="xl"
            p={6}
            shadow="lg"
            textAlign="center"
            transition="all 0.3s"
            _hover={{ transform: 'translateY(-4px)', shadow: 'xl' }}
            animation={`${slideUp} 0.6s ease-out 0.6s both`}
          >
            <Circle size="60px" bg="blue.100" color="blue.500" mx="auto" mb={3}>
              <Icon as={FaImages} size="24px" />
            </Circle>
            <Text fontSize="sm" color={mutedColor} mb={1}>Pages</Text>
            <Text fontSize="2xl" fontWeight="bold" color={accentColor}>
              {totalPages || 'N/A'}
            </Text>
          </Box>
        </GridItem>

        <GridItem>
          <Box
            bg={bgColor}
            borderRadius="xl"
            p={6}
            shadow="lg"
            textAlign="center"
            transition="all 0.3s"
            _hover={{ transform: 'translateY(-4px)', shadow: 'xl' }}
            animation={`${slideUp} 0.6s ease-out 0.8s both`}
          >
            <Circle size="60px" bg="green.100" color="green.500" mx="auto" mb={3}>
              <Icon as={FaEye} size="24px" />
            </Circle>
            <Text fontSize="sm" color={mutedColor} mb={1}>Views</Text>
            <Text
              fontSize="2xl"
              fontWeight="bold"
              color={accentColor}
              animation={`${countUp} 0.8s ease-out 1s both`}
            >
              {formatViews(animatedViews)}
            </Text>
          </Box>
        </GridItem>

        {rating && (
          <GridItem>
            <Box
              bg={bgColor}
              borderRadius="xl"
              p={6}
              shadow="lg"
              textAlign="center"
              transition="all 0.3s"
              _hover={{ transform: 'translateY(-4px)', shadow: 'xl' }}
              animation={`${slideUp} 0.6s ease-out 1s both`}
            >
              <Circle size="60px" bg="yellow.100" color="yellow.500" mx="auto" mb={3}>
                <Icon as={StarIcon} size="24px" />
              </Circle>
              <Text fontSize="sm" color={mutedColor} mb={1}>Rating</Text>
              <HStack justify="center" spacing={1}>
                <Text
                  fontSize="2xl"
                  fontWeight="bold"
                  color={accentColor}
                  animation={`${countUp} 0.8s ease-out 1.2s both`}
                >
                  {animatedRating.toFixed(1)}
                </Text>
                <Text fontSize="lg" color={mutedColor}>/5</Text>
              </HStack>
              <Progress
                value={(animatedRating / 5) * 100}
                colorScheme="yellow"
                size="sm"
                mt={2}
                borderRadius="full"
              />
            </Box>
          </GridItem>
        )}
      </Grid>

      {/* Details Section */}
      <Box
        bg={bgColor}
        borderRadius="xl"
        p={6}
        shadow="lg"
        animation={`${slideUp} 0.6s ease-out 1.4s both`}
      >
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between">
            <HStack spacing={2}>
              <Icon as={CalendarIcon} color={mutedColor} />
              <Text fontSize="sm" color={mutedColor}>Published</Text>
            </HStack>
            <Text fontSize="sm" fontWeight="medium">
              {formatDate(publishedDate)}
            </Text>
          </HStack>

          {language && (
            <HStack justify="space-between">
              <HStack spacing={2}>
                <Icon as={FaLanguage} color={mutedColor} />
                <Text fontSize="sm" color={mutedColor}>Language</Text>
              </HStack>
              <Badge colorScheme="blue" variant="subtle">
                {language}
              </Badge>
            </HStack>
          )}

          {category && (
            <HStack justify="space-between">
              <HStack spacing={2}>
                <Icon as={FaTag} color={mutedColor} />
                <Text fontSize="sm" color={mutedColor}>Category</Text>
              </HStack>
              <Badge colorScheme="purple" variant="subtle">
                {category}
              </Badge>
            </HStack>
          )}

          {size && (
            <HStack justify="space-between">
              <HStack spacing={2}>
                <Icon as={TimeIcon} color={mutedColor} />
                <Text fontSize="sm" color={mutedColor}>Size</Text>
              </HStack>
              <Text fontSize="sm" fontWeight="medium">
                {size}
              </Text>
            </HStack>
          )}
          <Divider />

          {/* Quality Indicators */}
          <Flex wrap="wrap" gap={2}>
            {totalPages && totalPages > 20 && (
              <Badge colorScheme="green" variant="subtle">
                High Quality
              </Badge>
            )}
            {views && views > 10000 && (
              <Badge colorScheme="orange" variant="subtle">
                Popular
              </Badge>
            )}
            {rating && rating >= 4.5 && (
              <Badge colorScheme="yellow" variant="subtle">
                Highly Rated
              </Badge>
            )}
          </Flex>
        </VStack>
      </Box>
    </VStack>
  );
});

PostInfo.displayName = 'PostInfo';

export default PostInfo;
