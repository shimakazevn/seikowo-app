import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/opacity.css';
import {
  Box,
  Grid,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  HStack,
  Text,
  VStack,
  useColorModeValue,
  useBreakpointValue,
  Flex,
  Switch,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, StarIcon, ChevronDownIcon, ViewIcon } from '@chakra-ui/icons';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { saveMangaBookmark, getHistoryData, saveHistoryData, READ_KEY } from '../utils/historyUtils';
import { useNavigate, useLocation } from 'react-router-dom';

const MangaReader = ({ images, postId, postTitle, postSlug }) => {
  const { isOpen, onOpen, onClose: originalOnClose } = useDisclosure();
  const [currentPage, setCurrentPage] = useState(0);
  const [displayCount, setDisplayCount] = useState(8);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isVerticalMode, setIsVerticalMode] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const isMobile = useBreakpointValue({ base: true, md: false });
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const modalBodyRef = useRef(null);

  const minSwipeDistance = 50;

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(images.length - 1, prev + 1));
  }, [images.length]);

  const onTouchStart = (e) => {
    if (isVerticalMode || isZoomed) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    if (isVerticalMode || isZoomed) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (isVerticalMode || isZoomed) return;
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentPage < images.length - 1) {
      handleNextPage();
    }
    if (isRightSwipe && currentPage > 0) {
      handlePrevPage();
    }
  };

  const handleKeyPress = useCallback((e) => {
    if (isOpen && !isVerticalMode) {
      if (e.key === 'ArrowLeft') handlePrevPage();
      if (e.key === 'ArrowRight') handleNextPage();
      if (e.key === 'Escape') originalOnClose();
    }
  }, [isOpen, handlePrevPage, handleNextPage, originalOnClose, isVerticalMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Auto-open reader if page parameter exists in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get('p'));
    if (page && !isOpen) {
      onOpen();
    }
  }, [location.search, isOpen, onOpen]);

  // Custom close handler
  const handleClose = useCallback(() => {
    originalOnClose();
    // Remove page parameter from URL
    const baseUrl = postSlug.split('?')[0];
    navigate(`/${baseUrl}`, { replace: true });
  }, [originalOnClose, postSlug, navigate]);

  // Initialize page from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pageFromUrl = parseInt(params.get('p'));
    
    if (pageFromUrl > 0 && pageFromUrl <= images.length) {
      setCurrentPage(pageFromUrl - 1);
    }
  }, [location.search, images.length]);

  // Update URL when page changes and reader is open
  useEffect(() => {
    if (!postSlug || !isOpen) return;
    const baseUrl = postSlug.split('?')[0];
    const newUrl = `${baseUrl}?p=${currentPage + 1}`;
    navigate(newUrl, { replace: true });
  }, [currentPage, postSlug, navigate, isOpen]);

  // Save reading progress to history_read_posts
  useEffect(() => {
    if (postId && postTitle && postSlug) {
      const userId = localStorage.getItem('google_user_id') || 'guest';
      const readPosts = getHistoryData(READ_KEY, userId);
      
      // Update or add reading progress
      const existingIndex = readPosts.findIndex(p => p.id === postId && p.slug === postSlug);
      if (existingIndex !== -1) {
        readPosts[existingIndex] = {
          ...readPosts[existingIndex],
          currentPage,
          totalPages: images.length,
          readAt: Date.now()
        };
      } else {
        readPosts.unshift({
          id: postId,
          title: postTitle,
          slug: postSlug,
          currentPage,
          totalPages: images.length,
          readAt: Date.now()
        });
      }
      
      // Keep only latest 50 entries
      if (readPosts.length > 50) {
        readPosts.splice(50);
      }
      
      saveHistoryData(READ_KEY, userId, readPosts);
    }
  }, [currentPage, postId, postTitle, postSlug, images.length]);

  // Check if page is bookmarked
  useEffect(() => {
    if (!postId || !postSlug) return;
    
    const userId = localStorage.getItem('google_user_id') || 'guest';
    const key = `history_manga_bookmarks_${userId}`;
    try {
      const bookmarks = JSON.parse(localStorage.getItem(key) || '[]');
      // Check if current page is bookmarked
      const isCurrentPageBookmarked = bookmarks.some(b => 
        b.id === postId && b.currentPage === currentPage
      );
      setIsBookmarked(isCurrentPageBookmarked);
      
      // Restore reading mode preference from any bookmark of this post
      const postBookmark = bookmarks.find(b => b.id === postId);
      if (postBookmark?.isVerticalMode !== undefined) {
        setIsVerticalMode(postBookmark.isVerticalMode);
      }
    } catch (err) {
      console.error('Error checking bookmark:', err);
    }
  }, [postId, postSlug, currentPage]);

  // Handle bookmark
  const handleBookmark = useCallback(() => {
    if (!postId || !postTitle || !postSlug) return;

    const userId = localStorage.getItem('google_user_id') || 'guest';
    const key = `history_manga_bookmarks_${userId}`;
    
    try {
      const bookmarks = JSON.parse(localStorage.getItem(key) || '[]');
      const existingBookmarkIndex = bookmarks.findIndex(b => 
        b.id === postId && b.currentPage === currentPage
      );

      if (existingBookmarkIndex !== -1) {
        // Remove bookmark
        bookmarks.splice(existingBookmarkIndex, 1);
        localStorage.setItem(key, JSON.stringify(bookmarks));
        setIsBookmarked(false);
        toast({
          title: 'Đã gỡ bookmark',
          description: `Trang ${currentPage + 1}/${images.length}`,
          status: 'info',
          duration: 2000,
        });
      } else {
        // Add bookmark
        const success = saveMangaBookmark({
          id: postId,
          title: postTitle,
          slug: postSlug,
          currentPage: currentPage,
          totalPages: images.length,
          isVerticalMode
        });
        
        if (success) {
          setIsBookmarked(true);
          toast({
            title: 'Đã lưu bookmark',
            description: `Trang ${currentPage + 1}/${images.length}`,
            status: 'success',
            duration: 2000,
          });
        } else {
          throw new Error('Failed to save bookmark');
        }
      }
    } catch (err) {
      console.error('Error handling bookmark:', err);
      toast({
        title: 'Lỗi xử lý bookmark',
        status: 'error',
        duration: 2000,
      });
    }
  }, [postId, postTitle, postSlug, currentPage, toast, images.length, isVerticalMode]);

  // Convert image URL to thumbnail URL
  const getThumbUrl = (url) => {
    return url.replace(/\/s[0-9]+\//, '/s200/');
  };

  // Convert thumbnail URL back to full size URL
  const getFullUrl = (url) => {
    return url.replace(/\/s[0-9]+\//, '/s1600/');
  };

  const renderImage = (img, index) => (
    <Box
      key={index}
      width="100%"
      height="100%"
      display="flex"
      justifyContent="center"
      alignItems="center"
      mb={isVerticalMode ? 0 : 0}
      position="relative"
    >
      {!isVerticalMode && isMobile && !isZoomed && (
        <>
          <Box
            position="absolute"
            left={0}
            top={0}
            width="30%"
            height="100%"
            zIndex={2}
            onClick={handlePrevPage}
            cursor="pointer"
          />
          <Box
            position="absolute"
            right={0}
            top={0}
            width="30%"
            height="100%"
            zIndex={2}
            onClick={handleNextPage}
            cursor="pointer"
          />
        </>
      )}
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={3}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
        doubleClick={{ mode: "reset" }}
        disabled={isVerticalMode}
        onTransformed={(e) => {
          setIsZoomed(e.state.scale > 1);
        }}
        panning={{
          disabled: isVerticalMode,
          velocityDisabled: true
        }}
      >
        {({ resetTransform }) => (
          <TransformComponent
            wrapperStyle={{
              width: '100%',
              height: '100%',
              maxWidth: '100vw',
              maxHeight: isVerticalMode ? 'none' : '100%',
            }}
          >
            <img
              src={getFullUrl(img)}
              alt={`Page ${index + 1}`}
              style={{
                maxWidth: '100%',
                height: isVerticalMode ? 'auto' : '100%',
                objectFit: 'contain',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
              loading="lazy"
              onDoubleClick={() => resetTransform()}
            />
          </TransformComponent>
        )}
      </TransformWrapper>
    </Box>
  );

  // Track scroll position in vertical mode
  const handleScroll = useCallback((e) => {
    if (!isVerticalMode || !isOpen) return;

    const container = e.target;
    const imageElements = container.getElementsByTagName('img');
    const containerTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const centerY = containerTop + (containerHeight / 2);

    // Find the image closest to the center of the viewport
    let closestImage = null;
    let closestDistance = Infinity;
    let closestIndex = 0;

    Array.from(imageElements).forEach((img, index) => {
      const rect = img.getBoundingClientRect();
      const imgCenterY = rect.top + (rect.height / 2);
      const distance = Math.abs(containerHeight/2 - imgCenterY);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestImage = img;
        closestIndex = index;
      }
    });

    if (closestIndex !== currentPage) {
      setCurrentPage(closestIndex);
    }
  }, [isVerticalMode, isOpen, currentPage]);

  // Function to scroll to current page
  const scrollToCurrentPage = useCallback(() => {
    if (!isVerticalMode || !modalBodyRef.current) return;
    
    const imageElements = modalBodyRef.current.getElementsByTagName('img');
    if (imageElements.length > currentPage) {
      const targetImage = imageElements[currentPage];
      
      // Wait for image to load
      if (!targetImage.complete) {
        targetImage.onload = () => {
          // Get the container's height
          const containerHeight = modalBodyRef.current.clientHeight;
          // Get image position
          const imageRect = targetImage.getBoundingClientRect();
          // Calculate scroll position to center the image
          const scrollTop = targetImage.offsetTop - (containerHeight - imageRect.height) / 2;
          
          modalBodyRef.current.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          });
        };
      } else {
        // Image already loaded
        const containerHeight = modalBodyRef.current.clientHeight;
        const imageRect = targetImage.getBoundingClientRect();
        const scrollTop = targetImage.offsetTop - (containerHeight - imageRect.height) / 2;
        
        modalBodyRef.current.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }
  }, [isVerticalMode, currentPage]);

  // Effect to handle vertical mode changes
  useEffect(() => {
    if (isVerticalMode) {
      // Add a small delay to allow layout to update
      const timer = setTimeout(() => {
        scrollToCurrentPage();
      }, 300); // Increased delay for better reliability
      
      return () => clearTimeout(timer);
    }
  }, [isVerticalMode, scrollToCurrentPage]);

  // Handle mode switch
  const handleModeSwitch = useCallback((e) => {
    const newMode = e.target.checked;
    setIsVerticalMode(newMode);
    
    // Reset zoom when switching to vertical mode
    if (newMode) {
      setIsZoomed(false);
      // Force scroll after a short delay
      setTimeout(() => {
        scrollToCurrentPage();
      }, 300);
    } else {
      // When switching back to horizontal, ensure current page is displayed
      setCurrentPage(currentPage);
    }
  }, [currentPage, scrollToCurrentPage]);

  return (
    <Box>
      <VStack spacing={6} width="100%" align="stretch">
        <Grid 
          templateColumns={{
            base: 'repeat(3, 1fr)',
            sm: 'repeat(4, 1fr)',
            md: 'repeat(5, 1fr)',
            lg: 'repeat(6, 1fr)',
            xl: 'repeat(8, 1fr)'
          }}
          gap={2}
        >
          {images.slice(0, displayCount).map((img, idx) => (
            <Box
              key={idx}
              position="relative"
              cursor="pointer"
              onClick={() => {
                setCurrentPage(idx);
                onOpen();
              }}
              transition="transform 0.2s"
              _hover={{ transform: 'scale(1.05)' }}
            >
              <LazyLoadImage
                src={getThumbUrl(img)}
                alt={`Page ${idx + 1}`}
                width="100%"
                height="auto"
                effect="opacity"
                style={{
                  aspectRatio: '3/4',
                  objectFit: 'cover',
                  borderRadius: '0.375rem',
                  transition: 'opacity 0.15s ease-in-out'
                }}
                wrapperProps={{
                  style: {
                    transitionDuration: '0.15s'
                  }
                }}
              />
              <Text
                position="absolute"
                bottom={1}
                right={1}
                bg="blackAlpha.700"
                color="white"
                px={1.5}
                py={0.5}
                borderRadius="md"
                fontSize="xs"
              >
                {idx + 1}/{images.length}
              </Text>
            </Box>
          ))}
        </Grid>

        {displayCount < images.length && (
          <Button 
            onClick={() => setDisplayCount(prev => Math.min(prev + 8, images.length))}
            colorScheme="blue"
            width="100%"
            leftIcon={<ChevronDownIcon />}
          >
            Xem thêm ({images.length - displayCount} ảnh)
          </Button>
        )}

        <Button
          onClick={() => {
            setCurrentPage(0);
            onOpen();
          }}
          colorScheme="teal"
          width="100%"
          size="lg"
          leftIcon={<ViewIcon />}
        >
          Đọc Chapter
        </Button>
      </VStack>

      <Modal 
        isOpen={isOpen} 
        onClose={handleClose}
        size="full" 
        motionPreset="none"
      >
        <ModalOverlay />
        <ModalContent bg={bgColor} maxH="100vh" h="100vh" m="0">
          <ModalHeader p={2}>
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={4}>
                <Text fontSize={{ base: 'sm', md: 'md' }}>
                  {!isVerticalMode && `Trang ${currentPage + 1}/${images.length}`}
                </Text>
                <Tooltip 
                  label={isVerticalMode ? 'Chuyển sang chế độ ngang' : 'Chuyển sang chế độ dọc'}
                  placement="bottom"
                  hasArrow
                  bg="blue.500"
                  color="white"
                  px={3}
                  py={2}
                  borderRadius="md"
                  fontSize="sm"
                  fontWeight="medium"
                  openDelay={300}
                >
                  <Flex align="center" gap={2}>
                    <Switch
                      size="sm"
                      isChecked={isVerticalMode}
                      onChange={handleModeSwitch}
                      sx={{
                        '& span[data-checked]': {
                          bg: 'blue.500',
                        },
                        '& span[data-checked] > *': {
                          transform: 'translateX(16px)',
                        },
                        '& span:not([data-checked])': {
                          bg: 'gray.300',
                        }
                      }}
                    />
                    <Text fontSize="sm" color={textColor} userSelect="none">
                      {isVerticalMode ? 'Dọc' : 'Ngang'}
                    </Text>
                  </Flex>
                </Tooltip>
                <Tooltip label={isBookmarked ? "Gỡ bookmark" : "Lưu bookmark"}>
                  <IconButton
                    icon={<StarIcon />}
                    onClick={handleBookmark}
                    colorScheme={isBookmarked ? "pink" : "blue"}
                    variant={isBookmarked ? "solid" : "outline"}
                    size="sm"
                    aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                  />
                </Tooltip>
              </Flex>
              <ModalCloseButton position="static" onClick={handleClose} />
            </Flex>
          </ModalHeader>
          <ModalBody p={0} h="calc(100vh - 48px)" ref={modalBodyRef}>
            <Box 
              height="100%"
              position="relative"
              overflow="auto"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onScroll={handleScroll}
              sx={{
                scrollBehavior: 'smooth',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none'
                },
                WebkitOverflowScrolling: 'touch',
                touchAction: isVerticalMode ? 'pan-y pinch-zoom' : 'none',
                scrollSnapType: isVerticalMode ? 'y mandatory' : 'none',
              }}
            >
              {isVerticalMode ? (
                <VStack spacing={0} align="stretch">
                  {images.map((img, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        scrollSnapAlign: 'start',
                        scrollSnapStop: 'always',
                      }}
                    >
                      {renderImage(img, idx)}
                    </Box>
                  ))}
                </VStack>
              ) : (
                renderImage(images[currentPage], currentPage)
              )}
            </Box>

            {!isMobile && !isVerticalMode && (
              <>
                <IconButton
                  icon={<ChevronLeftIcon />}
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  position="fixed"
                  left={4}
                  top="50%"
                  transform="translateY(-50%)"
                  zIndex={2}
                  size="lg"
                  variant="solid"
                  colorScheme="blue"
                  opacity={0.8}
                  _hover={{ opacity: 1 }}
                />
                <IconButton
                  icon={<ChevronRightIcon />}
                  onClick={handleNextPage}
                  disabled={currentPage === images.length - 1}
                  position="fixed"
                  right={4}
                  top="50%"
                  transform="translateY(-50%)"
                  zIndex={2}
                  size="lg"
                  variant="solid"
                  colorScheme="blue"
                  opacity={0.8}
                  _hover={{ opacity: 1 }}
                />
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MangaReader; 