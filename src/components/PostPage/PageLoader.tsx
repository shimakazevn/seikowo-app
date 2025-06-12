import React from 'react';
import { Center, Spinner } from '@chakra-ui/react';

export const PageLoader: React.FC = () => (
  <Center h="50vh">
    <Spinner size="xl" color="blue.500" thickness="4px" />
  </Center>
); 