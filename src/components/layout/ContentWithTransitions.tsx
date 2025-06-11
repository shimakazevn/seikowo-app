import React, { memo, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import PageLoader from './PageLoader';
import ErrorBoundary from './ErrorBoundary';
import PageTransition from '../ui/molecules/PageTransition';
import { ProtectedRoute } from '../../routes/lazyRoutes';
import { allRouteGroups } from '../../routes/routeConfigs';
import type { RouteConfig } from '../../routes/routeConfigs';

interface StaticPageProps {
  children: React.ReactNode;
}

// Memoize static pages
const StaticPage: React.FC<StaticPageProps> = memo(({ children }) => (
  <div className="container py-5">
    {children}
  </div>
));

StaticPage.displayName = 'StaticPage';

// Component to render a route with proper transitions and protection
const RouteWithTransition: React.FC<{ route: RouteConfig }> = ({ route }) => {
  const Element = route.element;
  const content = (
    <PageTransition variant={route.layout}>
      {route.layout === 'subtle' && !route.protected ? (
        <StaticPage>
          <Element />
        </StaticPage>
      ) : (
        <Element />
      )}
    </PageTransition>
  );

  if (route.protected) {
    return (
      <ProtectedRoute>
        {content}
      </ProtectedRoute>
    );
  }

  return content;
};

const ContentWithTransitions: React.FC = () => {
  const location = useLocation();

  return (
    <Box
      minH="calc(100vh - 5rem)"
      ml={{ base: 0, lg: '80px' }}
      mb={{ base: '70px', lg: 0 }}
    >
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes location={location} key={location.pathname}>
            {allRouteGroups.flatMap(group => 
              group.routes.map(route => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<RouteWithTransition route={route} />}
                />
              ))
            )}
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Box>
  );
};

export default ContentWithTransitions;