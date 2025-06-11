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
import { optimizeThumbnail } from '../utils/blogUtils';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import useUserStore from '../store/useUserStore';
import { MANGA_KEY } from '../utils/userUtils';
import { backupUserData } from '../api/auth';
import { debounce } from 'lodash';
import useFollowBookmarkStore from '../store/useFollowBookmarkStore';
import { MangaPost, User } from '../types/common';
import { MangaBookmark } from '../types/global';
import BookmarkButton from './BookmarkButton';

interface MangaReaderProps {
  postId: string;
  initialPage?: number;
  images: string[];
  postTitle: string;
  postSlug: string;
}

interface MangaData {
  id: string;
  title: string;
  url: string;
  currentPage: number;
  totalPages: number;
  verticalMode: boolean;
}

const MangaReader: React.FC<MangaReaderProps> = ({
  postId,
  initialPage = 0,
  images,
  postTitle,
  postSlug
}) => {
  const { isOpen, onOpen, onClose: originalOnClose } = useDisclosure();
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const [currentPage, setCurrentPage] = useState(0);
  const [displayCount, setDisplayCount] = useState(8);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isVerticalMode, setIsVerticalMode] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [autoScroll, setAutoScroll] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(1);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isTwoPage, setIsTwoPage] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [pageInput, setPageInput] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const isMobile = useBreakpointValue({ base: true, md: false });
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef(Date.now());
  const pagesRead = useRef(0);
  const { isAuthenticated, userId, accessToken } = useUserStore();
  const {
    initialize: initializeStore,
    getBookmarkData
  } = useFollowBookmarkStore();

  const minSwipeDistance = 50;

  const scrollToCurrentPage = useCallback(() => {
    if (!isVerticalMode || !modalBodyRef.current) return;

    const imageElements = modalBodyRef.current.getElementsByTagName('img');
    if (imageElements.length > currentPage) {
      const targetImage = imageElements[currentPage];

      if (!targetImage.complete) {
        targetImage.onload = () => {
          const containerHeight = modalBodyRef.current!.clientHeight;
          const imageRect = targetImage.getBoundingClientRect();
          const scrollTop = targetImage.offsetTop - (containerHeight - imageRect.height) / 2;

          modalBodyRef.current!.scrollTo({
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

  const onTouchStart = (e: React.TouchEvent) => {
    if (isVerticalMode || isZoomed) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
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

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
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
    const page = parseInt(params.get('p') || '0');
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
    const pageFromUrl = parseInt(params.get('p') || '0');

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

    if (!isAuthenticated || !userId) {
      setCurrentPage(initialPage);
      setIsVerticalMode(false);
      setLoading(false);
      return;
    }

    const bookmarkData = getBookmarkData(postId);
    if (bookmarkData) {
      const pageToLoad = Math.min(bookmarkData.currentPage, images.length - 1);
      setCurrentPage(pageToLoad);
      setIsVerticalMode((bookmarkData as any).verticalMode !== undefined ? (bookmarkData as any).verticalMode : false);
    } else {
      setCurrentPage(initialPage);
      setIsVerticalMode(false);
    }
    setLoading(false);
  }, [postId, initialPage, images, isAuthenticated, userId, getBookmarkData]);

  const getThumbUrl = (url: string): string => {
    // Use optimizeThumbnail for better image optimization
    const optimized = optimizeThumbnail(url, 200);
    return optimized || url.replace(/\/s[0-9]+\//, '/s200/');
  };

  const getFullUrl = (url: string): string => {
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
        modalBodyRef.current!.scrollBy({
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

  const handleAutoScrollToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoScroll(e.target.checked);
    if (!e.target.checked && autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
  }, []);

  const handleAutoScrollSpeedChange = useCallback((value: number) => {
    setAutoScrollSpeed(value);
  }, []);

  const handleBrightnessChange = useCallback((value: number) => {
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

  const handleTransform = useCallback((e: { state: { scale: number } }) => {
    setIsZoomed(e.state.scale > 1);
    setZoomLevel(Math.round(e.state.scale * 100));
  }, []);

  const handleImageError = useCallback(() => {
    setError('Không thể tải ảnh');
    setLoading(false);
  }, []);

  const debouncedSave = useCallback(
    debounce(async (page: number) => {
      if (!userId || !isAuthenticated || !Array.isArray(images) || images.length === 0) {
        return;
      }

      try {
        const currentSlug = postSlug || location.pathname.split('/').pop();

        if (!postId || !postTitle || !currentSlug) {
          console.error('Missing required data:', String(postId || 'no-id'), String(postTitle || 'no-title'), String(currentSlug || 'no-slug'));
          return;
        }

        const bookmark: MangaBookmark = {
          id: postId,
          currentPage: page,
          totalPages: images.length,
          verticalMode: isVerticalMode,
          title: postTitle,
          url: window.location.pathname,
          timestamp: Date.now(),
        };

        const bookmarksRaw = userId ? await getHistoryData('bookmarks', userId) : [];
        const bookmarks = Array.isArray(bookmarksRaw) ? bookmarksRaw : [];
        const existingIndex = bookmarks.findIndex(b => b.id === postId);

        if (existingIndex !== -1) {
          bookmarks[existingIndex] = bookmark;
        } else {
          bookmarks.unshift(bookmark);
        }

        userId ? await saveHistoryData('bookmarks', userId, bookmarks) : Promise.resolve();

        // Backup to Google Drive if user is logged in
        if (userId && accessToken) {
          try {
            const backupData = {
              readPosts: userId ? await getHistoryData('reads', userId) : [],
              favoritePosts: userId ? await getHistoryData('favorites', userId) : [],
              mangaBookmarks: userId ? await getHistoryData('bookmarks', userId) : []
            };
            await backupUserData(accessToken, userId, backupData);
          } catch (error: any) {
            console.error('Error backing up to Google Drive:', error);
          }
        }
      } catch (error: any) {
        console.error('Error auto-saving bookmark:', error);
      }
    }, 5000),
    [postId, postTitle, postSlug, images.length, isVerticalMode, userId, accessToken]
  );

  useEffect(() => {
    if (isAuthenticated && userId && Array.isArray(images) && images.length > 0) {
      debouncedSave(currentPage);
    }
    return () => {
      debouncedSave.cancel();
    };
  }, [currentPage, debouncedSave, isAuthenticated, userId, images]);



  const renderImage = useCallback((img: string, index: number, fill = false) => (
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

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!isVerticalMode || !isOpen) return;

    const container = e.target as HTMLDivElement;
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

  const handleModeSwitch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleTwoPageSwitch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsTwoPage(checked);
    if (checked) {
      // Snap to even page
      setCurrentPage(prev => prev % 2 === 0 ? prev : prev - 1);
    }
  }, []);

  const handlePageJump = useCallback((value: string) => {
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

  const handleDownload = useCallback(async (index: number) => {
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
    } catch (error: any) {
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

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      modalBodyRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  }, []);

  const handleToolbarToggle = useCallback(() => {
    setShowToolbar(prev => !prev);
  }, []);

  const handleImageLoad = useCallback(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    // Check for page parameter in URL
    const params = new URLSearchParams(location.search);
    const pageFromUrl = parseInt(params.get('p') || '0');

    if (pageFromUrl > 0 && pageFromUrl <= images.length) {
      setCurrentPage(pageFromUrl - 1);
      onOpen(); // Open reader if page parameter exists
    }
  }, [location.search, images.length, onOpen]);

  useEffect(() => {
    if (!postId || !postTitle || !postSlug) {
      console.error('Missing required data:', { postId, postTitle, postSlug });
      setError('Dữ liệu bài viết không đủ. Vui lòng tải lại trang.');
      return;
    }
  }, [postId, postTitle, postSlug]);

  useEffect(() => {
    if (userId && isAuthenticated) {
      initializeStore(userId);
    }
  }, [userId, isAuthenticated, initializeStore]);

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
              _hover={{
                transform: 'scale(1.02)',
                transition: 'transform 0.2s'
              }}
            >
              <LazyLoadImage
                src={getThumbUrl(img)}
                alt={`Page ${idx + 1}`}
                effect="opacity"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 'md',
                  objectFit: 'cover'
                }}
              />
              <Text
                position="absolute"
                bottom={2}
                right={2}
                bg="blackAlpha.700"
                color="white"
                px={2}
                py={1}
                borderRadius="md"
                fontSize="sm"
              >
                {idx + 1}
              </Text>
            </Box>
          ))}
        </Grid>

        <Modal
          isOpen={isOpen}
          onClose={handleClose}
          size="full"
          motionPreset="slideInBottom"
        >
          <ModalOverlay />
          <ModalContent
            bg={bgColor}
            maxW="100vw"
            maxH="100vh"
            m={0}
            p={0}
            borderRadius={0}
          >
            <ModalHeader
              p={4}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              borderBottom="1px"
              borderColor="gray.200"
            >
              <Text fontSize="lg" fontWeight="bold" noOfLines={1}>
                {postTitle}
              </Text>
              <HStack spacing={2}>
                <IconButton
                  aria-label="Toggle toolbar"
                  icon={showToolbar ? <ViewOffIcon /> : <ViewOnIcon />}
                  onClick={handleToolbarToggle}
                  variant="ghost"
                  size="sm"
                />
                <IconButton
                  aria-label="Settings"
                  icon={<SettingsIcon />}
                  onClick={onSettingsOpen}
                  variant="ghost"
                  size="sm"
                />
                <IconButton
                  aria-label="Close"
                  icon={<ChevronDownIcon />}
                  onClick={handleClose}
                  variant="ghost"
                  size="sm"
                />
              </HStack>
            </ModalHeader>

            <ModalBody
              ref={modalBodyRef}
              p={0}
              overflow={isVerticalMode ? 'auto' : 'hidden'}
              position="relative"
              onScroll={handleScroll}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {loading && (
                <Flex
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  justify="center"
                  align="center"
                  bg="blackAlpha.700"
                  zIndex={10}
                >
                  <Spinner size="xl" color="white" />
                </Flex>
              )}

              {isVerticalMode ? (
                <VStack spacing={0} align="stretch">
                  {images.map((img, idx) => renderImage(img, idx, true))}
                </VStack>
              ) : (
                <Box
                  position="relative"
                  width="100%"
                  height="100%"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  {isTwoPage ? (
                    <HStack spacing={0} width="100%" height="100%">
                      {currentPage < images.length && renderImage(images[currentPage], currentPage)}
                      {currentPage + 1 < images.length && renderImage(images[currentPage + 1], currentPage + 1)}
                    </HStack>
                  ) : (
                    renderImage(images[currentPage], currentPage)
                  )}
                </Box>
              )}
            </ModalBody>

            {showToolbar && (
              <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                p={4}
                bg={bgColor}
                borderTop="1px"
                borderColor="gray.200"
                zIndex={5}
              >
                <HStack spacing={4} justify="space-between">
                  <HStack spacing={2}>
                    <IconButton
                      aria-label="Previous page"
                      icon={<ChevronLeftIcon />}
                      onClick={handlePrevPage}
                      isDisabled={currentPage === 0}
                      variant="ghost"
                      size="sm"
                    />
                    <NumberInput
                      value={currentPage + 1}
                      min={1}
                      max={images.length}
                      onChange={handlePageJump}
                      size="sm"
                      width="70px"
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <Text color={mutedTextColor}>/ {images.length}</Text>
                    <IconButton
                      aria-label="Next page"
                      icon={<ChevronRightIcon />}
                      onClick={handleNextPage}
                      isDisabled={currentPage === images.length - 1}
                      variant="ghost"
                      size="sm"
                    />
                  </HStack>

                  <HStack spacing={2}>
                    <Tooltip label="Vertical mode">
                      <Switch
                        isChecked={isVerticalMode}
                        onChange={handleModeSwitch}
                        size="sm"
                      />
                    </Tooltip>
                    <Tooltip label="Two-page mode">
                      <Switch
                        isChecked={isTwoPage}
                        onChange={handleTwoPageSwitch}
                        isDisabled={isVerticalMode}
                        size="sm"
                      />
                    </Tooltip>
                    <Tooltip label="Auto-scroll">
                      <Switch
                        isChecked={autoScroll}
                        onChange={handleAutoScrollToggle}
                        isDisabled={!isVerticalMode}
                        size="sm"
                      />
                    </Tooltip>
                    {autoScroll && (
                      <Slider
                        value={autoScrollSpeed}
                        onChange={handleAutoScrollSpeedChange}
                        min={1}
                        max={10}
                        step={1}
                        width="100px"
                        size="sm"
                      >
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                    )}
                    <Tooltip label="Brightness">
                      <Slider
                        value={brightness}
                        onChange={handleBrightnessChange}
                        min={50}
                        max={150}
                        step={1}
                        width="100px"
                        size="sm"
                      >
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                    </Tooltip>
                    <BookmarkButton
                      mangaData={{
                        id: postId,
                        title: postTitle,
                        url: window.location.pathname,
                        currentPage,
                        totalPages: images.length,
                        verticalMode: isVerticalMode
                      }}
                    />
                    <IconButton
                      aria-label="Download"
                      icon={<DownloadIcon />}
                      onClick={() => handleDownload(currentPage)}
                      variant="ghost"
                      size="sm"
                      isLoading={isDownloading}
                    />
                    <IconButton
                      aria-label="Share"
                      icon={<ExternalLinkIcon />}
                      onClick={handleShare}
                      variant="ghost"
                      size="sm"
                    />
                    <IconButton
                      aria-label="Fullscreen"
                      icon={fullscreen ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={handleFullscreen}
                      variant="ghost"
                      size="sm"
                    />
                  </HStack>
                </HStack>
              </Box>
            )}
          </ModalContent>
        </Modal>

        <Modal
          isOpen={isSettingsOpen}
          onClose={onSettingsClose}
          size="md"
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Settings</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text mb={2}>Display Count</Text>
                  <NumberInput
                    value={displayCount}
                    min={4}
                    max={24}
                    onChange={(_, value) => setDisplayCount(value)}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </Box>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default MangaReader;