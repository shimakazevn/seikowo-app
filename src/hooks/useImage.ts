import { useState, useEffect } from 'react';

export const useImage = (initialShowImage = false) => {
  const [showImage, setShowImage] = useState(initialShowImage);

  useEffect(() => {
    const handleImageLoading = () => {
      if (!showImage) {
        setShowImage(true);
      }
    };

    window.addEventListener('mousewheel', handleImageLoading);
    window.addEventListener('touchmove', handleImageLoading);

    return () => {
      window.removeEventListener('mousewheel', handleImageLoading);
      window.removeEventListener('touchmove', handleImageLoading);
    };
  }, [showImage]);

  return showImage;
};
