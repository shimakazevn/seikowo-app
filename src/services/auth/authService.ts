import { AuthTokens } from '../../types/auth';
import { User } from '../../types/global';
import { googleAuthService } from './googleAuthService';

export class AuthService {
  private static instance: AuthService;
  private tokens: AuthTokens | null = null;
  private user: User | null = null;

  private constructor() {
    // Initialize from localStorage if available
    const storedTokens = localStorage.getItem('auth_tokens');
    const storedUser = localStorage.getItem('user');
    if (storedTokens) {
      this.tokens = JSON.parse(storedTokens);
    }
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async loginWithGoogle(): Promise<User> {
    try {
      const response = await googleAuthService.login();
      
      // Store the tokens
      this.tokens = {
        accessToken: response.access_token,
        expiresAt: Date.now() + (response.expires_in * 1000)
      };
      localStorage.setItem('auth_tokens', JSON.stringify(this.tokens));

      // Get user info from Google
      const userInfo = await this.getGoogleUserInfo();
      
      // Create or update user in our system
      this.user = await this.createOrUpdateUser(userInfo);
      localStorage.setItem('user', JSON.stringify(this.user));
      
      return this.user;
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await googleAuthService.logout();
    } catch (error) {
      console.error('Google logout failed:', error);
    } finally {
      // Clear local state regardless of Google logout success
      this.tokens = null;
      this.user = null;
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('user');
    }
  }

  private async getGoogleUserInfo(): Promise<any> {
    if (!this.tokens?.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${this.tokens.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return response.json();
  }

  private async createOrUpdateUser(googleUser: any): Promise<User> {
    // Create a user object matching the User interface
    return {
      sub: googleUser.sub,
      name: googleUser.name,
      given_name: googleUser.given_name,
      family_name: googleUser.family_name,
      picture: googleUser.picture,
      email: googleUser.email,
      email_verified: googleUser.email_verified,
      locale: googleUser.locale,
      id: googleUser.sub,
      updatedAt: Date.now()
    };
  }

  getCurrentUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.tokens?.accessToken;
  }

  getAccessToken(): string | null {
    return this.tokens?.accessToken || null;
  }
}

export const authService = AuthService.getInstance();

