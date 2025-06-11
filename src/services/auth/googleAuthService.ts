import { DRIVE_SCOPE } from '../../constants';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

if (!GOOGLE_CLIENT_ID) {
  throw new Error('Google Client ID is not defined in environment variables');
}

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private clientId: string;

  private constructor() {
    this.clientId = GOOGLE_CLIENT_ID;
  }

  static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  async login(): Promise<{ access_token: string; expires_in: number; token_type: string; scope: string }> {
    return new Promise((resolve, reject) => {
      // Load the Google OAuth script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // @ts-ignore - google is loaded from script
        const client = google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: DRIVE_SCOPE,
          callback: (response: any) => {
            if (response.error) {
              reject(new Error(response.error));
              return;
            }
            resolve(response);
          },
        });

        client.requestAccessToken();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Google OAuth script'));
      };
      document.head.appendChild(script);
    });
  }

  async logout(): Promise<void> {
    // @ts-ignore - google is loaded from script
    if (window.google?.accounts?.oauth2?.revoke) {
      const token = localStorage.getItem('auth_tokens');
      if (token) {
        const { accessToken } = JSON.parse(token);
        // @ts-ignore - google is loaded from script
        await google.accounts.oauth2.revoke(accessToken);
      }
    }
  }
}

export const googleAuthService = GoogleAuthService.getInstance(); 