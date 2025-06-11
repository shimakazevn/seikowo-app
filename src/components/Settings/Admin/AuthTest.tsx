import React, { useState } from 'react';
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
  useToast,
  Spinner
} from '@chakra-ui/react';
import { useAuthContext } from '../../../contexts/AuthContext';
import { authService } from '../../../services/authService';
import LoginButton from '../../Auth/LoginButton';

const AuthTest: React.FC = () => {
  const { isAuthenticated, user, isLoading, logout } = useAuthContext();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const toast = useToast();

  const runFullAuthTest = async () => {
    setTesting(true);
    setTestResults(null);
    
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    try {
      // Test 1: Check auth context
      results.tests.push({
        name: 'Auth Context',
        result: {
          isAuthenticated,
          hasUser: !!user,
          isLoading,
          userEmail: user?.email
        },
        status: isAuthenticated ? 'pass' : 'fail'
      });

      // Test 2: Check tokens
      const tokens = await authService.tokenManager.getTokens();
      results.tests.push({
        name: 'Token Storage',
        result: {
          hasToken: !!tokens?.accessToken,
          tokenLength: tokens?.accessToken?.length || 0
        },
        status: !!tokens?.accessToken ? 'pass' : 'fail'
      });

      // Test 3: Validate token
      if (tokens?.accessToken) {
        try {
          const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
              'Authorization': `Bearer ${tokens.accessToken}`
            }
          });
          
          results.tests.push({
            name: 'Token Validation',
            result: {
              status: response.status,
              ok: response.ok,
              statusText: response.statusText
            },
            status: response.ok ? 'pass' : 'fail'
          });

          if (response.ok) {
            const userInfo = await response.json();
            results.tests.push({
              name: 'User Info API',
              result: {
                hasUserInfo: !!userInfo,
                email: userInfo.email,
                name: userInfo.name
              },
              status: !!userInfo.email ? 'pass' : 'fail'
            });
          }
        } catch (apiError) {
          results.tests.push({
            name: 'Token Validation',
            result: { error: apiError.message },
            status: 'fail'
          });
        }
      }

      // Test 4: Test Google Picker prerequisites
      const pickerTest = {
        hasGapi: !!window.gapi,
        hasToken: !!tokens?.accessToken,
        isAuthenticated,
        readyForPicker: !!window.gapi && !!tokens?.accessToken && isAuthenticated
      };

      results.tests.push({
        name: 'Google Picker Ready',
        result: pickerTest,
        status: pickerTest.readyForPicker ? 'pass' : 'fail'
      });

      // Test 5: Environment variables
      const envTest = {
        hasClientId: !!import.meta.env.VITE_GOOGLE_CLIENT_ID,
        hasApiKey: !!import.meta.env.VITE_GOOGLE_API_KEY,
        clientIdPreview: import.meta.env.VITE_GOOGLE_CLIENT_ID ? 
          import.meta.env.VITE_GOOGLE_CLIENT_ID.substring(0, 20) + '...' : null
      };

      results.tests.push({
        name: 'Environment Config',
        result: envTest,
        status: envTest.hasClientId && envTest.hasApiKey ? 'pass' : 'fail'
      });

      setTestResults(results);

      const passedTests = results.tests.filter(t => t.status === 'pass').length;
      const totalTests = results.tests.length;

      toast({
        title: 'Auth Test Complete',
        description: `${passedTests}/${totalTests} tests passed`,
        status: passedTests === totalTests ? 'success' : 'warning',
        duration: 5000,
        isClosable: true
      });

    } catch (error) {
      console.error('Auth test failed:', error);
      results.error = error.message;
      setTestResults(results);
      
      toast({
        title: 'Auth Test Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'green';
      case 'fail': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
      <VStack align="stretch" spacing={4}>
        <Text fontSize="lg" fontWeight="bold">🧪 Complete Auth Test</Text>
        
        <Divider />
        
        {/* Quick Status */}
        <HStack>
          <Badge colorScheme={isAuthenticated ? 'green' : 'red'}>
            {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </Badge>
          {isLoading && <Spinner size="sm" />}
          {user && <Text fontSize="sm">Welcome, {user.name}!</Text>}
        </HStack>

        {/* Actions */}
        <HStack>
          {!isAuthenticated ? (
            <LoginButton variant="button" size="sm" colorScheme="blue" />
          ) : (
            <Button size="sm" colorScheme="red" onClick={logout}>
              Logout
            </Button>
          )}
          
          <Button 
            size="sm" 
            colorScheme="purple" 
            onClick={runFullAuthTest}
            isLoading={testing}
            loadingText="Testing..."
          >
            Run Full Test
          </Button>
        </HStack>

        {/* Test Results */}
        {testResults && (
          <VStack align="stretch" spacing={3}>
            <Text fontWeight="semibold">Test Results:</Text>
            
            {testResults.tests.map((test: any, index: number) => (
              <Box key={index} p={3} border="1px" borderColor="gray.200" borderRadius="md">
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="medium">{test.name}</Text>
                  <Badge colorScheme={getStatusColor(test.status)}>
                    {test.status.toUpperCase()}
                  </Badge>
                </HStack>
                <Code p={2} fontSize="xs" maxH="100px" overflowY="auto" w="100%">
                  {JSON.stringify(test.result, null, 2)}
                </Code>
              </Box>
            ))}

            {testResults.error && (
              <Alert status="error">
                <AlertIcon />
                <Text fontSize="sm">{testResults.error}</Text>
              </Alert>
            )}
          </VStack>
        )}

        {/* Instructions */}
        <Alert status="info">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" fontWeight="semibold">
              How to fix authentication issues:
            </Text>
            <Text fontSize="xs">
              1. Make sure you're logged in (click Login button)<br/>
              2. Check that Google API credentials are configured<br/>
              3. Verify token is valid by running the test<br/>
              4. If tests pass, Google Picker should work
            </Text>
          </VStack>
        </Alert>
      </VStack>
    </Box>
  );
};

export default AuthTest;
