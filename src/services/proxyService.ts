import { getCachedData, setCachedData, CACHE_KEYS } from '../utils/cache';
import { handleError } from '../api';
import { DEFAULT_API_CONFIG } from '../utils/apiUtils';

// Interfaces
interface FetchPostsSecurelyParams {
  maxResults?: number;
  useCache?: boolean;
  startIndex?: number;
}

interface AtomEntry {
  id: string;
  title: string;
  content: string;
  published: string;
  updated: string;
  link: string;
  url?: string; // For compatibility with PostCard
  slug?: string; // For routing
  author: {
    displayName: string;
  };
  labels: string[];
}

interface AtomFeedResponse {
  items: AtomEntry[];
  nextPageToken?: string | null;
  totalResults?: number;
}

// ATOM feed URL with pagination support
const getAtomFeedUrl = (startIndex: number = 1, maxResults: number = 500): string => {
  return `${DEFAULT_API_CONFIG.baseUrl}/atom.xml?redirect=false&start-index=${startIndex}&max-results=${maxResults}`;
};

// Note: RSS2JSON service handles XML parsing for us, so we don't need parseAtomXML anymore

// Parse ATOM XML directly on client-side
const parseAtomXML = (xmlText: string): AtomEntry[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Failed to parse ATOM XML');
  }

  const entries = xmlDoc.querySelectorAll('entry');
  const items: AtomEntry[] = [];

  entries.forEach((entry) => {
    try {
      // Extract basic info
      const id = entry.querySelector('id')?.textContent || '';
      const title = entry.querySelector('title')?.textContent || '';
      const published = entry.querySelector('published')?.textContent || '';
      const updated = entry.querySelector('updated')?.textContent || '';

      // Extract content (try multiple selectors)
      let content = '';
      const contentElement = entry.querySelector('content[type="html"]') ||
                           entry.querySelector('content') ||
                           entry.querySelector('summary');
      if (contentElement) {
        content = contentElement.textContent || contentElement.innerHTML || '';
      }

      // Extract link
      const linkElement = entry.querySelector('link[rel="alternate"]') ||
                         entry.querySelector('link[type="text/html"]') ||
                         entry.querySelector('link');
      const link = linkElement?.getAttribute('href') || '';

      // Extract author
      const authorElement = entry.querySelector('author name') ||
                           entry.querySelector('author') ||
                           entry.querySelector('dc\\:creator');
      const authorName = authorElement?.textContent || 'Unknown';

      // Extract categories/labels
      const categoryElements = entry.querySelectorAll('category');
      const labels: string[] = [];
      categoryElements.forEach((cat) => {
        const term = cat.getAttribute('term') || cat.getAttribute('label') || cat.textContent;
        if (term) labels.push(term);
      });

      // Clean up ID (remove blog prefix)
      const cleanId = id.includes('.post-') ? id.split('.post-')[1] :
                     id.includes('/') ? id.split('/').pop() || id : id;

      // Generate slug from link - extract year/month/slug from Blogger URL
      // URL format: https://seikowoteam.blogspot.com/2025/06/post-title.html
      let slug = cleanId;
      if (link) {
        try {
          const url = new URL(link);
          const pathParts = url.pathname.split('/').filter(part => part);
          if (pathParts.length >= 3) {
            // Extract year/month/slug from path: ['2025', '06', 'post-title.html']
            const year = pathParts[0];
            const month = pathParts[1];
            const postSlug = pathParts[2].replace('.html', '');
            slug = `${year}/${month}/${postSlug}`;
          } else {
            // Fallback: just use the last part
            slug = pathParts[pathParts.length - 1]?.replace('.html', '') || cleanId;
          }
        } catch (error) {
          // Fallback to cleanId if URL parsing fails
          slug = cleanId;
        }
      }

      items.push({
        id: cleanId,
        title: title.trim(),
        content: content.trim(),
        published,
        updated,
        link,
        url: link, // Add url field for compatibility
        slug, // Add slug field for routing
        author: {
          displayName: authorName.trim()
        },
        labels
      });
    } catch (error) {
      console.warn('Error parsing ATOM entry:', error);
    }
  });

  return items;
};

// Try local Vite proxy (development only)
const fetchViaLocalProxy = async (atomUrl: string, maxResults: number, startIndex: number): Promise<AtomFeedResponse> => {
  const proxyUrl = `/api/atom-proxy?url=${encodeURIComponent(atomUrl)}`;

  const response = await fetch(proxyUrl, {
    headers: {
      'Accept': 'application/atom+xml, application/xml, text/xml, */*'
    }
  });

  if (!response.ok) {
    throw new Error(`Local proxy HTTP ${response.status}: ${response.statusText}`);
  }

  const xmlText = await response.text();
  const items = parseAtomXML(xmlText);

  // Calculate next batch info
  const hasNextPage = items.length === maxResults;
  const nextStartIndex = hasNextPage ? startIndex + maxResults : null;
  const nextPageToken = hasNextPage ? `start_${nextStartIndex}` : null;

  return {
    items,
    totalResults: items.length,
    nextPageToken
  };
};

// Try direct fetch (for production or if CORS is disabled)
const fetchDirectly = async (atomUrl: string, maxResults: number, startIndex: number): Promise<AtomFeedResponse> => {
  const response = await fetch(atomUrl, {
    headers: {
      'Accept': 'application/atom+xml, application/xml, text/xml, */*',
      'User-Agent': 'Mozilla/5.0 (compatible; BlogReader/1.0)'
    }
  });

  if (!response.ok) {
    throw new Error(`Direct fetch HTTP ${response.status}: ${response.statusText}`);
  }

  const xmlText = await response.text();
  const items = parseAtomXML(xmlText);

  // Calculate next batch info
  const hasNextPage = items.length === maxResults;
  const nextStartIndex = hasNextPage ? startIndex + maxResults : null;
  const nextPageToken = hasNextPage ? `start_${nextStartIndex}` : null;

  return {
    items,
    totalResults: items.length,
    nextPageToken
  };
};

// Main fetch function with environment-based strategy
export const fetchPostsViaCORS = async (maxResults: number = 20, startIndex: number = 1): Promise<AtomFeedResponse> => {
  try {
    const atomUrl = getAtomFeedUrl(startIndex, maxResults);
    const isDevelopment = import.meta.env.DEV;

    if (isDevelopment) {
      // DEVELOPMENT: Use proxy first
      try {
        return await fetchViaLocalProxy(atomUrl, maxResults, startIndex);
      } catch (error: any) {
        console.warn(`Local proxy failed: ${error.message}`);
        // Fallback to direct fetch in dev if proxy fails
        try {
          return await fetchDirectly(atomUrl, maxResults, startIndex);
        } catch (directError: any) {
          console.warn(`Direct fetch fallback failed: ${directError.message}`);
          throw new Error('All fetch methods failed. Please check your internet connection and try again.');
        }
      }
    } else {
      // PRODUCTION: Use direct fetch only
      try {
        return await fetchDirectly(atomUrl, maxResults, startIndex);
      } catch (error: any) {
        console.warn(`Direct fetch failed: ${error.message}`);
        throw new Error('Failed to fetch posts. Please check your internet connection and try again.');
      }
    }
  } catch (error: any) {
    console.error('fetchPostsViaCORS failed:', error);
    throw handleError(error);
  }
};

// Mock data generation removed - app will show proper error instead

// Note: Removed bulk fetching functions in favor of proper pagination

// Fetch posts securely with infinity loading support
export const fetchPostsSecurely = async (params: FetchPostsSecurelyParams = {}): Promise<AtomFeedResponse> => {
  const { maxResults = 20, useCache = true, startIndex = 1 } = params;

  try {
    // Create cache key based on start index for infinity loading
    const cacheKey = `${CACHE_KEYS.ATOM_POSTS}_batch_${startIndex}` as any;

    // Check cache first ONLY if enabled
    if (useCache) {
      const cachedData = await getCachedData(cacheKey);
      if (cachedData) {
        return cachedData as AtomFeedResponse;
      }
    }

    // Fetch batch (20 posts)
    const corsData = await fetchPostsViaCORS(maxResults, startIndex);

    // Cache the result for this specific page
    if (useCache) {
      setCachedData(cacheKey, corsData);
    }

    return corsData;
  } catch (error: any) {
    console.error('fetchPostsSecurely failed:', error);
    throw handleError(error);
  }
};

// Fetch large batch for initial load (try to get all posts)
export const fetchInitialBatch = async (maxResults: number = 500): Promise<AtomFeedResponse> => {
  try {
    const cacheKey = `${CACHE_KEYS.ATOM_POSTS}_initial_all` as any;

    const corsData = await fetchPostsViaCORS(maxResults, 1);
    const actualPostsCount = corsData.items?.length || 0;

    // Cache the large batch
    setCachedData(cacheKey, corsData);

    // Also cache as main posts cache for offline use
    setCachedData(CACHE_KEYS.ATOM_POSTS as any, corsData);

    return corsData;
  } catch (error: any) {
    console.error('fetchInitialBatch failed:', error);

    // Try to get from cache as fallback
    try {
      const cacheKey = `${CACHE_KEYS.ATOM_POSTS}_initial_all` as any;
      const cachedData = await getCachedData(cacheKey);
      if (cachedData) {
        return cachedData as AtomFeedResponse;
      }
    } catch (cacheError) {
      console.error('Cache fallback also failed:', cacheError);
    }

    throw handleError(error);
  }
};

// Fetch next batch for infinity loading (DEPRECATED - now only displays from cache)
export const fetchNextBatch = async (currentStartIndex: number, batchSize: number = 20): Promise<AtomFeedResponse> => {
  try {
    const nextStartIndex = currentStartIndex + batchSize;
    return await fetchPostsSecurely({
      maxResults: batchSize,
      startIndex: nextStartIndex,
      useCache: true
    });
  } catch (error: any) {
    console.error('fetchNextBatch failed:', error);
    throw handleError(error);
  }
};

// Enhanced search posts securely - searches across multiple pages for better results
export const searchPostsSecurely = async (params: {
  keyword?: string;
  tag?: string;
  maxResults?: number;
  page?: number;
}): Promise<AtomFeedResponse> => {
  try {
    const { keyword, tag, maxResults = 50, page = 1 } = params;

    // For comprehensive search, fetch more posts (up to 200 posts)
    const searchBatchSize = Math.min(maxResults * 4, 200);
    let allPosts: any[] = [];
    let currentStartIndex = 1;
    let hasMorePosts = true;
    let batchCount = 0;
    const maxBatches = 4; // Limit to prevent infinite loops

    // Fetch multiple batches for comprehensive search
    while (hasMorePosts && batchCount < maxBatches && allPosts.length < searchBatchSize) {
      try {
        const batchPosts = await fetchPostsSecurely({
          maxResults: 50,
          startIndex: currentStartIndex,
          useCache: true
        });

        if (batchPosts.items && batchPosts.items.length > 0) {
          allPosts = [...allPosts, ...batchPosts.items];
          currentStartIndex += batchPosts.items.length;
          hasMorePosts = !!batchPosts.nextPageToken;
          batchCount++;
        } else {
          hasMorePosts = false;
        }
      } catch (batchError) {
        console.warn(`Batch ${batchCount + 1} failed, continuing with current results`);
        hasMorePosts = false;
      }
    }

    let filteredItems = allPosts;

    // Enhanced keyword filtering
    if (keyword && keyword.trim()) {
      const keywordLower = keyword.toLowerCase().trim();
      const keywords = keywordLower.split(/\s+/); // Support multiple keywords

      filteredItems = filteredItems.filter(item => {
        const titleLower = item.title.toLowerCase();
        const contentLower = item.content.toLowerCase();
        const labels = item.labels || [];
        const labelsText = labels.join(' ').toLowerCase();

        // Check if any keyword matches
        return keywords.some(kw =>
          titleLower.includes(kw) ||
          contentLower.includes(kw) ||
          labelsText.includes(kw)
        );
      });
    }

    // Enhanced tag filtering with safety check
    if (tag && tag.trim()) {
      const tagLower = tag.toLowerCase().trim();
      filteredItems = filteredItems.filter(item => {
        const labels = item.labels || [];
        return labels.some((label: string) =>
          label && label.toLowerCase().includes(tagLower)
        );
      });
    }

    // Sort by relevance if keyword search
    if (keyword && keyword.trim()) {
      filteredItems.sort((a, b) => {
        const aScore = calculateSearchRelevance(keyword, a);
        const bScore = calculateSearchRelevance(keyword, b);
        return bScore - aScore;
      });
    }

    // Limit results
    const limitedResults = filteredItems.slice(0, maxResults);

    return {
      items: limitedResults,
      totalResults: limitedResults.length,
      nextPageToken: null // Search results don't have pagination
    };
  } catch (error: any) {
    console.error('searchPostsSecurely failed:', error);
    throw handleError(error);
  }
};

// Helper function to calculate search relevance
const calculateSearchRelevance = (query: string, item: any): number => {
  const queryLower = query.toLowerCase();
  const titleLower = item.title.toLowerCase();
  const contentLower = item.content.toLowerCase();
  const labels = item.labels || [];

  let score = 0;

  // Title matches (highest weight)
  if (titleLower.includes(queryLower)) {
    score += 100;
    if (titleLower.startsWith(queryLower)) score += 50;
  }

  // Label matches (high weight)
  labels.forEach((label: string) => {
    if (label && label.toLowerCase().includes(queryLower)) {
      score += 75;
    }
  });

  // Content matches (lower weight)
  const contentMatches = (contentLower.match(new RegExp(queryLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  score += contentMatches * 10;

  return score;
};

export default {
  fetchPostsSecurely,
  fetchPostsViaCORS,
  fetchNextBatch,
  searchPostsSecurely
};

