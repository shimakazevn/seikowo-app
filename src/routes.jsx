import { lazy } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const PostPage = lazy(() => import('./pages/PostPage'));
const Page = lazy(() => import('./pages/Page'));
const TagsList = lazy(() => import('./pages/TagList'));
const PostsByTag = lazy(() => import('./pages/PostsByTag'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const PagesList = lazy(() => import('./pages/PagesList'));

export const routes = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/p',
    element: <PagesList />,
  },
  {
    path: '/p/:slug',
    element: <Page />,
  },
  {
    path: '/:year/:month/:slug',
    element: <PostPage />,
  },
  {
    path: '/tags',
    element: <TagsList />,
  },
  {
    path: '/tag/:label',
    element: <PostsByTag />,
  },
  {
    path: '/search',
    element: <SearchPage />,
  },
]; 