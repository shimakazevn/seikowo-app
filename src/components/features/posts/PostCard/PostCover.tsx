import React, { memo, useState } from 'react';
import {
  Box,
  Image,
  AspectRatio,
  Skeleton,
  useColorModeValue,
  IconButton,
  VStack,
  Text,
  Badge,
  HStack,
  Flex,
  Circle,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { StarIcon, DownloadIcon } from '@chakra-ui/icons';
import { FaBookmark, FaPlay, FaHeart } from 'react-icons/fa';

interface PostCoverProps {
  coverImage: string;
  title: string;
  totalPages?: number;
  isBookmarked?: boolean;
  isFollowed?: boolean;
  onRead: () => void;
  onBookmark?: () => void;
  onFollow?: () => void;
}

// Animations
const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(2deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const PostCover: React.FC<PostCoverProps> = memo(({
  coverImage,
  title,
  totalPages,
  isBookmarked = false,
  isFollowed = false,
  onRead,
  onBookmark,
  onFollow
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const shadowColor = useColorModeValue('lg', 'dark-lg');
  const gradientBg = useColorModeValue(
    'linear(to-br, blue.50, purple.50, pink.50)',
    'linear(to-br, gray.900, purple.900, blue.900)'
  );

  const getThumbUrl = (url: string): string => {
    return url.replace(/\/s[0-9]+\//, '/s400/');
  };

  return (
    <Box
      bgGradient={gradientBg}
      borderRadius="2xl"
      overflow="hidden"
      shadow="2xl"
      transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
      transform={isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)'}
      _hover={{
        shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}
      position="relative"
      maxW="320px"
      mx="auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animation={isHovered ? `${float} 3s ease-in-out infinite` : undefined}
    >
      {/* Cover Image */}
      <AspectRatio ratio={3/4} position="relative">
        <Box>
          {!imageLoaded && !imageError && (
            <Skeleton width="100%" height="100%" />
          )}

          {!imageError ? (
            <Image
              src={getThumbUrl(coverImage)}
              alt={title}
              objectFit="cover"
              width="100%"
              height="100%"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
              display={imageLoaded ? 'block' : 'none'}
            />
          ) : (
            <Box
              width="100%"
              height="100%"
              bg="gray.100"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="gray.500" fontSize="sm">
                No Image
              </Text>
            </Box>
          )}

          {/* Glassmorphism Overlay */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bgGradient="linear(to-t, blackAlpha.800, transparent, blackAlpha.600)"
            opacity={isHovered ? 1 : 0}
            transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            backdropFilter="blur(10px)"
          >
            {/* Main Play Button */}
            <Circle
              size="80px"
              bg="whiteAlpha.200"
              backdropFilter="blur(20px)"
              border="2px solid"
              borderColor="whiteAlpha.300"
              cursor="pointer"
              onClick={onRead}
              transition="all 0.3s"
              _hover={{
                transform: 'scale(1.1)',
                bg: 'whiteAlpha.300',
                borderColor: 'whiteAlpha.500',
              }}
              animation={isHovered ? `${pulse} 2s ease-in-out infinite` : undefined}
            >
              <FaPlay size="24px" color="white" />
            </Circle>

            {/* Action Buttons */}
            <HStack spacing={3} mt={4}>
              {onBookmark && (
                <Circle
                  size="45px"
                  bg={isBookmarked ? 'yellow.400' : 'whiteAlpha.200'}
                  backdropFilter="blur(20px)"
                  border="2px solid"
                  borderColor={isBookmarked ? 'yellow.300' : 'whiteAlpha.300'}
                  cursor="pointer"
                  onClick={onBookmark}
                  transition="all 0.3s"
                  _hover={{
                    transform: 'scale(1.1)',
                    bg: isBookmarked ? 'yellow.300' : 'whiteAlpha.300',
                  }}
                >
                  <FaBookmark size="16px" color={isBookmarked ? 'black' : 'white'} />
                </Circle>
              )}

              {onFollow && (
                <Circle
                  size="45px"
                  bg={isFollowed ? 'red.400' : 'whiteAlpha.200'}
                  backdropFilter="blur(20px)"
                  border="2px solid"
                  borderColor={isFollowed ? 'red.300' : 'whiteAlpha.300'}
                  cursor="pointer"
                  onClick={onFollow}
                  transition="all 0.3s"
                  _hover={{
                    transform: 'scale(1.1)',
                    bg: isFollowed ? 'red.300' : 'whiteAlpha.300',
                  }}
                >
                  <FaHeart size="16px" color={isFollowed ? 'white' : 'white'} />
                </Circle>
              )}

              <Circle
                size="45px"
                bg="whiteAlpha.200"
                backdropFilter="blur(20px)"
                border="2px solid"
                borderColor="whiteAlpha.300"
                cursor="pointer"
                transition="all 0.3s"
                _hover={{
                  transform: 'scale(1.1)',
                  bg: 'whiteAlpha.300',
                }}
              >
                <DownloadIcon size="16px" color="white" />
              </Circle>
            </HStack>
          </Box>

          {/* Enhanced Badges */}
          {totalPages && (
            <Badge
              position="absolute"
              top={3}
              right={3}
              bg="blackAlpha.700"
              color="white"
              backdropFilter="blur(10px)"
              border="1px solid"
              borderColor="whiteAlpha.300"
              fontSize="xs"
              borderRadius="full"
              px={3}
              py={1}
              fontWeight="bold"
              transform={isHovered ? 'scale(1.05)' : 'scale(1)'}
              transition="all 0.3s"
            >
              {totalPages}
            </Badge>
          )}

          {/* Floating Status Indicators */}
          <VStack
            position="absolute"
            top={3}
            left={3}
            spacing={2}
            align="start"
          >
            {isBookmarked && (
              <Circle
                size="32px"
                bg="yellow.400"
                border="2px solid white"
                shadow="lg"
                animation={`${pulse} 2s ease-in-out infinite`}
              >
                <FaBookmark size="12px" color="black" />
              </Circle>
            )}
            {isFollowed && (
              <Circle
                size="32px"
                bg="red.400"
                border="2px solid white"
                shadow="lg"
                animation={`${pulse} 2s ease-in-out infinite`}
              >
                <FaHeart size="12px" color="white" />
              </Circle>
            )}
          </VStack>
        </Box>
      </AspectRatio>

      {/* Enhanced Title Section */}
      <Box
        p={4}
        bgGradient="linear(to-r, transparent, whiteAlpha.50, transparent)"
        backdropFilter="blur(5px)"
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          bgGradient: 'linear(to-r, transparent, whiteAlpha.300, transparent)',
        }}
      >
        <Text
          fontSize="sm"
          fontWeight="bold"
          lineHeight="1.3"
          noOfLines={2}
          title={title}
          color={useColorModeValue('gray.800', 'white')}
          textAlign="center"
          transition="all 0.3s"
          _hover={{
            color: useColorModeValue('blue.600', 'blue.300'),
          }}
        >
          {title}
        </Text>

        {/* Shimmer effect on title */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgGradient="linear(to-r, transparent, whiteAlpha.200, transparent)"
          opacity={isHovered ? 1 : 0}
          animation={isHovered ? `${shimmer} 2s ease-in-out infinite` : undefined}
          transition="opacity 0.3s"
        />
      </Box>
    </Box>
  );
});

PostCover.displayName = 'PostCover';

export default PostCover;
