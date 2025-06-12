import React from 'react';
import {
  Box,
  Skeleton,
  SkeletonText,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';

export const PostSkeleton: React.FC = () => {
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

export const CardSkeleton: React.FC = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <Box bg={bgColor} p={4} rounded="lg" shadow="sm">
      <Skeleton height="200px" mb={4} />
      <SkeletonText noOfLines={3} spacing={4} />
    </Box>
  );
};

interface ListSkeletonProps {
  count?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ count = 3 }) => {
  return (
    <VStack spacing={4} align="stretch">
      {Array(count).fill(null).map((_, index: number) => (
        <Box key={index}>
          <Skeleton height="20px" mb={2} />
          <SkeletonText noOfLines={2} spacing={4} />
        </Box>
      ))}
    </VStack>
  );
};

interface GridSkeletonProps {
  columns?: number;
  rows?: number;
}

export const GridSkeleton: React.FC<GridSkeletonProps> = ({ columns = 3, rows = 2 }) => {
  return (
    <Box
      display="grid"
      gridTemplateColumns={`repeat(${columns}, 1fr)`}
      gap={4}
    >
      {Array(columns * rows).fill(null).map((_, index: number) => (
        <CardSkeleton key={index} />
      ))}
    </Box>
  );
};

export const LoadingSpinner: React.FC = () => {
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