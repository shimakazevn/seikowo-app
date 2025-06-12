import { NavigateFunction } from 'react-router-dom';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface GoogleAuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface ToastFunction {
  (options: {
    title: string;
    description: string;
    status: 'success' | 'error' | 'warning' | 'info';
    duration: number;
    isClosable: boolean;
  }): void;
}

export interface FollowedPost {
  id: string;
  updated?: string;
  published?: string;
  [key: string]: any;
}

export interface UseNavActionsParams {
  setUser: (userId: string, accessToken: string) => void;
  initializeUser: () => Promise<void>;
  userId: string | null;
  accessToken: string | null;
  toast: ToastFunction;
  onClose: () => void;
  setUpdatedFollowCount: (count: number) => void;
}

export interface UseLoginParams {
  setUser: (userId: string, accessToken: string) => void;
  initializeUser: () => Promise<void>;
  navigate: NavigateFunction;
  toast: ToastFunction;
  onClose?: () => void;
}

export interface UseNavActionsReturn {
  handleOpenSearch: () => void;
  handleHistory: () => void;
  handleProfile: () => void;
  handleViewMore: () => void;
  login: () => void;
  logout: () => void;
  checkUpdatedFollows: () => Promise<void>;
}

// Auth-related types and interfaces
export interface EncryptedData {
  value: string;
  timestamp: number;
}

export interface SessionData {
  userData: any;
  token: string;
  refreshToken: string;
  timestamp: number;
  sessionId: string;
  expiresAt: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface TokenData {
  id: string;
  value: string;
  timestamp: number;
}

export interface UserInfoData {
  id: string;
  sub: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email_verified: boolean;
  timestamp: number;
  lastSyncTime: number;
  syncStatus: {
    totalFollows: number;
    totalBookmarks: number;
  };
  accessToken?: string;
}
