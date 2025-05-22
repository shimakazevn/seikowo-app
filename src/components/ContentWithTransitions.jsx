import React, { useRef, memo } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Box } from '@chakra-ui/react';
import HomePage from '../pages/HomePage';
import PostPage from '../pages/PostPage';
import TagPage from './TagPage/TagPage';
import UserHistoryPage from '../pages/HistoryPage';

// Memoize static pages
const StaticPage = memo(({ children }) => (
  <div className="container py-5">
    {children}
  </div>
));

StaticPage.displayName = 'StaticPage';

const ContentWithTransitions = () => {
  const location = useLocation();
  
  return (
    <Box minH="calc(100vh - 5rem)">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tag/:tagName" element={<TagPage />} />
          <Route path="/u/:userId" element={<UserHistoryPage />} />
          <Route 
            path="/categories" 
            element={
              <StaticPage>
                <h1>Categories</h1>
              </StaticPage>
            } 
          />
          <Route 
            path="/search" 
            element={
              <StaticPage>
                <h1>Search</h1>
              </StaticPage>
            } 
          />
          <Route 
            path="/about" 
            element={
              <StaticPage>
                <h1>About</h1>
              </StaticPage>
            } 
          />
          <Route 
            path="/contact" 
            element={
              <StaticPage>
                <h1>Contact</h1>
              </StaticPage>
            } 
          />
          <Route 
            path="/terms" 
            element={
              <StaticPage>
                <h1>Terms</h1>
              </StaticPage>
            } 
          />
          {/* Catch-all route for blog posts */}
          <Route path="*" element={<PostPage />} />
        </Routes>
      </AnimatePresence>
    </Box>
  );
};

export default memo(ContentWithTransitions); 