/**
 * API utilities for handling environment-aware requests
 * In development: Uses Vite proxy to bypass CORS
 * In production: Direct API calls
 */

import useUserStore from '../store/useUserStore';

export interface ApiConfig {
  baseUrl: string;
  maxResults?: number;
  timeout?: number;
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  baseUrl: 'https://seikowo-app.blogspot.com',
  maxResults: 80,
  timeout: 10000
};

/**
 * Get the appropriate fetch URL based on environment
 * @param endpoint - The API endpoint (e.g., '/feeds/posts/default')
 * @param params - URL search parameters
 * @param config - API configuration
 * @returns The URL to fetch from
 */
export function getApiUrl(
  endpoint: string, 
  params: Record<string, string | number> = {},
  config: ApiConfig = DEFAULT_API_CONFIG
): string {
  const isDev = import.meta.env.DEV;
  
  // Build target URL
  const url = new URL(endpoint, config.baseUrl);
  
  // Add default parameters
  url.searchParams.set('alt', 'json');
  if (config.maxResults) {
    url.searchParams.set('max-results', config.maxResults.toString());
  }
  
  // Add custom parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value.toString());
  });
  
  const targetUrl = url.toString();
  if (isDev) {
    // Development: Use Vite proxy
    const encodedUrl = encodeURIComponent(targetUrl);
    const proxyUrl = `/api/blogger-json?url=${encodedUrl}`;
    console.log('🔧 Dev mode - Using proxy:', proxyUrl);
    return proxyUrl;
  } else {
    // Production: Direct API call
    console.log('🚀 Prod mode - Direct call:', targetUrl);
    return targetUrl;
  }
}

/**
 * Fetch data from Blogger API with environment-aware URL handling
 * @param endpoint - The API endpoint
 * @param params - URL parameters
 * @param config - API configuration
 * @returns Promise with the response data
 */
export async function fetchBloggerApi<T = any>(
  endpoint: string,
  params: Record<string, string | number> = {},
  config: ApiConfig = DEFAULT_API_CONFIG
): Promise<T> {
  const url = getApiUrl(endpoint, params, config);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout || 10000);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BlogReader/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    throw error;
  }
}

/**
 * Fetch all posts from the blog
 * @param maxResults - Maximum number of posts to fetch
 * @returns Promise with posts data
 */
export async function fetchAllPosts(maxResults: number = 500) {
  return fetchBloggerApi('/feeds/posts/default', {}, { 
    ...DEFAULT_API_CONFIG, 
    maxResults 
  });
}

/**
 * Fetch posts by label/tag
 * @param label - The label/tag to filter by
 * @param maxResults - Maximum number of posts to fetch
 * @returns Promise with filtered posts data
 */
export async function fetchPostsByLabel(label: string, maxResults: number = 100) {
  return fetchBloggerApi('/feeds/posts/default', {
    'label': label
  }, { 
    ...DEFAULT_API_CONFIG, 
    maxResults 
  });
}

/**
 * Extract categories from posts data
 * @param postsData - The posts data from Blogger API
 * @returns Array of categories with counts
 */
export function extractCategories(postsData: any): Array<{ name: string; count: number }> {
  if (!postsData?.feed?.entry) {
    return [];
  }
  
  const tagCounts: { [key: string]: number } = {};
  
  postsData.feed.entry.forEach((post: any) => {
    if (post.category) {
      post.category.forEach((cat: any) => {
        const tagName = cat.term;
        tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
      });
    }
  });
  
  // Convert to array and sort by count
  return Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get environment info for debugging
 */
export function getEnvironmentInfo() {
  return {
    isDev: import.meta.env.DEV,
    mode: import.meta.env.MODE,
    baseUrl: import.meta.env.BASE_URL,
    prod: import.meta.env.PROD
  };
}

interface FetchWithAuthOptions extends RequestInit {
  retryCount?: number;
}

const MAX_RETRIES = 1; // Only one retry after token refresh

export async function fetchWithAuth(url: string, options?: FetchWithAuthOptions): Promise<Response> {
  const { retryCount = 0, ...fetchOptions } = options || {};
  const userStore = useUserStore.getState();

  try {
    const accessToken = await userStore.getValidAccessToken();

    if (!accessToken) {
      console.warn('[fetchWithAuth] No valid access token available. Request will proceed without auth.');
      // Proceed without token if not available, some endpoints might be public
      return fetch(url, fetchOptions);
    }

    const headers = {
      ...fetchOptions.headers,
      'Authorization': `Bearer ${accessToken}`,
    };

    const response = await fetch(url, { ...fetchOptions, headers });

    // If response is 401 Unauthorized and it's the first attempt, try to refresh token and retry
    if (response.status === 401 && retryCount < MAX_RETRIES) {
      console.warn('[fetchWithAuth] Access token expired or invalid. Attempting to refresh and retry...');
      const newAccessToken = await userStore.getValidAccessToken(); // This will trigger refresh if needed

      if (newAccessToken) {
        console.log('[fetchWithAuth] Token refreshed successfully. Retrying request...');
        return fetchWithAuth(url, { ...options, retryCount: retryCount + 1 });
      } else {
        console.error('[fetchWithAuth] Failed to refresh token. User will be logged out.');
        await userStore.logout(); // Force logout if refresh fails
        throw new Error('Unauthorized: Failed to refresh token.');
      }
    }

    return response;
  } catch (error: any) {
    console.error('[fetchWithAuth] Error during authenticated fetch:', error);
    if (error.message.includes('Unauthorized')) {
      await userStore.logout(); // Force logout if persistent unauthorized error
    }
    throw error;
  }
}
