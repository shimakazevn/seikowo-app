import React, { useRef, memo } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import HomePage from '../pages/HomePage';
import PostPage from '../pages/PostPage';
import TagPage from './TagPage/TagPage';
import BookmarkPage from '../pages/BookmarkPage';
import CategoriesPage from '../pages/CategoriesPage';
import AboutPage from '../pages/AboutPage';
import ContactPage from '../pages/ContactPage';
import UserProfilePage from '../pages/UserProfilePage';
import FavoritePage from './Favorite/FavoritePage';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsOfService from '../pages/TermsOfService';
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
    <Box minH="calc(100vh - 9rem)">
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
            <Route path="/bookmarks" element={<BookmarkPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/favorite" element={<FavoritePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route 
              path="/search" 
              element={
                <StaticPage>
                  <h1>Search</h1>
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