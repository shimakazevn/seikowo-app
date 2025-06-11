import LazyLoadImage from 'react-lazy-load-image-component';
declare module 'react-lazy-load-image-component' {
  import { ComponentType, CSSProperties } from 'react';

  export interface LazyLoadImageProps {
    src: string;
    alt?: string;
    width?: number | string;
    height?: number | string;
    effect?: string;
    style?: CSSProperties;
    wrapperClassName?: string;
    placeholderSrc?: string;
    visibleByDefault?: boolean;
    threshold?: number;
    beforeLoad?: () => void;
    afterLoad?: () => void;
    delayTime?: number;
    delayMethod?: 'debounce' | 'throttle';
    placeholder?: React.ReactNode;
    wrapperProps?: object;
    useIntersectionObserver?: boolean;
    scrollPosition?: { x: number; y: number };
  }

  const LazyLoadImage: ComponentType<LazyLoadImageProps>;
  export default LazyLoadImage;
} 