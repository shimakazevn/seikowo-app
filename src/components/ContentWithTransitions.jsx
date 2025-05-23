import React, { useRef, memo } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import HomePage from '../pages/HomePage';
import PostPage from '../pages/PostPage';
import TagPage from './TagPage/TagPage';
import UserHistoryPage from '../pages/HistoryPage';
import { AnimatePresence, motion } from 'framer-motion';

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
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.1 }}
        >
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
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

export default memo(ContentWithTransitions); 