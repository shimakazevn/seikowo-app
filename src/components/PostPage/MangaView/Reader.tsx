import React, { useCallback, useEffect, useState } from 'react';
import { Box, Image, Text, useColorModeValue } from '@chakra-ui/react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useMangaReader } from './useMangaReader';
import Header from './Header';

const MotionBox = motion(Box);

interface ReaderProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  startPage?: number;
}

const Reader: React.FC<ReaderProps> = ({
  images,
  isOpen,
  onClose,
  startPage = 0,
}) => {
  const [showUI, setShowUI] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const bgColor = useColorModeValue('white', 'gray.800');
  const controlsBg = useColorModeValue('rgba(0, 0, 0, 0.5)', 'rgba(255, 255, 255, 0.1)');

  const {
    currentPage,
    brightness,
    handlePrevPage,
    handleNextPage,
  } = useMangaReader(images, startPage);

  // Handle close
  const handleClose = useCallback(() => {
    console.log('handleClose called');
    onClose();
  }, [onClose]);

  // Handle fullscreen toggle
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Handle share
  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: 'Manga Page',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You might want to show a toast notification here
    }
  }, []);

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg={bgColor}
      zIndex={1000}
      overflow="hidden"
    >
      <Header
        currentPage={currentPage}
        totalPages={images.length}
        showUI={showUI}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleThumbnails={() => setShowThumbnails(!showThumbnails)}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onShare={handleShare}
      />

      <Box
        p={0}
        pt="100px"
        onClick={() => setShowUI(!showUI)}
        cursor="pointer"
        height="calc(100vh - 100px)"
      >
        {/* Main Image Display */}
        <Box
          position="relative"
          height="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          filter={`brightness(${brightness}%)`}
        >
          {images[currentPage] && (
            <Image
              src={images[currentPage]}
              alt={`Page ${currentPage + 1}`}
              maxH="100%"
              maxW="100%"
              objectFit="contain"
              loading="lazy"
              fallback={
                <Box
                  w="100%"
                  h="100%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="gray.100"
                >
                  <Text>Loading...</Text>
                </Box>
              }
            />
          )}

          {/* Navigation Controls */}
          <AnimatePresence>
            {showUI && (
              <>
                {/* Previous Page Button */}
                {currentPage > 0 && (
                  <MotionBox
                    position="absolute"
                    left={4}
                    top="50%"
                    transform="translateY(-50%)"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
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
                        WebkitTouchCallout: 'none',
                        WebkitUserSelect: 'none',
                        outline: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      onTouchStart={(e) => {
                        e.currentTarget.style.transform = 'scale(0.95)';
                      }}
                      onTouchEnd={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      className="no-tap-highlight"
                    >
                      <FaChevronLeft />
                    </button>
                  </MotionBox>
                )}

                {/* Next Page Button */}
                {currentPage < images.length - 1 && (
                  <MotionBox
                    position="absolute"
                    right={4}
                    top="50%"
                    transform="translateY(-50%)"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
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
                        WebkitTouchCallout: 'none',
                        WebkitUserSelect: 'none',
                        outline: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      onTouchStart={(e) => {
                        e.currentTarget.style.transform = 'scale(0.95)';
                      }}
                      onTouchEnd={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
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
    </Box>
  );
};

export default Reader;
