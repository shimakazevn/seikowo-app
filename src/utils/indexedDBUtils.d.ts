// Type definitions for IndexedDB utilities

export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  timestamp: string;
  [key: string]: any;
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

export interface UserData {
  id: string;
  email: string;
  name: string;
  [key: string]: any;
}

export interface CacheData {
  value: any;
  timestamp: number;
}

export interface FetchPostsParams {
  maxResults?: number;
  pageToken?: string;
  orderBy?: string;
  view?: string;
  forceRefresh?: boolean;
  selectedTag?: string | null;
}

export type HistoryType = 'bookmarks' | 'favorites' | 'reads';
export type CacheKey = string;
export type StoreName = string;

// Extended IndexedDB interfaces
export interface IDBDatabaseExtended extends IDBDatabase {
  // Add any custom properties if needed
}

export interface IDBTransactionExtended extends IDBTransaction {
  // Add any custom properties if needed
}

export interface IDBObjectStoreExtended extends IDBObjectStore {
  // Add any custom properties if needed
}

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
}

export interface HistoryData {
  [key: string]: any;
}

export interface CacheConfig {
  maxAge: number;
  maxSize: number;
  duration: number;
}

export interface CacheConfigs {
  [key: string]: CacheConfig;
}
