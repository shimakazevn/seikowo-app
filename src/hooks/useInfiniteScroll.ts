import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
  threshold?: number;
  enabled?: boolean;
}

export const useInfiniteScroll = ({
  hasMore,
  loading,
  onLoadMore,
  rootMargin = '100px',
  threshold = 0.1,
  enabled = true
}: UseInfiniteScrollOptions) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const lastLoadTime = useRef<number>(0);
  const LOAD_COOLDOWN = 1000; // 1 second cooldown between loads

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    const now = Date.now();
    
    if (
      entry.isIntersecting && 
      hasMore && 
      !loading && 
      enabled &&
      (now - lastLoadTime.current) > LOAD_COOLDOWN
    ) {
      console.log('🔄 Auto-loading more posts (scroll detected)');
      lastLoadTime.current = now;
      onLoadMore();
    }
  }, [hasMore, loading, enabled, onLoadMore]);

  useEffect(() => {
    if (!enabled || !triggerRef.current) return;

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin,
      threshold
    });

    observer.observe(triggerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersection, enabled, rootMargin, threshold]);

  return { triggerRef };
};

export default useInfiniteScroll;
