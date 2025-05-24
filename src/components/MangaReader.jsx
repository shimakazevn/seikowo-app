import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Input,
  InputGroup,
  InputRightElement,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  StarIcon, 
  ChevronDownIcon, 
  ViewIcon,
  TimeIcon,
  ChevronUpIcon,
  ChevronDownIcon as ChevronDown,
  SettingsIcon,
  DownloadIcon,
  ViewOffIcon,
  ViewIcon as ViewOnIcon,
  ExternalLinkIcon,
} from '@chakra-ui/icons';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { getHistoryData, saveHistoryData } from '../utils/indexedDBUtils';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaBookmark, FaBookmark as FaBookmarkSolid } from 'react-icons/fa';
import useUserStore from '../store/useUserStore';
import { MANGA_KEY } from '../utils/userUtils';
import { backupUserData } from '../api/auth';

const MangaReader = ({ postId, initialPage = 0, images, postTitle }) => {
  const { isOpen, onOpen, onClose: originalOnClose } = useDisclosure();
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const [currentPage, setCurrentPage] = useState(0);
  const [displayCount, setDisplayCount] = useState(8);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isVerticalMode, setIsVerticalMode] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [autoScroll, setAutoScroll] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(1);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isTwoPage, setIsTwoPage] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [pageInput, setPageInput] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const isMobile = useBreakpointValue({ base: true, md: false });
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const modalBodyRef = useRef(null);
  const autoScrollInterval = useRef(null);
  const startTime = useRef(Date.now());
  const pagesRead = useRef(0);
  const { postSlug } = useParams();
  const { isGuest, userId, accessToken } = useUserStore();

  const minSwipeDistance = 50;

  const scrollToCurrentPage = useCallback(() => {
    if (!isVerticalMode || !modalBodyRef.current) return;
    
    const imageElements = modalBodyRef.current.getElementsByTagName('img');
    if (imageElements.length > currentPage) {
      const targetImage = imageElements[currentPage];
      
      if (!targetImage.complete) {
        targetImage.onload = () => {
          const containerHeight = modalBodyRef.current.clientHeight;
          const imageRect = targetImage.getBoundingClientRect();
          const scrollTop = targetImage.offsetTop - (containerHeight - imageRect.height) / 2;
          
          modalBodyRef.current.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          });
        };
      } else {
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

  const handlePrevPage = useCallback(() => {
    if (isTwoPage) {
      setCurrentPage(prev => Math.max(0, prev - 2));
    } else {
      setCurrentPage(prev => Math.max(0, prev - 1));
    }
  }, [isTwoPage]);

  const handleNextPage = useCallback(() => {
    if (isTwoPage) {
      setCurrentPage(prev => {
        if (prev + 2 >= images.length) {
          // If odd number of pages, allow last single page
          return images.length % 2 === 0 ? images.length - 2 : images.length - 1;
        }
        return prev + 2;
      });
    } else {
      setCurrentPage(prev => Math.min(images.length - 1, prev + 1));
    }
  }, [isTwoPage, images.length]);

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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get('p'));
    if (page && !isOpen) {
      onOpen();
    }
  }, [location.search, isOpen, onOpen]);

  const handleClose = useCallback(() => {
    originalOnClose();
    const baseUrl = postSlug.split('?')[0];
    navigate(`/${baseUrl}`, { replace: true });
  }, [originalOnClose, postSlug, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pageFromUrl = parseInt(params.get('p'));
    
    if (pageFromUrl > 0 && pageFromUrl <= images.length) {
      setCurrentPage(pageFromUrl - 1);
    }
  }, [location.search, images.length]);

  useEffect(() => {
    if (!postSlug || !isOpen) return;
    const baseUrl = postSlug.split('?')[0];
    const newUrl = `${baseUrl}?p=${currentPage + 1}`;
    navigate(newUrl, { replace: true });
  }, [currentPage, postSlug, navigate, isOpen]);

  useEffect(() => {
    if (!Array.isArray(images) || images.length === 0) {
      setLoading(false);
      return;
    }

    if (isGuest) {
        setIsBookmarked(false);
        setCurrentPage(initialPage);
        setIsVerticalMode(false);
        setLoading(false);
        return;
    }

    const loadBookmarks = async () => {
      const bookmarks = await getHistoryData('bookmarks', userId);
      const foundBookmark = bookmarks.find(b => b.id === postId);
      if (foundBookmark) {
        const pageToLoad = Math.min(foundBookmark.currentPage, images.length - 1);
        setCurrentPage(pageToLoad);
        setIsBookmarked(true);
        setIsVerticalMode(foundBookmark.verticalMode !== undefined ? foundBookmark.verticalMode : false);
      } else {
        setCurrentPage(initialPage);
        setIsBookmarked(false);
        setIsVerticalMode(false);
      }
       setLoading(false);
    };

    loadBookmarks();
  }, [postId, initialPage, images, isGuest, userId]);

  useEffect(() => {
    if (!Array.isArray(images) || images.length === 0) {
      return;
    }

    if (isGuest || !Array.isArray(images) || images.length === 0) {
      return;
    }

    const saveBookmark = async () => {
      try {
        // Get postSlug from URL if not provided in props
        const currentSlug = postSlug || location.pathname.split('/').pop();
        
        // Validate required data
        if (!postId || !postTitle || !currentSlug) {
          console.error('Missing required data:', { postId, postTitle, currentSlug });
          toast({
            title: 'Lỗi',
            description: 'Không thể lưu bookmark. Dữ liệu bài viết không đủ.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        const bookmark = {
          id: postId,
          currentPage: currentPage,
          totalPages: images.length,
          verticalMode: isVerticalMode,
          title: postTitle,
          slug: currentSlug,
          url: window.location.pathname,
          labels: [],
          timestamp: Date.now(),
          bookmarkAt: Date.now(),
        };
        
        console.log('Saving bookmark:', bookmark);

        // Get existing bookmarks
        const bookmarks = await getHistoryData('bookmarks', userId);
        console.log('Existing bookmarks:', bookmarks);

        // Update or add new bookmark
        const existingIndex = bookmarks.findIndex(b => b.id === postId);
        if (existingIndex !== -1) {
          bookmarks[existingIndex] = bookmark;
        } else {
          bookmarks.unshift(bookmark);
        }
        
        // Save to IndexedDB
        await saveHistoryData('bookmarks', userId, bookmarks);
        console.log('Bookmarks saved successfully');

        // Show success message
        toast({
          title: 'Đã lưu bookmark',
          description: `Đã lưu vị trí đọc tại trang ${currentPage + 1}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Backup to Google Drive if user is logged in
        if (userId && accessToken) {
          try {
            const backupData = {
              readPosts: await getHistoryData('read', userId),
              followPosts: await getHistoryData('favorites', userId),
              mangaBookmarks: bookmarks
            };
            console.log('Backing up data:', backupData);
            await backupUserData(accessToken, userId, backupData);
          } catch (error) {
            console.error('Error backing up to Google Drive:', error);
          }
        }
      } catch (error) {
        console.error('Error saving bookmark:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể lưu bookmark. Vui lòng thử lại.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    saveBookmark();
  }, [currentPage, postId, images.length, isVerticalMode, postSlug, postTitle, isGuest, userId, accessToken, toast]);

  const getThumbUrl = (url) => {
    return url.replace(/\/s[0-9]+\//, '/s200/');
  };

  const getFullUrl = (url) => {
    return url.replace(/\/s[0-9]+\//, '/s1600/');
  };

  const calculateTimeLeft = useCallback(() => {
    if (pagesRead.current === 0) return null;
    
    const timePerPage = (Date.now() - startTime.current) / pagesRead.current;
    const pagesLeft = images.length - currentPage - 1;
    const timeLeft = Math.round((timePerPage * pagesLeft) / 1000);
    
    if (timeLeft < 60) return `${timeLeft}s`;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}m ${seconds}s`;
  }, [currentPage, images.length]);

  useEffect(() => {
    if (currentPage > 0) {
      pagesRead.current++;
      setEstimatedTimeLeft(calculateTimeLeft());
    }
  }, [currentPage, calculateTimeLeft]);

  useEffect(() => {
    if (autoScroll && isVerticalMode && modalBodyRef.current) {
      autoScrollInterval.current = setInterval(() => {
        modalBodyRef.current.scrollBy({
          top: autoScrollSpeed * 2,
          behavior: 'smooth'
        });
      }, 50);
    }
    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [autoScroll, isVerticalMode, autoScrollSpeed]);

  const handleAutoScrollToggle = useCallback((e) => {
    setAutoScroll(e.target.checked);
    if (!e.target.checked && autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
  }, []);

  const handleAutoScrollSpeedChange = useCallback((value) => {
    setAutoScrollSpeed(value);
  }, []);

  const handleBrightnessChange = useCallback((value) => {
    setBrightness(value);
  }, []);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(0);
    if (isVerticalMode) {
      scrollToCurrentPage();
    }
  }, [isVerticalMode, scrollToCurrentPage]);

  const goToLastPage = useCallback(() => {
    setCurrentPage(images.length - 1);
    if (isVerticalMode) {
      scrollToCurrentPage();
    }
  }, [images.length, isVerticalMode, scrollToCurrentPage]);

  const handleTransform = useCallback((e) => {
    setIsZoomed(e.state.scale > 1);
    setZoomLevel(Math.round(e.state.scale * 100));
  }, []);

  const handleImageError = useCallback(() => {
    setError('Không thể tải ảnh');
    setLoading(false);
  }, []);

  // Handle bookmark toggle
  const handleBookmark = useCallback(async () => {
    if (isGuest) {
         toast({
            title: 'Lỗi',
            description: 'Chức năng bookmark chỉ dành cho người dùng đã đăng nhập.',
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
        return;
    }

    // Ensure required data is available
    if (!postId || !postSlug || !Array.isArray(images) || images.length === 0) {
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu bookmark. Dữ liệu bài viết không đủ.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const bookmarks = await getHistoryData('bookmarks', userId);

      // Generate a unique identifier for the current page's bookmark
      const currentBookmarkIdentifier = `${postId}_p${currentPage + 1}`;

      // Check if the current page is already bookmarked
      const existingIndex = bookmarks.findIndex(b => 
        `${b.id}_p${b.currentPage + 1}` === currentBookmarkIdentifier
      );

      if (existingIndex !== -1) {
        // Bookmark exists, remove it
        bookmarks.splice(existingIndex, 1);
        await saveHistoryData('bookmarks', userId, bookmarks);
        setIsBookmarked(false);
        toast({
          title: 'Đã gỡ bookmark',
          description: `Trang ${currentPage + 1}/${images.length}`,
          status: 'info',
          duration: 2000,
          isClosable: true,
        });
      } else {
        // Bookmark does not exist, add it
        const bookmarkToAdd = {
          id: postId,
          currentPage: currentPage,
          verticalMode: isVerticalMode,
          title: postTitle,
          thumbnail: '',
          slug: postSlug,
          labels: [],
          timestamp: Date.now(),
        };
        
        // Use saveMangaBookmark to handle adding, updating, and list limit
        const success = await saveMangaBookmark(bookmarkToAdd);

        if (success) {
          setIsBookmarked(true);
          toast({
            title: 'Đã lưu bookmark',
            description: `Trang ${currentPage + 1}/${images.length}`,
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        } else {
           toast({
            title: 'Lỗi lưu bookmark',
            description: 'Không thể lưu bookmark.',
            status: 'error',
            duration: 2000,
            isClosable: true,
          });
        }
      }
    } catch (err) {
      console.error('Error handling bookmark:', err);
       toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi khi xử lý bookmark.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [postId, currentPage, isVerticalMode, postTitle, postSlug, images.length, toast, isGuest, userId]);

  // Check if current page is bookmarked on page change
  useEffect(() => {
    const checkBookmark = async () => {
      if (!Array.isArray(images) || images.length === 0) {
        setIsBookmarked(false); // Cannot be bookmarked if no images
        return;
      }

      try {
        const bookmarks = await getHistoryData('bookmarks');
        const isCurrentPageBookmarked = bookmarks.some(b => 
          b.id === postId && b.currentPage === currentPage
        );
        setIsBookmarked(isCurrentPageBookmarked);
      } catch (error) {
        console.error('Error checking bookmark:', error);
        setIsBookmarked(false);
      }
    };

    checkBookmark();
  }, [postId, currentPage, images.length]);

  const renderImage = useCallback((img, index, fill = false) => (
    <Box
      key={index}
      width="100%"
      height="100%"
      display="flex"
      justifyContent="center"
      alignItems="center"
      mb={isVerticalMode ? 0 : 0}
      position="relative"
      filter={`brightness(${brightness}%)`}
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
        onTransformed={handleTransform}
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
              maxWidth: fill ? '100%' : '100vw',
              maxHeight: fill ? '100%' : (isVerticalMode ? 'none' : '100%'),
            }}
          >
            <img
              src={getFullUrl(img)}
              alt={`Page ${index + 1}`}
              style={{
                width: fill ? '100%' : 'auto',
                height: fill ? '100%' : (isVerticalMode ? 'auto' : '100%'),
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
  ), [isVerticalMode, isMobile, isZoomed, brightness, handlePrevPage, handleNextPage, handleTransform]);

  const handleScroll = useCallback((e) => {
    if (!isVerticalMode || !isOpen) return;

    const container = e.target;
    const imageElements = container.getElementsByTagName('img');
    const containerTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const centerY = containerTop + (containerHeight / 2);

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

  const handleModeSwitch = useCallback((e) => {
    const newMode = e.target.checked;
    setIsVerticalMode(newMode);
    if (newMode) {
      setIsTwoPage(false); // Disable two-page mode when switching to vertical
      setTimeout(() => {
        scrollToCurrentPage();
      }, 300);
    } else {
      setCurrentPage(currentPage); // Keep current page
    }
  }, [currentPage, scrollToCurrentPage]);

  // Handle switching two-page mode
  const handleTwoPageSwitch = useCallback((e) => {
    const checked = e.target.checked;
    setIsTwoPage(checked);
    if (checked) {
      // Snap to even page
      setCurrentPage(prev => prev % 2 === 0 ? prev : prev - 1);
    }
  }, []);

  // Handle page jump
  const handlePageJump = useCallback((value) => {
    if (!Array.isArray(images) || images.length === 0) return;
    const pageNum = parseInt(value);
    if (pageNum >= 1 && pageNum <= images.length) {
      if (isTwoPage) {
        // Snap to even page, but allow last single page if odd
        let adjustedPage = Math.floor((pageNum - 1) / 2) * 2;
        if (adjustedPage >= images.length - 1) adjustedPage = images.length - 1;
        setCurrentPage(adjustedPage);
      } else {
        setCurrentPage(pageNum - 1);
      }
      if (isVerticalMode) {
        scrollToCurrentPage();
      }
    }
  }, [images.length, isVerticalMode, scrollToCurrentPage, isTwoPage]);

  // Handle download
  const handleDownload = useCallback(async (index) => {
    if (isDownloading || !Array.isArray(images) || images.length === 0 || index < 0 || index >= images.length) return;
    setIsDownloading(true);
    try {
      const img = images[index];
      const imgUrl = getFullUrl(img);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = imgUrl;
      link.download = `page-${index + 1}.jpg`;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Đang tải xuống',
        description: 'Mở tab mới để tải ảnh',
        status: 'info',
        duration: 2000,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Lỗi tải xuống',
        description: 'Vui lòng thử lại sau',
        status: 'error',
        duration: 2000,
      });
    } finally {
      setIsDownloading(false);
    }
  }, [images, isDownloading, toast]);

  // Handle share
  const handleShare = useCallback(() => {
    if (!Array.isArray(images) || images.length === 0) return;
    const baseUrl = postSlug.split('?')[0];
    const shareUrl = `${window.location.origin}/${baseUrl}?p=${currentPage + 1}`;
    if (navigator.share) {
      navigator.share({
        title: postTitle,
        text: `Đang đọc ${postTitle} - Trang ${currentPage + 1}`,
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast({
          title: 'Đã sao chép link',
          description: 'Bạn có thể chia sẻ link này',
          status: 'success',
          duration: 2000,
        });
      });
    }
  }, [postSlug, postTitle, currentPage, toast]);

  // Handle fullscreen
  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      modalBodyRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  }, []);

  // Handle toolbar toggle
  const handleToolbarToggle = useCallback(() => {
    setShowToolbar(prev => !prev);
  }, []);

  const handleImageLoad = useCallback(() => {
    setLoading(false);
  }, []);

  // Add initial check for login and page parameter
  useEffect(() => {
    // Check if user is logged in
    if (isGuest) {
      toast({
        title: 'Thông báo',
        description: 'Vui lòng đăng nhập để sử dụng đầy đủ tính năng.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }

    // Check for page parameter in URL
    const params = new URLSearchParams(location.search);
    const pageFromUrl = parseInt(params.get('p'));
    
    if (pageFromUrl > 0 && pageFromUrl <= images.length) {
      setCurrentPage(pageFromUrl - 1);
      onOpen(); // Open reader if page parameter exists
    }
  }, [location.search, images.length, isGuest, toast, onOpen]);

  // Add validation for required data
  useEffect(() => {
    if (!postId || !postTitle || !postSlug) {
      console.error('Missing required data:', { postId, postTitle, postSlug });
      setError('Dữ liệu bài viết không đủ. Vui lòng tải lại trang.');
      return;
    }
  }, [postId, postTitle, postSlug]);

  if (error) {
    return (
      <Box p={4}>
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="lg"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Lỗi
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {error}
          </AlertDescription>
          <Button
            colorScheme="blue"
            mt={4}
            onClick={() => navigate(-1)}
          >
            Quay lại
          </Button>
        </Alert>
      </Box>
    );
  }

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
        motionPreset="slideInBottom"
      >
        <ModalOverlay 
          bg="blackAlpha.300"
          backdropFilter="blur(10px)"
          transition="all 0.2s"
        />
        <ModalContent 
          bg={bgColor} 
          maxH="100vh" 
          h="100vh" 
          m="0"
          transition="all 0.3s"
          transform={isOpen ? "scale(1)" : "scale(0.95)"}
          opacity={isOpen ? 1 : 0}
        >
          <ModalHeader 
            p={2} 
            display={showToolbar ? 'block' : 'none'}
            position="fixed"
            top={0}
            left={0}
            right={0}
            zIndex={1000}
            bg={useColorModeValue('rgba(255,255,255,0.6)', 'rgba(30,41,59,0.6)')}
            backdropFilter="blur(12px)"
            sx={{
              WebkitBackdropFilter: 'blur(12px)',
            }}
            borderBottom="1px solid"
            borderColor={useColorModeValue('gray.200', 'gray.700')}
          >
            <Flex justify="flex-end" align="center" gap={2}>
              {/* Favorite/Bookmark Button */}
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
              {/* Fullscreen Button */}
              <Tooltip label="Xem toàn màn hình">
                <IconButton
                  icon={<ExternalLinkIcon />}
                  onClick={handleFullscreen}
                  size="sm"
                  aria-label="Fullscreen"
                />
              </Tooltip>
              {/* Settings Button */}
              <IconButton
                icon={<SettingsIcon />}
                variant="ghost"
                size="sm"
                onClick={onSettingsOpen}
                aria-label="Cài đặt"
              />
              <ModalCloseButton position="static" onClick={handleClose} />
            </Flex>
          </ModalHeader>
          <ModalBody 
            p={0} 
            h={showToolbar ? "calc(100vh - 48px)" : "100vh"} 
            ref={modalBodyRef}
            mt={showToolbar ? "48px" : 0}
          >
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
              ) : isTwoPage ? (
                <Grid templateColumns="repeat(2, 1fr)" gap={0} height="100%" alignItems="stretch" justifyItems="stretch">
                  {Array.from({ length: Math.ceil(images.length / 2) }).map((_, pairIndex) => {
                    const leftPageIndex = pairIndex * 2;
                    const rightPageIndex = leftPageIndex + 1;
                    const isCurrentPair = Math.floor(currentPage / 2) === pairIndex;
                    return (
                      <Grid
                        key={pairIndex}
                        templateColumns="repeat(2, 1fr)"
                        gap={0}
                        display={isCurrentPair ? "grid" : "none"}
                        height="100%"
                        alignItems="stretch"
                        justifyItems="stretch"
                      >
                        <Box width="100%" height="100%" display="flex" alignItems="center" justifyContent="center">
                          {renderImage(images[leftPageIndex], leftPageIndex, true)}
                        </Box>
                        <Box width="100%" height="100%" display="flex" alignItems="center" justifyContent="center">
                          {rightPageIndex < images.length ? renderImage(images[rightPageIndex], rightPageIndex, true) : null}
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
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
                  disabled={isTwoPage ? currentPage >= images.length - 2 : currentPage >= images.length - 1}
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
                {/* Toolbar Toggle Button */}
                <IconButton
                  icon={showToolbar ? <ViewOffIcon /> : <ViewOnIcon />}
                  onClick={handleToolbarToggle}
                  variant="solid"
                  colorScheme="blue"
                  size="lg"
                  position="fixed"
                  right={4}
                  bottom={4}
                  zIndex={2}
                  aria-label={showToolbar ? "Hide toolbar" : "Show toolbar"}
                  opacity={0.8}
                  _hover={{ opacity: 1 }}
                />
              </>
            )}

            {/* Show toolbar toggle for mobile or vertical mode */}
            {(isMobile || isVerticalMode || isTwoPage) && (
              <IconButton
                icon={showToolbar ? <ViewOffIcon /> : <ViewOnIcon />}
                onClick={handleToolbarToggle}
                variant="solid"
                colorScheme="blue"
                size="lg"
                position="fixed"
                right={4}
                bottom={4}
                zIndex={2}
                aria-label={showToolbar ? "Hide toolbar" : "Show toolbar"}
                opacity={0.8}
                _hover={{ opacity: 1 }}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Settings Modal */}
      <Modal 
        isOpen={isSettingsOpen} 
        onClose={onSettingsClose} 
        size="md"
        isCentered
        motionPreset="slideInBottom"
      >
        <ModalOverlay 
          bg="blackAlpha.300"
          backdropFilter="blur(10px)"
          transition="all 0.2s"
        />
        <ModalContent 
          bg={bgColor}
          borderRadius="xl"
          boxShadow="xl"
          transition="all 0.3s"
          transform={isSettingsOpen ? "scale(1)" : "scale(0.95)"}
          opacity={isSettingsOpen ? 1 : 0}
        >
          <ModalHeader 
            borderBottom="1px solid"
            borderColor={useColorModeValue('gray.200', 'gray.700')}
            pb={4}
          >
            <Flex align="center" gap={2}>
              <SettingsIcon />
              <Text>Cài đặt</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <VStack spacing={6} align="stretch">
              {/* Reading Mode Settings */}
              <Box>
                <Flex align="center" gap={2} mb={2}>
                  <ViewIcon />
                  <Text fontWeight="medium">Chế độ đọc</Text>
                </Flex>
                <Flex align="center" gap={4}>
                  <Flex align="center" gap={2}>
                    <Switch
                      size="sm"
                      isChecked={isVerticalMode}
                      onChange={handleModeSwitch}
                      onWheel={e => e.target.blur()}
                    />
                    <Text fontSize="sm">{isVerticalMode ? 'Dọc' : 'Ngang'}</Text>
                  </Flex>
                  {!isVerticalMode && (
                    <Flex align="center" gap={2}>
                      <Switch
                        size="sm"
                        isChecked={isTwoPage}
                        onChange={handleTwoPageSwitch}
                      />
                      <Text fontSize="sm">2 trang</Text>
                    </Flex>
                  )}
                </Flex>
              </Box>

              {/* Display Settings */}
              <Box>
                <Text fontWeight="medium" mb={2}>Độ sáng: {brightness}%</Text>
                <Slider
                  value={brightness}
                  onChange={handleBrightnessChange}
                  min={50}
                  max={150}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </Box>

              {/* Auto Scroll Settings */}
              {isVerticalMode && (
                <Box>
                  <Flex align="center" gap={2} mb={2}>
                    <TimeIcon />
                    <Text fontWeight="medium">Tự động cuộn</Text>
                    <Switch
                      size="sm"
                      isChecked={autoScroll}
                      onChange={handleAutoScrollToggle}
                      ml="auto"
                    />
                  </Flex>
                  {autoScroll && (
                    <Slider
                      value={autoScrollSpeed}
                      onChange={handleAutoScrollSpeedChange}
                      min={1}
                      max={5}
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  )}
                </Box>
              )}

              {/* Navigation */}
              <Box>
                <Text fontWeight="medium" mb={2}>Đi đến trang</Text>
                <NumberInput
                  size="sm"
                  maxW="100px"
                  min={1}
                  max={Array.isArray(images) ? images.length : 1}
                  value={currentPage + 1}
                  onChange={(value) => handlePageJump(value)}
                  isDisabled={!Array.isArray(images) || images.length === 0}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Box>

              {/* Quick Navigation */}
              <Flex gap={2}>
                <Button
                  leftIcon={<ChevronUpIcon />}
                  onClick={goToFirstPage}
                  size="sm"
                  flex={1}
                  isDisabled={!Array.isArray(images) || images.length === 0}
                >
                  Đến trang đầu
                </Button>
                <Button
                  leftIcon={<ChevronDown />}
                  onClick={goToLastPage}
                  size="sm"
                  flex={1}
                  isDisabled={!Array.isArray(images) || images.length === 0}
                >
                  Đến trang cuối
                </Button>
              </Flex>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MangaReader; 