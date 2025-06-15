import React, { useState } from 'react';
import { Box, Spinner, Text, useColorModeValue } from '@chakra-ui/react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  objectFit?: React.CSSProperties['objectFit'];
  borderRadius?: string | number;
  boxShadow?: string;
  border?: string;
  borderColor?: string;
  onClick?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
  placeholderSrc?: string;
  threshold?: number;
  wrapperClassName?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width = '100%',
  height = '100%',
  objectFit = 'cover',
  borderRadius = 'md',
  boxShadow = 'none',
  border = 'none',
  borderColor = 'transparent',
  onClick,
  onError,
  style,
  placeholderSrc,
  threshold = 100,
  wrapperClassName
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const bgColor = useColorModeValue('gray.100', 'gray.700');
  const errorColor = useColorModeValue('red.500', 'red.300');

  const handleError = () => {
    setLoaded(true);
    setError(true);
    onError?.();
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width={width}
      height={height}
      bg={bgColor}
      position="relative"
      borderRadius={borderRadius}
      overflow="hidden"
      boxShadow={boxShadow}
      border={border}
      borderColor={borderColor}
      onClick={onClick}
      cursor={onClick ? 'pointer' : 'default'}
      transition="all 0.3s ease"
      _hover={onClick ? { transform: 'scale(1.02)', boxShadow: 'lg' } : {}}
      style={style}
      className={wrapperClassName}
    >
      {!loaded && !error && !placeholderSrc && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={1}
        >
          <Spinner
            size="md"
            thickness="3px"
            speed="0.65s"
            color="blue.500"
            emptyColor="gray.200"
          />
        </Box>
      )}
      {error && (
        <Text
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          color={errorColor}
          fontSize="sm"
          textAlign="center"
          px={4}
        >
          Failed to load image
        </Text>
      )}
      <LazyLoadImage
        src={src}
        alt={alt}
        effect="blur"
        width={width}
        height={height}
        threshold={threshold}
        placeholderSrc={placeholderSrc}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        style={{
          objectFit: objectFit,
          width: '100%',
          height: '100%',
          borderRadius: borderRadius,
          transition: 'opacity 0.3s ease-in-out',
          opacity: loaded ? 1 : 0,
        }}
        wrapperClassName="lazy-image-wrapper"
      />
    </Box>
  );
};

export default LazyImage; 