import React, { memo, useState } from 'react';
import {
  Box,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Text,
  useColorModeValue,
  Divider,
  VStack,
  HStack,
  Badge,
  Icon,
  Flex,
  Circle,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { FaLanguage, FaPalette, FaUser, FaBook, FaTags, FaStar } from 'react-icons/fa';

// Animations
const slideIn = keyframes`
  from { transform: translateX(20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
  60% { transform: translateY(-3px); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 5px currentColor; }
  50% { box-shadow: 0 0 20px currentColor, 0 0 30px currentColor; }
`;

interface TagCategory {
  name: string;
  tags: string[];
  color: string;
  icon: React.ElementType;
}

interface TagListProps {
  labels?: string[];
  onTagClick?: (tag: string) => void;
  showCategories?: boolean;
}

const TagList: React.FC<TagListProps> = memo(({
  labels = [],
  onTagClick,
  showCategories = true
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const gradientBg = useColorModeValue(
    'linear(to-br, blue.50, purple.50, pink.50)',
    'linear(to-br, gray.900, purple.900, blue.900)'
  );

  // Enhanced categorization with icons
  const categorizeTag = (tag: string): TagCategory => {
    const lowerTag = tag.toLowerCase();

    // Language tags
    if (['english', 'japanese', 'chinese', 'korean', 'vietnamese'].some(lang => lowerTag.includes(lang))) {
      return { name: 'Language', tags: [tag], color: 'blue', icon: FaLanguage };
    }

    // Category tags
    if (['manga', 'doujinshi', 'artist cg', 'game cg', 'western'].some(cat => lowerTag.includes(cat))) {
      return { name: 'Category', tags: [tag], color: 'purple', icon: FaBook };
    }

    // Character tags
    if (lowerTag.includes('character:') || lowerTag.includes('char:')) {
      return { name: 'Characters', tags: [tag.replace(/character:|char:/gi, '').trim()], color: 'green', icon: FaUser };
    }

    // Artist tags
    if (lowerTag.includes('artist:') || lowerTag.includes('author:')) {
      return { name: 'Artists', tags: [tag.replace(/artist:|author:/gi, '').trim()], color: 'orange', icon: FaPalette };
    }

    // Parody tags
    if (lowerTag.includes('parody:') || lowerTag.includes('series:')) {
      return { name: 'Parodies', tags: [tag.replace(/parody:|series:/gi, '').trim()], color: 'pink', icon: FaStar };
    }

    // Default to general tags
    return { name: 'Tags', tags: [tag], color: 'gray', icon: FaTags };
  };

  // Group tags by category
  const groupedTags = labels.reduce((acc, tag) => {
    const category = categorizeTag(tag);
    const existingCategory = acc.find(cat => cat.name === category.name);

    if (existingCategory) {
      existingCategory.tags.push(...category.tags);
    } else {
      acc.push(category);
    }

    return acc;
  }, [] as TagCategory[]);

  if (labels.length === 0) {
    return (
      <Box
        p={4}
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
      >
        <Text color="gray.500" fontSize="sm" textAlign="center">
          No tags available
        </Text>
      </Box>
    );
  }

  if (!showCategories) {
    return (
      <Box
        p={4}
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
      >
        <Wrap spacing={2}>
          {labels.map((tag, index) => (
            <WrapItem key={index}>
              <Tag
                size="sm"
                colorScheme="gray"
                cursor={onTagClick ? 'pointer' : 'default'}
                onClick={() => onTagClick?.(tag)}
                _hover={onTagClick ? { transform: 'scale(1.05)' } : {}}
                transition="transform 0.2s"
              >
                <TagLabel>{tag}</TagLabel>
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {groupedTags.map((category, categoryIndex) => (
        <Box
          key={categoryIndex}
          bgGradient={gradientBg}
          borderRadius="2xl"
          overflow="hidden"
          shadow="xl"
          transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
          transform={hoveredCategory === category.name ? 'scale(1.02)' : 'scale(1)'}
          onMouseEnter={() => setHoveredCategory(category.name)}
          onMouseLeave={() => setHoveredCategory(null)}
          animation={`${slideIn} 0.6s ease-out ${categoryIndex * 0.1}s both`}
        >
          {/* Category Header */}
          <Box
            p={4}
            bgGradient={`linear(to-r, ${category.color}.400, ${category.color}.600)`}
            color="white"
            position="relative"
            overflow="hidden"
          >
            <Flex align="center" justify="space-between">
              <HStack spacing={3}>
                <Circle
                  size="40px"
                  bg="whiteAlpha.200"
                  backdropFilter="blur(10px)"
                  border="2px solid"
                  borderColor="whiteAlpha.300"
                >
                  <Icon as={category.icon} size="18px" />
                </Circle>
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight="bold">
                    {category.name}
                  </Text>
                  <Text fontSize="xs" opacity={0.8}>
                    {category.tags.length} {category.tags.length === 1 ? 'tag' : 'tags'}
                  </Text>
                </VStack>
              </HStack>

              <Badge
                bg="whiteAlpha.200"
                color="white"
                backdropFilter="blur(10px)"
                border="1px solid"
                borderColor="whiteAlpha.300"
                borderRadius="full"
                px={3}
                py={1}
                animation={hoveredCategory === category.name ? `${glow} 2s ease-in-out infinite` : undefined}
              >
                {category.tags.length}
              </Badge>
            </Flex>

            {/* Animated background pattern */}
            <Box
              position="absolute"
              top={0}
              right={0}
              width="100px"
              height="100px"
              opacity={0.1}
              transform="rotate(45deg)"
              bg={`${category.color}.300`}
              borderRadius="lg"
              animation={hoveredCategory === category.name ? `${bounce} 1s ease-in-out infinite` : undefined}
            />
          </Box>

          {/* Tags Grid */}
          <Box p={4}>
            <Wrap spacing={3}>
              {category.tags.map((tag, tagIndex) => (
                <WrapItem key={tagIndex}>
                  <Tag
                    size="md"
                    colorScheme={category.color}
                    variant="subtle"
                    cursor={onTagClick ? 'pointer' : 'default'}
                    onClick={() => onTagClick?.(tag)}
                    borderRadius="full"
                    px={4}
                    py={2}
                    fontWeight="medium"
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    _hover={onTagClick ? {
                      transform: 'translateY(-2px) scale(1.05)',
                      shadow: 'lg',
                      variant: 'solid',
                      animation: `${bounce} 0.6s ease-in-out`
                    } : {}}
                    animation={`${slideIn} 0.4s ease-out ${tagIndex * 0.05}s both`}
                  >
                    <TagLabel>{tag}</TagLabel>
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          </Box>
        </Box>
      ))}
    </VStack>
  );
});

TagList.displayName = 'TagList';

export default TagList;
