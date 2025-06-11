import { blogConfig } from '../config';
import { getCachedData, setCachedData, CACHE_KEYS } from '../utils/cache';
import { ErrorTypes, AppError, handleError } from '../api';
import { DEFAULT_API_CONFIG } from '../utils/apiUtils';

// Interfaces
interface FetchPostsParams {
  maxResults?: number;
  pageToken?: string;
  orderBy?: string;
  view?: string;
}

interface FetchPostsByTagParams {
  label: string;
  maxResults?: number;
  pageToken?: string;
  orderBy?: string;
  view?: string;
}

interface SearchPostsParams {
  keyword?: string;
  tag?: string;
  year?: string;
  pageToken?: string;
  maxResults?: number;
}

export interface BloggerResponse {
  items?: any[];
  nextPageToken?: string;
  [key: string]: any;
}

export const fetchPosts = async (params: FetchPostsParams = {}): Promise<BloggerResponse> => {
  const { maxResults = 80, pageToken, orderBy, view } = params;
  try {
    // Try to get from cache first
    const cachedData = await getCachedData(CACHE_KEYS.POSTS);
    if (cachedData) return cachedData as BloggerResponse;

    // Use ATOM feed for better pagination and more posts
    const atomData = await fetchAtomFeed(1, maxResults);

    // Convert ATOM format to Blogger API format
    const convertedData: BloggerResponse = {
      items: atomData.items?.map((item: any) => ({
        id: item.guid,
        title: item.title,
        content: item.content,
        published: item.pubDate,
        updated: item.pubDate,
        url: item.link,
        author: {
          displayName: item.author
        },
        labels: item.categories || []
      })) || [],
      nextPageToken: undefined // ATOM pagination handled via start-index
    };

    // Save to cache
    setCachedData(CACHE_KEYS.POSTS, convertedData);
    return convertedData;
  } catch (error: any) {
    console.error('Failed to fetch posts:', error);
    throw handleError(error);
  }
};

export const fetchPostsByTag = async (params: FetchPostsByTagParams): Promise<BloggerResponse> => {
  const { label, maxResults = 100, pageToken, orderBy, view } = params;
  try {
    const encodedLabel = encodeURIComponent(label);
    let url = `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/posts?key=${blogConfig.apiKey}&labels=${encodedLabel}&maxResults=${maxResults}`;
    if (orderBy) url += `&orderBy=${orderBy}`;
    if (view) url += `&view=${view}`;
    if (pageToken) url += `&pageToken=${pageToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new AppError(
        ErrorTypes.API_ERROR,
        `API Error: ${response.status}`
      );
    }

    return await response.json();
  } catch (error: any) {
    throw handleError(error);
  }
};

export const fetchPages = async (maxResults: number = 50): Promise<BloggerResponse> => {
  try {
    const cachedData = await getCachedData(CACHE_KEYS.PAGES);
    if (cachedData) return cachedData as BloggerResponse;

    const response = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/pages?key=${blogConfig.apiKey}&maxResults=${maxResults}`
    );

    if (!response.ok) {
      throw new AppError(
        ErrorTypes.API_ERROR,
        `API Error: ${response.status}`
      );
    }

    const data = await response.json();
    setCachedData(CACHE_KEYS.PAGES, data);
    return data;
  } catch (error: any) {
    throw handleError(error);
  }
};

export const searchPosts = async (params: SearchPostsParams): Promise<BloggerResponse> => {
  try {
    const { keyword, tag, year, pageToken, maxResults = 10 } = params;
    let url = `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/posts/search?key=${blogConfig.apiKey}&maxResults=${maxResults}`;

    if (keyword) url += `&q=${encodeURIComponent(keyword.trim())}`;
    if (tag) url += `&labels=${encodeURIComponent(tag)}`;
    if (year) {
      url += `&publishedMin=${year}-01-01T00:00:00Z`;
      url += `&publishedMax=${year}-12-31T23:59:59Z`;
    }
    if (pageToken) url += `&pageToken=${pageToken}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new AppError(
        ErrorTypes.API_ERROR,
        `API Error: ${response.status}`
      );
    }

    return await response.json();
  } catch (error: any) {
    throw handleError(error);
  }
};

// Parse ATOM XML directly
const parseAtomXMLForBlogger = (xmlText: string): any[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Failed to parse ATOM XML');
  }

  const entries = xmlDoc.querySelectorAll('entry');
  const items: any[] = [];

  entries.forEach((entry) => {
    try {
      const id = entry.querySelector('id')?.textContent || '';
      const title = entry.querySelector('title')?.textContent || '';
      const published = entry.querySelector('published')?.textContent || '';
      const updated = entry.querySelector('updated')?.textContent || '';

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

export const fetchAtomFeed = async (startIndex: number = 1, maxResults: number = 500): Promise<any> => {
  try {
    const BLOG_ATOM_URL = `${DEFAULT_API_CONFIG.baseUrl}/feeds/posts/default?alt=atom&start-index=${startIndex}&max-results=${maxResults}`;
    const isDevelopment = import.meta.env.DEV;

    if (isDevelopment) {
      // DEVELOPMENT: Try proxy first
      try {
        const proxyUrl = `/api/atom-proxy?url=${encodeURIComponent(BLOG_ATOM_URL)}`;
        const response = await fetch(proxyUrl);

        if (response.ok) {
          const xmlText = await response.text();
          const items = parseAtomXMLForBlogger(xmlText);
          return { items };
        }
      } catch (error: any) {
        console.warn(`Proxy fetch failed: ${error.message}`);
      }

      // Fallback to direct fetch in dev
      try {
        const response = await fetch(BLOG_ATOM_URL, {
          headers: {
            'Accept': 'application/atom+xml, application/xml, text/xml, */*'
          }
        });

        if (response.ok) {
          const xmlText = await response.text();
          const items = parseAtomXMLForBlogger(xmlText);
          return { items };
        }
      } catch (error: any) {
        console.warn(`Direct fetch failed: ${error.message}`);
        throw new Error('Failed to fetch posts. Please check your internet connection and try again.');
      }
    } else {
      // PRODUCTION: Try direct fetch only
      try {
        const response = await fetch(BLOG_ATOM_URL, {
          headers: {
            'Accept': 'application/atom+xml, application/xml, text/xml, */*'
          }
        });

        if (response.ok) {
          const xmlText = await response.text();
          const items = parseAtomXMLForBlogger(xmlText);
          return { items };
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


