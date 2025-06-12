import { blogConfig } from './config';
import { getCachedData, setCachedData, CACHE_KEYS } from './utils/cache';
import { ErrorTypes, AppError, handleError } from './utils/errorHandler';
import { DEFAULT_API_CONFIG } from './utils/apiUtils';
import useUserStore from './store/useUserStore'; // Import useUserStore

// Re-export error handling
export { ErrorTypes, AppError, handleError };

// Re-export auth functions
export * from './api/auth';

// Re-export blogger functions
export * from './api/blogger';

// Define interfaces for RSS feed data
interface RssItem {
  guid: string;
  title: string;
  link: string;
  pubDate: string;
  author: string;
  categories?: string[];
  thumbnail?: string;
  description: string;
  content: string;
  enclosure?: { url: string, type: string }[];
}

interface RssFeed {
  status: string;
  feed: { url: string; title: string; link: string; author: string; description: string; image: string; };
  items: RssItem[];
}

interface PageData {
  id: string;
  title: string;
  content: string;
  published: string;
  url: string;
}

interface PageResponse {
  items: PageData[];
}

// Note: Post interface moved to global types

interface PostResponse {
  items: any[];
}

// Additional utility functions
export const getPostUrl = (postId: string): string => {
  return `https://www.blogger.com/blog/post/edit/${blogConfig.blogId}/${postId}`;
};

export const getPageUrl = (pageId: string): string => {
  return `https://www.blogger.com/blog/page/edit/${blogConfig.blogId}/${pageId}`;
};

export const getBlogUrl = (): string => {
  return `https://www.blogger.com/blog/${blogConfig.blogId}`;
};

export const getPostViewUrl = (postId: string): string => {
  return `${DEFAULT_API_CONFIG.baseUrl}/${postId}`;
};

export const getPageViewUrl = (pageId: string): string => {
  return `${DEFAULT_API_CONFIG.baseUrl}/p/${pageId}`;
};

export const getTagUrl = (tag: string): string => {
  return `${DEFAULT_API_CONFIG.baseUrl}/search/label/${encodeURIComponent(tag)}`;
};

export const getYearUrl = (year: number): string => {
  return `${DEFAULT_API_CONFIG.baseUrl}/search?updated-max=${year}-12-31T23:59:59%2B07:00&updated-min=${year}-01-01T00:00:00%2B07:00`;
};

export const getSearchUrl = (keyword: string): string => {
  return `${DEFAULT_API_CONFIG.baseUrl}/search?q=${encodeURIComponent(keyword)}`;
};

// Get ATOM feed URL
export const getAtomUrl = (): string => {
  return `${DEFAULT_API_CONFIG.baseUrl}/feeds/posts/default?alt=atom`;
};

// Get RSS feed URL (for backward compatibility)
export const getRSSUrl = (): string => {
  return `${DEFAULT_API_CONFIG.baseUrl}/feeds/posts/default?alt=rss`;
};

// Define interfaces for ATOM feed data
interface AtomItem {
  guid: string;
  title: string;
  link: string;
  pubDate: string;
  author: string;
  categories?: string[];
  content: string;
}

interface AtomFeed {
  items: AtomItem[];
}

// Parse ATOM XML directly for API
const parseAtomXMLForAPI = (xmlText: string): AtomItem[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Failed to parse ATOM XML');
  }

  const entries = xmlDoc.querySelectorAll('entry');
  const items: AtomItem[] = [];

  entries.forEach((entry) => {
    try {
      const id = entry.querySelector('id')?.textContent || '';
      const title = entry.querySelector('title')?.textContent || '';
      const published = entry.querySelector('published')?.textContent || '';

      // Extract content
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
                           entry.querySelector('author');
      const authorName = authorElement?.textContent || 'Unknown';

      // Extract categories/labels
      const categoryElements = entry.querySelectorAll('category');
      const categories: string[] = [];
      categoryElements.forEach((cat) => {
        const term = cat.getAttribute('term') || cat.getAttribute('label') || cat.textContent;
        if (term) categories.push(term);
      });

      // Clean up ID
      const cleanId = id.includes('.post-') ? id.split('.post-')[1] :
                     id.includes('/') ? id.split('/').pop() || id : id;

      items.push({
        guid: cleanId,
        title: title.trim(),
        content: content.trim(),
        pubDate: published,
        link,
        author: authorName.trim(),
        categories
      });
    } catch (error) {
      console.warn('Error parsing ATOM entry:', error);
    }
  });

  return items;
};

export const getAtomFeed = async (startIndex: number = 1, maxResults: number = 500): Promise<AtomFeed> => {
  try {
    const atomUrl = `${getAtomUrl()}&start-index=${startIndex}&max-results=${maxResults}`;
    const isDevelopment = import.meta.env.DEV;

    if (isDevelopment) {
      // DEVELOPMENT: Try proxy first
      try {
        const proxyUrl = `/api/atom-proxy?url=${encodeURIComponent(atomUrl)}`;
        const response = await fetch(proxyUrl);

        if (response.ok) {
          const xmlText = await response.text();
          const items = parseAtomXMLForAPI(xmlText);
          const result = { items };
          setCachedData(CACHE_KEYS.ATOM, result);
          return result;
        }
      } catch (error: any) {
        console.warn(`Proxy fetch failed: ${error.message}`);
      }

      // Fallback to direct fetch in dev
      try {
        const response = await fetch(atomUrl, {
          headers: {
            'Accept': 'application/atom+xml, application/xml, text/xml, */*'
          }
        });

        if (response.ok) {
          const xmlText = await response.text();
          const items = parseAtomXMLForAPI(xmlText);
          const result = { items };
          setCachedData(CACHE_KEYS.ATOM, result);
          return result;
        }
      } catch (error: any) {
        console.warn(`Direct fetch failed: ${error.message}`);
        throw new Error('Failed to fetch posts. Please check your internet connection and try again.');
      }
    } else {
      // PRODUCTION: Try direct fetch only
      try {
        const response = await fetch(atomUrl, {
          headers: {
            'Accept': 'application/atom+xml, application/xml, text/xml, */*'
          }
        });

        if (response.ok) {
          const xmlText = await response.text();
          const items = parseAtomXMLForAPI(xmlText);
          const result = { items };
          setCachedData(CACHE_KEYS.ATOM, result);
          return result;
        }
      } catch (error: any) {
        console.warn(`Direct fetch failed: ${error.message}`);
        throw new Error('Failed to fetch posts. Please check your internet connection and try again.');
      }
    }

    throw new Error('Failed to fetch posts. Please check your internet connection and try again.');
  } catch (error: any) {
    throw handleError(error);
  }
};

export const getRSSFeed = async (): Promise<RssFeed> => {
  try {
    const cachedData = await getCachedData(CACHE_KEYS.RSS);
    if (cachedData) return cachedData as RssFeed;

    const response = await fetch(getRSSUrl());
    if (!response.ok) {
      throw new AppError(
        ErrorTypes.API_ERROR,
        `RSS API Error: ${response.status}`
      );
    }

    const data: RssFeed = await response.json();
    setCachedData(CACHE_KEYS.RSS, data);
    return data;
  } catch (error: any) {
    throw handleError(error);
  }
};

export const getRSSFeedItems = async (): Promise<RssItem[]> => {
  try {
    const feed = await getRSSFeed();
    return feed.items || [];
  } catch (error: any) {
    throw handleError(error);
  }
};

export const getRSSFeedItem = async (guid: string): Promise<RssItem | undefined> => {
  try {
    const items = await getRSSFeedItems();
    return items.find(item => item.guid === guid);
  } catch (error: any) {
    throw handleError(error);
  }
};

export const getRSSFeedItemsByTag = async (tag: string): Promise<RssItem[]> => {
  try {
    const items = await getRSSFeedItems();
    return items.filter(item =>
      item.categories &&
      item.categories.some(category =>
        category.toLowerCase() === tag.toLowerCase()
      )
    );
  } catch (error: any) {
    throw handleError(error);
  }
};

export const getRSSFeedItemsByYear = async (year: number): Promise<RssItem[]> => {
  try {
    const items = await getRSSFeedItems();
    return items.filter(item => {
      const date = new Date(item.pubDate);
      return date.getFullYear() === year;
    });
  } catch (error: any) {
    throw handleError(error);
  }
};

export const getRSSFeedItemsBySearch = async (keyword: string): Promise<RssItem[]> => {
  try {
    const items = await getRSSFeedItems();
    const searchTerm = keyword.toLowerCase();
    return items.filter(item =>
      item.title.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm)
    );
  } catch (error: any) {
    throw handleError(error);
  }
};

export const fetchPages = async (): Promise<PageResponse> => {
  try {
    const token = await useUserStore.getState().getValidAccessToken();
    const response = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/pages?key=${blogConfig.apiKey}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new AppError(
        ErrorTypes.API_ERROR,
        `Failed to fetch pages: ${response.status}`
      );
    }

    const data: PageResponse = await response.json();
    return data;
  } catch (error: any) {
    throw handleError(error);
  }
};

export const fetchPosts = async (maxResults: number = 10): Promise<PostResponse> => {
  try {
    const token = await useUserStore.getState().getValidAccessToken();
    const response = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/posts?maxResults=${maxResults}&key=${blogConfig.apiKey}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new AppError(
        ErrorTypes.API_ERROR,
        `Failed to fetch posts: ${response.status}`
      );
    }

    const data: PostResponse = await response.json();
    return data;
  } catch (error: any) {
    throw handleError(error);
  }
};

export const fetchPostsByTag = async (label: string): Promise<PostResponse> => {
  try {
    const token = await useUserStore.getState().getValidAccessToken();
    const response = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/posts?labels=${encodeURIComponent(label)}&key=${blogConfig.apiKey}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new AppError(
        ErrorTypes.API_ERROR,
        `Failed to fetch posts by tag: ${response.status}`
      );
    }

    const data: PostResponse = await response.json();
    return data;
  } catch (error: any) {
    throw handleError(error);
  }
};

export async function searchPosts(params: {
  keyword: string;
  tag: string;
  year: string;
  pageToken?: string | null;
  maxResults: number;
}): Promise<PostResponse> {
  try {
    const token = await useUserStore.getState().getValidAccessToken();
    if (!token) {
      throw new AppError(
        ErrorTypes.AUTH_ERROR,
        'No valid token available'
      );
    }

    let url = `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/posts?key=${blogConfig.apiKey}&maxResults=${params.maxResults}`;

    if (params.keyword) {
      url += `&q=${encodeURIComponent(params.keyword)}`;
    }

    if (params.tag) {
      url += `&labels=${encodeURIComponent(params.tag)}`;
    }

    if (params.year) {
      const startDate = `${params.year}-01-01T00:00:00Z`;
      const endDate = `${params.year}-12-31T23:59:59Z`;
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }

    if (params.pageToken) {
      url += `&pageToken=${params.pageToken}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new AppError(
        ErrorTypes.API_ERROR,
        `API error: ${response.status}`
      );
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error searching posts:', error);
    throw error;
  }
}