import { useState, useCallback } from 'react';

interface UseMangaReaderReturn {
  currentPage: number;
  brightness: number;
  handlePrevPage: () => void;
  handleNextPage: () => void;
  handlePageJump: (page: number) => void;
}

export const useMangaReader = (images: string[], startPage: number = 0): UseMangaReaderReturn => {
  const [currentPage, setCurrentPage] = useState(startPage);
  const [brightness, setBrightness] = useState(100);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < images.length - 1) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, images.length]);

  const handlePageJump = useCallback((page: number) => {
    if (page >= 0 && page < images.length) {
      setCurrentPage(page);
    }
  }, [images.length]);

  return {
    currentPage,
    brightness,
    handlePrevPage,
    handleNextPage,
    handlePageJump,
  };
}; 