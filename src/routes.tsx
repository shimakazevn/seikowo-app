import React, { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';

const HomePage = lazy(() => import('./pages/HomePage'));
const PostPage = lazy(() => import('./pages/PostPage'));
const Page = lazy(() => import('./pages/Page'));
const TagsList = lazy(() => import('./pages/TagList'));
const PostsByTag = lazy(() => import('./pages/PostsByTag'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const PagesList = lazy(() => import('./pages/PagesList'));

const wrapLazyComponent = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<div>Loading...</div>}>
    <Component />
  </Suspense>
);

export const routes: RouteObject[] = [
  {
    path: '/',
    element: wrapLazyComponent(HomePage),
  },
  {
    path: '/p',
    element: wrapLazyComponent(PagesList),
  },
  {
    path: '/p/:slug',
    element: wrapLazyComponent(Page),
  },
  {
    path: '/:year/:month/:slug',
    element: wrapLazyComponent(PostPage),
  },
  {
    path: '/tags',
    element: wrapLazyComponent(TagsList),
  },
  {
    path: '/tag/:label',
    element: wrapLazyComponent(PostsByTag),
  },
  {
    path: '/search',
    element: wrapLazyComponent(SearchPage),
  },
]; 