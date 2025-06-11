import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { keyframes } from '@emotion/react';
import {
  Box,
  Container,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  useToast,
  VStack,
  HStack,
  Text,
  IconButton,
  Badge,
  Progress,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FaArrowLeft, FaChevronLeft, FaChevronRight, FaTh, FaCog, FaShare, FaExpand, FaCompress } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { loadPost } from '../utils/postLoader';
import { extractImages } from '../utils/blogUtils';

// Define keyframes for animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
`;

const MotionBox = motion(Box);

interface MangaReaderPageProps {}

const MangaReaderPage: React.FC<MangaReaderPageProps> = () => {
  const params = useParams<{ year?: string; month?: string; slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  // Get the actual slug for loading post
  const slug = params.slug;

  // Get the current path without query params for navigation
  const basePath = location.pathname;

  // URL parameters
  const searchParams = new URLSearchParams(location.search);
  const currentPageFromUrl = parseInt(searchParams.get('page') || '1') - 1;

  // States
  const [post, setPost] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(currentPageFromUrl);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUI, setShowUI] = useState(true);
  const [isVerticalMode, setIsVerticalMode] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(3);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  // Responsive
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Colors
  const bgColor = useColorModeValue('white', 'gray.900');
  const headerBg = useColorModeValue('rgba(255,255,255,0.95)', 'rgba(0,0,0,0.95)');
  const controlsBg = useColorModeValue('rgba(0,0,0,0.7)', 'rgba(255,255,255,0.1)');

  // Preload images with limit
  const preloadImages = useCallback((startIndex: number, count: number = 3) => {
    const newLoadedImages = new Set(loadedImages);
    
    // Preload next few images
    for (let i = 0; i < count; i++) {
      const index = startIndex + i;
      if (index >= 0 && index < images.length && !loadedImages.has(index)) {
        const img = new Image();
        img.src = images[index];
        newLoadedImages.add(index);
      }
    }
    
    setLoadedImages(newLoadedImages);
  }, [images, loadedImages]);

  // Load current page and preload next pages
  useEffect(() => {
    if (images.length > 0) {
      // Load current page
      preloadImages(currentPage, 1);
      
      // Preload next 2 pages
      preloadImages(currentPage + 1, 2);
    }
  }, [currentPage, images, preloadImages]);

  // Load post data
  useEffect(() => {
    const loadPostData = async () => {
      if (!slug) {
        setError('No slug provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const postData = await loadPost(slug);

        if (!postData) {
          setError('Post not found');
          setLoading(false);
          return;
        }

        setPost(postData);

        // Extract images
        const extractedImages = extractImages(postData.content || '');
        setImages(extractedImages);
        setLoadedImages(new Set()); // Reset loaded images

        if (extractedImages.length === 0) {
          setError('No images found in this post');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading post:', err);
        setError('Failed to load post');
        setLoading(false);
      }
    };

    loadPostData();
  }, [slug]);

  // Sync currentPage with URL
  useEffect(() => {
    if (currentPageFromUrl !== currentPage && currentPageFromUrl >= 0 && currentPageFromUrl < images.length) {
      setCurrentPage(currentPageFromUrl);
    }
  }, [currentPageFromUrl, currentPage, images.length]);

  // Navigation handlers
  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      const newUrl = `${basePath}?read=true&page=${newPage + 1}`;
      navigate(newUrl, { replace: true });
      
      // Preload previous page if not loaded
      if (!loadedImages.has(newPage)) {
        preloadImages(newPage, 1);
      }
    }
  }, [currentPage, basePath, navigate, loadedImages, preloadImages]);

  const handleNextPage = useCallback(() => {
    if (currentPage < images.length - 1) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      const newUrl = `${basePath}?read=true&page=${newPage + 1}`;
      navigate(newUrl, { replace: true });
      
      // Preload next pages if not loaded
      if (!loadedImages.has(newPage + 1)) {
        preloadImages(newPage + 1, 2);
      }
    }
  }, [currentPage, images.length, basePath, navigate, loadedImages, preloadImages]);

  const handlePageJump = useCallback((page: number) => {
    if (page >= 0 && page < images.length) {
      setCurrentPage(page);
      const newUrl = `${basePath}?read=true&page=${page + 1}`;
      navigate(newUrl, { replace: true });
    }
  }, [images.length, basePath, navigate]);

  const handleBackToPost = () => {
    navigate(basePath);
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: post?.title || 'Manga Reader',
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share URL copied to clipboard",
        status: "success",
        duration: 2000,
      });
    }
  };

  const handleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevPage();
          break;
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          handleNextPage();
          break;
        case 'Escape':
          handleBackToPost();
          break;
        case 'f':
        case 'F':
          handleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handlePrevPage, handleNextPage]);

  // Auto-hide UI
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeout);
      setShowUI(true);
      timeout = setTimeout(() => setShowUI(false), 3000);
    };

    const handleMouseMove = () => resetTimeout();
    const handleTouchStart = () => resetTimeout();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart);
    
    resetTimeout();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  if (loading) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg={bgColor}>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading manga...</Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg={bgColor}>
        <Container maxW="md">
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            <Box>
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="black" position="relative" overflow="hidden">
      {/* Header */}
      <AnimatePresence>
        {showUI && (
          <MotionBox
            position="fixed"
            top={0}
            left={0}
            right={0}
            zIndex={1100}
            bg={headerBg}
            backdropFilter="blur(10px)"
            borderBottom="1px solid"
            borderColor="whiteAlpha.200"
            p={4}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ duration: 0.3 }}
          >
            <HStack justify="space-between" align="center">
              {/* Left Section */}
              <HStack spacing={4}>
                <IconButton
                  aria-label="Back to post"
                  icon={<FaArrowLeft />}
                  variant="ghost"
                  color="white"
                  onClick={handleBackToPost}
                  className="no-tap-highlight"
                />
                <VStack align="start" spacing={0}>
                  <HStack spacing={2}>
                    <Badge colorScheme="blue" variant="subtle">
                      Page {currentPage + 1} of {images.length}
                    </Badge>
                  </HStack>
                </VStack>
              </HStack>

              {/* Progress Bar */}
              <Box flex={1} mx={8} display={{ base: 'none', md: 'block' }}>
                <Progress
                  value={(currentPage + 1) / images.length * 100}
                  colorScheme="blue"
                  size="sm"
                  borderRadius="full"
                  bg="whiteAlpha.200"
                />
              </Box>

              {/* Right Section */}
              <HStack spacing={2}>
                <IconButton
                  aria-label="Share"
                  icon={<FaShare />}
                  variant="ghost"
                  color="white"
                  onClick={handleShare}
                  className="no-tap-highlight"
                />
                <IconButton
                  aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  icon={isFullscreen ? <FaCompress /> : <FaExpand />}
                  variant="ghost"
                  color="white"
                  onClick={handleFullscreen}
                  className="no-tap-highlight"
                />
              </HStack>
            </HStack>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <Box
        position="relative"
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        onClick={() => setShowUI(!showUI)}
      >
        {/* Current Image */}
        {images[currentPage] && (
          <Box
            maxW="100vw"
            maxH="100vh"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <img
              src={images[currentPage]}
              alt={`Page ${currentPage + 1}`}
              style={{
                marginTop: '10vh',
                maxWidth: '75%',
                maxHeight: '100%',
                objectFit: 'contain',
                userSelect: 'none',
              }}
            />
          </Box>
        )}

        {/* Navigation Controls */}
        <AnimatePresence>
          {showUI && (
            <>
              {/* Previous Button */}
              {currentPage > 0 && (
                <MotionBox
                  position="absolute"
                  left={4}
                  top="50%"
                  transform="translateY(-50%)"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    aria-label="Previous page"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevPage();
                    }}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: controlsBg,
                      backdropFilter: 'blur(10px)',
                      border: 'none',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '20px',
                      transition: 'transform 0.1s ease',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    className="no-tap-highlight"
                  >
                    <FaChevronLeft />
                  </button>
                </MotionBox>
              )}

              {/* Next Button */}
              {currentPage < images.length - 1 && (
                <MotionBox
                  position="absolute"
                  right={4}
                  top="50%"
                  transform="translateY(-50%)"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    aria-label="Next page"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextPage();
                    }}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: controlsBg,
                      backdropFilter: 'blur(10px)',
                      border: 'none',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '20px',
                      transition: 'transform 0.1s ease',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    className="no-tap-highlight"
                  >
                    <FaChevronRight />
                  </button>
                </MotionBox>
              )}
            </>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default MangaReaderPage;
