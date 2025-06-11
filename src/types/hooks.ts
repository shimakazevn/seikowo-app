import { User } from './common';
import { NavActions } from './navigation';

export interface UseNavActionsProps {
  setUser: (user: User | null) => void;
  initializeUser: () => Promise<void>;
  userId: string | null;
  accessToken: string | null;
  toast: any; // TODO: Add proper toast type
  onClose: () => void;
  setUpdatedFollowCount: (count: number) => void;
}

export interface UseThemeProps {
  initialMode?: 'light' | 'dark';
  initialBrightness?: number;
  initialFontSize?: number;
  initialFontFamily?: string;
}

export interface UseInfiniteScrollProps<T> {
  fetchData: (page: number) => Promise<T[]>;
  initialData?: T[];
  pageSize?: number;
}

export interface UseLocalStorageProps<T> {
  key: string;
  initialValue: T;
}

export interface UseDebounceProps<T> {
  value: T;
  delay?: number;
} 