import { useLocation, useNavigate } from 'react-router-dom';
import { useToast, UseToastOptions } from '@chakra-ui/react';

type ToastFunction = (options: UseToastOptions) => void;

export const usePostNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const handleReadManga = (startPage?: number) => {
    const page = startPage !== undefined ? startPage + 1 : 1;
    const newUrl = `${location.pathname}?read=true&page=${page}`;
    navigate(newUrl);
  };

  const handleTagSelect = (tag: string | null) => {
    if (tag) {
      window.location.href = `/tag/${encodeURIComponent(tag)}`;
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const showToast: ToastFunction = (options) => {
    toast({
      duration: 3000,
      isClosable: true,
      ...options
    });
  };

  return {
    handleReadManga,
    handleTagSelect,
    handleBackToHome,
    showToast,
    location,
    navigate
  };
}; 