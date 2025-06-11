// Google Token Refresh Implementation
// Demonstrates how Google supports automatic token refresh

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

interface RefreshResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

class GoogleTokenRefresh {
  private clientId: string;
  private clientSecret: string; // Only for server-side apps
  
  constructor() {
    this.clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET || '';
  }

  // Method 1: Using Google API Client Library (Recommended)
  async refreshWithGapi(): Promise<string> {
    try {
      console.log('[TokenRefresh] Refreshing token with gapi...');
      
      // Ensure gapi is loaded
      if (!window.gapi || !window.gapi.auth2) {
        throw new Error('Google API not loaded');
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      const currentUser = authInstance.currentUser.get();
      
      if (!currentUser.isSignedIn()) {
        throw new Error('User not signed in');
      }

      // This automatically handles refresh token logic
      const authResponse = await currentUser.reloadAuthResponse();
      
      console.log('[TokenRefresh] Token refreshed successfully:', {
        access_token: authResponse.access_token.substring(0, 20) + '...',
        expires_in: authResponse.expires_in
      });
      
      return authResponse.access_token;
    } catch (error) {
      console.error('[TokenRefresh] gapi refresh failed:', error);
      throw error;
    }
  }

  // Method 2: Manual refresh using REST API
  async refreshWithRestAPI(refreshToken: string): Promise<RefreshResponse> {
    try {
      console.log('[TokenRefresh] Refreshing token with REST API...');
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[TokenRefresh] REST API refresh failed:', errorData);
        throw new Error(`Token refresh failed: ${errorData.error_description || response.statusText}`);
      }

      const tokenData: RefreshResponse = await response.json();
      
      console.log('[TokenRefresh] Token refreshed successfully:', {
        access_token: tokenData.access_token.substring(0, 20) + '...',
        expires_in: tokenData.expires_in
      });
      
      return tokenData;
    } catch (error) {
      console.error('[TokenRefresh] REST API refresh failed:', error);
      throw error;
    }
  }

  // Method 3: Auto-refresh with retry logic
  async autoRefreshWithRetry(refreshToken: string, maxRetries = 3): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[TokenRefresh] Auto-refresh attempt ${attempt}/${maxRetries}`);
        
        // Try gapi first (preferred method)
        try {
          return await this.refreshWithGapi();
        } catch (gapiError) {
          console.log('[TokenRefresh] gapi failed, trying REST API...');
          
          // Fallback to REST API
          const tokenData = await this.refreshWithRestAPI(refreshToken);
          return tokenData.access_token;
        }
      } catch (error) {
        lastError = error as Error;
        console.error(`[TokenRefresh] Attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`[TokenRefresh] Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('All refresh attempts failed');
  }

  // Check if token needs refresh (5 minutes buffer)
  needsRefresh(expiresAt: number): boolean {
    const now = Date.now();
    const buffer = 5 * 60 * 1000; // 5 minutes
    return (expiresAt - now) <= buffer;
  }

  // Validate token by calling Google API
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
      
      if (!response.ok) {
        return false;
      }
      
      const tokenInfo = await response.json();
      console.log('[TokenRefresh] Token validation result:', {
        audience: tokenInfo.audience,
        scope: tokenInfo.scope,
        expires_in: tokenInfo.expires_in
      });
      
      return true;
    } catch (error) {
      console.error('[TokenRefresh] Token validation failed:', error);
      return false;
    }
  }

  // Get token info (expiry, scope, etc.)
  async getTokenInfo(accessToken: string): Promise<any> {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
      
      if (!response.ok) {
        throw new Error(`Token info request failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[TokenRefresh] Get token info failed:', error);
      throw error;
    }
  }

  // Demo: Complete refresh flow
  async demonstrateRefreshFlow(): Promise<void> {
    console.log('\n=== Google Token Refresh Demo ===');
    
    try {
      // Step 1: Check current token
      console.log('1. Checking current token...');
      const authInstance = window.gapi?.auth2?.getAuthInstance();
      
      if (!authInstance?.isSignedIn?.get()) {
        console.log('❌ User not signed in');
        return;
      }
      
      const currentUser = authInstance.currentUser.get();
      const authResponse = currentUser.getAuthResponse();
      
      console.log('✅ Current token info:', {
        expires_at: new Date(authResponse.expires_at),
        expires_in: Math.floor((authResponse.expires_at - Date.now()) / 1000) + 's',
        needs_refresh: this.needsRefresh(authResponse.expires_at)
      });
      
      // Step 2: Validate current token
      console.log('2. Validating current token...');
      const isValid = await this.validateToken(authResponse.access_token);
      console.log(isValid ? '✅ Token is valid' : '❌ Token is invalid');
      
      // Step 3: Refresh if needed
      if (this.needsRefresh(authResponse.expires_at) || !isValid) {
        console.log('3. Refreshing token...');
        const newToken = await this.refreshWithGapi();
        console.log('✅ Token refreshed successfully');
        
        // Step 4: Validate new token
        console.log('4. Validating new token...');
        const newIsValid = await this.validateToken(newToken);
        console.log(newIsValid ? '✅ New token is valid' : '❌ New token is invalid');
      } else {
        console.log('3. ✅ Token doesn\'t need refresh');
      }
      
    } catch (error) {
      console.error('❌ Refresh flow failed:', error);
    }
  }
}

// Usage example
const tokenRefresh = new GoogleTokenRefresh();

export default tokenRefresh;

// Example usage in component:
/*
const handleApiCall = async () => {
  try {
    // Get valid token (auto-refresh if needed)
    const token = await tokenRefresh.autoRefreshWithRetry(refreshToken);
    
    // Make API call with fresh token
    const response = await fetch('https://www.googleapis.com/blogger/v3/blogs/blogId/posts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('API call successful:', data);
  } catch (error) {
    console.error('API call failed:', error);
  }
};
*/
