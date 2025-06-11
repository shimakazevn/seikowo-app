import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Box,
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
  Flex,
  Badge,
  Divider,
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaBookmark, FaHeart, FaShare, FaExpand, FaCompress, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import useMangaReader from '../../hooks/useMangaReader';
import MangaViewer from './MangaViewer';
import MangaControls from './MangaControls';

interface OptimizedMangaReaderProps {
  postId: string;
  initialPage?: number;
  images: string[];
  postTitle: string;
  postSlug: string;
}

const OptimizedMangaReader: React.FC<OptimizedMangaReaderProps> = memo(({
  postId,
  initialPage = 0,
  images,
  postTitle,
  postSlug
}) => {
  const { isOpen, onOpen, onClose: originalOnClose } = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');

  const {
    currentPage,
    isVerticalMode,
    isTwoPage,
    loading,
    error,
    brightness,
    autoScroll,
    autoScrollSpeed,
    showToolbar,
    fullscreen,
    isZoomed,
    zoomLevel,
    totalPages,
    setCurrentPage,
    setIsVerticalMode,
    setIsTwoPage,
    setBrightness,
    setAutoScroll,
    setAutoScrollSpeed,
    setShowToolbar,
    setFullscreen,
    setIsZoomed,
    setZoomLevel,
    handlePrevPage,
    handleNextPage,
    goToPage,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  } = useMangaReader({
    postId,
    postTitle,
    postSlug,
    images,
    initialPage
  });

  // URL handling
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pageFromUrl = parseInt(params.get('p') || '0');

    if (pageFromUrl > 0 && pageFromUrl <= images.length) {
      setCurrentPage(pageFromUrl - 1);
      if (!isOpen) onOpen();
    }
  }, [location.search, images.length, isOpen, onOpen, setCurrentPage]);

  React.useEffect(() => {
    if (isOpen && postSlug) {
      const baseUrl = postSlug.split('?')[0];
      const newUrl = `${baseUrl}?p=${currentPage + 1}`;
      navigate(newUrl, { replace: true });
    }
  }, [currentPage, postSlug, navigate, isOpen]);

  const handleClose = useCallback(() => {
    originalOnClose();
    const baseUrl = postSlug.split('?')[0];
    navigate(`/${baseUrl}`, { replace: true });
  }, [originalOnClose, postSlug, navigate]);

  const handleTransform = useCallback((e: { state: { scale: number } }) => {
    setIsZoomed(e.state.scale > 1);
    setZoomLevel(Math.round(e.state.scale * 100));
  }, [setIsZoomed, setZoomLevel]);

  // Control handlers
  const handlePageJump = useCallback((value: string) => {
    const pageNum = parseInt(value) - 1;
    if (!isNaN(pageNum)) {
      goToPage(pageNum);
    }
  }, [goToPage]);

  const handleModeSwitch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIsVerticalMode(e.target.checked);
    if (e.target.checked) {
      setIsTwoPage(false);
      setAutoScroll(false);
    }
  }, [setIsVerticalMode, setIsTwoPage, setAutoScroll]);

  const handleTwoPageSwitch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTwoPage(e.target.checked);
  }, [setIsTwoPage]);

  const handleAutoScrollToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoScroll(e.target.checked);
  }, [setAutoScroll]);

  const handleDownload = useCallback(() => {
    toast({
      title: 'Download',
      description: 'Download functionality coming soon!',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  }, [toast]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: postTitle,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied',
        description: 'Page link copied to clipboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  }, [postTitle, toast]);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  }, [setFullscreen]);

  const mangaData = useMemo(() => ({
    id: postId,
    title: postTitle,
    url: window.location.pathname,
    currentPage,
    totalPages,
    verticalMode: isVerticalMode
  }), [postId, postTitle, currentPage, totalPages, isVerticalMode]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="200px">
        <Spinner size="lg" color="blue.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" maxW="400px" mx="auto">
        <AlertIcon />
        <Box>
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Box>
      </Alert>
    );
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="full"
        closeOnOverlayClick={false}
        closeOnEsc={true}
      >
        <ModalOverlay bg="blackAlpha.900" />
        <ModalContent bg={bgColor} m={0} borderRadius={0}>
          <ModalHeader p={2}>
            <MangaControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
              onPageJump={handlePageJump}
              isVerticalMode={isVerticalMode}
              isTwoPage={isTwoPage}
              autoScroll={autoScroll}
              onModeSwitch={handleModeSwitch}
              onTwoPageSwitch={handleTwoPageSwitch}
              onAutoScrollToggle={handleAutoScrollToggle}
              autoScrollSpeed={autoScrollSpeed}
              brightness={brightness}
              onAutoScrollSpeedChange={setAutoScrollSpeed}
              onBrightnessChange={setBrightness}
              onDownload={handleDownload}
              onShare={handleShare}
              onFullscreen={handleFullscreen}
              isDownloading={false}
              fullscreen={fullscreen}
              mangaData={mangaData}
            />
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p={0} overflow={isVerticalMode ? 'auto' : 'hidden'}>
            <MangaViewer
              images={images}
              currentPage={currentPage}
              isVerticalMode={isVerticalMode}
              isTwoPage={isTwoPage}
              brightness={brightness}
              isZoomed={isZoomed}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
              onTransform={handleTransform}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
});

OptimizedMangaReader.displayName = 'OptimizedMangaReader';

export default OptimizedMangaReader;
