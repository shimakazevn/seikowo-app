import { ComponentType } from 'react';
import * as LazyRoutes from './lazyRoutes';

export type LayoutVariant = 'default' | 'subtle' | 'modal';

export interface RouteConfig {
  path: string;
  element: ComponentType<any>;
  layout: LayoutVariant;
  protected?: boolean;
  exact?: boolean;
  title?: string;
  description?: string;
}

export interface RouteGroup {
  title: string;
  routes: RouteConfig[];
}

// Main routes
export const mainRoutes: RouteGroup = {
  title: 'Main',
  routes: [
    { 
      path: '/', 
      element: LazyRoutes.HomePage, 
      layout: 'default',
      exact: true,
      title: 'Home',
      description: 'Welcome to our blog'
    },
    { 
      path: '/tag/:tagName', 
      element: LazyRoutes.TagPage, 
      layout: 'subtle',
      title: 'Tag Posts'
    },
    { 
      path: '/tags', 
      element: LazyRoutes.CategoriesPage, 
      layout: 'subtle',
      title: 'Tags'
    },
    { 
      path: '/search', 
      element: LazyRoutes.SearchPage, 
      layout: 'subtle',
      title: 'Search'
    }
  ]
};

// Static pages
export const staticRoutes: RouteGroup = {
  title: 'Static',
  routes: [
    { 
      path: '/about', 
      element: LazyRoutes.AboutPage, 
      layout: 'subtle',
      title: 'About Us'
    },
    { 
      path: '/contact', 
      element: LazyRoutes.ContactPage, 
      layout: 'subtle',
      title: 'Contact Us'
    },
    { 
      path: '/privacy-policy', 
      element: LazyRoutes.PrivacyPolicy, 
      layout: 'subtle',
      title: 'Privacy Policy'
    },
    { 
      path: '/terms-of-service', 
      element: LazyRoutes.TermsOfService, 
      layout: 'subtle',
      title: 'Terms of Service'
    }
  ]
};

// User-related routes
export const userRoutes: RouteGroup = {
  title: 'User',
  routes: [
    { 
      path: '/settings/*', 
      element: LazyRoutes.SettingsPage, 
      layout: 'subtle',
      title: 'Settings'
    },
    { 
      path: '/user', 
      element: LazyRoutes.UserPage, 
      layout: 'subtle',
      title: 'Profile'
    },
    {
      path: '/user/posts',
      element: LazyRoutes.PostsManagement,
      layout: 'subtle',
      protected: true,
      title: 'Manage Posts'
    }
  ]
};

// Feature routes
export const featureRoutes: RouteGroup = {
  title: 'Features',
  routes: [
    { 
      path: '/remix', 
      element: LazyRoutes.RemixPage, 
      layout: 'default',
      title: 'Remix'
    },
    { 
      path: '/donate', 
      element: LazyRoutes.DonatePage, 
      layout: 'subtle',
      title: 'Support Us'
    },
    { 
      path: '/updates', 
      element: LazyRoutes.UpdatesPage, 
      layout: 'subtle',
      title: 'Latest Updates'
    },
    { 
      path: '/post/edit/:postId', 
      element: LazyRoutes.PostEditPage, 
      layout: 'modal',
      protected: true,
      title: 'Edit Post'
    },
    // {
    //   path: '/upload-images',
    //   element: LazyRoutes.ImageUploadPage,
    //   layout: 'subtle',
    //   title: 'Upload Images',
    //   description: 'Upload images to your Blogger posts'
    // }
  ]
};

// Blog post routes
export const blogRoutes: RouteGroup = {
  title: 'Blog',
  routes: [
    { 
      path: '/:year/:month/:slug', 
      element: LazyRoutes.PostPage, 
      layout: 'default',
      title: 'Blog Post'
    },
    { 
      path: '/:year/:month/:slug.html', 
      element: LazyRoutes.PostPage, 
      layout: 'default',
      title: 'Blog Post'
    },
    { 
      path: '/:slug.html', 
      element: LazyRoutes.PostPage, 
      layout: 'default',
      title: 'Blog Post'
    }
  ]
};

// Error routes
export const errorRoutes: RouteGroup = {
  title: 'Errors',
  routes: [
    { 
      path: '/404', 
      element: LazyRoutes.NotFoundPage, 
      layout: 'default',
      title: 'Page Not Found'
    },
    { 
      path: '*', 
      element: LazyRoutes.NotFoundPage, 
      layout: 'default',
      title: 'Page Not Found'
    }
  ]
};

// Export all route groups
export const allRouteGroups: RouteGroup[] = [
  mainRoutes,
  staticRoutes,
  userRoutes,
  featureRoutes,
  blogRoutes,
  errorRoutes
];

// Helper to get all routes flattened
export const getAllRoutes = (): RouteConfig[] => {
  return allRouteGroups.flatMap(group => group.routes);
};
