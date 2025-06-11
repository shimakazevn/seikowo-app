/**
 * Fetch utilities with environment-based strategy
 * Provides consistent fetching behavior across the application
 */

/**
 * Check if we're in development mode
 */
export const isDevelopmentMode = (): boolean => {
  return import.meta.env.DEV;
};

/**
 * Fetch strategy based on environment
 * - Development: Use proxy first, fallback to direct
 * - Production: Use direct fetch only
 */
export interface FetchOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

export interface FetchResult {
  success: boolean;
  data?: string;
  error?: string;
  method: 'proxy' | 'direct' | 'fallback';
}

/**
 * Environment-aware fetch function
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise with fetch result
 */
export const fetchWithEnvironmentStrategy = async (
  url: string, 
  options: FetchOptions = {}
): Promise<FetchResult> => {
  const isDev = isDevelopmentMode();
  const defaultHeaders = {
    'Accept': 'application/atom+xml, application/xml, text/xml, */*',
    'User-Agent': 'Mozilla/5.0 (compatible; BlogReader/1.0)',
    ...options.headers
  };

  console.log(`🌍 Environment: ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'}`);
  console.log(`🔄 Fetching: ${url}`);

  if (isDev) {
    // DEVELOPMENT: Try proxy first
    console.log('🔧 DEV MODE: Using proxy first...');
    
    try {
      const proxyUrl = `/api/atom-proxy?url=${encodeURIComponent(url)}`;
      console.log('🌐 Proxy URL:', proxyUrl);
      
      const response = await fetch(proxyUrl, {
        headers: defaultHeaders,
        signal: options.timeout ? AbortSignal.timeout(options.timeout) : undefined
      });

      if (response.ok) {
        const data = await response.text();
        console.log('✅ Proxy fetch successful');
        return {
          success: true,
          data,
          method: 'proxy'
        };
      } else {
        console.warn(`❌ Proxy fetch failed: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      console.warn(`❌ Proxy fetch error: ${error.message}`);
    }

    // Fallback to direct fetch in development
    console.log('🔄 Proxy failed, trying direct fetch as fallback...');
    try {
      const response = await fetch(url, {
        headers: defaultHeaders,
        signal: options.timeout ? AbortSignal.timeout(options.timeout) : undefined
      });

      if (response.ok) {
        const data = await response.text();
        console.log('✅ Direct fetch fallback successful');
        return {
          success: true,
          data,
          method: 'fallback'
        };
      } else {
        console.warn(`❌ Direct fetch fallback failed: ${response.status} ${response.statusText}`);
        return {
          success: false,
          error: `Direct fetch failed: ${response.status} ${response.statusText}`,
          method: 'fallback'
        };
      }
    } catch (error: any) {
      console.warn(`❌ Direct fetch fallback error: ${error.message}`);
      return {
        success: false,
        error: `Direct fetch error: ${error.message}`,
        method: 'fallback'
      };
    }
  } else {
    // PRODUCTION: Use direct fetch only
    console.log('🚀 PRODUCTION MODE: Using direct fetch...');
    
    try {
      const response = await fetch(url, {
        headers: defaultHeaders,
        signal: options.timeout ? AbortSignal.timeout(options.timeout) : undefined
      });

      if (response.ok) {
        const data = await response.text();
        console.log('✅ Direct fetch successful');
        return {
          success: true,
          data,
          method: 'direct'
        };
      } else {
        console.warn(`❌ Direct fetch failed: ${response.status} ${response.statusText}`);
        return {
          success: false,
          error: `Direct fetch failed: ${response.status} ${response.statusText}`,
          method: 'direct'
        };
      }
    } catch (error: any) {
      console.warn(`❌ Direct fetch error: ${error.message}`);
      return {
        success: false,
        error: `Direct fetch error: ${error.message}`,
        method: 'direct'
      };
    }
  }
};

/**
 * Log environment strategy for debugging
 */
export const logEnvironmentStrategy = () => {
  const isDev = isDevelopmentMode();
  console.log(`
🌍 FETCH STRATEGY:
- Environment: ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'}
- Strategy: ${isDev ? 'Proxy first → Direct fallback' : 'Direct only'}
- Proxy available: ${isDev ? 'Yes' : 'No'}
  `);
};
