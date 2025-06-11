import React, { useState, useEffect } from 'react';
import { Box, Button, Text, VStack, HStack, Badge, Code, Divider } from '@chakra-ui/react';
import { authService } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';

const AuthDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuthContext();

  const refreshDebugInfo = async () => {
    try {
      const tokens = await authService.tokenManager.getTokens();
      const isValid = await authService.tokenManager.isTokenValid();
      
      // Check localStorage
      const localStorageKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('secure_key_') || key.startsWith('auth_')
      );
      
      // Check sessionStorage  
      const sessionStorageKeys = Object.keys(sessionStorage).filter(key => 
        key.startsWith('secure_key_') || key.startsWith('auth_')
      );

      setDebugInfo({
        tokens: tokens ? {
          hasAccessToken: !!tokens.accessToken,
          accessTokenLength: tokens.accessToken?.length || 0,
          hasRefreshToken: !!tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          isExpired: tokens.expiresAt ? Date.now() > tokens.expiresAt : false
        } : null,
        isTokenValid: isValid,
        localStorage: localStorageKeys,
        sessionStorage: sessionStorageKeys,
        authContext: {
          isAuthenticated,
          isLoading,
          hasUser: !!user,
          userId: user?.id
        },
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('Debug info error:', error);
      setDebugInfo({ error: error.message });
    }
  };

  useEffect(() => {
    if (isVisible) {
      refreshDebugInfo();
      const interval = setInterval(refreshDebugInfo, 2000);
      return () => clearInterval(interval);
    }
  }, [isVisible, isAuthenticated]);

  const clearAllStorage = async () => {
    try {
      await authService.tokenManager.clearTokens();
      localStorage.clear();
      sessionStorage.clear();
      await refreshDebugInfo();
    } catch (error) {
      console.error('Clear storage error:', error);
    }
  };

  if (!isVisible) {
    return (
      <Box position="fixed" top={4} right={4} zIndex={9999}>
        <Button size="sm" onClick={() => setIsVisible(true)} colorScheme="blue">
          Debug Auth
        </Button>
      </Box>
    );
  }

  return (
    <Box 
      position="fixed" 
      top={4} 
      right={4} 
      p={4} 
      bg="gray.800" 
      color="white" 
      borderRadius="md" 
      maxW="400px"
      maxH="80vh"
      overflowY="auto"
      zIndex={9999}
      fontSize="sm"
    >
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="bold">Auth Debug</Text>
        <Button size="xs" onClick={() => setIsVisible(false)}>×</Button>
      </HStack>

      <VStack align="stretch" spacing={3}>
        <Box>
          <Text fontWeight="bold" mb={1}>Auth Context:</Text>
          <Code p={2} bg="gray.700" borderRadius="sm" w="full">
            {JSON.stringify(debugInfo.authContext, null, 2)}
          </Code>
        </Box>

        <Divider />

        <Box>
          <Text fontWeight="bold" mb={1}>Tokens:</Text>
          <Code p={2} bg="gray.700" borderRadius="sm" w="full">
            {JSON.stringify(debugInfo.tokens, null, 2)}
          </Code>
          <Badge colorScheme={debugInfo.isTokenValid ? 'green' : 'red'} mt={1}>
            Token Valid: {debugInfo.isTokenValid ? 'Yes' : 'No'}
          </Badge>
        </Box>

        <Divider />

        <Box>
          <Text fontWeight="bold" mb={1}>Storage Keys:</Text>
          <Text fontSize="xs" mb={1}>localStorage: {debugInfo.localStorage?.length || 0} keys</Text>
          <Code p={2} bg="gray.700" borderRadius="sm" w="full" fontSize="xs">
            {debugInfo.localStorage?.join(', ') || 'none'}
          </Code>
          <Text fontSize="xs" mb={1} mt={2}>sessionStorage: {debugInfo.sessionStorage?.length || 0} keys</Text>
          <Code p={2} bg="gray.700" borderRadius="sm" w="full" fontSize="xs">
            {debugInfo.sessionStorage?.join(', ') || 'none'}
          </Code>
        </Box>

        <Divider />

        <VStack spacing={2}>
          <Button size="sm" onClick={refreshDebugInfo} colorScheme="blue" w="full">
            Refresh ({debugInfo.timestamp})
          </Button>
          <Button size="sm" onClick={clearAllStorage} colorScheme="red" w="full">
            Clear All Storage
          </Button>
          <Button size="sm" onClick={() => logout()} colorScheme="orange" w="full">
            Test Logout
          </Button>
        </VStack>

        {debugInfo.error && (
          <Box>
            <Text color="red.300" fontWeight="bold">Error:</Text>
            <Code p={2} bg="red.900" borderRadius="sm" w="full">
              {debugInfo.error}
            </Code>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default AuthDebug;
