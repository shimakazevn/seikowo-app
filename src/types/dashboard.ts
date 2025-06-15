import type { FavoritePost, MangaBookmark, User } from './global';

export interface TabComponentProps {
  cardBg: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  isDark: boolean;
  favoritesPosts?: FavoritePost[];
  bookmarkedPosts?: MangaBookmark[];
}

export interface UserDashboardTab {
  id: string;
  label: string;
  icon: any;
  description: string;
  color: string;
  component: React.ComponentType<TabComponentProps>;
}

export interface UserDashboardProps {
  user: User;
  accessToken: string | null;
}

export interface DashboardHeaderProps {
  user: User;
  textColor: string;
  mutedColor: string;
}

export interface DashboardTabProps {
  tab: UserDashboardTab;
  isActive: boolean;
  onClick: () => void;
  textColor: string;
  mutedColor: string;
  hoverBg: string;
}

export interface LoadingStateProps {
  bgColor: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
}

export interface ErrorStateProps {
  bgColor: string;
  textColor: string;
  error: string;
} 