import React, { memo, useMemo, useEffect, useRef, useCallback } from 'react';
import { Box, Grid, VStack, useBreakpointValue, useColorModeValue } from '@chakra-ui/react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import OptimizedImage from './OptimizedImage';

interface MangaViewerProps {
  images: string[];
  currentPage: number;
  isVerticalMode: boolean;
  isTwoPage: boolean;
  brightness: number;
  isZoomed: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onTransform: (e: { state: { scale: number } }) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

const MangaViewer: React.FC<MangaViewerProps> = memo(({
  images,
  currentPage,
  isVerticalMode,
  isTwoPage,
  brightness,
  isZoomed,
  onPrevPage,
  onNextPage,
  onTransform,
  onTouchStart,
  onTouchMove,
  onTouchEnd
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const bgColor = useColorModeValue('white', 'gray.800');
  const containerRef = useRef<HTMLDivElement>(null);

  // Preload next and previous images
  useEffect(() => {
    const preloadImage = (index: number) => {
      if (index >= 0 && index < images.length) {
        const img = new Image();
        img.src = images[index];
      }
    };

    // Preload next 2 pages
    preloadImage(currentPage + 1);
    preloadImage(currentPage + 2);
    // Preload previous page
    preloadImage(currentPage - 1);
  }, [currentPage, images]);

  // Handle scroll to top when page changes in vertical mode
  useEffect(() => {
    if (isVerticalMode && containerRef.current) {
      const images = containerRef.current.getElementsByTagName('img');
      if (images[currentPage]) {
        images[currentPage].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [currentPage, isVerticalMode]);

  const renderImage = useCallback((img: string, index: number, fill = false) => (
    <Box
      key={index}
      width="100%"
      height="100%"
      display="flex"
      justifyContent="center"
      alignItems="center"
      mb={isVerticalMode ? 4 : 0}
      position="relative"
      filter={`brightness(${brightness}%)`}
      transition="filter 0.3s ease"
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
            onClick={onPrevPage}
            cursor="pointer"
          />
          <Box
            position="absolute"
            right={0}
            top={0}
            width="30%"
            height="100%"
            zIndex={2}
            onClick={onNextPage}
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
        onTransformed={onTransform}
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
            <OptimizedImage
              src={img}
              alt={`Page ${index + 1}`}
              style={{
                width: fill ? '100%' : 'auto',
                height: fill ? '100%' : (isVerticalMode ? 'auto' : '100%'),
                objectFit: 'contain',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                transition: 'transform 0.3s ease',
              }}
              loading="lazy"
              onDoubleClick={() => resetTransform()}
            />
          </TransformComponent>
        )}
      </TransformWrapper>
    </Box>
  ), [isVerticalMode, isMobile, isZoomed, brightness, onPrevPage, onNextPage, onTransform]);

  const content = useMemo(() => {
    if (isVerticalMode) {
      return (
        <VStack spacing={0} align="stretch" ref={containerRef}>
          {images.map((img, idx) => renderImage(img, idx, true))}
        </VStack>
      );
    }

    if (isTwoPage) {
      return (
        <Grid templateColumns="1fr 1fr" gap={0} width="100%" height="100%">
          {currentPage < images.length && renderImage(images[currentPage], currentPage)}
          {currentPage + 1 < images.length && renderImage(images[currentPage + 1], currentPage + 1)}
        </Grid>
      );
    }

    return renderImage(images[currentPage], currentPage);
  }, [isVerticalMode, isTwoPage, currentPage, images, renderImage]);

  return (
    <Box
      width="100%"
      height="100%"
      bg={bgColor}
      overflow={isVerticalMode ? 'auto' : 'hidden'}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      css={{
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      {content}
    </Box>
  );
});

MangaViewer.displayName = 'MangaViewer';

export default MangaViewer;
