import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Alert,
  AlertIcon,
  Code,
  Divider,
  Badge,
  useToast
} from '@chakra-ui/react';
import { useAuthContext } from '../../../contexts/AuthContext';
import { authService } from '../../../services/authService';

const AuthDebug: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuthContext();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const toast = useToast();

  useEffect(() => {
    checkTokenInfo();
  }, [isAuthenticated]);

  const checkTokenInfo = async () => {
    try {
      const tokens = await authService.tokenManager.getTokens();
      const isValid = await authService.tokenManager.isTokenValid();

      // Test token by making a simple API call
      let apiTestResult = null;
      if (tokens?.accessToken) {
        try {
          const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
              'Authorization': `Bearer ${tokens.accessToken}`
            }
          });
          apiTestResult = {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText
          };
        } catch (apiError) {
          apiTestResult = {
            error: apiError.message
          };
        }
      }

      setTokenInfo({
        hasToken: !!tokens?.accessToken,
        tokenLength: tokens?.accessToken?.length || 0,
        tokenPreview: tokens?.accessToken ? tokens.accessToken.substring(0, 20) + '...' : null,
        isValid,
        apiTest: apiTestResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error checking token info:', error);
      setTokenInfo({ error: error.message });
    }
  };

  const testGoogleAPI = async () => {
    try {
      const tokens = await authService.tokenManager.getTokens();
      if (!tokens?.accessToken) {
        throw new Error('No access token available');
      }

      // Test Google userinfo API
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`API test failed: ${response.status} ${response.statusText}`);
      }

      const userInfo = await response.json();
      setDebugInfo({
        apiTest: 'success',
        userInfo,
        timestamp: new Date().toISOString()
      });

      toast({
        title: 'API Test Success',
        description: 'Google API call successful',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('API test failed:', error);
      setDebugInfo({
        apiTest: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });

      toast({
        title: 'API Test Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const refreshAuth = async () => {
    try {
      // Use the auth context's refresh method instead
      const currentUser = await authService.getCurrentUser();
      await checkTokenInfo();

      if (currentUser) {
        toast({
          title: 'Auth Refreshed',
          description: 'Authentication state has been refreshed successfully',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      } else {
        toast({
          title: 'No User Found',
          description: 'No authenticated user found after refresh',
          status: 'warning',
          duration: 3000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('Auth refresh failed:', error);
      toast({
        title: 'Refresh Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const clearTokens = async () => {
    try {
      await authService.tokenManager.clearTokens();
      await checkTokenInfo();

      toast({
        title: 'Tokens Cleared',
        description: 'All authentication tokens have been cleared',
        status: 'info',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Clear tokens failed:', error);
      toast({
        title: 'Clear Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  return (
    <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
      <VStack align="stretch" spacing={4}>
        <Text fontSize="lg" fontWeight="bold">🔍 Authentication Debug</Text>
        
        <Divider />
        
        {/* Auth Status */}
        <VStack align="stretch" spacing={2}>
          <Text fontWeight="semibold">Auth Status:</Text>
          <HStack>
            <Badge colorScheme={isAuthenticated ? 'green' : 'red'}>
              {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </Badge>
            <Badge colorScheme={isLoading ? 'yellow' : 'blue'}>
              {isLoading ? 'Loading' : 'Ready'}
            </Badge>
          </HStack>
        </VStack>

        {/* User Info */}
        {user && (
          <VStack align="stretch" spacing={2}>
            <Text fontWeight="semibold">User Info:</Text>
            <Code p={2} fontSize="sm">
              {JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                picture: user.picture ? 'Has picture' : 'No picture'
              }, null, 2)}
            </Code>
          </VStack>
        )}

        {/* Token Info */}
        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between">
            <Text fontWeight="semibold">Token Info:</Text>
            <Button size="sm" onClick={checkTokenInfo}>
              Refresh
            </Button>
          </HStack>
          {tokenInfo && (
            <Code p={2} fontSize="sm" maxH="150px" overflowY="auto">
              {JSON.stringify({
                hasToken: tokenInfo.hasToken,
                tokenLength: tokenInfo.tokenLength,
                tokenPreview: tokenInfo.tokenPreview,
                isValid: tokenInfo.isValid,
                apiTest: tokenInfo.apiTest,
                timestamp: tokenInfo.timestamp,
                error: tokenInfo.error
              }, null, 2)}
            </Code>
          )}
        </VStack>

        {/* Actions */}
        <VStack align="stretch" spacing={2}>
          <Text fontWeight="semibold">Actions:</Text>
          <HStack wrap="wrap">
            <Button
              size="sm"
              colorScheme="blue"
              onClick={testGoogleAPI}
              isDisabled={!isAuthenticated}
            >
              Test Google API
            </Button>
            <Button
              size="sm"
              colorScheme="green"
              onClick={refreshAuth}
              isDisabled={!isAuthenticated}
            >
              Refresh Auth
            </Button>
            <Button
              size="sm"
              colorScheme="red"
              variant="outline"
              onClick={clearTokens}
            >
              Clear Tokens
            </Button>
          </HStack>
        </VStack>

        {/* Debug Info */}
        {debugInfo && (
          <VStack align="stretch" spacing={2}>
            <Text fontWeight="semibold">Debug Results:</Text>
            <Code p={2} fontSize="sm" maxH="200px" overflowY="auto">
              {JSON.stringify(debugInfo, null, 2)}
            </Code>
          </VStack>
        )}

        {/* Status Alert */}
        <Alert status={isAuthenticated ? 'success' : 'warning'}>
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" fontWeight="semibold">
              {isAuthenticated ? 'Ready for Google Picker' : 'Authentication Required'}
            </Text>
            <Text fontSize="xs">
              {isAuthenticated 
                ? 'You can now use Google Picker and other Google APIs'
                : 'Please login to access Google services'
              }
            </Text>
          </VStack>
        </Alert>
      </VStack>
    </Box>
  );
};

export default AuthDebug;
