// Global types for the application

export interface Post {
  id: string;
  title: string;
  content: string;
  slug: string;
  url: string;
  labels: string[];
  published: string;
  updated: string;
  timestamp?: number;
  thumbnail?: string | null;
}

export interface BlogPost extends Post {
  author?: {
    id: string;
    displayName: string;
    url: string;
    image?: {
      url: string;
    };
  };
  blog?: {
    id: string;
  };
  etag?: string;
  kind?: string;
  selfLink?: string;
  status?: string;
  titleLink?: string;
  replies?: {
    totalItems: number;
    selfLink: string;
  };
  images?: Array<{
    url: string;
  }>;
  location?: {
    name: string;
    lat: number;
    lng: number;
    span: string;
  };
}

export interface FavoritePost {
  id: string;
  title: string;
  url: string;
  published: string;
  updated: string;
  labels: string[];
  thumbnail?: string | null;
  timestamp: number;
  favoriteAt: number;
}

export interface MangaBookmark {
  id: string;
  title: string;
  url: string;
  currentPage: number;
  timestamp: number;
  totalPages?: number;
  verticalMode?: boolean;
}

export interface HistoryItem extends Post {
  timestamp: number;
}

export interface User {
  id: string;
  sub: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email_verified: boolean;
  locale?: string;
  is2FAEnabled: boolean;
  twoFactorSecret: string | null;
  isAuthenticated: boolean;
  timestamp: number;
  lastSyncTime: number | null;
  syncStatus: 'idle' | 'loading' | 'success' | 'error';
  updatedAt?: string;
}

export interface UserData {
  id: string;
  sub: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email_verified: boolean;
  locale?: string;
  is2FAEnabled: boolean;
  twoFactorSecret: string | null;
  timestamp: number;
  lastSyncTime: number | null;
  syncStatus: 'idle' | 'loading' | 'success' | 'error';
  updatedAt?: string;
}

export interface UserInfo {
  id: string;
  sub: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email_verified: boolean;
  timestamp: number;
}

export interface SearchFilters {
  tags: string[];
  year?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface MenuItem {
  label: string;
  path: string;
  icon?: React.ComponentType;
  isExternal?: boolean;
}

export interface NavItem {
  label: string;
  path: string;
  icon?: React.ComponentType;
  isExternal?: boolean;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  currentPage: number;
  totalPages: number;
  timestamp: number;
  verticalMode?: boolean;
}

// API Response types
export interface PostResponse {
  items: BlogPost[];
  nextPageToken?: string;
  kind: string;
  etag: string;
}

export interface PageResponse {
  items: any[];
  nextPageToken?: string;
  kind: string;
  etag: string;
}

export interface RssItem {
  title: string;
  description: string;
  link: string;
  guid: string;
  pubDate: string;
  categories: string[];
  content?: string;
  thumbnail?: string;
  enclosure?: {
    link: string;
    type: string;
  };
}

export interface RssFeed {
  status: string;
  feed: {
    url: string;
    title: string;
    link: string;
    author: string;
    description: string;
    image: string;
  };
  items: RssItem[];
}

// Error types
export interface AppErrorType {
  name: string;
  message: string;
  stack?: string;
}

// Toast types
export interface ToastOptions {
  title: string;
  description: string;
  status: 'success' | 'error' | 'warning' | 'info';
  duration: number;
  isClosable: boolean;
}

// Auth types
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

export interface AuthResponse {
  code?: string;
  access_token?: string;
  refresh_token?: string;
  [key: string]: any;
}

// Store types
export interface CachedData {
  items: any[];
  timestamp: number;
}

// Component prop types
export interface PostCardProps {
  post: BlogPost;
  index?: number;
  cardBg?: string;
  textColor?: string;
  mutedTextColor?: string;
}

export interface HistoryCardProps {
  post?: HistoryItem;
  data?: HistoryItem;
  timestamp?: string;
  onRemove?: () => void;
  showRemoveButton?: boolean;
}

export interface AuthErrorProps {
  error: Error;
  onRetry: () => void;
  onLogout: () => void;
}

// Navigation types
export interface NavMenuDesktopProps {
  menuItems: MenuItem[];
  isActive: (path: string) => boolean;
  activeColor: string;
  textColor: string;
}

export interface MobileNavProps {
  menuItems: NavItem[];
  isOpen: boolean;
  isActive: (path: string) => boolean;
  activeColor: string;
  textColor: string;
}

export interface DesktopNavProps {
  menuItems: MenuItem[];
  isActive: (path: string) => boolean;
  activeColor: string;
  textColor: string;
}
