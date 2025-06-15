import { lazy } from 'react';

// Main Pages
export const HomePage = lazy(() => import('../pages/HomePage'));
export const PostPage = lazy(() => import('../pages/PostPage'));
// export const ImageUploadPage = lazy(() => import('../pages/ImageUploadPage')); // Đã loại bỏ
export const TagPage = lazy(() => import('../pages/TagPage'));
export const CategoriesPage = lazy(() => import('../pages/CategoriesPage'));
export const SearchPage = lazy(() => import('../pages/SearchPage'));

// Static Pages
export const AboutPage = lazy(() => import('../pages/AboutPage'));
export const ContactPage = lazy(() => import('../pages/ContactPage'));
export const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
export const TermsOfService = lazy(() => import('../pages/TermsOfService'));
export const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// User Pages
export const UserPage = lazy(() => import('../pages/UserPage'));
export const SettingsPage = lazy(() => import('../pages/SettingsPage'));
export const PostsManagement = lazy(() => import('../pages/user/PostsManagement'));

// Feature Pages
export const RemixPage = lazy(() => import('../pages/RemixPage'));
export const DonatePage = lazy(() => import('../pages/DonatePage'));
export const UpdatesPage = lazy(() => import('../pages/UpdatesPage'));
export const PostEditPage = lazy(() => import('../pages/PostEditPage'));

// Components
export const ProtectedRoute = lazy(() => import('../components/features/Auth/ProtectedRoute'));
// export const PostPageWrapper = lazy(() => import('../components/PostPage/PostView/Wrapper')); // Temporarily removed due to loading issues
