import { create } from 'zustand';
import { blogConfig } from '../config';
import { fetchPosts } from '../api';

// Helper: strip HTML and normalize text
function normalizeText(str) {
  if (!str) return '';
  // First strip HTML
  const withoutHtml = str.replace(/<[^>]*>/g, ' ')
                         .replace(/&[a-z]+;/gi, ' ')
                         .toLowerCase();
  // Then normalize whitespace
  return withoutHtml.replace(/\s+/g, ' ').trim();
}

// Helper: check if query matches text with word boundaries
function matchesText(text, query) {
  if (!text || !query) return false;
  const words = query.toLowerCase().split(/\s+/);
  const normalizedText = normalizeText(text);
  
  return words.every(word => {
    // Create a regex with word boundaries
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(normalizedText);
  });
}

const useSearchStore = create((set, get) => ({
  isOpen: false,
  searchQuery: '',
  searchResults: [],
  recentSearches: [],
  isLoading: false,
  error: null,
  filters: {
    tags: [],
    dateRange: null,
    sortBy: 'title', // 'title', 'date'
  },

  // Actions
  openSearch: () => set({ isOpen: true }),
  closeSearch: () => {
    set({ 
      isOpen: false,
      error: null,
      isLoading: false 
    });
  },
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),

  // Search function
  performSearch: async (directQuery) => {
    const state = get();
    const query = directQuery || state.searchQuery;
    
    set({ isLoading: true, error: null });

    try {
      // First try to get data from localStorage
      const cachedPosts = localStorage.getItem('cachedPosts');
      const cacheTime = localStorage.getItem('cacheTime');
      let posts = [];

      // Check if cache is older than 1 hour
      const isCacheValid = cacheTime && (Date.now() - parseInt(cacheTime)) < 3600000;

      if (cachedPosts && isCacheValid) {
        posts = JSON.parse(cachedPosts);
      } else {
        // If no cached data or cache is old, fetch from API
        const data = await fetchPosts();
        posts = data.items || [];
        
        // Cache the fetched data
        localStorage.setItem('cachedPosts', JSON.stringify(posts));
        localStorage.setItem('cacheTime', Date.now().toString());
      }

      // Perform search on posts
      const q = query.trim().toLowerCase();
      let results = posts;

      if (q) {
        results = posts.filter(post => {
          const title = post.title || '';
          const content = normalizeText(post.content || '');
          const labels = Array.isArray(post.labels) ? post.labels : [];
          const searchTerms = q.split(/\s+/);

          // Check if any search term matches title, content, or labels
          return searchTerms.some(term => {
            const inTitle = title.toLowerCase().includes(term);
            const inContent = content.includes(term);
            const inLabels = labels.some(label => 
              label.toLowerCase().includes(term)
            );
            return inTitle || inContent || inLabels;
          });
        });
      }

      // Apply filters
      if (state.filters.tags.length > 0) {
        results = results.filter(post => {
          const postLabels = Array.isArray(post.labels) ? post.labels : [];
          return state.filters.tags.every(tag => 
            postLabels.some(label => label.toLowerCase() === tag.toLowerCase())
          );
        });
      }

      // Sort results - always sort by title by default if no specific sort is selected
      if (state.filters.sortBy === 'date') {
        results.sort((a, b) => new Date(b.published) - new Date(a.published));
      } else {
        results.sort((a, b) => a.title.localeCompare(b.title));
      }

      // console.log('Search results:', {
      //   query: q,
      //   totalResults: results.length,
      //   filters: state.filters
      // });

      set({ 
        searchResults: results,
        error: null
      });

      return results;
    } catch (error) {
      console.error('Search error:', error);
      set({ 
        error: 'Failed to perform search: ' + error.message,
        searchResults: []
      });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  // Clear search
  clearSearch: () => set({
    searchQuery: '',
    searchResults: [],
    error: null,
    filters: {
      tags: [],
      dateRange: null,
      sortBy: 'title',
    }
  }),
}));

export default useSearchStore; 