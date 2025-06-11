import React from 'react';
import { Center, Spinner, Text, VStack } from '@chakra-ui/react';

interface PageLoaderProps {
  message?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading...' }) => (
  <Center h="50vh">
    <VStack spacing={4}>
      <Spinner
        size="xl"
        color="blue.500"
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
      />
      <Text color="gray.600" fontSize="sm">
        {message}
      </Text>
    </VStack>
  </Center>
);

export default PageLoader;
