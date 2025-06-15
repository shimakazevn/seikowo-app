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
    console.log(`[fetchBloggerApi] Fetching: ${url}`);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BlogReader/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      // Log chi tiết hơn cho lỗi 404
      if (response.status === 404) {
        console.error(`[fetchBloggerApi] Resource not found: ${url}`);
        console.error(`[fetchBloggerApi] Endpoint: ${endpoint}`);
        console.error(`[fetchBloggerApi] Params:`, params);
        console.error(`[fetchBloggerApi] Config:`, config);
        
        // Kiểm tra nếu là lỗi fetch bài viết
        if (endpoint.includes('/posts/')) {
          const postId = endpoint.split('/posts/')[1];
          console.error(`[fetchBloggerApi] Post ID: ${postId} not found or inaccessible`);
          throw new Error(`Bài viết không tồn tại hoặc không có quyền truy cập (ID: ${postId})`);
        }
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`[fetchBloggerApi] Request timeout for: ${url}`);
        throw new Error('Yêu cầu quá thời gian chờ');
      }
      
      // Nếu là lỗi 404 đã được xử lý ở trên
      if (error.message.includes('Bài viết không tồn tại')) {
        throw error;
      }
      
      console.error(`[fetchBloggerApi] Error fetching ${url}:`, error);
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

// Thêm cache cho token validation
const tokenCache = {
  token: null as string | null,
  expiresAt: 0,
  isValidating: false,
  lastFetch: 0
};

const TOKEN_CACHE_DURATION = 5000; // 5 giây cooldown
const TOKEN_VALIDATION_DURATION = 3600000; // 1 giờ

/**
 * Get the appropriate API URL based on environment
 * @param endpoint - The API endpoint
 * @param params - URL parameters
 * @returns The URL to fetch from
 */
export function getBloggerApiUrl(endpoint: string, params: Record<string, string | number> = {}): string {
  const isDev = import.meta.env.DEV;
  const baseUrl = 'https://www.googleapis.com';
  
  // Ensure endpoint starts with a slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Remove /blogger/v3 if it exists in the endpoint since we'll add it back
  const endpointWithoutVersion = cleanEndpoint.replace('/blogger/v3', '');
  
  // Construct the full URL with /blogger/v3
  const targetUrl = new URL(`/blogger/v3${endpointWithoutVersion}`, baseUrl).toString();
  
  // Add parameters
  const url = new URL(targetUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value.toString());
  });
  
  const finalUrl = url.toString();
  if (isDev) {
    // Development: Use Vite proxy
    const proxyUrl = `/api/blogger?url=${encodeURIComponent(finalUrl)}`;
    console.log('[getBloggerApiUrl] Original URL:', finalUrl);
    console.log('[getBloggerApiUrl] Proxy URL:', proxyUrl);
    return proxyUrl;
  }
  
  // Production: Direct API call
  return finalUrl;
}

export async function fetchWithAuth(url: string, options?: FetchWithAuthOptions): Promise<Response> {
  const { retryCount = 0, ...fetchOptions } = options || {};
  const userStore = useUserStore.getState();
  const now = Date.now();

  // Kiểm tra cache và cooldown
  if (tokenCache.isValidating) {
    // Đợi tối đa 5 giây nếu đang validate
    for (let i = 0; i < 50; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!tokenCache.isValidating) {
        break;
      }
    }
  }

  // Nếu cache còn hạn và chưa hết cooldown
  if (tokenCache.token && 
      tokenCache.expiresAt > now && 
      now - tokenCache.lastFetch < TOKEN_CACHE_DURATION) {
    console.log('[fetchWithAuth] Using cached token');
    const headers = {
      ...fetchOptions.headers,
      'Authorization': `Bearer ${tokenCache.token}`,
    };
    return fetch(url, { ...fetchOptions, headers });
  }

  try {
    // Bắt đầu validate token mới
    tokenCache.isValidating = true;
    tokenCache.lastFetch = now;

    const accessToken = await userStore.getValidAccessToken();

    if (!accessToken) {
      console.warn('[fetchWithAuth] No valid access token available. Request will proceed without auth.');
      tokenCache.isValidating = false;
      tokenCache.token = null;
      tokenCache.expiresAt = 0;
      return fetch(url, fetchOptions);
    }

    // Cache token mới
    tokenCache.token = accessToken;
    tokenCache.expiresAt = now + TOKEN_VALIDATION_DURATION;
    tokenCache.isValidating = false;

    const headers = {
      ...fetchOptions.headers,
      'Authorization': `Bearer ${accessToken}`,
    };

    // Kiểm tra nếu là API Blogger
    let targetUrl = url;
    if (url.includes('googleapis.com/blogger/v3')) {
      try {
        // Parse URL để lấy endpoint và params
        const urlObj = new URL(url);
        const endpoint = urlObj.pathname.replace('/blogger/v3', '');
        const params = Object.fromEntries(urlObj.searchParams.entries());
        targetUrl = getBloggerApiUrl(endpoint, params);
        console.log('[fetchWithAuth] Using proxy for Blogger API:', {
          originalUrl: url,
          proxyUrl: targetUrl
        });
      } catch (error) {
        console.error('[fetchWithAuth] Error parsing Blogger API URL:', error);
        throw new Error('Invalid Blogger API URL');
      }
    }

    const response = await fetch(targetUrl, { ...fetchOptions, headers });

    // If response is 401 Unauthorized and it's the first attempt, try to refresh token and retry
    if (response.status === 401 && retryCount < MAX_RETRIES) {
      console.warn('[fetchWithAuth] Access token expired or invalid. Attempting to refresh and retry...');
      // Clear cache khi token hết hạn
      tokenCache.token = null;
      tokenCache.expiresAt = 0;
      tokenCache.isValidating = false;

      const newAccessToken = await userStore.getValidAccessToken();

      if (newAccessToken) {
        console.log('[fetchWithAuth] Token refreshed successfully. Retrying request...');
        // Cache token mới
        tokenCache.token = newAccessToken;
        tokenCache.expiresAt = now + TOKEN_VALIDATION_DURATION;
        return fetchWithAuth(url, { ...options, retryCount: retryCount + 1 });
      } else {
        console.error('[fetchWithAuth] Failed to refresh token. User will be logged out.');
        await userStore.logout();
        throw new Error('Unauthorized: Failed to refresh token.');
      }
    }

    return response;
  } catch (error: any) {
    console.error('[fetchWithAuth] Error during authenticated fetch:', error);
    // Clear cache khi có lỗi
    tokenCache.token = null;
    tokenCache.expiresAt = 0;
    tokenCache.isValidating = false;

    if (error.message.includes('Unauthorized')) {
      await userStore.logout();
    }
    throw error;
  }
}
