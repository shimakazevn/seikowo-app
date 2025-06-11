import React from 'react';
import {
  Box,
  VStack,
  Text,
  useColorModeValue
} from '@chakra-ui/react';

const AccessibilitySettings = () => {
  const textColor = useColorModeValue('gray.900', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <VStack spacing={8} align="stretch">
      <Box>
        <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={2}>
          cài đặt khả năng tiếp cận
        </Text>
        <Text fontSize="sm" color={mutedTextColor} mb={6}>
          tùy chỉnh các tính năng hỗ trợ khả năng tiếp cận.
        </Text>
      </Box>

      <Box textAlign="center" py={8}>
        <Text fontSize="lg" color={textColor} mb={2}>
          tính năng đang phát triển
        </Text>
        <Text fontSize="sm" color={mutedTextColor}>
          các tùy chọn khả năng tiếp cận sẽ được cập nhật trong phiên bản tới.
        </Text>
      </Box>
    </VStack>
  );
};

export default AccessibilitySettings;
