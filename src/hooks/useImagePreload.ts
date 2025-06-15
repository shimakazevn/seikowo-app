import { useState, useCallback, useEffect } from 'react';

export const useImagePreload = (images: string[], currentPage: number) => {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const preloadImages = useCallback((startIndex: number, count: number = 3) => {
    if (!images.length) return;
    
    const newLoadedImages = new Set(loadedImages);
    
    // Preload next few images
    for (let i = 0; i < count; i++) {
      const index = startIndex + i;
      if (index >= 0 && index < images.length && !loadedImages.has(index)) {
        const img = new Image();
        img.src = images[index];
        newLoadedImages.add(index);
      }
    }
    
    setLoadedImages(newLoadedImages);
  }, [images, loadedImages]);

  // Load current page and preload next pages
  useEffect(() => {
    if (images.length > 0) {
      // Load current page
      preloadImages(currentPage, 1);
      
      // Preload next 2 pages
      preloadImages(currentPage + 1, 2);
    }
  }, [currentPage, images.length, preloadImages]);

  return {
    loadedImages,
    preloadImages
  };
}; 