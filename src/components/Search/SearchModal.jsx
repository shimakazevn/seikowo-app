import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  Input,
  VStack,
  HStack,
  Text,
  Box,
  IconButton,
  useColorModeValue,
  Tag,
  TagLabel,
  TagCloseButton,
  Select,
  Button,
  Divider,
  useDisclosure,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  Portal,
  Spinner,
  Skeleton,
  SkeletonText,
  Image,
  useBreakpointValue,
  useToast,
} from '@chakra-ui/react';
import { SearchIcon, CalendarIcon, ChevronDownIcon, DeleteIcon } from '@chakra-ui/icons';
import { DateRangePicker } from 'react-date-range';
import { AutoSizer, List } from 'react-virtualized';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import useSearchStore from '../../store/useSearchStore';
import { Link } from 'react-router-dom';
import { getSlugFromUrl } from '../../utils/blogUtils';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

// Constants
const SEARCH_HISTORY_KEY = 'search_history';
const SEARCH_KEYWORDS_KEY = 'search_keywords';
const MAX_SEARCH_HISTORY = 50;
const MAX_KEYWORDS_HISTORY = 10;
const SEARCH_CACHE_KEY = 'search_cache';
const MAX_CACHE_ITEMS = 10;
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

// Validation constants
const SPECIAL_CHARS_REGEX = /[!@#$%^&*(),.?":{}|<>]/g;

// Helper functions
function extractThumbnail(post) {
  if (!post) return null;
  if (post.images && post.images.length > 0 && post.images[0].url) {
    return post.images[0].url;
  }
  if (post.featuredImage) {
    return post.featuredImage;
  }
  if (post.content) {
    const match = post.content.match(/<img[^>]+src=["']([^"'>]+)["']/i);
    if (match && match[1]) return match[1];
  }
  return null;
}

// Custom hook for search validation
const useSearchValidation = () => {
  const validateAndCleanQuery = (query) => {
    // Remove special characters and extra spaces
    return query
      .replace(SPECIAL_CHARS_REGEX, '')
      .trim()
      .replace(/\s+/g, ' ');
  };

  return { validateAndCleanQuery };
};

// Custom hooks
const useSearchHandlers = (store) => {
  const {
    filters,
    setFilters,
    performSearch,
    setSearchQuery,
  } = store;

  const { validateAndCleanQuery } = useSearchValidation();

  const handleSearch = useMemo(() => (e) => {
    const cleanedQuery = validateAndCleanQuery(e.target.value);
    setSearchQuery(cleanedQuery);
  }, [setSearchQuery, validateAndCleanQuery]);

  const handleTagClick = useMemo(() => (tag) => {
    const cleanedTag = validateAndCleanQuery(tag);
    if (cleanedTag && !filters.tags.includes(cleanedTag)) {
      setFilters({ tags: [...filters.tags, cleanedTag] });
    }
  }, [filters.tags, setFilters, validateAndCleanQuery]);

  const handleTagRemove = useMemo(() => (tagToRemove) => {
    setFilters({ tags: filters.tags.filter(tag => tag !== tagToRemove) });
  }, [filters.tags, setFilters]);

  const handleSortChange = useMemo(() => (e) => {
    setFilters({ sortBy: e.target.value });
  }, [setFilters]);

  return {
    handleSearch,
    handleTagClick,
    handleTagRemove,
    handleSortChange,
  };
};

// Custom hook for managing search history
const useSearchHistory = () => {
  const toast = useToast();
  const saveKeywordTimeoutRef = useRef(null);

  const saveSearchKeyword = useCallback((keyword) => {
    if (!keyword?.trim()) return;
    
    // Clear any existing timeout
    if (saveKeywordTimeoutRef.current) {
      clearTimeout(saveKeywordTimeoutRef.current);
    }

    // Set new timeout to save keyword after 3 seconds
    saveKeywordTimeoutRef.current = setTimeout(() => {
      try {
        const keywords = JSON.parse(localStorage.getItem(SEARCH_KEYWORDS_KEY) || '[]');
        const cleanKeyword = keyword.trim();
        
        // Remove if keyword already exists
        const index = keywords.indexOf(cleanKeyword);
        if (index > -1) {
          keywords.splice(index, 1);
        }
        
        // Add to beginning of array
        keywords.unshift(cleanKeyword);
        
        // Keep only latest MAX_KEYWORDS_HISTORY items
        if (keywords.length > MAX_KEYWORDS_HISTORY) {
          keywords.length = MAX_KEYWORDS_HISTORY;
        }
        
        localStorage.setItem(SEARCH_KEYWORDS_KEY, JSON.stringify(keywords));
      } catch (error) {
        console.error('Error saving search keyword:', error);
      }
    }, 3000); // 3 seconds delay
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveKeywordTimeoutRef.current) {
        clearTimeout(saveKeywordTimeoutRef.current);
      }
    };
  }, []);

  const getSearchKeywords = () => {
    try {
      const keywords = JSON.parse(localStorage.getItem(SEARCH_KEYWORDS_KEY) || '[]');
      return keywords;
    } catch (error) {
      console.error('Error reading search keywords:', error);
      return [];
    }
  };

  const saveSearchResult = (query, results) => {
    if (!query || !results) return;
    
    try {
      // First save the search keyword
      saveSearchKeyword(query);
      
      const history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
      const timestamp = new Date().toISOString();
      
      // Check if query already exists
      const existingIndex = history.findIndex(item => item.query === query);
      if (existingIndex !== -1) {
        // Update existing entry
        history[existingIndex] = {
          query,
          results,
          timestamp
        };
      } else {
        // Add new entry
        history.unshift({
          query,
          results,
          timestamp,
        });
      }

      // Keep only the latest MAX_SEARCH_HISTORY items
      if (history.length > MAX_SEARCH_HISTORY) {
        history.length = MAX_SEARCH_HISTORY;
      }

      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving search history:', error);
      toast({
        title: 'Error saving search history',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getSearchHistory = () => {
    try {
      return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
    } catch (error) {
      console.error('Error reading search history:', error);
      return [];
    }
  };

  const getPreviousResults = (query) => {
    if (!query) return null;
    const history = getSearchHistory();
    const searchItem = history.find(item => item.query === query);
    return searchItem?.results || null;
  };

  const clearSearchHistory = () => {
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
      toast({
        title: 'Search history cleared',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error clearing search history:', error);
      toast({
        title: 'Error clearing search history',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return {
    saveSearchKeyword,
    getSearchKeywords,
    saveSearchResult,
    getSearchHistory,
    getPreviousResults,
    clearSearchHistory,
  };
};

// Custom hook for search effects
const useSearchEffects = ({ isOpen, searchQuery, isLoading, performSearch, inputRef, filters }) => {
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  return searchTimeoutRef;
};

// Search Results List Component
const SearchResultsList = React.memo(({ searchResults, isLoading }) => {
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const imageBg = useColorModeValue('gray.100', 'gray.700');

  const rowRenderer = ({ index, key, style }) => {
    const post = searchResults[index];
    const thumbnail = extractThumbnail(post);
    const slug = getSlugFromUrl(post.link);

    return (
      <Box key={key} style={style}>
        <Link to={`/post/${slug}`}>
          <HStack
            spacing={4}
            p={2}
            borderRadius="lg"
            _hover={{ bg: hoverBg }}
            transition="all 0.2s"
          >
            <Box
              w="100px"
              h="100px"
              borderRadius="md"
              overflow="hidden"
              bg={imageBg}
              flexShrink={0}
            >
              {thumbnail ? (
                <LazyLoadImage
                  src={thumbnail}
                  alt={post.title}
                  effect="blur"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Box w="100%" h="100%" bg={imageBg} />
              )}
            </Box>
            <VStack align="start" spacing={1} flex={1}>
              <Text
                fontWeight="medium"
                noOfLines={2}
                color={textColor}
              >
                {post.title}
              </Text>
              <Text fontSize="sm" color={textColor} noOfLines={2}>
                {post.excerpt}
              </Text>
            </VStack>
          </HStack>
        </Link>
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Box py={6} textAlign="center">
        <Spinner size="lg" thickness="4px" color="blue.400" speed="0.65s" />
        <Text mt={2} color="gray.500">Đang tìm kiếm...</Text>
        <SkeletonText mt={4} noOfLines={3} spacing={3} skeletonHeight="4" />
      </Box>
    );
  }

  if (searchResults.length === 0) {
    return (
      <Box py={6} textAlign="center">
        <Text color="gray.500">Không tìm thấy kết quả</Text>
      </Box>
    );
  }

  return (
    <Box
      style={{
        height: 'calc(80vh - 200px)',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <AutoSizer>
        {({ width, height }) => (
          <List
            width={width}
            height={height}
            rowCount={searchResults.length}
            rowHeight={140}
            rowRenderer={rowRenderer}
            overscanRowCount={3}
            style={{ 
              WebkitOverflowScrolling: 'touch'
            }}
          />
        )}
      </AutoSizer>
    </Box>
  );
});

const SearchModal = () => {
  const store = useSearchStore();
  const {
    isOpen,
    searchQuery,
    searchResults,
    isLoading,
    error,
    filters,
    openSearch,
    closeSearch,
    setSearchQuery,
    performSearch,
    clearSearch
  } = store;

  const { getSearchKeywords, saveSearchKeyword } = useSearchHistory();
  const [recentSearches, setRecentSearches] = useState([]);
  
  // Load recent searches when modal opens
  useEffect(() => {
    if (isOpen) {
      const keywords = getSearchKeywords();
      setRecentSearches(keywords);
    }
  }, [isOpen]);

  // Save search keyword only after search is performed and has results
  useEffect(() => {
    if (searchResults?.length > 0 && searchQuery?.trim()) {
      saveSearchKeyword(searchQuery);
      setRecentSearches(getSearchKeywords());
    }
  }, [searchResults, searchQuery]);

  const handleRecentSearchClick = useCallback(async (keyword) => {
    try {
      setSearchQuery(keyword);
      await performSearch(keyword);
    } catch (error) {
      console.error('Error performing search:', error);
    }
  }, [setSearchQuery, performSearch]);

  const handleSortChange = useCallback(async (e) => {
    const newSortBy = e.target.value;
    store.setFilters({ sortBy: newSortBy });
    if (searchQuery.trim()) {
      await performSearch(searchQuery);
    }
  }, [store, searchQuery, performSearch]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearSearch();
    }
  }, [isOpen, clearSearch]);

  const inputRef = useRef(null);
  const { isOpen: isDatePickerOpen, onClose: onDatePickerClose, onToggle: onDatePickerToggle } = useDisclosure();

  const handlers = {
    ...useSearchHandlers(store),
    handleSortChange
  };

  const searchTimeoutRef = useSearchEffects({
    isOpen,
    searchQuery,
    isLoading,
    performSearch,
    inputRef,
    filters
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      } else if (e.key === 'Escape') {
        closeSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openSearch, closeSearch]);

  // Theme values
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const imageBg = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const text2Color = useColorModeValue('gray.700', 'gray.500');

  const saveSearchResults = (query, results) => {
    const searchCache = JSON.parse(localStorage.getItem(SEARCH_CACHE_KEY) || '[]');
    const updatedCache = [
      { query, results, timestamp: Date.now() },
      ...searchCache.filter(item => item.query !== query)
    ].slice(0, MAX_CACHE_ITEMS);
    localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(updatedCache));
  };

  const getCachedSearchResults = (query) => {
    const searchCache = JSON.parse(localStorage.getItem(SEARCH_CACHE_KEY) || '[]');
    const searchItem = searchCache.find(item => item.query === query);
    if (searchItem && Date.now() - searchItem.timestamp < CACHE_DURATION) {
      return searchItem;
    }
    return null;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={closeSearch}
      size="xl" 
      isCentered
      scrollBehavior="inside"
      blockScrollOnMount={false}
    >
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent
        backdropFilter="blur(30px)"
        bg={useColorModeValue("rgba(255, 255, 255, 0.48)", "rgba(26, 32, 44, 0.48)")}
        borderRadius="xl"
        boxShadow="xl"
        maxW="800px"
        mx={4}
        maxH="80vh"
        onClick={(e) => e.stopPropagation()}
      >
        <Box p={4}>
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              performSearch(e.target.value);
            }}
            placeholder="Search posts, tags, or content..."
            size="lg"
            variant="filled"
            bg={useColorModeValue("rgba(255, 255, 255, 0.48)", "rgba(26, 32, 44, 0.48)")}
            _hover={{ bg: useColorModeValue("rgba(255,255,255,0.68)", "rgba(26,32,44,0.68)") }}
            _focus={{ bg: useColorModeValue('white', 'gray.600') }}
            _placeholder={{ color: useColorModeValue("rgba(0, 0, 0, 0.68)", "rgba(255, 255, 255, 0.68)") }}
            borderRadius="lg"
          />
          <Text fontSize="xs" color={textColor} mt={2}>
            Press ⌘K to search, Esc to close
          </Text>
        </Box>

        <Divider />

        <Box p={4}>
          <HStack spacing={4} mb={4}>
            <Select
              value={filters.sortBy}
              onChange={handlers.handleSortChange}
              size="sm"
              w="150px"
              borderRadius="lg"
              variant="filled"
              bg={useColorModeValue("rgba(255, 255, 255, 0.48)", "rgba(26, 32, 44, 0.48)")}
              _hover={{ bg: useColorModeValue("rgba(255,255,255,0.68)", "rgba(26,32,44,0.68)") }}
              _focus={{ bg: useColorModeValue("rgba(255,255,255,0.68)", "rgba(26,32,44,0.68)") }}
              _placeholder={{ color: useColorModeValue("rgba(0, 0, 0, 0.68)", "rgba(255, 255, 255, 0.68)") }}
            >
              <option value="title">Tiêu đề</option>
              <option value="date">Ngày đăng</option>
            </Select>
          </HStack>

          {filters.tags.length > 0 && (
            <HStack spacing={2} mb={4} wrap="wrap">
              {filters.tags.map(tag => (
                <Tag
                  key={tag}
                  size="sm"
                  borderRadius="full"
                  variant="subtle"
                  colorScheme="blue"
                >
                  <TagLabel>{tag}</TagLabel>
                  <TagCloseButton onClick={() => handlers.handleTagRemove(tag)} />
                </Tag>
              ))}
            </HStack>
          )}

          {searchQuery.length === 0 && recentSearches.length > 0 && (
            <VStack align="stretch" spacing={2}>
              <Text fontSize="sm" color={textColor}>Recent Searches</Text>
              {recentSearches.map((search, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  justifyContent="flex-start"
                  onClick={() => handleRecentSearchClick(search)}
                  leftIcon={<SearchIcon />}
                  color={text2Color}
                  _hover={{
                    bg: useColorModeValue("rgba(255, 255, 255, 0.68)", "rgba(26, 32, 44, 0.68)"),
                    color: useColorModeValue("black", "gray.200"),
                  }}
                >
                  {search}
                </Button>
              ))}
            </VStack>
          )}

          {searchQuery.length > 0 && (
            <SearchResultsList
              searchResults={searchResults}
              isLoading={isLoading}
            />
          )}
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default SearchModal; 