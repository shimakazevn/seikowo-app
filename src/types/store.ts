import { User, Bookmark } from './common';

export interface UserStore {
  userId: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  initializeUser: () => Promise<void>;
}

export interface FollowBookmarkStore {
  bookmarks: Bookmark[];
  loading: boolean;
  initialize: () => Promise<void>;
  toggleBookmark: (postId: string) => Promise<void>;
  isBookmarked: (postId: string) => boolean;
  getBookmarkData: (postId: string) => Bookmark | undefined;
}

export interface ThemeStore {
  mode: 'light' | 'dark';
  brightness: number;
  fontSize: number;
  fontFamily: string;
  setMode: (mode: 'light' | 'dark') => void;
  setBrightness: (brightness: number) => void;
  setFontSize: (fontSize: number) => void;
  setFontFamily: (fontFamily: string) => void;
}