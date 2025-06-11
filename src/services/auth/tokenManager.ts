import type { AuthTokens } from '../types/auth';

export class TokenManager {
  private static instance: TokenManager;
  private tokens: AuthTokens | null = null;
  
  private constructor() {}
  
  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  async setTokens(tokens: AuthTokens): Promise<void> {
    this.tokens = tokens;
    await this.saveTokens(tokens);
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.tokens) {
      const tokens = await this.loadTokens();
      if (!tokens) return null;
      this.tokens = tokens;
    }

    if (this.isTokenExpired()) {
      const newToken = await this.refreshAccessToken();
      if (!newToken) return null;
      return newToken;
    }

    return this.tokens.accessToken;
  }

  async refreshAccessToken(): Promise<string | null> {
    if (!this.tokens?.refreshToken) return null;

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: this.tokens.refreshToken,
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const newTokens: AuthTokens = {
        ...this.tokens,
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000)
      };

      await this.setTokens(newTokens);
      return newTokens.accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await this.clearTokens();
      return null;
    }
  }

  async clearTokens(): Promise<void> {
    this.tokens = null;
    try {
      localStorage.removeItem('auth_tokens');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  private isTokenExpired(): boolean {
    if (!this.tokens?.expiresAt) return true;
    // Add 5 minute buffer
    return Date.now() > (this.tokens.expiresAt - 5 * 60 * 1000);
  }

  private async saveTokens(tokens: AuthTokens): Promise<void> {
    try {
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  private async loadTokens(): Promise<AuthTokens | null> {
    try {
      const tokensStr = localStorage.getItem('auth_tokens');
      if (!tokensStr) return null;
      return JSON.parse(tokensStr);
    } catch (error) {
      console.error('Error loading tokens:', error);
      return null;
    }
  }
}
