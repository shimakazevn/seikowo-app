import React, { useEffect } from 'react';
import { Box, Spinner, Center, Text, VStack, Progress, useColorModeValue } from '@chakra-ui/react';
import useInitializationStore from '../store/initializationStore';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const { isInitialized, isInitializing, initializationError, initializationProgress, initialize } = useInitializationStore();
  
  // Calculate overall progress
  const progress = Object.values(initializationProgress).filter(Boolean).length / 3 * 100;
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const errorColor = useColorModeValue('red.500', 'red.300');

  useEffect(() => {
    console.log('[AppInitializer] useEffect triggered. isInitialized:', isInitialized, 'isInitializing:', isInitializing);
    if (!isInitialized && !isInitializing) {
      console.log('[AppInitializer] Calling initialize()...');
      initialize();
        }
  }, [isInitialized, isInitializing, initialize]);

  // Show loading screen while initializing
  if (!isInitialized || isInitializing) {
    return (
      <Center minH="100vh" bg={bgColor}>
        <VStack spacing={6} p={8} borderRadius="lg" boxShadow="lg" bg={bgColor}>
          <Spinner
            size="xl"
            color="blue.500"
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
          />
          <VStack spacing={2} align="stretch" w="300px">
            <Text fontSize="lg" fontWeight="medium" textAlign="center">
            Đang khởi tạo ứng dụng...
          </Text>
            <Progress
              value={progress}
              size="sm"
              colorScheme="blue"
              borderRadius="full"
              hasStripe
              isAnimated
            />
            <Text fontSize="sm" color={textColor} textAlign="center">
              {progress.toFixed(0)}% hoàn thành
            </Text>
          </VStack>
          {initializationError && (
            <Text fontSize="sm" color={errorColor} textAlign="center">
              Có lỗi xảy ra: {initializationError.message}
            </Text>
          )}
        </VStack>
      </Center>
    );
  }

  return <>{children}</>;
};

export default AppInitializer;
