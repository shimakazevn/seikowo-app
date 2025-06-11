import React, { useState, useMemo } from 'react';
import {
  Box,
  HStack,
  VStack,
  Tag,
  TagLabel,
  Badge,
  Wrap,
  WrapItem,
  Input,
  InputGroup,
  InputLeftElement,
  useToast,
  Tooltip,
  Card,
  CardBody,
  Text,
  Button,
  IconButton,
  useColorModeValue,
  Divider,
  Flex,
} from '@chakra-ui/react';
import {
  SearchIcon,
  CloseIcon,
} from '@chakra-ui/icons';
import {
  FaFilter,
  FaTags,
  FaRandom,
  FaSortAmountDown,
  FaSortAmountUp,
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

const MotionBox = motion(Box);

interface TagInfo {
  name: string;
  count: number;
}

interface TagFilterForPostProps {
  tags: string[];
  selectedTag?: string | null;
  onTagSelect?: (tag: string | null) => void;
  showSearch?: boolean;
  maxTags?: number;
  variant?: 'compact' | 'full';
}

const TagFilterForPost: React.FC<TagFilterForPostProps> = ({
  tags = [],
  selectedTag = null,
  onTagSelect,
  showSearch = true,
  maxTags = 20,
  variant = 'full'
}) => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  // Theme colors
  const bgColor = useColorModeValue('rgba(255,255,255,0.95)', 'rgba(26,32,44,0.95)');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Tag color schemes
  const tagColorSchemes = [
    'blue', 'purple', 'pink', 'red', 'orange', 
    'yellow', 'green', 'teal', 'cyan', 'gray'
  ];

  // Process tags into TagInfo format
  const processedTags = useMemo(() => {
    if (!tags || !Array.isArray(tags)) return [];
    
    const tagCounts: Record<string, number> = {};
    tags.forEach(tag => {
      if (tag && typeof tag === 'string') {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    });
    
    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [tags]);

  // Filter tags based on search
  const filteredTags = useMemo(() => {
    if (!processedTags || !Array.isArray(processedTags)) return [];
    
    let filtered = processedTags;
    if (searchTerm && typeof searchTerm === 'string') {
      filtered = processedTags.filter(tag => 
        tag && tag.name && typeof tag.name === 'string' &&
        tag.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    const limit = showAllTags ? filtered.length : Math.min(maxTags, filtered.length);
    return filtered.slice(0, limit);
  }, [processedTags, searchTerm, showAllTags, maxTags]);

  // Handlers
  const handleTagClick = (tagName: string) => {
    const newSelectedTag = selectedTag === tagName ? null : tagName;
    
    if (onTagSelect) {
      onTagSelect(newSelectedTag);
    } else {
      // Navigate to tag page
      if (newSelectedTag) {
        navigate(`/tag/${encodeURIComponent(tagName)}`);
      }
    }
    
    toast({
      title: newSelectedTag ? 'Đã chọn tag' : 'Đã bỏ chọn tag',
      description: newSelectedTag ? `Lọc theo: ${tagName}` : 'Hiển thị tất cả bài viết',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const getRandomTag = () => {
    if (filteredTags && Array.isArray(filteredTags) && filteredTags.length > 0) {
      const randomTag = filteredTags[Math.floor(Math.random() * filteredTags.length)];
      if (randomTag && randomTag.name) {
        handleTagClick(randomTag.name);
      }
    } else {
      toast({
        title: 'Không có tag nào',
        description: 'Không tìm thấy tag nào để chọn ngẫu nhiên',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    if (onTagSelect) {
      onTagSelect(null);
    }
  };

  // Early return for no tags
  if (!processedTags || processedTags.length === 0) {
    return (
      <Card bg={cardBg} shadow="sm" mb={4}>
        <CardBody>
          <HStack spacing={3} justify="center">
            <FaTags color={mutedColor} />
            <Text color={mutedColor} fontSize="sm">
              Không có tag nào
            </Text>
          </HStack>
        </CardBody>
      </Card>
    );
  }

  // Compact variant for smaller spaces
  if (variant === 'compact') {
    return (
      <MotionBox
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Wrap spacing={2}>
          {filteredTags.slice(0, 10).map((tag, index) => (
            <WrapItem key={tag.name}>
              <Tooltip label={`${tag.count} posts`}>
                <Tag
                  size="md"
                  colorScheme={tagColorSchemes[index % tagColorSchemes.length]}
                  variant={selectedTag === tag.name ? "solid" : "subtle"}
                  cursor="pointer"
                  onClick={() => handleTagClick(tag.name)}
                  transition="all 0.2s"
                  _hover={{
                    transform: 'translateY(-1px)',
                    shadow: 'sm',
                  }}
                >
                  <TagLabel fontSize="xs">{tag.name}</TagLabel>
                </Tag>
              </Tooltip>
            </WrapItem>
          ))}
          {processedTags.length > 10 && (
            <WrapItem>
              <Badge colorScheme="gray" variant="subtle" cursor="pointer">
                +{processedTags.length - 10} more
              </Badge>
            </WrapItem>
          )}
        </Wrap>
      </MotionBox>
    );
  }

  // Full variant
  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card bg={bgColor} shadow="md" mb={6}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            {/* Header */}
            <HStack justify="space-between" align="center">
              <HStack spacing={3}>
                <FaTags color={textColor} />
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  Related Tags ({processedTags.length})
                </Text>
                {selectedTag && (
                  <Badge colorScheme="blue" variant="solid">
                    Selected: {selectedTag}
                  </Badge>
                )}
              </HStack>
              
              <HStack spacing={2}>
                <Tooltip label="Random tag">
                  <IconButton
                    aria-label="Random tag"
                    icon={<FaRandom />}
                    size="sm"
                    variant="outline"
                    onClick={getRandomTag}
                    colorScheme="purple"
                  />
                </Tooltip>
                
                {(selectedTag || searchTerm) && (
                  <Tooltip label="Clear selection">
                    <IconButton
                      aria-label="Clear selection"
                      icon={<CloseIcon />}
                      size="sm"
                      variant="outline"
                      onClick={clearSearch}
                      colorScheme="red"
                    />
                  </Tooltip>
                )}
              </HStack>
            </HStack>

            {/* Search Input */}
            {showSearch && (
              <InputGroup size="md">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color={mutedColor} />
                </InputLeftElement>
                <Input
                  placeholder="Search tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  bg={cardBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'blue.500' }}
                />
              </InputGroup>
            )}

            {/* Tags Display */}
            <Box>
              <Wrap spacing={2} minH="40px">
                {filteredTags.length > 0 ? (
                  filteredTags.map((tag, index) => (
                    <WrapItem key={`${tag.name}-${index}`}>
                      <Tooltip label={`Click to filter by ${tag.name}`}>
                        <Tag
                          size="lg"
                          colorScheme={tagColorSchemes[index % tagColorSchemes.length]}
                          variant={selectedTag === tag.name ? "solid" : "subtle"}
                          cursor="pointer"
                          onClick={() => handleTagClick(tag.name)}
                          transition="all 0.2s"
                          _hover={{
                            transform: 'translateY(-2px)',
                            shadow: 'md',
                          }}
                          _active={{
                            transform: 'translateY(0)',
                          }}
                        >
                          <TagLabel fontWeight="medium">
                            {tag.name}
                          </TagLabel>
                          <Badge
                            ml={2}
                            colorScheme={selectedTag === tag.name ? "whiteAlpha" : "gray"}
                            variant="solid"
                            fontSize="xs"
                          >
                            {tag.count}
                          </Badge>
                        </Tag>
                      </Tooltip>
                    </WrapItem>
                  ))
                ) : (
                  <Text color={mutedColor} fontSize="sm" py={4}>
                    {searchTerm ? `Không tìm thấy tag nào với từ khóa "${searchTerm}"` : 'Không có tag nào'}
                  </Text>
                )}
              </Wrap>
            </Box>

            {/* Show More/Less Button */}
            {processedTags.length > maxTags && (
              <HStack justify="center">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAllTags(!showAllTags)}
                  leftIcon={showAllTags ? <FaSortAmountUp /> : <FaSortAmountDown />}
                  color={textColor}
                >
                  {showAllTags ? 'Show Less' : `Show All (${processedTags.length})`}
                </Button>
              </HStack>
            )}
          </VStack>
        </CardBody>
      </Card>
    </MotionBox>
  );
};

export default TagFilterForPost;
