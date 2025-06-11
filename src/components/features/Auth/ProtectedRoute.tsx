import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  VStack,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Spinner,
  Center
} from '@chakra-ui/react';
import useUserStore from '../../../store/useUserStore';
import useInitializationStore from '../../../store/initializationStore';
import LoginButton from './LoginButton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  showLoginPrompt?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/',
  showLoginPrompt = true
}) => {
  const { isAuthenticated, user, storeReady } = useUserStore();
  const { isInitialized, isInitializing, initializationError } = useInitializationStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const errorColor = useColorModeValue('red.500', 'red.300');

  // Double check authentication with user data
  const hasValidAuth = isAuthenticated && user && (user.sub || user.id);

  // Show loading while store is initializing or not ready
  if (isInitializing || !isInitialized || !storeReady) {
    return (
      <Center minH="200px" bg={bgColor}>
        <VStack spacing={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color={textColor}>Đang kiểm tra đăng nhập...</Text>
          {initializationError && (
            <Text fontSize="sm" color={errorColor}>
              Lỗi: {initializationError.message}
            </Text>
          )}
        </VStack>
      </Center>
    );
  }

  // Redirect if not authenticated
  if (!hasValidAuth) {
    if (showLoginPrompt) {
      // Store the attempted URL for redirect after login
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
    }
    navigate(redirectTo, { replace: true });
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
