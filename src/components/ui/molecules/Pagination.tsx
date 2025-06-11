import React from 'react';
import {
  Box,
  VStack,
  Text,
  Spinner,
  useColorModeValue,
  Center,
} from '@chakra-ui/react';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';

interface InfinityLoadingProps {
  totalPosts: number;
  hasMorePosts: boolean;
  loadingMore: boolean;
  batchSize: number;
  onLoadMore: () => void;
}

const InfinityLoading: React.FC<InfinityLoadingProps> = ({
  totalPosts,
  hasMorePosts,
  loadingMore,
  batchSize,
  onLoadMore,
}) => {
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Use infinite scroll hook (always enabled)
  const { triggerRef } = useInfiniteScroll({
    hasMore: hasMorePosts,
    loading: loadingMore,
    onLoadMore,
    rootMargin: '200px', // Trigger 200px before reaching the element
    threshold: 0.1,
    enabled: true // Always enabled
  });

  return (
    <Box
      p={6}
      mt={8}
      mb={4}
    >
      <VStack spacing={4}>
        {/* Auto-scroll trigger (invisible) */}
        {hasMorePosts && (
          <Box
            ref={triggerRef}
            height="1px"
            width="100%"
            position="relative"
          />
        )}

        {/* Auto-scroll trigger (invisible) */}
        <div ref={triggerRef} style={{ height: '1px' }} />

        {/* End of Posts Indicator */}
        {!hasMorePosts && (
          <VStack spacing={2}>
            <Text fontSize="sm" color={textColor} textAlign="center">
              🏁 Đã hiển thị tất cả bài viết
            </Text>
            <Text fontSize="xs" color={textColor} textAlign="center" opacity={0.7}>
              Tổng cộng: {totalPosts} bài viết
            </Text>
          </VStack>
        )}

        {/* Loading Indicator */}
        {loadingMore && (
          <Center>
            <VStack spacing={2}>
              <Spinner size="md" color="blue.500" />
              <Text fontSize="xs" color={textColor}>
                Đang tải thêm {batchSize} bài viết...
              </Text>
            </VStack>
          </Center>
        )}
      </VStack>
    </Box>
  );
};

export default InfinityLoading;
