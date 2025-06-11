import { useState, useEffect, useCallback } from 'react';

interface ScrollPosition {
  x: number;
  y: number;
}

interface UseScrollPositionOptions {
  throttle?: number;
  element?: Element | null;
}

export const useScrollPosition = (options: UseScrollPositionOptions = {}) => {
  const { throttle = 100, element } = options;
  
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({
    x: 0,
    y: 0
  });

  const [isAtTop, setIsAtTop] = useState(true);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  const updateScrollPosition = useCallback(() => {
    const target = element || window;
    const x = element ? element.scrollLeft : window.pageXOffset;
    const y = element ? element.scrollTop : window.pageYOffset;

    setScrollPosition({ x, y });
    setIsAtTop(y === 0);
    
    // Determine scroll direction
    setIsScrollingDown(y > lastScrollY);
    setLastScrollY(y);
  }, [element, lastScrollY]);

  useEffect(() => {
    const target = element || window;
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      if (throttle > 0) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(updateScrollPosition, throttle);
      } else {
        updateScrollPosition();
      }
    };

    target.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial call
    updateScrollPosition();

    return () => {
      target.removeEventListener('scroll', handleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [element, throttle, updateScrollPosition]);

  return {
    scrollPosition,
    isAtTop,
    isScrollingDown,
    x: scrollPosition.x,
    y: scrollPosition.y
  };
};

// Simplified hook for just checking if at top
export const useIsAtTop = (threshold = 0) => {
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY <= threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial call
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  return isAtTop;
};
