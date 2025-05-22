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
        duration: 2000,
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
    saveSearchResult,
    getSearchHistory,
    getPreviousResults,
    getSearchKeywords,
    saveSearchKeyword,
    clearSearchHistory,
  };
};

// Update useSearchEffects to include caching
const useSearchEffects = ({ isOpen, searchQuery, isLoading, performSearch, inputRef, filters }) => {
  const searchTimeoutRef = useRef(null);
  const prevFiltersRef = useRef(filters);
  const prevQueryRef = useRef(searchQuery);
  const { saveSearchResult } = useSearchHistory();

  // Effect for search query changes
  useEffect(() => {
    if (!isOpen) return;
    
    if (prevQueryRef.current === searchQuery) return;
    prevQueryRef.current = searchQuery;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      useSearchStore.setState({ 
        isLoading: false,
        searchResults: [],
        error: null
      });
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await performSearch(searchQuery);
        if (results && Array.isArray(results)) {
          saveSearchResult(searchQuery, results);
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, isOpen, performSearch, saveSearchResult]);

  // Effect for filter changes
  useEffect(() => {
    if (!isOpen || !searchQuery.trim()) return;
    
    if (JSON.stringify(prevFiltersRef.current) === JSON.stringify(filters)) return;
    prevFiltersRef.current = filters;

    performSearch(searchQuery).catch(error => {
      console.error('Filter search error:', error);
    });
  }, [filters, isOpen, performSearch, searchQuery]);

  // Effect for input focus
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return searchTimeoutRef;
};

const ResultItem = React.memo(({ result, onClose, handleTagClick, hoverBg, imageBg }) => {
  const thumbnail = extractThumbnail(result);
  const maxLabels = useBreakpointValue({ base: 2, sm: 3, md: 4, lg: 5 });
  
  return (
    <Box
      p={3}
      borderRadius="md"
      _hover={{ 
        bg: hoverBg,
        transform: 'translateY(-2px)',
        boxShadow: 'md'
      }}
      transition="all 0.2s ease-in-out"
      as={Link}
      to={`/${result.url.split('/').pop()}`}
      onClick={onClose}
      position="relative"
      display="block"
      width="100%"
      pointerEvents="auto"
      style={{ touchAction: 'pan-y pinch-zoom' }}
    >
      <Box
        display="flex"
        alignItems="flex-start"
        gap={4}
        width="100%"
      >
        <Box
          flexShrink={0}
          width="80px"
          height="120px"
          position="relative"
          borderRadius="md"
          overflow="hidden"
        >
          <Image
            src={thumbnail || 'https://via.placeholder.com/80x120?text=No+Image'}
            alt={result.title}
            width="100%"
            height="100%"
            objectFit="cover"
            bg={imageBg}
            loading="lazy"
          />
        </Box>
        <Box flex="1" minWidth="0">
          <Text 
            fontWeight="semibold"
            mb={2}
            display="block"
            noOfLines={1}
            fontSize="md"
          >
            {result.title}
          </Text>
          <Box
            position="relative"
            maxHeight="3.6em"
            overflow="hidden"
            mb={3}
          >
            <Text 
              fontSize="sm" 
              color="gray.500"
              noOfLines={2}
              sx={{
                lineHeight: '1.4em',
                wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: '2',
                overflow: 'hidden'
              }}
            >
              {result.content.replace(/<[^>]*>/g, '')}
            </Text>
          </Box>
          {result.labels && result.labels.length > 0 && (
            <HStack spacing={2} display="flex" flexWrap="wrap" gap={2}>
              {result.labels.slice(0, maxLabels).map((label) => (
                <Tag
                  key={label}
                  size="sm"
                  variant="subtle"
                  colorScheme="blue"
                  cursor="pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTagClick(label);
                  }}
                  _hover={{
                    bg: 'blue.100'
                  }}
                  transition="background 0.2s ease"
                >
                  {label}
                </Tag>
              ))}
              {result.labels.length > maxLabels && (
                <Tag size="sm" variant="subtle">
                  +{result.labels.length - maxLabels}
                </Tag>
              )}
            </HStack>
          )}
        </Box>
      </Box>
    </Box>
  );
});

const SearchResults = React.memo(({ searchResults, closeSearch, handleTagClick, hoverBg, imageBg }) => {
  const resultsContainerRef = useRef(null);
  const scrollColor = useColorModeValue('gray.300', 'gray.600');
  const scrollTrackColor = useColorModeValue('gray.100', 'gray.700');
  const scrollHoverColor = useColorModeValue('gray.400', 'gray.500');

  const rowRenderer = useMemo(() => ({ index, key, style }) => {
    const result = searchResults[index];
    return (
      <div key={key} style={style}>
        <ResultItem
          result={result}
          onClose={closeSearch}
          handleTagClick={handleTagClick}
          hoverBg={hoverBg}
          imageBg={imageBg}
        />
      </div>
    );
  }, [searchResults, closeSearch, handleTagClick, hoverBg, imageBg]);

  return (
    <Box
      ref={resultsContainerRef}
      height="400px"
      position="relative"
      onClick={(e) => e.stopPropagation()}
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          width: '6px',
          background: scrollTrackColor,
        },
        '&::-webkit-scrollbar-thumb': {
          background: scrollColor,
          borderRadius: '24px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: scrollHoverColor,
        },
        '.ReactVirtualized__Grid': {
          '&:focus': {
            outline: 'none',
          },
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        },
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
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const imageBg = useColorModeValue('gray.100', 'gray.700');

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
        bg={bgColor}
        borderRadius="xl"
        boxShadow="xl"
        maxW="800px"
        mx={4}
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
            bg={useColorModeValue('gray.50', 'gray.700')}
            _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
            _focus={{ bg: useColorModeValue('white', 'gray.600') }}
            borderRadius="lg"
          />
          <Text fontSize="xs" color="gray.500" mt={2}>
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
              <Text fontSize="sm" color="gray.500">Recent Searches</Text>
              {recentSearches.map((search, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  justifyContent="flex-start"
                  onClick={() => handleRecentSearchClick(search)}
                  leftIcon={<SearchIcon />}
                >
                  {search}
                </Button>
              ))}
            </VStack>
          )}

          {searchQuery.length > 0 && (
            isLoading ? (
              <Box py={6} textAlign="center">
                <Spinner size="lg" thickness="4px" color="blue.400" speed="0.65s" />
                <Text mt={2} color="gray.500">Đang tìm kiếm...</Text>
                <SkeletonText mt={4} noOfLines={3} spacing={3} skeletonHeight="4" />
              </Box>
            ) : error ? (
              <Box py={6} textAlign="center">
                <Text color="red.500">{error}</Text>
              </Box>
            ) : searchResults.length === 0 ? (
              <Box py={6} textAlign="center">
                <Text>Không tìm thấy kết quả</Text>
              </Box>
            ) : (
              <SearchResults
                searchResults={searchResults}
                closeSearch={closeSearch}
                handleTagClick={handlers.handleTagClick}
                hoverBg={hoverBg}
                imageBg={imageBg}
              />
            )
          )}
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default SearchModal; 