// Common types for the application
export interface BaseEntity {
  id: string;
  title: string;
  slug: string;
  url: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MangaPost extends BaseEntity {
  images: string[];
  labels: string[];
  description?: string;
  author?: string;
  status?: 'ongoing' | 'completed' | 'dropped';
  totalPages: number;
}

export interface CommonBookmark extends BaseEntity {
  currentPage: number;
  totalPages: number;
  verticalMode: boolean;
  labels: string[];
  timestamp: number;
  bookmarkAt: number;
}

export interface CommonUser {
  id: string;
  username: string;
  email?: string;

  accessToken?: string;
}

// Re-export for backward compatibility
export interface User extends CommonUser {}
export interface Bookmark extends CommonBookmark {}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  brightness: number;
  fontSize: number;
  fontFamily: string;
}

export interface ReadingHistory {
  postId: string;
  currentPage: number;
  lastReadAt: number;
  totalPages: number;
  title: string;
  slug: string;
}

export interface CommonSearchFilters {
  tags: string[];
  status?: 'ongoing' | 'completed' | 'dropped';
  sortBy?: 'latest' | 'popular' | 'rating';
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}