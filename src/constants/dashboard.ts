import { FaBookmark, FaHeart, FaComment, FaEdit } from 'react-icons/fa';
import type { UserDashboardTab } from '../types/dashboard';
import FavoritePostsTab from '../components/features/User/FavoritePostsTab';
import BookmarkedMangaTab from '../components/features/User/BookmarkedMangaTab';
import UserCommentsTab from '../components/features/User/UserCommentsTab';
import PostsManagement from '../components/features/User/PostsManagement';

export const USER_DASHBOARD_TABS: UserDashboardTab[] = [
  {
    id: 'favorite-posts',
    label: 'favorites',
    icon: FaHeart,
    description: 'danh sách bài viết đã thích',
    color: '#ff6347',
    component: FavoritePostsTab,
  },
  {
    id: 'bookmarked-manga',
    label: 'bookmark',
    icon: FaBookmark,
    description: 'quản lý các truyện đã bookmark',
    color: '#20b2aa',
    component: BookmarkedMangaTab,
  },
  {
    id: 'user-comments',
    label: 'comments',
    icon: FaComment,
    description: 'quản lý các bình luận đã đăng',
    color: '#3182ce',
    component: UserCommentsTab,
  },
  {
    id: 'posts-management',
    label: 'quản lý bài viết',
    icon: FaEdit,
    description: 'quản lý các bài viết của bạn',
    color: '#4CAF50',
    component: PostsManagement,
  }
]; 