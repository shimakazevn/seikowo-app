import React from 'react';
import LazyImage from '../../ui/common/LazyImage';

interface OptimizedImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  style,
  onClick,
  onError
}) => {
  return (
    <LazyImage
      src={src}
      alt={alt}
      style={style}
      onClick={onClick}
      onError={onError}
    />
  );
};

export default OptimizedImage;
