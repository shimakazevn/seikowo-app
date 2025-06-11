import React, { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  IconButton,
  Badge,
  Wrap,
  WrapItem,
  Tooltip,
  useToast,
  Collapse,
  Card,
  CardBody,
  InputGroup,
  InputLeftElement,
  InputRightElement,
} from '@chakra-ui/react';
import {
  FaSearch,
  FaTimes,
  FaDice,
  FaChevronDown,
  FaChevronUp,
  FaTags,
  FaFilter,
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const MotionBox = motion(Box);

interface MangaTagFilterProps {
  tags: string[];
  onTagSelect?: (tag: string | null) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const MangaTagFilter: React.FC<MangaTagFilterProps> = ({
  tags = [],
  onTagSelect,
  isOpen = false,
  onToggle,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  // Cobalt.tools inspired theme colors
  const bgColor = '#0a0a0a';
  const cardBg = '#1a1a1a';
  const elevatedBg = '#222222';
  const textColor = '#ffffff';
  const mutedColor = '#b3b3b3';
  const tertiaryColor = '#808080';
  const borderColor = '#333333';
  const accentColor = '#00d4ff';
  const accentHover = '#33ddff';
  const inputBg = '#222222';

  // Cobalt-inspired tag color schemes
  const tagColors = [
    '#00d4ff', // Primary cobalt blue
    '#0099cc', // Darker blue
    '#66e0ff', // Lighter blue
    '#00ff88', // Success green
    '#ffaa00', // Warning orange
    '#ff4444', // Error red
    '#8866ff', // Purple
    '#ff6699', // Pink
  ];

  // Process tags with counts
  const processedTags = useMemo(() => {
    if (!tags || !Array.isArray(tags)) return [];
    
    return tags.map((tag, index) => ({
      name: tag,
      count: Math.floor(Math.random() * 50) + 1,
      color: tagColors[index % tagColors.length]
    }));
  }, [tags]);

  // Filter tags based on search
  const filteredTags = useMemo(() => {
    let filtered = processedTags;
    
    if (searchTerm) {
      filtered = processedTags.filter(tag => 
        tag.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    const limit = showAllTags ? filtered.length : Math.min(12, filtered.length);
    return filtered.slice(0, limit);
  }, [processedTags, searchTerm, showAllTags]);

  const handleTagClick = (tagName: string) => {
    toast({
      title: 'Tag Selected',
      description: `Filtering by: ${tagName}`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
    
    onTagSelect?.(tagName);
    navigate(`/tag/${encodeURIComponent(tagName)}`);
  };

  const handleRandomTag = () => {
    if (filteredTags.length > 0) {
      const randomTag = filteredTags[Math.floor(Math.random() * filteredTags.length)];
      handleTagClick(randomTag.name);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (!processedTags || processedTags.length === 0) {
    return null;
  }

  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Cobalt-style Toggle Button */}
      <Button
        leftIcon={isOpen ? <FaChevronUp /> : <FaChevronDown />}
        rightIcon={<FaFilter />}
        variant="outline"
        size="md"
        color={accentColor}
        onClick={onToggle}
        bg={cardBg}
        borderColor={borderColor}
        _hover={{
          bg: elevatedBg,
          borderColor: accentColor,
          color: accentHover,
          transform: 'translateY(-1px)',
          boxShadow: `0 4px 12px ${accentColor}40`,
        }}
        _active={{
          transform: 'translateY(0)',
        }}
        transition="all 0.2s ease"
        borderRadius="8px"
        px={6}
        py={3}
        mb={4}
        w="fit-content"
        fontWeight="500"
      >
        <HStack spacing={3}>
          <FaTags />
          <Text fontSize="sm" fontWeight="500">
            {isOpen ? 'Hide' : 'Show'} Tag Filter
          </Text>
          <Badge
            bg={accentColor}
            color={bgColor}
            fontSize="xs"
            borderRadius="6px"
            fontWeight="500"
            px={2}
            py={1}
          >
            {processedTags.length}
          </Badge>
        </HStack>
      </Button>

      {/* Cobalt-style Tag Filter Content */}
      <Collapse in={isOpen} animateOpacity>
        <Card
          bg={cardBg}
          shadow="lg"
          border="1px solid"
          borderColor={borderColor}
          borderRadius="12px"
          overflow="hidden"
          _hover={{
            borderColor: accentColor + '60',
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 25px ${bgColor}80`,
          }}
          transition="all 0.2s ease"
        >
          <CardBody p={6}>
            <VStack spacing={5} align="stretch">
              {/* Header */}
              <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                  <Box
                    p={3}
                    bg={accentColor}
                    borderRadius="8px"
                    color={bgColor}
                    boxShadow={`0 0 20px ${accentColor}40`}
                  >
                    <FaTags />
                  </Box>
                  <VStack spacing={1} align="start">
                    <Text fontSize="lg" fontWeight="600" color={textColor}>
                      Tag Filter
                    </Text>
                    <Text fontSize="xs" color={tertiaryColor}>
                      {filteredTags.length} of {processedTags.length} tags
                    </Text>
                  </VStack>
                </HStack>
                
                <Tooltip label="Random Tag" bg={elevatedBg} color={textColor}>
                  <IconButton
                    aria-label="Random tag"
                    icon={<FaDice />}
                    size="md"
                    variant="outline"
                    bg={elevatedBg}
                    borderColor={borderColor}
                    color={accentColor}
                    onClick={handleRandomTag}
                    _hover={{
                      bg: accentColor,
                      color: bgColor,
                      borderColor: accentColor,
                      transform: 'rotate(180deg)',
                      boxShadow: `0 0 15px ${accentColor}60`,
                    }}
                    transition="all 0.3s ease"
                    borderRadius="8px"
                  />
                </Tooltip>
              </HStack>

              {/* Cobalt-style Search Input */}
              <InputGroup size="md">
                <InputLeftElement pointerEvents="none">
                  <FaSearch color={tertiaryColor} />
                </InputLeftElement>
                <Input
                  placeholder="Search tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  bg={elevatedBg}
                  border="1px solid"
                  borderColor={borderColor}
                  color={textColor}
                  fontWeight="500"
                  _placeholder={{ color: tertiaryColor }}
                  _focus={{
                    borderColor: accentColor,
                    boxShadow: `0 0 0 1px ${accentColor}`,
                    bg: elevatedBg,
                  }}
                  _hover={{
                    borderColor: accentColor + '60',
                  }}
                  borderRadius="8px"
                  transition="all 0.2s ease"
                />
                {searchTerm && (
                  <InputRightElement>
                    <IconButton
                      aria-label="Clear search"
                      icon={<FaTimes />}
                      size="xs"
                      variant="ghost"
                      color={tertiaryColor}
                      onClick={clearSearch}
                      _hover={{
                        color: accentColor,
                        bg: accentColor + '20',
                      }}
                      borderRadius="6px"
                    />
                  </InputRightElement>
                )}
              </InputGroup>

              {/* Tags Display */}
              <Box>
                <Wrap spacing={3} justify="flex-start">
                  {filteredTags.length > 0 ? (
                    filteredTags.map((tag, index) => (
                      <WrapItem key={`${tag.name}-${index}`}>
                        <Tooltip
                          label={`Click to filter by ${tag.name}`}
                          placement="top"
                          bg={elevatedBg}
                          color={textColor}
                          borderRadius="6px"
                        >
                          <Badge
                            bg={tag.color + '20'}
                            color={tag.color}
                            border="1px solid"
                            borderColor={tag.color + '40'}
                            px={4}
                            py={2}
                            fontSize="sm"
                            fontWeight="500"
                            cursor="pointer"
                            borderRadius="8px"
                            transition="all 0.2s ease"
                            _hover={{
                              bg: tag.color,
                              color: bgColor,
                              borderColor: tag.color,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 4px 15px ${tag.color}40`,
                            }}
                            _active={{
                              transform: 'translateY(0)',
                            }}
                            onClick={() => handleTagClick(tag.name)}
                            display="flex"
                            alignItems="center"
                            gap={2}
                          >
                            <Text>{tag.name}</Text>
                            <Box
                              bg={tag.color + '30'}
                              px={2}
                              py={1}
                              borderRadius="6px"
                              fontSize="xs"
                              fontWeight="600"
                              minW="20px"
                              textAlign="center"
                            >
                              {tag.count}
                            </Box>
                          </Badge>
                        </Tooltip>
                      </WrapItem>
                    ))
                  ) : (
                    <Text color={tertiaryColor} fontSize="sm" py={6} textAlign="center" w="100%">
                      {searchTerm ? `No tags found for "${searchTerm}"` : 'No tags available'}
                    </Text>
                  )}
                </Wrap>
              </Box>

              {/* Cobalt-style Show More/Less Button */}
              {processedTags.length > 12 && (
                <HStack justify="center">
                  <Button
                    size="md"
                    variant="outline"
                    onClick={() => setShowAllTags(!showAllTags)}
                    leftIcon={showAllTags ? <FaChevronUp /> : <FaChevronDown />}
                    color={accentColor}
                    bg={elevatedBg}
                    borderColor={borderColor}
                    fontWeight="500"
                    _hover={{
                      bg: accentColor + '20',
                      borderColor: accentColor,
                      transform: 'translateY(-1px)',
                    }}
                    _active={{
                      transform: 'translateY(0)',
                    }}
                    borderRadius="8px"
                    transition="all 0.2s ease"
                  >
                    {showAllTags ? 'Show Less' : `Show All (${processedTags.length})`}
                  </Button>
                </HStack>
              )}
            </VStack>
          </CardBody>
        </Card>
      </Collapse>
    </MotionBox>
  );
};

export default MangaTagFilter;
