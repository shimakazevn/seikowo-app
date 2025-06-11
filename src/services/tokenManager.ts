// Google Token Management Service
// Handles access token storage, refresh, and expiration

interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp
  tokenType: string;
  scope: string;
}

interface UserSession {
  user: {
    id: string;
    email: string;
    name: string;
    picture: string;
  };
  tokens: TokenData;
  lastRefresh: number;
}

class TokenManager {
  private readonly STORAGE_KEY = 'google_session';
  private readonly TOKEN_BUFFER = 5 * 60 * 1000; // 5 minutes buffer before expiry
  private refreshPromise: Promise<string> | null = null;

  // Save session to localStorage
  saveSession(session: UserSession): void {
    try {
      const encrypted = this.encryptSession(session);
      localStorage.setItem(this.STORAGE_KEY, encrypted);
      console.log('[TokenManager] Session saved successfully');
    } catch (error) {
      console.error('[TokenManager] Failed to save session:', error);
    }
  }

  // Get session from localStorage
  getSession(): UserSession | null {
    try {
      const encrypted = localStorage.getItem(this.STORAGE_KEY);
      if (!encrypted) return null;

      const session = this.decryptSession(encrypted);
      
      // Check if session is still valid
      if (this.isSessionExpired(session)) {
        console.log('[TokenManager] Session expired, removing...');
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('[TokenManager] Failed to get session:', error);
      this.clearSession();
      return null;
    }
  }

  // Clear session
  clearSession(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('[TokenManager] Session cleared');
  }

  // Check if access token needs refresh
  needsRefresh(session: UserSession): boolean {
    const now = Date.now();
    const expiresAt = session.tokens.expiresAt;
    
    // Refresh if token expires within buffer time
    return (expiresAt - now) <= this.TOKEN_BUFFER;
  }

  // Check if session is completely expired
  isSessionExpired(session: UserSession): boolean {
    const now = Date.now();
    const expiresAt = session.tokens.expiresAt;
    
    // Session is expired if access token is expired and no refresh token
    return now >= expiresAt && !session.tokens.refreshToken;
  }

  // Get valid access token (refresh if needed)
  async getValidAccessToken(): Promise<string | null> {
    const session = this.getSession();
    if (!session) return null;

    // If token is still valid, return it
    if (!this.needsRefresh(session)) {
      return session.tokens.accessToken;
    }

    // If already refreshing, wait for it
    if (this.refreshPromise) {
      try {
        return await this.refreshPromise;
      } catch (error) {
        console.error('[TokenManager] Refresh promise failed:', error);
        return null;
      }
    }

    // Start refresh process
    this.refreshPromise = this.refreshAccessToken(session);
    
    try {
      const newToken = await this.refreshPromise;
      this.refreshPromise = null;
      return newToken;
    } catch (error) {
      this.refreshPromise = null;
      console.error('[TokenManager] Token refresh failed:', error);
      return null;
    }
  }

  // Refresh access token using gapi
  private async refreshAccessToken(session: UserSession): Promise<string> {
    try {
      console.log('[TokenManager] Refreshing access token...');

      // Use gapi to refresh token
      if (window.gapi && window.gapi.auth2) {
        const authInstance = window.gapi.auth2.getAuthInstance();
        const currentUser = authInstance.currentUser.get();
        
        if (currentUser.isSignedIn()) {
          const authResponse = await currentUser.reloadAuthResponse();
          
          // Update session with new token
          const updatedSession: UserSession = {
            ...session,
            tokens: {
              ...session.tokens,
              accessToken: authResponse.access_token,
              expiresAt: Date.now() + (authResponse.expires_in * 1000),
            },
            lastRefresh: Date.now()
          };
          
          this.saveSession(updatedSession);
          console.log('[TokenManager] Token refreshed successfully');
          return authResponse.access_token;
        }
      }

      // Fallback: Manual refresh using refresh token
      if (session.tokens.refreshToken) {
        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
            refresh_token: session.tokens.refreshToken,
            grant_type: 'refresh_token'
          })
        });

        if (!response.ok) {
          throw new Error(`Token refresh failed: ${response.statusText}`);
        }

        const tokenData = await response.json();
        
        const updatedSession: UserSession = {
          ...session,
          tokens: {
            ...session.tokens,
            accessToken: tokenData.access_token,
            expiresAt: Date.now() + (tokenData.expires_in * 1000),
          },
          lastRefresh: Date.now()
        };
        
        this.saveSession(updatedSession);
        console.log('[TokenManager] Token refreshed via refresh token');
        return tokenData.access_token;
      }

      throw new Error('No refresh method available');
    } catch (error) {
      console.error('[TokenManager] Token refresh failed:', error);
      this.clearSession();
      throw error;
    }
  }

  // Simple encryption for localStorage (basic security)
  private encryptSession(session: UserSession): string {
    const jsonString = JSON.stringify(session);
    return btoa(jsonString); // Base64 encoding (not secure, but better than plain text)
  }

  // Simple decryption
  private decryptSession(encrypted: string): UserSession {
    const jsonString = atob(encrypted);
    return JSON.parse(jsonString);
  }

  // Get token expiry info
  getTokenInfo(): { 
    isValid: boolean; 
    expiresIn: number; 
    expiresAt: Date | null;
    needsRefresh: boolean;
  } {
    const session = this.getSession();
    
    if (!session) {
      return {
        isValid: false,
        expiresIn: 0,
        expiresAt: null,
        needsRefresh: false
      };
    }

    const now = Date.now();
    const expiresAt = new Date(session.tokens.expiresAt);
    const expiresIn = Math.max(0, session.tokens.expiresAt - now);
    
    return {
      isValid: !this.isSessionExpired(session),
      expiresIn,
      expiresAt,
      needsRefresh: this.needsRefresh(session)
    };
  }

  // Auto-refresh token before expiry
  startAutoRefresh(): void {
    const checkInterval = 60 * 1000; // Check every minute
    
    setInterval(async () => {
      const session = this.getSession();
      if (!session) return;

      if (this.needsRefresh(session)) {
        console.log('[TokenManager] Auto-refreshing token...');
        try {
          await this.getValidAccessToken();
        } catch (error) {
          console.error('[TokenManager] Auto-refresh failed:', error);
        }
      }
    }, checkInterval);
  }

  // Manual token validation
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
      return response.ok;
    } catch (error) {
      console.error('[TokenManager] Token validation failed:', error);
      return false;
    }
  }
}

// Global instance
const tokenManager = new TokenManager();

export default tokenManager;
export type { TokenData, UserSession };
