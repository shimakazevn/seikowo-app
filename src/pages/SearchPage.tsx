import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Heading,
  Select,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
  IconButton,
  Flex,
  SimpleGrid,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';
import { getCachedData, setCachedData, CACHE_KEYS } from '../utils/cache';
import { openDatabase } from '../utils/indexedDBUtils';
import PostCard from '../components/HomePage/PostCard';

interface Post {
  id: string;
  title: string;
  content: string;
  published: string;
  url: string;
  labels?: string[];
  excerpt?: string;
  relevanceScore?: number;
}

interface SearchFilters {
  tags: string[];
  sortBy: 'relevance' | 'date' | 'title';
}

// Constants
const SEARCH_HISTORY_KEY = 'search_history';
const MAX_SEARCH_HISTORY = 20;
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

// Helper functions
const calculateRelevanceScore = (query: string, post: Post): number => {
  const queryLower = query.toLowerCase();
  const titleLower = post.title.toLowerCase();
  const contentLower = post.content.toLowerCase();
  
  let score = 0;
  
  // Title matches are more important
  if (titleLower.includes(queryLower)) score += 10;
  if (contentLower.includes(queryLower)) score += 5;
  
  // Exact matches get higher scores
  if (titleLower === queryLower) score += 20;
  
  // Tag matches
  if (post.labels) {
    post.labels.forEach(label => {
      if (label.toLowerCase().includes(queryLower)) score += 3;
    });
  }
  
  return score;
};

const extractTextFromHtml = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    tags: [],
    sortBy: 'relevance'
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  const toast = useToast();
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.900', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Load cached posts and extract tags
  const loadAvailableTags = useCallback(async () => {
    try {
      const cachedPosts = await getCachedData(CACHE_KEYS.ATOM_POSTS);
      if (cachedPosts && cachedPosts.items) {
        const allTags = new Set<string>();
        cachedPosts.items.forEach((post: any) => {
          if (post.labels) {
            post.labels.forEach((label: string) => allTags.add(label));
          }
        });
        setAvailableTags(Array.from(allTags).sort());
      }
    } catch (error) {
      console.error('Error loading available tags:', error);
    }
  }, []);

  // Load recent searches
  const loadRecentSearches = useCallback(async () => {
    try {
      const db = await openDatabase();
      const tx = db.transaction('search', 'readonly');
      const store = tx.objectStore('search');
      const history = await store.get(SEARCH_HISTORY_KEY);
      if (history && Array.isArray(history.value)) {
        setRecentSearches(history.value);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, []);

  // Save search to history
  const saveSearchToHistory = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    try {
      const db = await openDatabase();
      const tx = db.transaction('search', 'readwrite');
      const store = tx.objectStore('search');
      
      const history = await store.get(SEARCH_HISTORY_KEY);
      let searches = history?.value || [];
      
      // Remove if already exists and add to front
      searches = searches.filter((s: string) => s !== query);
      searches.unshift(query);
      
      // Keep only recent searches
      searches = searches.slice(0, MAX_SEARCH_HISTORY);
      
      await store.put({
        id: SEARCH_HISTORY_KEY,
        value: searches,
        timestamp: Date.now()
      });
      
      setRecentSearches(searches);
    } catch (error) {
      console.error('Error saving search to history:', error);
    }
  }, []);

  // Perform search in cached data
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cacheKey = `search_${query}`;
      const cachedSearch = await getCachedData(cacheKey as any);
      
      if (cachedSearch && cachedSearch.timestamp) {
        const isCacheValid = (Date.now() - cachedSearch.timestamp) < CACHE_DURATION;
        if (isCacheValid) {
          setSearchResults(cachedSearch.results);
          setIsLoading(false);
          return;
        }
      }

      // Search in cached posts
      const cachedPosts = await getCachedData(CACHE_KEYS.ATOM_POSTS);
      if (!cachedPosts || !cachedPosts.items) {
        setError('không có dữ liệu để tìm kiếm. vui lòng tải lại trang.');
        setIsLoading(false);
        return;
      }

      const queryLower = query.toLowerCase();
      const results: Post[] = [];

      cachedPosts.items.forEach((post: any) => {
        const titleMatch = post.title.toLowerCase().includes(queryLower);
        const contentMatch = extractTextFromHtml(post.content).toLowerCase().includes(queryLower);
        const tagMatch = post.labels?.some((label: string) => 
          label.toLowerCase().includes(queryLower)
        );

        if (titleMatch || contentMatch || tagMatch) {
          const relevanceScore = calculateRelevanceScore(query, post);
          results.push({
            ...post,
            excerpt: extractTextFromHtml(post.content).substring(0, 200) + '...',
            relevanceScore
          });
        }
      });

      // Apply filters
      let filteredResults = results;

      // Filter by tags
      if (filters.tags.length > 0) {
        filteredResults = results.filter(post => 
          post.labels?.some(label => filters.tags.includes(label))
        );
      }

      // Sort results
      switch (filters.sortBy) {
        case 'relevance':
          filteredResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
          break;
        case 'date':
          filteredResults.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
          break;
        case 'title':
          filteredResults.sort((a, b) => a.title.localeCompare(b.title));
          break;
      }

      // Cache results
      setCachedData(cacheKey as any, {
        results: filteredResults,
        timestamp: Date.now()
      });

      setSearchResults(filteredResults);
      await saveSearchToHistory(query);
      
    } catch (error) {
      console.error('Search error:', error);
      setError('có lỗi xảy ra khi tìm kiếm');
    } finally {
      setIsLoading(false);
    }
  }, [filters, saveSearchToHistory]);

  // Initialize
  useEffect(() => {
    loadAvailableTags();
    loadRecentSearches();
  }, [loadAvailableTags, loadRecentSearches]);

  // Search when query changes
  useEffect(() => {
    const query = searchParams.get('q');
    if (query && query !== searchQuery) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams, performSearch]);

  // Handle search input
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
      performSearch(searchQuery.trim());
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchParams({});
  };

  // Handle recent search click
  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    setSearchParams({ q: query });
    performSearch(query);
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="xl" color={textColor} mb={2}>
            tìm kiếm bài viết
          </Heading>
          <Text color={mutedTextColor}>
            tìm kiếm trong {availableTags.length} chủ đề có sẵn
          </Text>
        </Box>

        {/* Search Form */}
        <Box as="form" onSubmit={handleSearchSubmit}>
          <InputGroup size="lg">
            <InputLeftElement>
              <SearchIcon color={mutedTextColor} />
            </InputLeftElement>
            <Input
              placeholder="nhập từ khóa tìm kiếm..."
              value={searchQuery}
              onChange={handleSearchInput}
              bg={bgColor}
              borderColor={borderColor}
              _focus={{
                borderColor: 'blue.500',
                boxShadow: '0 0 0 1px blue.500'
              }}
            />
            {searchQuery && (
              <InputRightElement>
                <IconButton
                  aria-label="clear search"
                  icon={<CloseIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={handleClearSearch}
                />
              </InputRightElement>
            )}
          </InputGroup>
        </Box>

        {/* Filters */}
        {searchQuery && (
          <HStack spacing={4} wrap="wrap">
            <Select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              width="200px"
              size="sm"
            >
              <option value="relevance">độ liên quan</option>
              <option value="date">ngày đăng</option>
              <option value="title">tiêu đề</option>
            </Select>
          </HStack>
        )}

        {/* Recent Searches */}
        {!searchQuery && recentSearches.length > 0 && (
          <Box>
            <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={4}>
              tìm kiếm gần đây
            </Text>
            <Wrap spacing={2}>
              {recentSearches.slice(0, 10).map((search, index) => (
                <WrapItem key={index}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRecentSearchClick(search)}
                    leftIcon={<SearchIcon />}
                  >
                    {search}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>
          </Box>
        )}

        {/* Loading */}
        {isLoading && (
          <Flex justify="center" py={8}>
            <Spinner size="lg" color="blue.500" />
          </Flex>
        )}

        {/* Error */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {searchQuery && !isLoading && (
          <Box>
            <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={4}>
              {searchResults.length > 0
                ? `tìm thấy ${searchResults.length} kết quả cho "${searchQuery}"`
                : `không tìm thấy kết quả cho "${searchQuery}"`
              }
            </Text>

            {searchResults.length > 0 && (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {searchResults.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </SimpleGrid>
            )}
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default SearchPage;
