import React, { memo } from 'react';
import { Box, Spinner, useColorModeValue } from '@chakra-ui/react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/opacity.css';

interface OptimizedImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  onDoubleClick?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  src,
  alt,
  style,
  loading = 'lazy',
  onDoubleClick
}) => {
  const bgColor = useColorModeValue('gray.100', 'gray.700');

  return (
    <Box
      width="100%"
      height="100%"
      display="flex"
      justifyContent="center"
      alignItems="center"
      bg={bgColor}
      position="relative"
    >
      <LazyLoadImage
        src={src}
        alt={alt}
        effect="opacity"
        style={style}
        loading={loading}
        onDoubleClick={onDoubleClick}
        placeholder={
          <Box
            width="100%"
            height="100%"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Spinner size="xl" />
          </Box>
        }
      />
    </Box>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
