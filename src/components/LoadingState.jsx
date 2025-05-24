import React from 'react';
import {
  Box,
  Skeleton,
  SkeletonText,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';

export const PostSkeleton = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <Box bg={bgColor} p={6} rounded="lg" shadow="sm">
      <Skeleton height="40px" mb={4} />
      <SkeletonText mt={4} noOfLines={1} spacing={4} mb={6} />
      <VStack align="stretch" spacing={4}>
        <Skeleton height="200px" />
        <SkeletonText mt={4} noOfLines={6} spacing={4} />
        <SkeletonText mt={4} noOfLines={4} spacing={4} />
        <SkeletonText mt={4} noOfLines={3} spacing={4} />
      </VStack>
    </Box>
  );
};

export const CardSkeleton = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <Box bg={bgColor} p={4} rounded="lg" shadow="sm">
      <Skeleton height="200px" mb={4} />
      <SkeletonText noOfLines={3} spacing={4} />
    </Box>
  );
};

export const ListSkeleton = ({ count = 3 }) => {
  return (
    <VStack spacing={4} align="stretch">
      {Array(count).fill(null).map((_, index) => (
        <Box key={index}>
          <Skeleton height="20px" mb={2} />
          <SkeletonText noOfLines={2} spacing={4} />
        </Box>
      ))}
    </VStack>
  );
};

export const GridSkeleton = ({ columns = 3, rows = 2 }) => {
  return (
    <Box
      display="grid"
      gridTemplateColumns={`repeat(${columns}, 1fr)`}
      gap={4}
    >
      {Array(columns * rows).fill(null).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </Box>
  );
};

export const LoadingSpinner = () => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="200px"
    >
      <Skeleton
        height="40px"
        width="40px"
        borderRadius="full"
        animation="pulse"
      />
    </Box>
  );
}; 