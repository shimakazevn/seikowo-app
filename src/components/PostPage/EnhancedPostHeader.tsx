import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  Badge,
  Avatar,
  Flex,
  useColorModeValue,
  IconButton,
  Tooltip,
  Button,
  Collapse,
  useDisclosure,
} from '@chakra-ui/react';
import {
  FaCalendarAlt,
  FaClock,
  FaShare,
  FaBookmark,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import TagFilterForPost from './TagFilterForPost';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

interface EnhancedPostHeaderProps {
  title: string;
  publishedDate: string;
  author?: string;
  readingTime?: number;
  tags?: string[];
  onShare?: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
  showTagFilter?: boolean;
  onTagSelect?: (tag: string | null) => void;
}

const EnhancedPostHeader: React.FC<EnhancedPostHeaderProps> = ({
  title,
  publishedDate,
  author = "Admin",
  readingTime = 5,
  tags = [],
  onShare,
  onBookmark,
  isBookmarked = false,
  showTagFilter = true,
  onTagSelect,
}) => {
  const { isOpen: isTagsOpen, onToggle: onTagsToggle } = useDisclosure({ defaultIsOpen: false });
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50, pink.50)',
    'linear(to-br, gray.900, blue.900, purple.900)'
  );
  const cardBg = useColorModeValue('rgba(255,255,255,0.8)', 'rgba(26,32,44,0.8)');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.300');
  const borderColor = useColorModeValue('whiteAlpha.300', 'whiteAlpha.200');

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Chưa xác định';
    }
  };

  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <MotionBox
      bgGradient={bgGradient}
      position="relative"
      overflow="hidden"
      borderRadius="2xl"
      p={8}
      mb={8}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Background Pattern */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.1}
        bgImage="radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)"
      />

      {/* Main Content */}
      <Box position="relative" zIndex={1}>
        <VStack spacing={6} align="stretch">
          {/* Title Section */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Heading
              as="h1"
              size="2xl"
              color={textColor}
              lineHeight="1.2"
              fontWeight="800"
              bgGradient="linear(to-r, blue.600, purple.600, pink.600)"
              bgClip="text"
              mb={4}
            >
              {title}
            </Heading>
          </MotionBox>

          {/* Meta Information */}
          <MotionFlex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'stretch', md: 'center' }}
            gap={4}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Left Side - Author & Date */}
            <HStack spacing={6} flex={1}>
              <HStack spacing={3}>
                <Avatar
                  size="md"
                  name={author}
                  bg="blue.500"
                  color="white"
                  icon={<FaUser />}
                />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="600" color={textColor} fontSize="sm">
                    {author}
                  </Text>
                  <Text fontSize="xs" color={mutedColor}>
                    Tác giả
                  </Text>
                </VStack>
              </HStack>

              <VStack align="start" spacing={1}>
                <HStack spacing={2}>
                  <FaCalendarAlt color={mutedColor} size="12px" />
                  <Text fontSize="sm" color={mutedColor}>
                    {formatDate(publishedDate)}
                  </Text>
                </HStack>
                <HStack spacing={4}>
                  <HStack spacing={1}>
                    <FaClock color={mutedColor} size="12px" />
                    <Text fontSize="xs" color={mutedColor}>
                      {readingTime} phút đọc
                    </Text>
                  </HStack>
                </HStack>
              </VStack>
            </HStack>

            {/* Right Side - Actions */}
            <HStack spacing={3}>
              <Tooltip label="Chia sẻ">
                <IconButton
                  aria-label="Share"
                  icon={<FaShare />}
                  variant="ghost"
                  colorScheme="blue"
                  size="lg"
                  onClick={onShare}
                  bg={cardBg}
                  backdropFilter="blur(10px)"
                  border="1px solid"
                  borderColor={borderColor}
                  _hover={{
                    transform: 'scale(1.1)',
                    bg: 'blue.500',
                    color: 'white',
                  }}
                  transition="all 0.2s"
                />
              </Tooltip>

              <Tooltip label={isBookmarked ? "Bỏ bookmark" : "Bookmark"}>
                <IconButton
                  aria-label="Bookmark"
                  icon={<FaBookmark />}
                  variant={isBookmarked ? "solid" : "ghost"}
                  colorScheme="orange"
                  size="lg"
                  onClick={onBookmark}
                  bg={isBookmarked ? 'orange.500' : cardBg}
                  backdropFilter="blur(10px)"
                  border="1px solid"
                  borderColor={borderColor}
                  _hover={{
                    transform: 'scale(1.1)',
                    bg: 'orange.500',
                    color: 'white',
                  }}
                  transition="all 0.2s"
                />
              </Tooltip>
            </HStack>
          </MotionFlex>

          {/* Tags Section with Enhanced Filter */}
          {tags.length > 0 && (
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <VStack spacing={4} align="stretch">
                {/* Quick Tags Preview */}
                <HStack spacing={2} flexWrap="wrap" justify="space-between" align="center">
                  <HStack spacing={2} flexWrap="wrap">
                    <FaTag color={mutedColor} size="14px" />
                    {tags.slice(0, 5).map((tag, index) => (
                      <Badge
                        key={index}
                        colorScheme="blue"
                        variant="subtle"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="600"
                        bg={cardBg}
                        backdropFilter="blur(10px)"
                        border="1px solid"
                        borderColor={borderColor}
                        _hover={{
                          transform: 'scale(1.05)',
                          bg: 'blue.500',
                          color: 'white',
                        }}
                        transition="all 0.2s"
                        cursor="pointer"
                        as={Link}
                        to={`/tag/${encodeURIComponent(tag)}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {tags.length > 5 && (
                      <Badge
                        colorScheme="gray"
                        variant="subtle"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                      >
                        +{tags.length - 5} more
                      </Badge>
                    )}
                  </HStack>

                  {/* Toggle Button for Enhanced Tags */}
                  {showTagFilter && tags.length > 3 && (
                    <Tooltip label={isTagsOpen ? "Hide tag filter" : "Show tag filter"}>
                      <IconButton
                        aria-label="Toggle tag filter"
                        icon={isTagsOpen ? <FaChevronUp /> : <FaChevronDown />}
                        size="sm"
                        variant="ghost"
                        onClick={onTagsToggle}
                        bg={cardBg}
                        backdropFilter="blur(10px)"
                        border="1px solid"
                        borderColor={borderColor}
                        _hover={{
                          transform: 'scale(1.1)',
                          bg: 'blue.500',
                          color: 'white',
                        }}
                        transition="all 0.2s"
                      />
                    </Tooltip>
                  )}
                </HStack>

                {/* Enhanced Tag Filter */}
                {showTagFilter && (
                  <Collapse in={isTagsOpen} animateOpacity>
                    <Box mt={4}>
                      <TagFilterForPost
                        tags={tags}
                        onTagSelect={onTagSelect}
                        variant="full"
                        maxTags={15}
                        showSearch={true}
                      />
                    </Box>
                  </Collapse>
                )}
              </VStack>
            </MotionBox>
          )}
        </VStack>
      </Box>
    </MotionBox>
  );
};

export default EnhancedPostHeader;
